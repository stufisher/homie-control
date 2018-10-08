# -*- coding: utf-8 -*-
#!/usr/bin/env python

import time
import homie
import logging
import datetime
import glob
import os
import base64
# logging.basicConfig(level=logging.INFO)
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

from modules.homiedevice import HomieDevice
from modules.mysql import db


class Archiver(HomieDevice):

    _root = None
    _write_frames = True


    def setup(self):
        self._archive = self._homie.Node("archive", "camera")
        self._archive.advertise("frameno").settable(self.archiveHandler)
        self._archive.advertise("frame")
        self._archive.advertise("frames")

        root = self._db.pq("""SELECT o.value FROM options JOIN options o ON o.name='archiver_root'""")
        if len(root):
            if os.path.exists(root[0]['value']):
                self._root = root[0]['value']

        device = self._db.pq("""SELECT p.devicestring, p.nodestring, p.propertystring FROM property p
            INNER JOIN options o ON o.name='archiver_source_property' AND o.value = p.propertyid""")
        if len(device):
            d = device[0]
            self._homie.subscribeTopic(str('{b}/{d}/{n}/{p}'.format(
                b=self._homie.baseTopic, d=d['devicestring'], n=d['nodestring'], p=d['propertystring'])), 
                self._save_frame)


    def init(self):
        self._update_framecount()


    def _update_framecount(self):
        fc = len(glob.glob("{root}/*.jpg".format(root=self._root)))
        self._archive.setProperty("frames").send(str(fc))
        self._load_frame(fc-1)


    def _save_frame(self, mqttc, obj, msg):
        logger.debug("Caught new frame")

        if self._write_frames and self._root:
            frame_name = "{root}/{file}.jpg".format(root=self._root, file=datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S"))
            logger.info('Writing frame: {fn}'.format(fn=frame_name))

            with open(frame_name, "wb") as frame:
                frame.write(msg.payload)

            self._update_framecount()


    def archiveHandler(self, mqttc, obj, msg):
        imageid = msg.payload.decode("UTF-8").lower()
        logger.debug("Frameid {fr}".format(fr=imageid))

        imint = int(imageid)
        self._load_frame(imint)


    def _load_frame(self, imint):
        frames = glob.glob("{root}/*.jpg".format(root=self._root))
        frames.sort(key=os.path.getmtime)
        if imint < len(frames) and imint > 0:
            file = frames[imint]

            with open(file) as frame:
                logger.info("Loading archived frame: {fn} - {file}".format(fn=imint, file=file))
                self._archive.setProperty("frame").send(base64.b64encode(frame.read()))

            self._archive.setProperty("frameno").send(str(imint))


def main():
    d = db()
    Homie = homie.Homie("configs/archiver.json")
    archiver = Archiver(d, Homie)

    Homie.setFirmware("archiver", "1.0.0")
    Homie.setup()

    while True:
        pass



if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")