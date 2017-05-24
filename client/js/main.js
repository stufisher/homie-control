require.config({
  shim: {
      Flot: {
          deps: ['jquery'],
          exports: '$.plot'
      },
      'Flot-selection': {
          deps: ['Flot']
      },
      'Flot-resize': {
          deps: ['Flot']
      },
      'flot.tooltip.pib': {
          deps: ['Flot']
      },
      'Flot-axislabels': {
          deps: ['Flot']
      },
      'Flot-time': {
          deps: ['Flot']
      },

      'jquery-color': {
          deps: ['jquery']
      },

  },
  paths: {
    Flot: "vendor/Flot/jquery.flot",
    "Flot-time": "vendor/Flot/jquery.flot.time",
    "Flot-selection": "vendor/Flot/jquery.flot.selection",
    "Flot-resize": "vendor/Flot/jquery.flot.resize",
    "backbone.marionette": "vendor/backbone.marionette/lib/backbone.marionette",
    "backbone.validation": "vendor/backbone.validation/dist/backbone-validation",
    "paho-mqtt-js": "vendor/paho-mqtt-js/mqttws31",
    requirejs: "vendor/requirejs/require",
    backgrid: "vendor/backgrid/lib/backgrid",
    "backgrid-paginator": "vendor/backgrid-paginator/backgrid-paginator",
    "backbone.paginator": "vendor/backbone.paginator/lib/backbone.paginator",
    backbone: "vendor/backbone/backbone",
    jquery: "vendor/jquery/dist/jquery",
    "jquery-color": "vendor/jquery-color/jquery.color",
    "jeditable": "vendor/jeditable/jquery.jeditable",
    underscore: "vendor/underscore/underscore",
    "backbone.radio": "vendor/backbone.radio/build/backbone.radio",
    "flot.tooltip.pib": "vendor/flot.tooltip.pib/js/jquery.flot.tooltip",
    "backbone.syphon": "vendor/backbone.syphon/lib/backbone.syphon",
    "moment": "vendor/moment/moment",
  },
  packages: [

  ]
})

require(['app'], function(app) {
  "use strict"
  app.start()
})
