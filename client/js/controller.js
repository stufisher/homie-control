define([
        'views/console',

        'collections/properties',
        'views/properties/properties',
        'views/properties/devices',
        'views/properties/propertyadd',
        'views/properties/propertygroups',

        'models/options',
        'views/options/options',
        'views/options/config_editor',

        'views/schedule/schedule',

        'views/profile/profiles',

        'collections/devices',
        'views/devices/devices',

        'views/triggers/triggers',

        'views/history/history',
        ],
function(
    Console,
    Properties, PropertiesView, PropertyDeviceView, PropertyAddView, PropertyGroupsView,
    Options, OptionsView, ConfigEditor,
    ScheduleView,
    ProfileView,
    Devices, DevicesView,
    TriggerView,
    HistoryView
    ) {

    var controller = {

        options: function() {
            var o = new Options()
            o.fetch({
                success: function() {
                    app.title({ title: 'Options' })
                    app.content.show(new OptionsView({ model: o }))
                },

                error: function() {
                    app.message({ title: 'Error', message: 'Couldnt load options'})
                },
            })
        },

        configure_page: function(page) {
            var p = app.pages.findWhere({ pageid: parseInt(page) })
            if (p) {
                app.title({ title: 'Config Page: '+p.get('title') })
                app.content.show(new ConfigEditor({ model: p }))

            } else app.message({ title: 'Not found', message: 'No page with that id found' })
        },



        // Console
        console: function() {
            app.title({ title: 'Console' })
            app.content.show(new Console())
        },


        // Properties
        properties: function(s, page) {
            // app.loading()
            page = page ? parseInt(page) : 1

            var ps = new Properties(null, { state: { currentPage: page }, queryParams: { s: s } })
            ps.setPageSize(app.mobile() ? 5 : 15)
            ps.fetch({
                success: function() {
                    app.title({ title: 'Properties' })
                    app.content.show(new PropertiesView({ collection: ps, params: { s: s } }))
                },

                error: function() {
                    app.message({ title: 'Error', message: 'Couldnt load properties'})
                },
            })
        },


        devices: function() {
            app.title({ title: 'Devices' })
            app.content.show(new PropertyDeviceView())
        },


        add_property: function() {
            app.title({ title: 'Add Property' })
            app.content.show(new PropertyAddView())
        },


        // Property Groups
        property_group: function() {
            app.title({ title: 'Property Groups' })
            app.content.show(new PropertyGroupsView())
        },


        // Schedules
        schedule: function() {
            app.title({ title: 'Schedules' })
            app.content.show(new ScheduleView())
        },


        // Profiles
        profiles: function() {
            app.title({ title: 'Profiles' })
            app.content.show(new ProfileView())
        },


        // Devices
        ndevices: function() {
            // app.loading()
            var ds = new Devices()
            ds.fetch({
                success: function() {
                    app.title({ title: 'Devices' })
                    app.content.show(new DevicesView({ collection: ds }))
                },

                error: function() {
                    app.message({ title: 'Error', message: 'Couldnt load devices'})
                },
            })
        },


        // Triggers
        trigger: function() {
            app.title({ title: 'Triggers' })
            app.content.show(new TriggerView())
        },


        // History
        history: function() {
            app.title({ title: 'History' })
            app.content.show(new HistoryView())
        },


        // Dynamic Pages
        pages: function(slug) {
            if (!slug) {
                var p = app.pages.first().set({ isSelected: true })
                app.navigate('pages/'+p.get('slug'))
            } else var p = app.pages.findWhere({slug: slug.replace(/\/pages/,'') })

            if (p && app.config.templates.indexOf(p.get('template')) > -1) {
                app.title({ title: p.get('title') })
                if (p.get('config')) {
                    require(['views/pages/'+p.get('template')], function(view) {
                        app.content.show(new view({ config: p.get('configobj') }))
                    })
                } else {
                    app.message({ title: 'Page not configured', message:'Configure this page <a href="/options/'+p.get('pageid')+'"><i class="fa fa-cog></i></a>'})
                }

            } else {
                app.message({ title: '404', message: 'Not what youre looking for' })
            }
        }

    }

    app.on('properties:show', function() {
        app.navigate('property')
        controller.properties()
    })

    app.on('options:show', function() {
        app.navigate('options')
        controller.options()
    })
        
    return controller
        
        
})