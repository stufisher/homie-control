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
        ],

        'homie' => [
            'base_topic' => 'devices',
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
        ],
    ],
];
