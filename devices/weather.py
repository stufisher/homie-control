# -*- coding: utf-8 -*-
#!/usr/bin/env python

import time
import homie
import logging
import requests
logging.getLogger("requests").setLevel(logging.WARNING)
import datetime
import pytz
logging.basicConfig(level=logging.INFO)
# logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

from modules.homiedevice import HomieDevice
from modules.mysql import db


class Weather(HomieDevice):

    _timezone = None

    _cache = {}
    _config = {}
    _last_update = 0
    _update_interval = 5

    _root_url = "https://api.darksky.net"

    _property_map = [
        {            
            'url': '/forecast/{key}/{lat},{long}?units=ca',
            'nodes': [{
                'name': '_current',
                'properties': {
                    'temperature': ['currently', 'temperature'],
                    'feelslike': ['currently', 'apparentTemperature'],
                    'humidity': ['currently', 'humidity'],
                    'windspeed': ['currently', 'windSpeed'],
                    'gustspeed': ['currently', 'windGust'],
                    'winddir': ['currently', 'windBearing'],
                    'icon': ['currently', 'icon'],
                    'pop': ['currently', 'precipProbability'],
                    'visibility': ['currently', 'visibility'],
                    'cloudcover': ['currently', 'cloudCover'],
                    'uvindex': ['currently', 'uvIndex'],
                },
            },
            {
                'name': '_astronomy',
                'properties': {
                    'sunrise': ['daily', 'data', 0, 'sunriseTime'],
                    'sunset': ['daily', 'data', 0, 'sunsetTime'],
                    'moonphase': ['daily', 'data', 0, 'moonPhase'],
                }
            },
            {
                'name': '_hourly',
                'length': 24,
                'properties': {
                    'textsummary': ['hourly', 'summary'],
                    'timestamps': ['hourly', 'data', '[]', 'time'],
                    'temperature': ['hourly', 'data', '[]', 'temperature'],
                    'summary': ['hourly', 'data', '[]', 'summary'],
                    'pop': ['hourly', 'data', '[]', 'precipProbability'],
                    'gust': ['hourly', 'data', '[]', 'windGust'],
                }
            },
            {
                'name': '_daily',
                'length': 5,
                'properties': {
                    'temphigh': ['daily', 'data', '[]', 'temperatureHigh'],
                    'templow': ['daily', 'data', '[]', 'temperatureLow'],
                    'icon': ['daily', 'data', '[]', 'icon'],
                    'pop': ['daily', 'data', '[]', 'precipProbability'],
                    'pint': ['daily', 'data', '[]', 'precipIntensity'],
                    'wind': ['daily', 'data', '[]', 'windSpeed'],
                    'winddir': ['daily', 'data', '[]', 'windBearing'],
                    'gust': ['daily', 'data', '[]', 'windGust'],
                    
                }
            }]
        },
    ]

    def setup(self):
        config = self._db.pq("""SELECT name, value FROM options WHERE name IN ('weather_lang', 'weather_key', 'latitude', 'longitude')""")
        if len(config):
            for row in config:
                self._config[row['name']] = row['value']
        else:
            raise AssertionError("Couldnt get weather config")

        self._current = self._homie.Node("weather", "current")
        self._current.advertise("temperature")
        self._current.advertise("feelslike")
        self._current.advertise("humidity")
        self._current.advertise("windspeed")
        self._current.advertise("gustspeed")
        self._current.advertise("winddir")
        self._current.advertise("icon")
        self._current.advertise("pop")
        self._current.advertise("visibility")
        self._current.advertise("cloudcover")
        self._current.advertise("uvindex")


        self._hourly = self._homie.Node("hourly", "forecast")
        self._hourly.advertise("textsummary")
        self._hourly.advertise("timestamps")
        self._hourly.advertise("temperature")
        self._hourly.advertise("summary")
        self._hourly.advertise("pop")
        self._hourly.advertise("gust")

        
        self._daily = self._homie.Node("daily", "forecast")
        self._today = self._homie.Node("today", "forecast")
        self._tomorrow = self._homie.Node("tomorrow", "forecast")
        for k in ['_daily']:
            n = getattr(self, k)
            n.advertise("templow")
            n.advertise("temphigh")
            n.advertise("icon")
            n.advertise("pop")
            n.advertise("pint")
            n.advertise("wind")
            n.advertise("winddir")
            n.advertise("gust")


        self._astronomy = self._homie.Node("astronomy", "astronomy")
        self._astronomy.advertise("sunset")
        self._astronomy.advertise("sunrise")
        self._astronomy.advertise("moonphase")


        self._external = self._homie.Node("ip", "external")
        self._external.advertise("external")


    def loopHandler(self):
        now = time.time()
        if now - self._last_update > self._update_interval * 60:

            for pm in self._property_map:
                logger.debug('Requesting {url}'.format(url=pm['url']))
                try:
                    r = requests.get(self._root_url+pm['url'].format(
                        key=self._config['weather_key'],
                        lang=self._config['weather_lang'],
                        lat=self._config['latitude'],
                        long=self._config['longitude']))
                except requests.ConnectionError as e:
                    logger.warning('Connection Error: {message}'.format(message=e))

                if r.status_code != 200:
                    logger.warning('Request returned: {code}'.format(code=r.status_code))
                    continue

                self._timezone = r.json()['timezone']

                for nl in pm['nodes']:
                    n = getattr(self, nl['name'])

                    for p,t in nl['properties'].iteritems():
                        ln = None
                        if 'length' in nl:
                            ln = nl['length']

                        val = self.get(r.json(), t, p, ln)
                        pid = '{nd}/{p}'.format(nd=n.nodeId, p=p)

                        if not (pid in self._cache):
                            self._cache[pid] = ""

                        if self._cache[pid] != val:
                            n.setProperty(p).send(str(val))
                            self._cache[pid] = val


            r = requests.get('https://api.ipify.org/?format=json')
            if r.status_code == 200:
                ipj = r.json()
                if 'ip' in ipj:
                    if not ('ip' in self._cache):
                        self._cache['ip'] = ""

                    if ipj['ip'] != self._cache['ip']:
                        self._external.setProperty('external').send(ipj['ip'])
                        self._cache['ip'] = ipj['ip']

            else:
                logger.warning('Request returned: {code}'.format(code=r.status_code))


            self._last_update = now


    def get(self, json, tree, key, ln=None):
        res = json
        for iid,item in enumerate(tree):
            if item == '[]':
                lst = []
                for lid,l in enumerate(res):
                    if ln == None or (ln and lid < ln):
                        lst.append(str(self.get(l, tree[iid+1:], key)))

                return ",".join(lst)
                
            else:
                res = res[item]

        if isinstance(res, basestring):
            res = res.replace(u'\u2013', '-')

        return self.translate(key, res)


    def translate(self, key, value):
        if key in ['sunset', 'sunrise', 'timestamps']:
            utc = datetime.datetime.utcfromtimestamp(value).replace(tzinfo=pytz.utc)
            local = utc.astimezone(pytz.timezone(self._timezone))
            return local.strftime('%H:%M')

        return value



def main():
    d = db()
    # config = homie.loadConfigFile("configs/weather.json")
    # Homie = homie.Homie(config)
    Homie = homie.Homie("configs/weather.json")
    weather = Weather(d, Homie)

    Homie.setFirmware("weather", "1.0.0")
    Homie.setup()

    while True:
        weather.loopHandler()
        time.sleep(5)



if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")
