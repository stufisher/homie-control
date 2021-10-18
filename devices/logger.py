#!/usr/bin/env python
# -*- coding: utf-8 -*-

import time
import homie
import operator as o
import logging

from modules.homiedevice import HomieDevice
from modules.mysql import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Logger(HomieDevice):

    _lastupdate = {}

    def setup(self):
        self._mqtt_subscribe(str(self._homie.baseTopic + "/#"), self.mqttHandler)

    def test(self, x, y, comp):
        return self._comparators[comp](x, y)

    def mqttHandler(self, mqttc, obj, msg):
        parts = msg.topic.split("/")
        if parts[0] != self._homie.baseTopic:
            return

        if msg.payload == "true" or msg.payload == "false":
            val = 1 if msg.payload == "true" else 0
        else:
            try:
                val = float(msg.payload)
            except:
                logger.debug(
                    "Value none numeric, not logging [{topic}, {payload}]".format(
                        topic=msg.topic, payload=msg.payload
                    )
                )
                return

        ptop = msg.topic.replace(self._homie.baseTopic + "/", "")
        if ptop not in self._lastupdate:
            self._lastupdate[ptop] = time.time()

        if (time.time() - self._lastupdate[ptop]) < 30:
            return

        self._lastupdate[ptop] = time.time()

        p = self._db.pq(
            """SELECT p.propertyid, p.devicestring, p.nodestring, p.propertystring,
            CONCAT(p.devicestring, '/', p.nodestring, '/', p.propertystring) as address, p.friendlyname
            FROM property p
            INNER JOIN propertytype ty ON ty.propertytypeid = p.propertytypeid
            WHERE p.propertytypeid IS NOT NULL
                AND ty.name != 'binary' AND ty.name != 'string' AND p.log = 1
                AND (CONCAT(p.devicestring, '/', p.nodestring, '/', p.propertystring) LIKE %s OR CONCAT(p.devicestring, '/', p.nodestring) LIKE %s)
            GROUP BY p.propertyid""",
            [ptop, ptop],
        )

        if not len(p):
            return

        p = p[0]
        if p:
            self._db.pq(
                """INSERT INTO history (propertyid, value) VALUES (%s, %s)""",
                [p["propertyid"], val],
            )
            self._db.pq(
                """UPDATE property set value=%s WHERE propertyid=%s""",
                [val, p["propertyid"]],
            )


def main():
    d = db()
    Homie = homie.Homie("configs/logger.json")
    log = Logger(d, Homie)

    Homie.setFirmware("logger", "1.0.0")
    Homie.setup()

    while True:
        log.loopHandler()
        time.sleep(5)


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")
