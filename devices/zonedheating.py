# -*- coding: utf-8 -*-
#!/usr/bin/env python

import time
import json
import logging

import homie

from modules.homiedevice import HomieDevice
from modules.mysql import db


logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class SetMixin:
    def _set(self, param, type, msg, node=None):
        payload = msg.payload.decode("UTF-8").lower()
        logger.info(
            "{id} {param}: {payload}".format(id=self._id, param=param, payload=payload)
        )
        try:
            if type == "float":
                val = float(payload)
            elif type == "bool":
                val = payload == "1"
            else:
                logger.error("Unknown payload type {type}".format(type=type))

            setattr(self, "_" + param, val)

            if type == "bool":
                ret = 1 if val else 0
            else:
                ret = payload

            if node:
                node.setProperty(param).send(ret)
            else:
                self.setProperty(param).send(ret)
        except ValueError as e:
            logger.error(
                "{param} was not a valid {type}".format(param=param, type=type)
            )

        return val


class ZoneNode(homie.HomieNode, SetMixin):
    _temperatureset = 20
    _enabled = True
    _heating = None
    _scheduled = False

    _boost = False
    _boosttime = 20
    _boostset = 25
    _booststart = 0

    _away = False
    _awayset = 15

    def __init__(self, homie_instance, zid, read_property, control_property):
        self._read_property = read_property
        self._control_property = control_property
        self._id = zid

        super(ZoneNode, self).__init__(
            homie_instance, "zheatingzone" + str(zid), "heatingzone"
        )

        self.advertise("enabled").settable(self.enable_handler)
        self.advertise("scheduled").settable(self.scheduled_handler)
        self.advertise("temperatureset").settable(self.temperature_sp_handler)

        self.advertise("boost").settable(self.boost_handler)
        self.advertise("boosttime").settable(self.boost_time_handler)
        self.advertise("boostset").settable(self.boost_sp_handler)

        self.advertise("away").settable(self.away_handler)
        self.advertise("awayset").settable(self.away_sp_handler)

    @property
    def _db(self):
        return db()

    def enable_handler(self, mqttc, obj, msg):
        self._set("enabled", "bool", msg)

    def scheduled_handler(self, mqttc, obj, msg):
        self._set("scheduled", "bool", msg)

    def temperature_sp_handler(self, mqttc, obj, msg):
        self._set("temperatureset", "float", msg)

    def boost_handler(self, mqttc, obj, msg):
        boost = self._set("boost", "bool", msg)

        if boost:
            self._booststart = time.time()

    def boost_time_handler(self, mqttc, obj, msg):
        self._set("boosttime", "float", msg)

    def boost_sp_handler(self, mqttc, obj, msg):
        self._set("boostset", "float", msg)

    def away_handler(self, mqttc, obj, msg):
        self._set("away", "bool", msg)

    def away_sp_handler(self, mqttc, obj, msg):
        self._set("awayset", "float", msg)

    def set(self, property, payload, retain=True):
        self.homie.mqtt.publish(
            self.homie.baseTopic
            + "/{device}/{node}/{property}/set".format(
                device=property["devicestring"],
                node=property["nodestring"],
                property=property["propertystring"],
            ),
            payload=str(payload),
            retain=retain,
        )

    def set_status(self, state):
        address = "{devicestring}/{nodestring}/{propertystring}".format(
            devicestring=self._control_property["devicestring"],
            nodestring=self._control_property["nodestring"],
            propertystring=self._control_property["propertystring"],
        )
        logger.info(
            "Setting status to {state} for {address}".format(
                state=state, address=address
            )
        )
        self.set(self._control_property, "1" if state else "0")
        self._heating = state

    @property
    def active(self):
        if not self._enabled:
            return

        # logger.info("{zid} enabled".format(zid=self._id))

        if not self._scheduled and not self.boost and not self.away:
            if self._heating:
                self.set_status(False)

            return

        # logger.info("{zid} running".format(zid=self._id))

        read = self._db.pq(
            """SELECT p.value FROM property p
            WHERE p.devicestring=%s AND p.nodestring=%s AND p.propertystring = %s""",
            [
                self._read_property["devicestring"],
                self._read_property["nodestring"],
                self._read_property["propertystring"],
            ],
        )
        if not read:
            logger.error("Couldnt find a heating reading device")
            return

        now = time.time()
        if self._boost:
            if (now - self._booststart) > self._boosttime * 60:
                self.boost = False

            set_point = self._boostset

        elif self.away:
            set_point = self._awayset

        else:
            set_point = self._temperatureset

        newstate = read[0]["value"] < set_point
        if newstate != self._heating:
            logger.debug(
                "{zid} set {set} read {read}".format(
                    zid=self._id, set=set_point, read=read[0]["value"]
                )
            )
            logger.debug(
                "{zid} new {new} old {old}".format(
                    zid=self._id, new=newstate, old=self._heating
                )
            )
            self.set_status(newstate)

        return newstate

    @property
    def boost(self):
        return self._boost

    @boost.setter
    def boost(self, state):
        self._boost = state
        self.setProperty("boost").send(1 if state else 0)

        if state:
            self._booststart = time.time()

    @property
    def away(self):
        return self._away

    @away.setter
    def away(self, state):
        self._away = state
        self.setProperty("away").send(1 if state else 0)

    @property
    def scheduled(self):
        return self._scheduled

    @scheduled.setter
    def scheduled(self, state):
        self._scheduled = state
        self.setProperty("scheduled").send(1 if state else 0)


