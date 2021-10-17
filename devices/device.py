#!/usr/bin/env python
# -*- coding: utf-8 -*-

import homie
import subprocess
import time
import datetime
import pytz
from astral import Location

import logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
logger = logging.getLogger(__name__)

from modules.homiedevice import HomieDevice
from modules.mysql import db


class ArpScan:

    _id = None
    _process = None
    _started = None
    _start = None
    _offset = 15

    _arp_normal = ['/usr/bin/arp-scan', '--interface', 'eth1', '-l', '-r', '5', '-t', '5000']
    _arp_fast   = ['/usr/bin/arp-scan', '--interface', 'eth1', '-l']

    def __init__(self, id, fast=False):
        self._id = id
        self._fast = fast
        self._started = time.time()

    def check(self):
        if self._process is None:
            if (time.time() - self._started) > (self._id * self._offset):
                # logger.info('[{id}, {f}] Arp Starting'.format(id=self._id, f=self._fast))
                self._start = time.time()
                self._process = subprocess.Popen(self._arp_fast if self._fast else self._arp_normal, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                # self._process = subprocess.Popen(['/sbin/ping', '-c', '10', '192.168.1.18'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        if self._process:
            if self._process.poll() is not None:
                # logger.info('[{id}, {f}] Arp Finished, took: {time}'.format(id=self._id, time=round(time.time() - self._start,1), f=self._fast))
                text = self._process.communicate()
                self._process = None
                return (text[0], self._fast)


class Device(HomieDevice):

    _processes = []
    # _process = None
    _sun_has_set = False
    _last_dev_count = None

    def setup(self):
        self._processes.append(ArpScan(0))
        self._processes.append(ArpScan(1, True))

        self._devices = self._homie.Node("devices", "devices")
        self._devices.advertise("online")

    def get_suntimes(self):
        opt = self._db.pq("SELECT name,value FROM options where name in ('timezone', 'latitude', 'longitude')")
        opts = {}
        for o in opt:
            opts[o['name']] = o['value']
 
        loc = Location(('', '', float(opts['latitude']), float(opts['longitude']), opts['timezone'], 0))

        return { 'timezone': opts['timezone'], 'sun': loc.sun(date=datetime.date.today(), local=True) }



    def run_device_triggers(self, deviceid, connected):
        logger.info('Running triggers for {dev}, state {con}'.format(dev=deviceid, con=connected))

        # Only trigger if this is the last device disconnecting, or first connecting
        devs = self._db.pq("""SELECT count(deviceid) as count FROM device WHERE active=1 AND connected=1 and deviceid != %s""", [deviceid])
        devs = devs[0]

        triggers = self._db.pq("""SELECT propertyprofileid,requiresunset,requirelast
            FROM devicetrigger WHERE active=1 AND connected=%s""",[connected])

        for t in triggers:
            if int(t['requirelast']):
                # print 'Require last', devs['count']
                if int(devs['count']) > 0:
                    return

            # print t
            if int(t['requiresunset']):
                if self._sun_has_set:
                    self.run_profile(t['propertyprofileid'])    
            else:
                self.run_profile(t['propertyprofileid'])

        dev_count = self._db.pq("""SELECT count(deviceid) as count FROM device WHERE active=1 AND connected=1""")
        dev_count = dev_count[0]["count"]

        if self._last_dev_count is None:
            self._devices.setProperty("online").send(1 if dev_count > 0 else 0)
            self._last_dev_count = dev_count

        if dev_count != self._last_dev_count:
            self._devices.setProperty("online").send(1 if dev_count > 0 else 0)
            self._last_dev_count = dev_count

    def run_sun_triggers(self, sunset):
        logger.info('Running triggers for:')
        if sunset == 1:
            logger.info('Sunset')
        else:
            logger.info('Sunrise')
            
        triggers = self._db.pq("""SELECT propertyprofileid,sunset,requiredevice 
            FROM suntrigger WHERE active=1 AND sunset=%s""",[sunset])

        devs = self._db.pq("SELECT deviceid FROM device WHERE active=1 AND connected=1")

        for t in triggers:
            # print t
            if int(t['requiredevice']):
                if len(devs):
                    self.run_profile(t['propertyprofileid'])    
            else:
                self.run_profile(t['propertyprofileid'])


    def _updateDevices(self, arp, connectonly=False):
        # print arp
        if not arp:
            return

        devs = self._db.pq("SELECT deviceid, connected, name, macaddress, dccount FROM device")
        # print devs
        for d in devs:
            for v in ['connected', 'dccount']:
                d[v] = int(d[v])

            # print d, d['macaddress'] in arp
            if d['connected'] == 0:
                if d['macaddress'] in arp:
                    lines = arp.split('\n')
                    ip = None
                    for l in lines:
                        if d['macaddress'] in l:
                            ap = l.split('\t')
                            ip = ap[0]

                    self._db.pq("UPDATE device SET connected=1,dccount=0,ipaddress=%s WHERE deviceid=%s",[ip,d['deviceid']])
                    logger.info('Device {d} connected'.format(d=d['name']))
                    self.run_device_triggers(d['deviceid'], 1)

            elif connectonly == False:
                if d['macaddress'] in arp:
                    # logger.info('Device {d} still connected'.format(d=d['name']))
                    if d['dccount'] > 0:
                        self._db.pq("UPDATE device SET dccount=0 WHERE deviceid=%s",[d['deviceid']])
                        # logger.info('Device {d} dc count reset'.format(d=d['name']))

                else:
                    self._db.pq("UPDATE device SET dccount=dccount+1 WHERE deviceid=%s",[d['deviceid']])
                    # logger.info('Device {d} dc count {c}'.format(d=d['name'], c=d['dccount']))

                    if d['dccount'] > 3:
                        self._db.pq("UPDATE device SET connected=0,dccount=0 WHERE deviceid=%s",[d['deviceid']])
                        logger.info('Device {d} disconnected'.format(d=d['name']))
                        self.run_device_triggers(d['deviceid'], 0) 


    def loopHandler(self):
        for p in self._processes:
            res = p.check()
            if res is not None:
                self._updateDevices(*res)
        

        # Check sunset / sunrise
        sun = self.get_suntimes()
        now = datetime.datetime.now(pytz.timezone(sun['timezone']))

        if now > sun['sun']['sunset']:
            if not self._sun_has_set:
                logger.info('Sun Setting')
                self.run_sun_triggers(1)
                self._sun_has_set = True

        elif now > sun['sun']['sunrise']:
            if self._sun_has_set:
                logger.info('Sun Rising')
                self.run_sun_triggers(0)
                self._sun_has_set = False


def main():
    Homie = homie.Homie("configs/device.json")
    d = db()
    dd = Device(d, Homie)

    Homie.setFirmware("device-handler", "1.0.0")
    Homie.setup()

    while True:
        dd.loopHandler()
        time.sleep(5)



if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")

