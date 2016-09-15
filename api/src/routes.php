<?php

$container = $app->getContainer();

// Bootstrap Routers
$modules = $container->get('settings')['modules'];
foreach ($modules as $name => $mod) {
    $cl = '\App\\Modules\\'.$mod.'\\Router';
    new $cl($app, $container->get('arglist'));
}
