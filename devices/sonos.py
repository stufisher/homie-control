# -*- coding: utf-8 -*-
#!/usr/bin/env python
import io
import time
import logging
import threading
import json
import base64

import homie
import requests

from PIL import Image
import soco

from modules.homiedevice import HomieDevice
from modules.mysql import db

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

logging.getLogger("requests").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)
logging.getLogger("homie").setLevel(logging.WARNING)
logging.getLogger("soco.services").setLevel(logging.WARNING)


class SonosDeviceNode(homie.HomieNode):
    def __init__(self, homie_instance, name, client, options):
        self._state = {"currentTrack": {}}
        self._last_update = 0

        self._options = options
        self._homie = homie_instance
        self._client = client
        self._progress = 0
        self._playing = 0

        self._name = name

        super(SonosDeviceNode, self).__init__(
            homie_instance, self._name.replace(" ", "").lower(), "device"
        )

        self.advertise("artist")
        self.advertise("album")
        self.advertise("track")
        self.advertise("progress")
        self.advertise("length")

        self.advertise("thumb")
        self.advertise("cover")

        self.advertise("playing").settable(self.playing_handler)
        self.advertise("next").settable(self.next_handler)
        self.advertise("previous").settable(self.playing_handler)
        self.advertise("volume").settable(self.volume_handler)
        self.advertise("favourite").settable(self.favourite_handler)

        self._tick_running = True
        self._tick_thread = threading.Thread(target=self._tick)
        self._tick_thread.daemon = True
        self._tick_thread.start()

        self._update_running = True
        self._update_thread = threading.Thread(target=self._update)
        self._update_thread.daemon = True
        self._update_thread.start()

    @property
    def name(self):
        return self._name

    def playing_handler(self, mqttc, obj, msg):
        payload = msg.payload.decode("UTF-8")
        if payload == "1":
            self.client("/play")
        else:
            self.client("/pause")

    def next_handler(self, *args):
        self.client("/next")

    def previous_handler(self, *args):
        self.client("/previous")

    def favourite_handler(self, mqttc, obj, msg):
        self.client("/favourite/{fav}".format(fav=msg.payload.decode("UTF-8")))

    def volume_handler(self, mqttc, obj, msg):
        self.client("/volume/{volume}".format(volume=msg.payload.decode("UTF-8")))

    def client(self, url, *args, **kwargs):
        return self._client("/{name}{url}".format(name=self.name, url=url))

    def update(self):
        req = self.client("/state")
        if req.status_code != 200:
            return

        state = req.json()

        track_info = state["currentTrack"]
        if self._state["currentTrack"].get("artist") != track_info.get("artist"):
            self.setProperty("artist").send(
                track_info["artist"].encode("ascii", "ignore")
                if track_info.get("artist")
                else " "
            )

        if self._state["currentTrack"].get("album") != track_info.get("album"):
            self.setProperty("album").send(
                track_info["album"].encode("ascii", "ignore")
                if track_info.get("album")
                else " "
            )

        if self._state["currentTrack"].get("title") != track_info.get("title"):
            self.setProperty("track").send(
                track_info["title"].encode("ascii", "ignore")
                if track_info.get("title")
                else " "
            )

            if track_info.get("absoluteAlbumArtUri"):
                aa_url = track_info["absoluteAlbumArtUri"]
                if not aa_url.startswith("http://"):
                    aa_url = self._options["sonos_aa"] + aa_url

                album_art = requests.get(aa_url)

                if album_art.status_code == 200:
                    self.setProperty("cover").send(
                        self._generate_thumb(
                            album_art.content,
                            size=[500, 500],
                            quality=60,
                            max_size=250000,
                        )
                    )

                    self.setProperty("thumb").send(
                        self._generate_thumb(album_art.content)
                    )

        if self._state["currentTrack"].get("duration") != track_info["duration"]:
            self.setProperty("length").send(track_info["duration"])

        if self._state.get("elapsedTime") != state["elapsedTime"]:
            self._progress = state["elapsedTime"]
            self.setProperty("progress").send(self._progress)

        if self._state.get("playbackState") != state["playbackState"]:
            self._playing = 1 if state["playbackState"] == "PLAYING" else 0
            self.setProperty("playing").send(self._playing)

        if self._state.get("volume") != state["volume"]:
            self.setProperty("volume").send(state["volume"])

        self._state = state

    def shutdown(self):
        logger.info("Waiting for threads to end")
        self._tick_running = False
        self._tick_thread.join()

        self._update_running = False
        self._update_thread.join()

    def _generate_thumb(self, content, quality=8, size=[200, 200], max_size=3000):
        img = Image.open(io.BytesIO(content))
        img = img.convert("RGB")
        img.thumbnail(size, Image.ANTIALIAS)

        byte_array = io.BytesIO()
        img.save(byte_array, "jpeg", quality=quality)
        b64 = base64.b64encode(byte_array.getvalue())

        if len(b64) > max_size:
            for _ in range(5):
                quality = quality * 0.75
                byte_array = io.BytesIO()
                img.save(byte_array, "jpeg", quality=int(round(quality)))
                b64 = base64.b64encode(byte_array.getvalue())
                if len(b64) < max_size:
                    break

        # print(self.name, len(b64))
        return b64

    def _tick(self):
        logger.info("Starting tick thread for {name}".format(name=self.name))
        while self._tick_running:
            if self._playing and self._homie.mqtt_connected:
                self._progress += 1
                self.setProperty("progress").send(self._progress)

            time.sleep(1)

    def _update(self):
        logger.info("Starting update thread for {name}".format(name=self.name))
        while self._update_running:
            now = time.time()
            if now - self._last_update > 5:
                self.update()
                self._last_update = now

            time.sleep(1)


