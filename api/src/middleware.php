<?php
// Application middleware
$container = $app->getContainer();


// Argument Parser
$app->add($container->get('args'));
