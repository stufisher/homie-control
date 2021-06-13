# -*- coding: utf-8 -*-

import time
import homie
import logging
import json
from datetime import datetime, timedelta
import dateutil

import requests
import arrow
from ics import Calendar

from modules.homiedevice import HomieDevice
from modules.mysql import db

logging.getLogger("requests").setLevel(logging.WARNING)
logging.basicConfig(level=logging.INFO)
# logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


def parse_calendar(text, tz):
    calendar = Calendar(text)
    add_recurring(calendar)

    days = {}
    for i in range(7):
        date = arrow.get(datetime.now() + timedelta(days=i)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        days[i] = {
            "events": [],
            "day": date.format("ddd"),
            "date": date.format("Do"),
            "month": date.format("MMM"),
        }
        events = calendar.timeline.on(date)
        for e in events:
            if e.all_day:
                # Google all day events finish at midnight the next day
                # so remove them
                if e.end == date:
                    continue

            event = {
                "title": e.name,
            }

            if e.all_day:
                event["all_day"] = True
            else:
                event["start"] = e.begin.to(tz).format("HH:mm")
                event["end"] = e.end.to(tz).format("HH:mm")

            if hasattr(e, "recurring"):
                event["recurring"] = True

            days[i]["events"].append(event)

    return list(days.values())


def get_data(url, tz):
    """Retrieve data"""
    try:
        r = requests.get(url)
        if r.status_code == 200:
            return parse_calendar(r.text, tz)

        else:
            logger.warning("Request returned: {code}".format(code=r.status_code))

    except requests.ConnectionError as e:
        logger.warning("Connection Error: {message}".format(message=e))


def add_recurring(calendar, days=8):
    recurring_events = []
    for event in calendar.events:
        for extra in event.extra:
            if extra.name == "RRULE":
                recurrences = dateutil.rrule.rrulestr(
                    extra.value.replace("Z", ""), dtstart=event.begin.naive
                )
                for recurrence in recurrences:
                    diff = recurrence - event.begin.naive
                    if diff == timedelta():
                        continue

                    if recurrence > datetime.now() + timedelta(days=days):
                        continue

                    new_event = event.clone()
                    new_event.end = diff + event.end
                    new_event.begin = diff + event.begin
                    new_event.recurring = True
                    recurring_events.append(new_event)

    calendar.events.update(set(list(calendar.events) + recurring_events))


class HomieCalendar(HomieDevice):
    _last_update = 0
    _update_interval = 5
    _cache = []

    def setup(self):
        config = self._db.pq(
            "SELECT name, value FROM options WHERE name IN ('calendar_url', 'timezone')"
        )

        self._config = {}
        if len(config):
            for row in config:
                self._config[row["name"]] = row["value"]
        else:
            raise AssertionError("Couldnt get calendar config")

        self._daily = self._homie.Node("daily", "events")
        self._daily.advertise("calendar")

    def loopHandler(self):
        now = time.time()
        if now - self._last_update > self._update_interval * 60:
            print("update")
            if not self._homie.mqtt_connected:
                logger.info("Waiting for mqtt connection")
                self._last_update = now - (self._update_interval * 60) + 5
                return

            data = get_data(self._config["calendar_url"], self._config["timezone"])
            if data:
                if data != self._cache:
                    self._daily.setProperty("calendar").send(json.dumps(data))
                    self._cache = data

            self._last_update = now


def main():
    d = db()
    config = homie.loadConfigFile("configs/calendar.json")
    Homie = homie.Homie(config)
    calendar = HomieCalendar(d, Homie)

    Homie.setFirmware("calendar", "1.0.0")
    Homie.setup()

    while True:
        calendar.loopHandler()
        time.sleep(5)


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Quitting.")
