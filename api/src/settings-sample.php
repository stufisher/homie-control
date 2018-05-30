<?php
return [
    'settings' => [
        'determineRouteBeforeAppMiddleware' => true,
        'displayErrorDetails' => true, // set to false in production

        'mysql' => [
            'user' => 'username',
            'password' => 'password',
            'db' => 'logging',
            'host' => '127.0.0.1',
        ],

        'mqtt' => [
            'server' => 'localhost',
            'client' => 'IrrigViewer',
            'user' => '',
            'password' => '',

            // mqqt server esp devices should use if different to above
            'device_server' => '192.168.123.1',
            'device_user'=> 'user',
            'device_password' => 'pass',
        ],

        'homie' => [
            'base_topic' => 'devices',
        ],

        // Wifi AP to connect ESP devices to
        'wifi' => [
            'ssid' => 'myssid',
            'password' => 'somepass',
        ],

        'modules' => [
            'Misc',
            'Profile',
            'Schedule',
            'Device',
            'Trigger',
            'Group',
            'Property',
            'Repeater',
            'Admin',
        ],
    ],
];
