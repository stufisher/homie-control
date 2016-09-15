#!/usr/bin/env python
# -*- coding: utf-8 -*-

from importlib import import_module
import time
import homie

import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from modules.mysql import db


class Manager:

    module_list = ['schedule', 'heating', 'profile', 'device', 'rf433']

    _modules = []

    def __init__(self, db, homie):
        self._db = db
        self._homie = homie

        for m in self.module_list:
            module = import_module(m)
            class_ = getattr(module, m.capitalize())
            # logger.info('initializing {m}, {c}'.format(m=module, c=class_))
            self._modules.append(class_(db, homie))

        self._homie.setFirmware("ha-controller", "1.0.0")
        self._homie.setup()


    def run(self):
        for m in self._modules:
            m.init()

        while True:
            for m in self._modules:
                m.loopHandler()

            time.sleep(1)

def main():
    Homie = homie.Homie("configs/manage.json")

    m = Manager(None, Homie)
    m.run()


if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")