class Sonos(HomieDevice):
    _fav_cache = []
    _first = True
    _last_update = 0
    _update_zones = False

    def setup(self):
        self._options = {}
        config = self._db.pq(
            """SELECT name, value FROM options WHERE name IN ('sonos_url', 'sonos_port', 'sonos_aa')"""
        )
        if config:
            for row in config:
                self._options[row["name"]] = row["value"]

        self._devices = []
        for device in soco.discover():
            node = SonosDeviceNode(
                self._homie,
                device.get_speaker_info()["zone_name"],
                self.client,
                self._options,
            )
            self._homie.nodes.append(node)
            self._devices.append(node)

        self._sonos = self._homie.Node("sonos", "sonos")
        self._sonos.advertise("favourites")
        self._sonos.advertise("pause").settable(self.pause_handler)
        self._sonos.advertise("resume").settable(self.resume_handler)

        self._zones = self._homie.Node("zones", "zones")
        self._zones.advertise("current")
        self._zones.advertise("add").settable(self.add_to_zone_handler)
        self._zones.advertise("remove").settable(self.remove_from_zone_handler)
        self._zones.advertise("volume").settable(self.volume_handler)

        self._update_running = True
        self._update_thread = threading.Thread(target=self._update)
        self._update_thread.daemon = True
        self._update_thread.start()

    def _update(self):
        logger.info("Starting main update thread")
        while self._update_running:
            now = time.time()
            if now - self._last_update > 30:
                self.get_zones()
                self.get_favs()
                self._last_update = now

            if self._update_zones:
                self.get_zones()
                self._update_zones = False

            time.sleep(1)

    def add_to_zone_handler(self, mqttc, obj, msg):
        try:
            zone, group = msg.payload.decode("UTF-8").split(",")
        except:
            logger.warning("Message does not have zone and group")
        else:
            resp = self.client("/{zone}/join/{group}".format(zone=zone, group=group))
            if resp.status_code == 200:
                time.sleep(1)
                self._update_zones = True

    def remove_from_zone_handler(self, mqttc, obj, msg):
        resp = self.client("/{zone}/leave".format(zone=msg.payload.decode("UTF-8")))
        if resp.status_code == 200:
            time.sleep(1)
            self._update_zones = True

    def volume_handler(self, mqttc, obj, msg):
        try:
            zone, volume = msg.payload.decode("UTF-8").split(",")
        except:
            logger.warning("Message does not have zone and volume")
        else:
            resp = self.client("/{zone}/groupVolume/{volume}".format(zone=zone, volume=volume))
            if resp.status_code == 200:
                self._update_zones = True

    def get_zones(self):
        resp = self.client("/zones")
        if resp.status_code == 200:
            zones_out = []
            for z in resp.json():
                zone = {
                    "coordinator": z["coordinator"]["roomName"],
                    "volume": z["coordinator"]["groupState"]["volume"],
                    "members": [m["roomName"] for m in z["members"]],
                }
                zones_out.append(zone)

            self._zones.setProperty("current").send(json.dumps(zones_out))

    def pause_handler(self, *args):
        self.client("/pauseall")

    def resume_handler(self, *args):
        self.client("/resumeall")

    def get_favs(self):
        resp = self.client("/favourites")
        if resp.status_code == 200:
            favs = resp.json()
            if favs != self._fav_cache:
                self._sonos.setProperty("favourites").send(json.dumps(favs))
                self._fav_cache = favs

    def client(self, path, method="get", **kwargs):
        url = (
            "http://"
            + self._options["sonos_url"]
            + ":"
            + str(self._options["sonos_port"])
            + path
        )
        return getattr(requests, method)(url, **kwargs)

    def loopHandler(self):
        if self._first:
            for d in self._devices:
                d.update()

            self._first = False

        time.sleep(1)

    def shutdown(self):
        self._update_running = False
        self._update_thread.join()

        for d in self._devices:
            d.shutdown()


def main():
    d = db()

    config = homie.loadConfigFile("configs/sonos.json")
    Homie = homie.Homie(config)
    sonos = Sonos(d, Homie)

    Homie.setFirmware("sonos", "1.0.0")
    Homie.setup()

    try:
        while True:
            sonos.loopHandler()

    finally:
        sonos.shutdown()


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")
