import base64
import logging
import requests
import time


logger = logging.getLogger(__name__)


class Pushover:
    def __init__(self, options):
        opts = {}
        for option in options:
            opts[option["name"]] = option["value"]

        self._options = opts

    def send(self, property, additional):
        files = {}
        message = "Property '{0}' changed to: <b>{2}</b>\n".format(*property)

        if len(additional):
            message += "Additional properties:\n"

        for add in additional:
            if add["type"] == "binary":
                if add["value"] is not None:
                    img = base64.decodestring(add["value"])
                    files["attachment"] = (
                        add["friendlyname"] + ".jpg",
                        img,
                        "image/jpeg",
                    )
                    message += "'{0}' attached\n".format(add["friendlyname"])
                else:
                    logger.warning("Additional property %s is None", add["address"])
            else:
                message += "'{0}' : <u>{1}</u>\n".format(
                    add["friendlyname"], add["value"]
                )

        req = requests.post(
            "https://api.pushover.net/1/messages.json",
            data={
                "token": self._options["pushover_token"],
                "user": self._options["pushover_group"],
                "title": "Homie Notification",
                "message": message,
                "timestamp": time.time(),
                "html": 1,
            },
            files=files,
        )

        if req.status_code == 200:
            logger.info("Sent push notification")
        else:
            logger.error(
                "Could not send push notification: {0}".format(req.status_code)
            )
