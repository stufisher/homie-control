#!/usr/bin/env python
# -*- coding: utf-8 -*-

import time
import homie
import operator as o
import logging

from modules.homiedevice import HomieDevice
from modules.mysql import db
from modules.sendmail import Email
from modules.pushover import Pushover

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Trigger(HomieDevice):

    _waiting = {}

    _comparators = {
        "==": o.eq,
        ">=": o.ge,
        ">": o.gt,
        "<=": o.le,
        "<": o.lt,
        "!=": o.ne,
    }

    def setup(self):
        self._additional_cache = {}

        triggers = self._db.pq(
            """SELECT IF(p.propertystring IS NOT NULL, CONCAT(p.devicestring, '/', p.nodestring, '/', p.propertystring), 
                CONCAT(p.devicestring, '/', p.nodestring)) as address,
                p.friendlyname, pt.propertytriggerid, pt.value, pt.comparator, pt.propertyprofileid, 
                pt.scheduleid, pt.schedulestatus, pt.email, pt.push, pt.delay
            FROM property p
            INNER JOIN propertytrigger pt ON pt.propertyid = p.propertyid"""
        )

        self._triggers = {}
        for trigger in triggers:
            if not trigger["address"] in self._triggers:
                self._triggers[trigger["address"]] = []

            self._triggers[trigger["address"]].append(trigger)

        additional = self._db.pq(
            """SELECT p.propertyid, ty.name as propertytype, p.friendlyname,
                GROUP_CONCAT(ptn.propertytriggerid) as propertytriggerid,
                CONCAT(p.devicestring, '/', p.nodestring, '/', p.propertystring) as address
            FROM property p
            INNER JOIN propertytype ty ON ty.propertytypeid = p.propertytypeid
            INNER JOIN propertytriggernotify ptn ON ptn.propertyid = p.propertyid
            GROUP BY propertyid"""
        )
        self._trigger_additional = {}
        for a in additional:
            a["propertytriggerids"] = map(int, a["propertytriggerid"].split(","))
            self._trigger_additional[a["address"]] = a

        for address in self._triggers.keys() + self._trigger_additional.keys():
            self._mqtt_subscribe(
                str(self._homie.baseTopic + "/" + address), self.mqttHandler
            )

    def test(self, x, y, comp):
        return self._comparators[comp](x, y)

    def mqttHandler(self, mqttc, obj, msg):
        parts = msg.topic.split("/")
        if parts[0] != self._homie.baseTopic:
            return

        ptop = msg.topic.replace(self._homie.baseTopic + "/", "")
        if ptop in self._trigger_additional:
            self._additional_cache[ptop] = msg.payload

        if ptop in self._triggers:
            if msg.payload == "true" or msg.payload == "false":
                val = 1 if msg.payload == "true" else 0
            else:
                try:
                    val = float(msg.payload)
                except:
                    logger.debug(
                        "Value none numeric, not triggering [{topic}, {payload}]".format(
                            topic=msg.topic, payload=msg.payload
                        )
                    )
                    return

            logger.info("Topic: {topic} has triggers".format(topic=ptop))
            for t in self._triggers[ptop]:
                active = self._db.pq(
                    "SELECT active FROM propertytrigger WHERE propertytriggerid = %s",
                    [t["propertytriggerid"]],
                )
                if not active[0]["active"]:
                    continue

                logger.info(
                    "Testing val: {val} tval: {tval} comp: {comp}".format(
                        val=val, tval=t["value"], comp=t["comparator"]
                    )
                )
                if self.test(val, float(t["value"]), t["comparator"]):
                    if t["propertyprofileid"] is not None:
                        if t["delay"] > 0:
                            self._waiting[t["propertyprofileid"]] = (
                                t["delay"] + time.time()
                            )
                        else:
                            logger.info(
                                "Running profile {pid}".format(
                                    pid=t["propertyprofileid"]
                                )
                            )
                            self.run_profile(t["propertyprofileid"])

                    if t["scheduleid"] is not None:
                        logger.info(
                            "Changing schedule {sid} to {state}".format(
                                sid=t["scheduleid"], state=t["schedulestatus"]
                            )
                        )
                        self._db.pq(
                            """UPDATE schedule SET active=%s WHERE scheduleid=%s""",
                            [t["schedulestatus"], t["scheduleid"]],
                        )

                    if t["email"]:
                        em = self._db.pq(
                            """SELECT value FROM options WHERE name='trigger_email_to'"""
                        )
                        if len(em):
                            logger.info(
                                "Emailing {em} with update".format(em=em[0]["value"])
                            )

                            m = Email(em[0]["value"])
                            m.set_message(
                                "PropertyTrigger",
                                [t["friendlyname"], t["address"], val],
                            )
                            m.send()

                    if t["push"]:
                        logger.info("Trying to send push notification")
                        push_opts = self._db.pq(
                            """SELECT name,value FROM options WHERE name IN ('pushover_token', 'pushover_group')"""
                        )
                        po = Pushover(push_opts)

                        additional = []
                        for add in self._trigger_additional.values():
                            if t["propertytriggerid"] in add["propertytriggerids"]:
                                additional.append(
                                    {
                                        "friendlyname": add["friendlyname"],
                                        "address": add["address"],
                                        "type": add["propertytype"],
                                        "value": self._additional_cache.get(
                                            add["address"]
                                        ),
                                    }
                                )
                        po.send([t["friendlyname"], t["address"], val], additional)

    def loopHandler(self):
        toremove = []
        now = time.time()
        for pid, delayuntil in self._waiting.iteritems():
            if now > delayuntil:
                self.run_profile(pid)
                toremove.append(pid)

        for pid in toremove:
            if pid in self._waiting:
                del self._waiting[pid]


def main():
    d = db()
    Homie = homie.Homie("configs/trigger.json")
    trigger = Trigger(d, Homie)

    Homie.setFirmware("trigger", "1.0.0")
    Homie.setup()

    while True:
        trigger.loopHandler()
        time.sleep(5)


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")
