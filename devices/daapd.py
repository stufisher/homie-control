# -*- coding: utf-8 -*-
#!/usr/bin/env python
import io
import time
import homie
import logging
import threading
import json

import base64

from PIL import Image
import requests
import websocket

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logging.getLogger("requests").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("homie").setLevel(logging.WARNING)


from modules.homiedevice import HomieDevice
from modules.mysql import db

class Daapd(HomieDevice):
    _first = True

    _playing = False
    _progress = 0

    _last_time = ''

    def on_message(self, message):
        js = json.loads(message)

        notify = {
            "player": self.get_player,
            "queue": self.get_queue,
            "volume": self.get_volume,
            "outputs": self.get_outputs,
        }

        if "notify" in js:
            for ty in js["notify"]:
                if ty in notify:
                    notify[ty]()

    def on_open(self):
        self._ws.send(json.dumps({
            "notify": [
                "player",
                "outputs",
                "volume",
                "queue",
            ]
        }))

    def on_error(self, error):
        logger.warning("daapd: {error}".format(error=str(error)))

    def on_close(self):
        logger.warning("daapd: websocket closed")

    def setup(self):
        self._options = {}
        config = self._db.pq("""SELECT name, value FROM options WHERE name IN ('daapd_url', 'daapd_port')""")
        if len(config):
            for row in config:
                self._options[row['name']] = row['value']

        
        self._clock = self._homie.Node("clock", "time")
        self._clock.advertise("time")

        self._library = self._homie.Node("library", "daapd")
        self._library.advertise("playlists")

        self._meta = self._homie.Node("meta", "daapd")
        self._meta.advertise("artist")
        self._meta.advertise("aartist")
        self._meta.advertise("album")
        self._meta.advertise("track")
        self._meta.advertise("progress")
        self._meta.advertise("length")

        self._cover = self._homie.Node("cover", "daapd")
        self._cover.advertise("image")
        self._cover.advertise("thumb")
        self._cover.advertise("mime")

        self._status = self._homie.Node("status", "daapd")
        self._status.advertise("playing").settable(self.playing_handler)
        self._status.advertise("next").settable(self.next_handler)
        self._status.advertise("previous").settable(self.previous_handler)

        self._queue = self._homie.Node("queue", "daapd")
        self._queue.advertise("queue")
        self._queue.advertise("add").settable(self.queue_add_handler)
        self._queue.advertise("play").settable(self.queue_play_handler)

        self._volume = self._homie.Node("volume", "daapd")
        self._volume.advertise("volume").settable(self.volume_handler)

        self._outputs = self._homie.Node("outputs", "daapd")
        self._outputs.advertise("outputs")
        self._outputs.advertise("enable").settable(self.out_enable_handler)
        self._outputs.advertise("volume").settable(self.out_volume_handler)

        conf = self.client('/api/config')
        if conf.status_code != 200:
            raise Exception("Couldnt get config")
        self._config = conf.json()

        path = "ws://"+self._options["daapd_url"]+":"+str(self._config["websocket_port"])
        self._ws = websocket.WebSocketApp(path, 
            on_message=self.on_message, on_open=self.on_open, on_error=self.on_error, on_close=self.on_close, subprotocols=["notify"])

        self._ws_thread = threading.Thread(target=self._ws.run_forever)
        self._ws_thread.daemon = True
        self._ws_thread.start()

        self._tick_running = True
        self._tick_thread = threading.Thread(target=self._tick)
        self._tick_thread.daemon = True
        self._tick_thread.start()

        self._clock_running = True
        self._clock_thread = threading.Thread(target=self._clock_fn)
        self._clock_thread.daemon = True
        self._clock_thread.start()


    def loopHandler(self):
        if self._first and self._homie.mqtt_connected:
            self.get_playlists()
            self.get_player()
            self.get_queue()
            self.get_outputs()

            self._first = False

        time.sleep(0.1)


    def _clock_fn(self):
        while self._clock_running:
            tm = time.strftime("%a %H:%M")
            if tm != self._last_time:
                self._clock.setProperty("time").send(tm)
                self._last_time = tm

            time.sleep(1)


    def shutdown(self):
        logger.info("Waiting for threads to end")
        self._ws.close()
        self._ws_thread.join()

        self._tick_running = False
        self._tick_thread.join()


    def client(self, path, method='get', **kwargs):
        return getattr(requests, method)("http://"+self._options["daapd_url"]+":"+str(self._options["daapd_port"])+path, **kwargs)


    def get_playlists(self):
        resp = self.client("/api/library/playlists")

        if resp.status_code != 200:
            return

        playlists = resp.json()["items"]
        pls = { "playlists": [] }
        for p in playlists:
            pls["playlists"].append({
                "name": p["name"],
                "uri": p["uri"],
            })

        self._library.setProperty("playlists").send(json.dumps(pls))

    def get_queue(self):
        resp = self.client("/api/queue")

        if resp.status_code != 200:
            return

        queue = resp.json()
        if len(queue["items"]):
            items = []
            for item in queue["items"]:
                items.append({
                    "id": item["id"],
                    "uri": item["uri"],
                    "artist": item["artist"],
                    "album": item["album"],
                    "title": item["title"],
                })

            self._queue.setProperty("queue").send(json.dumps({ "items": items }))


    def get_player(self):
        resp = self.client("/api/player")

        if resp.status_code != 200:
            return

        player = resp.json()
        self._playing = player["state"] == 'play'
        self._status.setProperty('playing').send(1 if self._playing else 0)
        self._volume.setProperty("volume").send(player['volume'])

        self._meta.setProperty("length").send(player["item_length_ms"]/1000)
        self._meta.setProperty("progress").send(player["item_progress_ms"]/1000)
        self._progress = player["item_progress_ms"]/1000

        if "artwork_url" in player:
            artwork = self.client(player["artwork_url"])

            if artwork.status_code == 200:
                self._cover.setProperty("mime").send(artwork.headers['Content-Type'])
                self._cover.setProperty("image").send(base64.b64encode(artwork.content))
                self._cover.setProperty("thumb").send(self._generate_thumb(artwork.content))

        resp = self.client("/api/queue")
        if resp.status_code != 200:
            return

        queue = resp.json()
        for item in queue["items"]:
            if item["id"] == player["item_id"]:
                self._meta.setProperty("artist").send(item["artist"].encode('ascii','ignore'))
                self._meta.setProperty("aartist").send(item["album_artist"].encode('ascii','ignore'))
                self._meta.setProperty("album").send(item["album"].encode('ascii','ignore'))
                self._meta.setProperty("track").send(item["title"].encode('ascii','ignore'))

                break


    def _generate_thumb(self, binary, quality=60):
        if not binary:
            return
            
        byt = io.BytesIO(binary)
        byt.seek(0)
        img = Image.open(byt)
        img.thumbnail([200,200], Image.ANTIALIAS)

        byte_array = io.BytesIO()
        img.save(byte_array, format='JPEG', subsampling=0, quality=quality)
        b64 = base64.b64encode(byte_array.getvalue())

        if len(b64) > 30000:
            for i in range(5):
                quality = quality * 0.5
                byte_array = io.BytesIO()
                img.save(byte_array, format='JPEG', subsampling=0, quality=int(quality))
                b64 = base64.b64encode(byte_array.getvalue())
                if (len(b64) < 30000):
                    break

        return b64


    def get_volume(self):
        self.get_player()
        self.get_outputs()


    def get_outputs(self):
        resp = self.client("/api/outputs")

        if resp.status_code != 200:
            return

        outputs = resp.json()
        out = []

        for o in outputs["outputs"]:
            out.append({
                "id": o["id"],
                "name": o["name"],
                "selected": o["selected"],
                "volume": o["volume"],
            })

        self._outputs.setProperty("outputs").send(json.dumps({ "outputs": out }))


    def playing_handler(self, mqttc, obj, msg):
        payload = msg.payload.decode("UTF-8")

        if payload == "1":
            self.client('/api/player/play', method="put")
        else:
            self.client('/api/player/stop', method="put")


    def next_handler(self, mqttc, obj, msg):
        self.client('/api/player/next', method="put")
    
    def previous_handler(self, mqttc, obj, msg):
        self.client('/api/player/previous', method="put")


    def queue_play_handler(self, mqttc, obj, msg):
        payload = msg.payload.decode("UTF-8")
        resp = self.client('/api/player/play', method="put", params={
            "item_id": payload
        })

    def queue_add_handler(self, mqttc, obj, msg):
        payload = msg.payload.decode("UTF-8")
        resp = self.client('/api/queue/items/add', 
            method='post', 
            params={
                "clear": "true",
                "uris": payload,
            }
        )
        self.client('/api/player/play', method="put")

    def volume_handler(self, mqttc, obj, msg):
        payload = msg.payload.decode("UTF-8")
        self.client('/api/player/volume', method="put", params={
            "volume": payload
        })

    def out_volume_handler(self, mqttc, obj, msg):
        payload = msg.payload.decode("UTF-8")
        try:
            oid, volume = payload.split(',')
            self.client('/api/outputs/{id}'.format(id=oid), method='put', json={
                "volume": int(volume)
            })
        except:
            logger.warning('out_volume_handler: malformed payload {pl}'.format(pl=payload))

    def out_enable_handler(self, mqttc, obj, msg):
        payload = msg.payload.decode("UTF-8")
        try:
            oid, enabled = payload.split(',')
            self.client('/api/outputs/{id}'.format(id=oid), method='put', json={
                'selected': enabled == '1'
            })
        except:
            logger.warning('out_enable_handler: malformed payload {pl}'.format(pl=payload))


    def _tick(self):
        logger.info('Starting tick thread')
        while self._tick_running:
            if self._playing and self._homie.mqtt_connected:
                self._progress += 1
                self._meta.setProperty("progress").send(self._progress)

            time.sleep(1)


def main():
    d = db()

    config = homie.loadConfigFile("configs/daapd.json")
    Homie = homie.Homie(config)
    daapd = Daapd(d, Homie)

    Homie.setFirmware("daapd", "1.0.0")
    Homie.setup()

    try: 
        while True:
            daapd.loopHandler()

    finally:
        daapd.shutdown()


if __name__ == '__main__':
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")
