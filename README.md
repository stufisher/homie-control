# homie-control

A high level mobile ready web application for the [Homie-esp8266](https://github.com/marvinroger/homie-esp8266) IoT framework

![GitHub Logo](https://github.com/stufisher/homie-control/blob/master/client/screenshots/irrigation.png)

Introduction
----
homie-control provides a web UI to manage Homie devices as well as a series of virtual python devices to allow extended functionality. 

Its lets you do useful things like:
* Historically log device properties
* Schedule changes in event properties (i.e. water your garden once a day)
* Execute profiles of property values (i.e. turn a series of lights on and off simultaneously)
* Trigger property changes based on: 
    * When a network device is dis/connected (i.e. your phone joins your wifi, turn the lights on)
    * Sunset / rise
    * When another property changes
* OTA updates (planned not yet implemented)

## Requirements
* A php / mysql stack running on whatever webserver you like
* An mqtt broker (i use [mosquitto](https://mosquitto.org/))

##Installation
The application consists of three components:
* A PHP REST API
* A Marionette js client
* A series of homie-python devices

### API
1. Install mysql database schema from db/logging.sql
2. Install php dependencies using [composer](https://getcomposer.org/) ```php composer.phar install```
3. Copy api/src/settings-sample.php -> settings.php and update usernames / passwords

### JS Client
1. Install dependencies using [bower](https://bower.io/) ```bower install```
2. Copy js/config-sample.json to config.json and edit mqtt passwords

### Python devices
In order to allow scheduling, profile execution, logging, etc, a series of homie-python devices are provided. These need to be running all the time for this functionality.
To run a device
1. Copy devices/configs/config-sample.json to <device-name>.json (i.e. heating.json for heating.py)
2. Configure mqtt details within config file
3. Run with ```python heating.py```

#### logger.py
This device will log any properties that are registered in the database. This device must be run standalone and cannot (currently) be wrappered by manage.py

#### schedule.py
This device periodically checks if a property is scheduled in the database and updates as needbe

#### profile.py
This device executes a 'profile' of properties
#### device.py
This device checks the network for devices connecting and disconnected and triggers property changes as needed. It also monitors the time and sends triggers for sunet and sunrise
#### heating.py
This device enables a switch to be toggled based on a temperature property reading and a schedule.
#### display.py
A very specific device for relaying property changes from homie-devices to an OLED. Will be generalised and database managed in future

#### manage.py
Is a special device that wraps the other devices into a single process

More docs to follow...
