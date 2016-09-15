#!/usr/bin/env python
# -*- coding: utf-8 -*-

import time
import homie
import operator as o
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from modules.homiedevice import HomieDevice
from modules.mysql import db

class ListenAll(homie.Homie):

    topicMap = {
        '0268d9e0/heating/on': 'heating',
        'control/heating/temperatureset': 'temperatureSP',
        '028caee0/temperature/value': 'temperature',

        '028f39e0/temperature/value1': 'outsidetemp1',
        '028f39e0/temperature/value2': 'outsidetemp2',

        '028f39e0/zone1/humidity': 'zone1humidity',
        '028f39e0/zone1/pump': 'zone1pump',
        '028f39e0/zone2/humidity': 'zone2humidity',
        '028f39e0/zone2/pump': 'zone2pump',
        '028f39e0/zone3/humidity': 'zone3humidity',
        '028f39e0/zone3/pump': 'zone3pump',
        '028f39e0/zone4/humidity': 'zone4humidity',
        '028f39e0/zone4/pump': 'zone4pump',

        '026a9de0/zone1/humidity': 'zone5humidity',
        '026a9de0/zone1/pump': 'zone5pump',
        '026a9de0/zone2/humidity': 'zone6humidity',
        '026a9de0/zone2/pump': 'zone6pump',
        '026a9de0/zone3/humidity': 'zone7humidity',
        '026a9de0/zone3/pump': 'zone7pump',
        '026a9de0/zone4/humidity': 'zone8humidity',
        '026a9de0/zone4/pump': 'zone8pump',
    }

    def _subscribe(self):
        logger.info('subscribing!')
        for t in self.topicMap.keys():
            self.mqtt.subscribe(self.baseTopic+"/"+t)
        self.subscribe_all_forced = True


class Display(HomieDevice):

    _name_map = {
        '028f39e0/zone1': 'zone1name',
        '028f39e0/zone2': 'zone2name',
        '028f39e0/zone3': 'zone3name',
        '028f39e0/zone4': 'zone4name',
        '026a9de0/zone1': 'zone5name',
        '026a9de0/zone2': 'zone6name',
        '026a9de0/zone3': 'zone7name',
        '026a9de0/zone4': 'zone8name',
    }

    _displayid = 'c23e7de0'

    _display_online = False

    def setup(self):
        self._homie.mqtt.on_message = self.mqttHandler

    def init(self):
        self.send_names()
        self._homie.mqtt.subscribe('{b}/{d}/$online'.format(b=self._homie.baseTopic, d=self._displayid))

    def send_names(self):
        ntmp = self._db.pq("""SELECT distinct psg.name, CONCAT(p.devicestring, "/", p.nodestring) as node
            FROM propertysubgroup psg
            INNER JOIN propertysubgroupcomponent psgc ON psgc.propertysubgroupid = psg.propertysubgroupid
            INNER JOIN property p ON p.propertyid = psgc.propertyid
            WHERE p.nodestring LIKE CONCAT('zone',%s)""", ['%'])

        names = {}
        for n in ntmp:
            names[n['node']] = n['name']


        for node,p in self._name_map.iteritems():
            if node in names:
                self._homie.mqtt.publish('{b}/{d}/display/{p}/set'.format(b=self._homie.baseTopic, p=p, d=self._displayid),
                    payload=str(names[node]))
                time.sleep(0.5)


    def mqttHandler(self, client, userdata, msg, *args, **kwargs):
        parts = msg.topic.split('/')
        if parts[0] != self._homie.baseTopic:
            return

        if msg.topic == '{b}/{d}/$online'.format(b=self._homie.baseTopic, d=self._displayid):
            if msg.payload != self._display_online:
                self._display_online = msg.payload

                if msg.payload == 'true':
                    logger.info('Display now online, sending updates')
                    self.send_names()
                    self._homie._subscribe()
                else: 
                    logger.info('Display offline')


        for t,nt in self._homie.topicMap.iteritems():
            if self._homie.baseTopic+"/"+t == msg.topic:
                if t == '028caee0/temperature/value':
                    msg.payload = int(float(msg.payload))
                self._homie.mqtt.publish('{b}/{d}/display/{p}/set'.format(b=self._homie.baseTopic, d=self._displayid, p=nt),
                 payload=str(msg.payload))
                time.sleep(0.2)


def main():
    d = db()
    Homie = ListenAll("configs/display.json")
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

