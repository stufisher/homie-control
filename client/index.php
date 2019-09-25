<?php

    $file = file_get_contents('js/config.json');
    $config = json_decode($file);

?><!DOCTYPE html>

<html>
    
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0" />
        <meta name="viewport" content="initial-scale=1.0"/>
        
        <link rel="icon" type="image/ico" href="<?php echo $config->appurl ?>/assets/images/logo_blue.png" />

        <link rel="stylesheet" type="text/css" href="<?php echo $config->appurl ?>/assets/css/stylesheets/main.css">
        <link rel="stylesheet" href="<?php echo $config->appurl ?>/assets/font-awesome/css/font-awesome.min.css">
        <link rel="stylesheet" href="<?php echo $config->appurl ?>/assets/weather-icons/css/weather-icons.min.css">
        <link rel="stylesheet" href="<?php echo $config->appurl ?>/assets/weather-icons/css/weather-icons-wind.css">
        <link rel="stylesheet" href="<?php echo $config->appurl ?>/assets/leaflet/leaflet.css">

        <script type="text/javascript" data-main="<?php echo $config->appurl ?>/js/main" src="<?php echo $config->appurl ?>/js/vendor/requirejs/require.js"></script>

        <title>HA</title>
                
    </head>
    
    <body class="activen"></body>
</html>
