#!/usr/bin/env python
# -*- coding: utf-8 -*-

import smbus
import homie
import time

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from modules.homiedevice import HomieDevice
from modules.mysql import db

class Rf433(HomieDevice):

    _lightt = {
        1: [1,1],
        2: [1,2],
        3: [1,3],
        4: [1,4],
        5: [2,1],
        6: [2,2],
        7: [2,3],
        8: [3,1],
        9: [3,2],
    }

    _first = {}

    def setup(self):
        self._shutters = self._homie.Node("shutters", "shutter")
        self._lights = self._homie.Node("lights", "switch")

        self._shutters.advertise("shutter1").settable(self.shutterHandler)
        self._homie.subscribe(self._shutters, "shutter1", self.shutterHandler)
        self._shutters.advertise("shutter2").settable(self.shutterHandler)
        self._homie.subscribe(self._shutters, "shutter2", self.shutterHandler)

        self._lights.advertise("light1").settable(self.lightHandler)
        self._homie.subscribe(self._lights, "light1", self.lightHandler)
        self._lights.advertise("light2").settable(self.lightHandler)
        self._homie.subscribe(self._lights, "light2", self.lightHandler)
        self._lights.advertise("light3").settable(self.lightHandler)
        self._homie.subscribe(self._lights, "light3", self.lightHandler)
        self._lights.advertise("light4").settable(self.lightHandler)
        self._homie.subscribe(self._lights, "light4", self.lightHandler)
        self._lights.advertise("light5").settable(self.lightHandler)
        self._homie.subscribe(self._lights, "light5", self.lightHandler)
        self._lights.advertise("light6").settable(self.lightHandler)
        self._homie.subscribe(self._lights, "light6", self.lightHandler)
        self._lights.advertise("light7").settable(self.lightHandler)
        self._homie.subscribe(self._lights, "light7", self.lightHandler)
        self._lights.advertise("light8").settable(self.lightHandler)
        self._homie.subscribe(self._lights, "light8", self.lightHandler)
        self._lights.advertise("light9").settable(self.lightHandler)
        self._homie.subscribe(self._lights, "light9", self.lightHandler)

    def lightHandler(self, mqttc, obj, msg):
        payload = msg.payload.decode("UTF-8").lower()
        light = msg.topic.replace('/set', '').split('/')[-1]
        lid = int(light.replace('light', ''))

        if not light in self._first:
            self._first[light] = 1
            return

        logger.info('Light {l} val: {v}'.format(l=light, v=payload))
        if payload == '1' or payload == '1.0':
            value = 1
        else:
            value = 0

        self.set_state(0, self._lightt[lid][0], self._lightt[lid][1], value)
        self._lights.setProperty(light).send(payload)

    def shutterHandler(self, mqttc, obj, msg):
        payload = msg.payload.decode("UTF-8").lower()
        shutter = msg.topic.replace('/set', '').split('/')[-1]
        sid = int(shutter.replace('shutter', '')) - 1

        if not shutter in self._first:
            self._first[shutter] = 1
            return

        logger.info('Shutter {l} val: {v}'.format(l=sid, v=payload))
        self.set_state(1, sid, state=int(payload))
        self._shutters.setProperty(shutter).send(payload)


    def set_state(self, type, group, device=None, state=None):
        # Need small delay for transmitter
        time.sleep(0.3)

        bus = smbus.SMBus(1)
        if int(type) == 0:
            bus.write_i2c_block_data(0x03, 0, [int(group),int(device),int(state)])
        elif int(type) == 1:
            bus.write_i2c_block_data(0x03, 1, [int(group),int(state)])
            


def main():
    d = db()
    Homie = homie.Homie("configs/rf433.json")
    rf = Rf433(d, Homie)

    Homie.setFirmware("rf433-controller", "1.0.0")
    Homie.setup()

    while True:
        pass



if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")