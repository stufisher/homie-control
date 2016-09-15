# -*- coding: utf-8 -*-
#!/usr/bin/env python

import time
import homie
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from modules.homiedevice import HomieDevice
from modules.mysql import db

class Profile(HomieDevice):

    _first = True

    def setup(self):
        self._profile = self._homie.Node("profile", "profile")
        self._homie.subscribe(self._profile, "id", self.profileHandler)


    def profileHandler(self, mqttc, obj, msg):
        if self._first:
            self._first = False
            return

        payload = msg.payload.decode("UTF-8").lower()
        logger.info("ProfileID: "+ payload)

        components = self._db.pq("""SELECT p.devicestring, p.nodestring, p.propertystring, pc.propertyid, IF(pc.value IS NOT NULL, pc.value, p.value) as value
            FROM propertyprofilecomponent pc
            LEFT OUTER JOIN property p ON p.propertyid = pc.propertyid
            WHERE propertyprofileid=%s""", [payload])

        # print components
        for c in components:
            self.set(c, c['value'])

        self._homie.setNodeProperty(self._profile, "id", payload)


def main():
    d = db()
    Homie = homie.Homie("configs/profile.json")
    profile = Profile(d, Homie)

    Homie.setFirmware("profile-controller", "1.0.0")
    Homie.setup()

    while True:
        pass



if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")