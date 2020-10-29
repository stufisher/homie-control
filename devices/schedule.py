# -*- coding: utf-8 -*-
#!/usr/bin/env python

import time
import homie
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from modules.homiedevice import HomieDevice
from modules.mysql import db


class Schedule(HomieDevice):

    _states = {}

    def loopHandler(self):
        devs = self._db.pq("""SELECT count(deviceid) as count FROM device WHERE active=1 AND connected=1""")
        devs = int(devs[0]['count'])

        heating_device = self._db.pq("""SELECT value FROM options WHERE name = 'heating_control_property'""")
        if not len(heating_device):
            heating_device = None
        else:
            heating_device = int(heating_device[0]['value'])

        schedules = self._db.pq("""SELECT propertyid, devicestring, nodestring, propertystring, max(enabled) as enabled, max(active) as active, invert FROM (
            SELECT p.propertyid, p.devicestring, p.nodestring, p.propertystring, s.enabled, 
                IF(sc.schedulecomponentid IS NOT NULL
                    AND DAYOFYEAR(CURRENT_TIMESTAMP) >= DAYOFYEAR(s.start)
                    AND DAYOFYEAR(CURRENT_TIMESTAMP) <= DAYOFYEAR(s.end)
                    AND s.enabled = 1
                    AND IF(s.requiredevice, %s, 1)
                    , 1, 0) as active, s.invert, s.requiredevice
            FROM schedule s 
            LEFT OUTER JOIN schedulecomponent sc ON s.scheduleid = sc.scheduleid
                AND DAYOFWEEK(CURRENT_TIMESTAMP) = sc.day 
                AND TIME(CURRENT_TIMESTAMP) >= sc.start AND TIME(CURRENT_TIMESTAMP) < sc.end
            INNER JOIN property p ON s.propertyid = p.propertyid
            GROUP BY s.scheduleid
            ) inr GROUP BY propertyid""", [devs > 0])

        for s in schedules:
            if s['propertyid'] == heating_device:
                continue

            if s['active'] == 1 and s['enabled'] == 1:
                newstate = 0 if s['invert'] == 1 else 1
            else:
                newstate = 1 if s['invert'] == 1 else 0

            # print s['devicestring'],s['nodestring'],s['propertystring'], s['active'], s['invert'] == '1', newstate

            if not (s['propertyid'] in self._states):
                self._states[s['propertyid']] = newstate
            else:
                if self._states[s['propertyid']] != newstate:
                    logger.info('Schedule changed state: {d}/{n}/{p} val: {v}'.format(
                        d=s['devicestring'],
                        n=s['nodestring'],
                        p=s['propertystring'],
                        v=newstate
                    ))
                    self.set(s, newstate)
                    self._states[s['propertyid']] = newstate



def main():
    d = db()
    Homie = homie.Homie("configs/schedule.json")
    schedule = Schedule(d, Homie)

    Homie.setFirmware("schedule-controller", "1.0.0")
    Homie.setup()

    while True:
        schedule.loopHandler()
        time.sleep(5)



if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")
