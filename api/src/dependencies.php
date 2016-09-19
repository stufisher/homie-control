<?php

// DIC configuration
$container = $app->getContainer();


// App Exceptions
class AppException extends Exception {}
$container['errorHandler'] = function ($container) {
    return function ($request, $response, $exception) use ($container) {
        if ($exception instanceof AppException) {
            return $container['response']->withStatus($exception->getCode())
                                         ->withJSON($exception->getMessage());
        } else {
            $data = [
              'code' => $exception->getCode(),
              'message' => $exception->getMessage(),
              'file' => $exception->getFile(),
              'line' => $exception->getLine(),
              'trace' => explode("\n", $exception->getTraceAsString()),
            ];
         
            return $container->get('response')->withStatus(500)
                             ->withHeader('Content-Type', 'application/json')
                             ->withJSON($data);
        }
    };
};


// MySQL
$container['db'] = function($c) {
    $s = $c->get('settings')['mysql'];
    return new App\MySQL($s['user'], $s['password'], $s['db'], $s['host']);
};


// MQTT
require __DIR__ . '/../vendor/bluerhinos/phpmqtt/phpMQTT.php';
$container['mqtt'] = function($c) {
    $s = $c->get('settings')['mqtt'];
    return new phpMQTT($s['server'], 1883, $s['client']);
};



// HTMLPurifier
$container['htmlpurifier'] = function($c) {
    $config = HTMLPurifier_Config::createDefault();
    return new HTMLPurifier($config);
};

// Argument List
$container['arglist'] = function($c) {
    return new App\ArgList();
};

// ArgParser
$container['args'] = function($c) {
    return new App\ArgParser($c->get('htmlpurifier'), $c->get('arglist'));
};



// Bootstrap Controllers
$modules = $container->get('settings')['modules'];
foreach ($modules as $mod) {
    $cl = '\App\Modules\\'.$mod.'\Controller';
    $container[$cl] = function($c) use ($app, $cl) {
        return new $cl($app, $c->get('args'), $c->get('db'), $c->get('mqtt'), $c->get('settings'));
    };
}
