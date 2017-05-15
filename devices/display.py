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

class ListenAll(homie.Homie):

    topic_map = {}
    displayid = ''

    def __init__(self, config, db):
        self._db = db
        super(ListenAll, self).__init__(config)


    def _subscribe(self):
        tmp = self._db.pq("""SELECT dm.round, dp.devicestring, CONCAT(p.devicestring, '/', p.nodestring, '/', p.propertystring) as propertyaddress, CONCAT(dp.devicestring, '/', dp.nodestring, '/', dp.propertystring) as repeateraddress
            FROM repeatermap dm
            INNER JOIN property p ON p.propertyid = dm.propertyid
            INNER JOIN property dp ON dp.propertyid = dm.repeaterpropertyid""")

        logger.info('subscribing!')
        self.topic_map = {}
        for t in tmp:
            self.topic_map[t['propertyaddress']] = t
            self.mqtt.subscribe(self.baseTopic+"/"+t['propertyaddress'])

        self.displayid = t['devicestring']
        self.subscribe_all_forced = True


class Display(HomieDevice):

    _display_online = False

    def setup(self):
        self._homie.mqtt.on_message = self.mqttHandler

    def init(self):
        self.send_statics()
        self._homie.mqtt.subscribe('{b}/{d}/$online'.format(b=self._homie.baseTopic, d=self._homie.displayid))

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



    def mqttHandler(self, client, userdata, msg, *args, **kwargs):
        parts = msg.topic.split('/')
        if parts[0] != self._homie.baseTopic:
            return

        if msg.topic == '{b}/{d}/$online'.format(b=self._homie.baseTopic, d=self._homie.displayid):
            if msg.payload != self._display_online:
                self._display_online = msg.payload

                if msg.payload == 'true':
                    logger.info('Display now online, sending updates')
                    self.send_statics()
                    self._homie._subscribe()
                else: 
                    logger.info('Display offline')


        for t,nt in self._homie.topic_map.iteritems():
            if self._homie.baseTopic+"/"+t == msg.topic:
                if nt['round']:
                    msg.payload = int(float(msg.payload))
                self._homie.mqtt.publish('{b}/{nt}/set'.format(b=self._homie.baseTopic, nt=nt['repeateraddress']),
                 payload=str(msg.payload))
                time.sleep(0.2)


def main():
    d = db()
    Homie = ListenAll("configs/display.json", d)
    display = Display(d, Homie)

    Homie.setFirmware("display-controller", "1.0.0")
    Homie.setup()

    display.init()
    while True:
        time.sleep(5)



if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")

