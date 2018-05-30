define(['backbone.marionette', 'controller'],
function(Marionette, controller) {

    var Router = Marionette.AppRouter.extend({
        appRoutes: {
            'console': 'console',

            'property(/s/:s)(/page/:page)': 'properties',
            'property/add': 'add_property',
            'device': 'devices',
            'device/scan': 'scan_devices',
            'group': 'property_group',

            'schedule': 'schedule',

            'profile': 'profiles',
            'ndevice': 'ndevices',
            'trigger': 'trigger',
            'history': 'history',
            'repeater': 'repeater',

            'pages/:slug': 'pages',

            'options': 'options',
            'options/:page': 'configure_page',

            '*home': 'pages',
        },

        onRoute: function(name, path, args) {
            console.log(name, path, args)
            if (path.endsWith(':slug')) {
                if (!args[0]) return
                path = path.replace(/\:slug/, args[0])
            }

            if (path == '*home') {
                if (!args[0]) return
                path = 'pages/'+args[0]
            }

            $.when(app.ready).done(function() {
                $('.sidebar li').removeClass('active')
                $('.sidebar a').each(function(i,l) {
                    var $l = $(l)
                    var hr = $l.attr('href').replace(/\//, '')
                    // console.log(path, hr)
                    if (hr == path) $l.parent('li').addClass('active')
                })
            })
        }
    })
   
    return new Router({
        controller: controller
    })
    
})