class Zonedheating(HomieDevice, SetMixin):
    _id = "root"
    _enabled = True
    _boost = None
    _status = None
    _zones = []

    def setup(self):
        self._node = self._homie.Node("zheating", "heating")

        self._node.advertise("enabled").settable(self.enable_handler)
        self._node.advertise("scheduled").settable(self.scheduled_handler)
        self._node.advertise("boost").settable(self.boost_handler)
        self._node.advertise("away").settable(self.away_handler)

        config = self._db.pq("""SELECT config FROM pages WHERE template='zheating'""")
        if not config:
            raise Exception("Could not find config")

        config = json.loads(config[0]["config"])

        for z in config["zones"]:
            properties = self._db.pq(
                """SELECT p.devicestring, p.nodestring, p.propertystring, pt.name as type
                FROM property p
                INNER JOIN propertytype pt ON p.propertytypeid = pt.propertytypeid
                INNER JOIN propertysubgroupcomponent psgc ON psgc.propertyid = p.propertyid
                WHERE psgc.propertysubgroupid = %s""",
                [z["propertysubgroupid"]],
            )

            read = {}
            control = {}

            for p in properties:
                if p["type"] == "temperature":
                    read = p

                if p["type"] == "switch":
                    control = p

            node = ZoneNode(self._homie, z["id"], read, control)
            self._homie.nodes.append(node)
            self._zones.append(node)

    def enable_handler(self, mqttc, obj, msg):
        enabled = self._set("enabled", "bool", msg, node=self._node)
        if not enabled:
            self.set_status(False)

    def scheduled_handler(self, mqttc, obj, msg):
        scheduled = self._set("scheduled", "bool", msg, node=self._node)
        if not scheduled:
            self.set_status(False)

        for z in self._zones:
            z.scheduled = scheduled

    def boost_handler(self, mqttc, obj, msg):
        state = self._set("boost", "bool", msg, node=self._node)

        for z in self._zones:
            z.boost = state

    def away_handler(self, mqttc, obj, msg):
        state = self._set("away", "bool", msg, node=self._node)

        for z in self._zones:
            z.away = state

    def is_active(self):
        active = False
        for z in self._zones:
            if z.active:
                active = True

        return active

    def is_boost(self):
        boost = False
        for z in self._zones:
            if z.boost:
                boost = True

        return boost

    def set_status(self, state):
        device = self._db.pq(
            """SELECT p.devicestring, p.nodestring, p.propertystring FROM property p
            INNER JOIN options o ON o.name='heating_control_property' AND o.value = p.propertyid"""
        )

        if not device:
            logger.error("Couldnt find a heating control device")
            return

        address = "{devicestring}/{nodestring}/{propertystring}".format(
            devicestring=device[0]["devicestring"],
            nodestring=device[0]["nodestring"],
            propertystring=device[0]["propertystring"],
        )
        logger.info(
            "Root: Setting status to {state} for {address}".format(
                state=state, address=address
            )
        )

        self.set(device[0], "1" if state else "0")
        self._status = state

    def loopHandler(self):
        if not self._enabled:
            return

        active = self.is_active()
        if active != self._status:
            self.set_status(active)

        boost = self.is_boost()
        if boost != self._boost:
            self._node.setProperty("boost").send("1" if boost else "0")
            self._boost = boost


def main():
    d = db()
    config = homie.loadConfigFile("configs/zoned_heating.json")
    Homie = homie.Homie(config)
    # Homie = homie.Homie("configs/zoned_heating.json")

    heating = Zonedheating(d, Homie)

    Homie.setFirmware("zheating-controller", "1.0.0")
    Homie.setup()

    while True:
        heating.loopHandler()
        time.sleep(5)


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")
