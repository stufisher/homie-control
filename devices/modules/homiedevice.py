# -*- coding: utf-8 -*-
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from mysql import db


class HomieDevice:

    def __init__(self, db, Homie):
        self.__db = db
        self._homie = Homie

        self.setup()

    @property
    def _db(self):
        if self.__db:
            return self.__db
        else:
            return db()


    def setup(self):
        pass

    def loopHandler(self):
        pass

    def init(self):
        pass


    def _mqtt_subscribe(self, topic, callback):
        self._homie._checkBeforeSetup()

        if not self._homie.subscribe_all:
            self._homie.subscriptions.append((topic, int(self._homie.qos)))

        if self._homie.mqtt_connected:
            self._homie._subscribe()

        self._homie.mqtt.message_callback_add(topic, callback)



    def set(self, property, payload, retain=True):
        self._homie.mqtt.publish(self._homie.baseTopic+'/{device}/{node}/{property}/set'.format(
            device=property['devicestring'],
            node=property['nodestring'],
            property=property['propertystring']
        ), payload=str(payload), retain=retain)


    def run_profile(self, profileid):
        profile = self._db.pq("""SELECT p.devicestring, p.nodestring, p.propertystring 
            FROM property p
            INNER JOIN options o ON o.name = 'profile_exec_property' AND o.value = p.propertyid""")
        if not len(profile):
            logger.error('Couldnt find a profile exec device')

        self.set(profile[0], profileid, False)