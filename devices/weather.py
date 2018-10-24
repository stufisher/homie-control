# -*- coding: utf-8 -*-
#!/usr/bin/env python

import time
import homie
import logging
import requests
import datetime
import pytz
logging.basicConfig(level=logging.INFO)
# logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

from modules.homiedevice import HomieDevice
from modules.mysql import db


class Weather(HomieDevice):

    _timezone = None

    _config = {}
    _last_update = 0
    _update_interval = 5

    _root_url = "https://api.darksky.net"

    _property_map = [
        {            
            'url': '/forecast/{key}/{lat},{long}?units=si',
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
                'name': '_today',
                'properties': {
                    'temphigh': ['daily', 'data', 0, 'temperatureHigh'],
                    'templow': ['daily', 'data', 0, 'temperatureLow'],
                    'icon': ['daily', 'data', 0, 'icon'],
                    'pop': ['daily', 'data', 0, 'precipProbability'],
                    'pint': ['daily', 'data', 0, 'precipIntensity'],
                    'wind': ['daily', 'data', 0, 'windSpeed'],
                    'winddir': ['daily', 'data', 0, 'windBearing'],
                    'gust': ['daily', 'data', 0, 'windGust'],
                    
                }
            },
            {
                'name': '_tomorrow',
                'properties': {
                    'temphigh': ['daily', 'data', 1, 'temperatureHigh'],
                    'templow': ['daily', 'data', 1, 'temperatureLow'],
                    'icon': ['daily', 'data', 1, 'icon'],
                    'pop': ['daily', 'data', 1, 'precipProbability'],
                    'pint': ['daily', 'data', 1, 'precipIntensity'],
                    'wind': ['daily', 'data', 1, 'windSpeed'],
                    'winddir': ['daily', 'data', 1, 'windBearing'],
                    'gust': ['daily', 'data', 1, 'windGust'],
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
        
        self._today = self._homie.Node("today", "forecast")
        self._tomorrow = self._homie.Node("tomorrow", "forecast")
        for k in ['_today', '_tomorrow']:
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



    def loopHandler(self):
        now = time.time()
        if now - self._last_update > 5 * 60:

            for pm in self._property_map:
                logger.debug('Requesting {url}'.format(url=pm['url']))
                r = requests.get(self._root_url+pm['url'].format(
                        key=self._config['weather_key'],
                        lang=self._config['weather_lang'],
                        lat=self._config['latitude'],
                        long=self._config['longitude']))

                self._timezone = r.json()['timezone']

                for nl in pm['nodes']:
                    n = getattr(self, nl['name'])

                    for p,t in nl['properties'].iteritems():
                        val = self.get(r.json(), t)
                        n.setProperty(p).send(str(self.translate(p, val)))

            self._last_update = now


    def get(self, json, tree):
        res = json
        for item in tree:
            res = res[item]

        return res


    def translate(self, key, value):
        if key in ['sunset', 'sunrise']:
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
