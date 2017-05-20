#!/usr/bin/env python
# -*- coding: utf-8 -*-

import time
import homie
import logging
logging.basicConfig(level=logging.INFO)
# logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

from modules.homiedevice import HomieDevice
from modules.mysql import db


class Repeater(HomieDevice):

    _repeater_online = False
    topic_map = {}
    repeaterid = ''

    def _subscribe(self):
        tmp = self._db.pq("""SELECT dm.round, dp.devicestring, CONCAT(p.devicestring, '/', p.nodestring, '/', p.propertystring) as propertyaddress, CONCAT(dp.devicestring, '/', dp.nodestring, '/', dp.propertystring) as repeateraddress
            FROM repeatermap dm
            INNER JOIN property p ON p.propertyid = dm.propertyid
            INNER JOIN property dp ON dp.propertyid = dm.repeaterpropertyid""")

        logger.info('subscribing!')
        self.topic_map = {}
        for t in tmp:
            self._homie.subscribeTopic(str(self._homie.baseTopic+"/"+t['propertyaddress']), self.mqtt_handler)
            self.topic_map[t['propertyaddress']] = t

        self.repeaterid = t['devicestring']
        self.subscribe_all_forced = True


    def setup(self):
        self._subscribe()
        self._homie.subscribeTopic(str('{b}/{d}/$online'.format(b=self._homie.baseTopic, d=self.repeaterid)), self._repeater_online)

    def init(self):
        self.send_statics()

    def send_statics(self):
        statics = self._db.pq("""SELECT pg.name as groupname, psg.name as subgroupname, dp.devicestring, dp.nodestring, dp.propertystring
            FROM repeatermap dm
            INNER JOIN property dp ON dp.propertyid = dm.repeaterpropertyid
            LEFT OUTER JOIN propertygroup pg ON pg.propertygroupid = dm.propertygroupid
            LEFT OUTER JOIN propertysubgroup psg ON psg.propertysubgroupid = dm.propertysubgroupid
            WHERE psg.name IS NOT NULL OR pg.name IS NOT NULL""")

        for s in statics:
            self._homie.mqtt.publish('{b}/{d}/{n}/{p}/set'.format(b=self._homie.baseTopic, d=s['devicestring'], n=s['nodestring'], p=s['propertystring']),
                    payload=(s['groupname'] if s['groupname'] else s['subgroupname']))
            time.sleep(0.5)


    def _repeater_online(self, mqttc, obj, msg):
        if msg.payload != self._repeater_online:
            self._repeater_online = msg.payload

            if msg.payload == 'true':
                logger.info('Repeater now online, sending updates')
                self.send_statics()
            else: 
                logger.info('Repeater offline')


    def mqtt_handler(self, mqttc, obj, msg):
        for t,nt in self.topic_map.iteritems():
            if self._homie.baseTopic+"/"+t == msg.topic:
                if nt['round']:
                    msg.payload = int(float(msg.payload))
                self._homie.mqtt.publish('{b}/{nt}/set'.format(b=self._homie.baseTopic, nt=nt['repeateraddress']),
                 payload=str(msg.payload))
                time.sleep(0.2)


def main():
    d = db()
    Homie = homie.Homie("configs/repeater.json")
    repeater = Repeater(d, Homie)

    Homie.setFirmware("repeater-controller", "1.0.0")
    Homie.setup()

    repeater.init()
    while True:
        time.sleep(5)



if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")

