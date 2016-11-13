# -*- coding: utf-8 -*-
#!/usr/bin/env python

import time
import homie
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from modules.homiedevice import HomieDevice
from modules.mysql import db


class Heating(HomieDevice):
    _status = False
    _setpoint = 20
    _enabled = True
    _over = False

    def setup(self):
        self._node = self._homie.Node("heating", "heating")

        self._homie.subscribe(self._node, "enabled", self.enableHandler)
        self._homie.subscribe(self._node, "override", self.overrideHandler)
        self._homie.subscribe(self._node, "temperatureset", self.temperatureSPHandler)


    def enableHandler(self, mqttc, obj, msg):
        payload = msg.payload.decode("UTF-8").lower()
        logger.info("Enable: "+ payload)
        if payload == '1':
            self._enabled = True
            self._homie.setNodeProperty(self._node, "enabled", "1", True)
        else:
            self._enabled = False
            self._homie.setNodeProperty(self._node, "enabled", "0", True)

    def overrideHandler(self, mqttc, obj, msg):
        payload = msg.payload.decode("UTF-8").lower()
        logger.info("Override: "+ payload)
        if payload == '1':
            self._over = True
            self._homie.setNodeProperty(self._node, "override", "1", True)
        else:
            self._over = False
            self._homie.setNodeProperty(self._node, "override", "0", True)

    def temperatureSPHandler(self, mqttc, obj, msg):
        payload = msg.payload.decode("UTF-8").lower()
        logger.info("Temperature Set Point: "+ payload)
        try:
            self._setpoint = float(payload)
            self._homie.setNodeProperty(self._node, "temperatureset", payload, True)
        except:
            logger.error("Setpoint was not a valid float")


    # -- TODO
    # Remove dependence on DB, use MQTT messages instead
    # How to couple these to other devices?
    def set_status(self, state):
        device = self._db.pq("""SELECT p.devicestring, p.nodestring, p.propertystring FROM property p
            INNER JOIN options o ON o.name='heating_control_property' AND o.value = p.propertyid""")

        if not len(device):
            logger.error('Couldnt find a heating switch device')
            return
        else: 
            self.set(device[0], '1' if state else '0')
            self._status = state


    def loopHandler(self):
        if not self._enabled:
            return

        # Get current temperature value
        device = self._db.pq("""SELECT p.value FROM property p
        INNER JOIN options o ON o.name='heating_reading_property' AND o.value = p.propertyid""")
        if not len(device):
            logger.error('Couldnt find a heating reading device')
            # time.sleep(5)
            return
        current = float(device[0]['value'])
        logger.info('Current Temperature Reading: {temp}'.format(temp=current))


        # Are we scheduled to be on? (do we need a device?)
        stmp = self._db.pq("""SELECT schedulecomponentid,requiredevice 
            FROM schedulecomponent sc 
            INNER JOIN schedule s ON s.scheduleid = sc.scheduleid AND s.enabled = 1
            INNER JOIN options o ON o.name = 'heating_control_property' AND o.value = s.propertyid
            WHERE DAYOFWEEK(CURRENT_TIMESTAMP) = sc.day AND TIME(CURRENT_TIMESTAMP) >= sc.start AND TIME(CURRENT_TIMESTAMP) < sc.end""")

        devs = self._db.pq("""SELECT count(deviceid) as count FROM device WHERE connected=1 AND active=1""")

        sch = []
        for s in stmp:
            if int(s['requiredevice']):
                if len(devs):
                    sch.append(s)
            else:
                sch.append(s)

        # When was motion last detected? + 30 mins
        # mot = self.db.pq("""SELECT logid 
        #     FROM log 
        #     WHERE typeid=7 AND value=1 AND timestamp + INTERVAL 30 MINUTE > CURRENT_TIMESTAMP
        #     ORDER BY timestamp DESC""")

        # logger.info('Override: {over}'.format(over=self._over))
        # Not scheduled, no motion, and not in override, return
        if not len(sch) and not self._over:
            if self._status:
                self.set_status(False)

            # logger.info('Not scheduled and not in override, sleeping')
            # time.sleep(10)
            return


        # Schedule / or motion and enabled, work out whether we should be heating
        if current > self._setpoint:
            newstate = False
        else:
            newstate = True

        if newstate != self._status:
            logger.info('Current: {current} Set: {set}'.format(current=current, set=self._setpoint))
            self.set_status(newstate)





def main():
    d = db()
    Homie = homie.Homie("configs/heating.json")
    heating = Heating(d, Homie)

    Homie.setFirmware("heating-controller", "1.0.0")
    Homie.setup()

    while True:
        heating.loopHandler()
        time.sleep(5)



if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")