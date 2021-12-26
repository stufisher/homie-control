define(['backbone.marionette', 'views/table', 'utils/table',
    'collections/properties',
    'collections/propertyprofiles',
    'collections/schedules',

    'collections/devices',

    'models/propertytrigger',
    'collections/propertytriggers',
    'models/suntrigger',
    'collections/suntriggers',
    'models/devicetrigger',
    'collections/devicetriggers'

    ], 
    function(Marionette, TableView, TableUtils,
        Properties, Profiles, Schedules, Devices,
        PropertyTrigger, PropertyTriggers,
        SunTrigger, SunTriggers,
        DeviceTrigger, DeviceTriggers) {
    

    var SetRise = {
        array: function() {
            return [['Sunset', '1'], ['Sunrise', '0']]
        }
    }

    var Comparators = {
        array: function() {
            return [['==', '=='], ['>=', '>='], ['>', '>'], ['<=', '<='], ['<', '<'], ['!=', '!=']]
        }
    }

    return Marionette.View.extend({
        className: 'content',
        template: _.template('<h1>Property Triggers</h1><a href="#" class="button addp r"><i class="fa fa-plus"></i> Add Property Trigger</a><div class="wrp"></div><h1>Sunset/Rise Triggers</h1><a href="#" class="button adds r"><i class="fa fa-plus"></i> Add Sun Trigger</a><div class="wrp2"></div><h1>Device Triggers</h1><a href="#" class="button addd r"><i class="fa fa-plus"></i> Add Device Trigger</a><div class="wrp3"></div>'),
        regions: {
            'wrap': '.wrp',
            'wrap2': '.wrp2',
            'wrap3': '.wrp3',
        },

        events: {
            'click a.addp': 'addPTrigger',
            'click a.adds': 'addSTrigger',
            'click a.addd': 'addDTrigger',
        },

        addPTrigger: function(e) {
            e.preventDefault()
            this.ptriggers.add(new PropertyTrigger({ new: true }))
        },

        addSTrigger: function(e) {
            e.preventDefault()
            this.striggers.add(new SunTrigger({ new: true }))
        },

        addDTrigger: function(e) {
            e.preventDefault()
            this.dtriggers.add(new DeviceTrigger({ new: true }))
        },


        initialize: function(options) {
            this.ptriggers = new PropertyTriggers()
            this.listenTo(this.ptriggers, 'change', this.saveTrigger, this)
            this.ptriggers.fetch()

            this.striggers = new SunTriggers()
            this.listenTo(this.striggers, 'change', this.saveTrigger, this)
            this.striggers.fetch()

            this.dtriggers = new DeviceTriggers()
            this.listenTo(this.dtriggers, 'change', this.saveTrigger, this)
            this.dtriggers.fetch()

            this.ready = []
            this.properties = new Properties(null, { subscribe: false, state: { pageSize: 9999 } })
            this.ready.push(this.properties.fetch())

            this.profiles = new Profiles()
            this.ready.push(this.profiles.fetch())

            this.schedules = new Schedules()
            this.ready.push(this.schedules.fetch())

            this.devices = new Devices()
            this.ready.push(this.devices.fetch())        
        },

        saveTrigger: function(m, v) {
            console.log('model changed', arguments)
            if (!m.get('new')) m.save(m.changedAttributes(), { patch: true })
        },


        onRender: function() {
            $.when.apply($, this.ready).done(this.doOnRender.bind(this))
        },

        doOnRender: function() {
            this.getRegion('wrap').show(new TableView({
                collection: this.ptriggers,
                columns: [
                    { name: 'propertyid', label: 'Property', cell: TableUtils.SelectInputCell, options: this.properties },
                    { name: 'value', label: 'Value', cell: TableUtils.ValidatedCell },
                    { name: 'comparator', label: 'Comparator', cell: TableUtils.SelectInputCell, options: Comparators },
                    { name: 'propertyprofileid', label: 'Profile', cell: TableUtils.SelectInputCell, options: this.profiles, none: true },
                    { name: 'scheduleid', label: 'Schedule', cell: TableUtils.SelectInputCell, options: this.schedules, none: true },
                    { name: 'schedulestatus', label: 'Schedule State', cell: TableUtils.ValidatedCell },
                    { name: 'email', label: 'Email', cell: TableUtils.SelectInputCell, options: TableUtils.YesNo },
                    { name: 'push', label: 'Push', cell: TableUtils.SelectInputCell, options: TableUtils.YesNo },
                    { name: 'delay', label: 'Delay (s)', cell: TableUtils.ValidatedCell },
                    { name: 'requiredevice', label: 'Device', cell: TableUtils.SelectInputCell, options: TableUtils.YesNo },
                    { name: 'requirenodevice', label: 'No Device', cell: TableUtils.SelectInputCell, options: TableUtils.YesNo },
                    { label: '', cell: TableUtils.EnableCell, enabled: 'active', editable: false },
                    { label: '', cell: TableUtils.OptionsCell, editable: false },
                ],
                loading: true,
                backgrid: {
                    emptyText: 'No triggers defined'
                }
            }))


            this.getRegion('wrap2').show(new TableView({
                collection: this.striggers,
                columns: [
                    { name: 'sunset', label: 'Time', cell: TableUtils.SelectInputCell, options: SetRise },
                    { name: 'requiredevice', label: 'Require Device', cell: TableUtils.SelectInputCell, options: TableUtils.YesNo },
                    { name: 'propertyprofileid', label: 'Profile', cell: TableUtils.SelectInputCell, options: this.profiles },
                    { label: '', cell: TableUtils.EnableCell, enabled: 'active', editable: false },
                    { label: '', cell: TableUtils.OptionsCell, editable: false },
                ],
                loading: true,
                backgrid: {
                    emptyText: 'No triggers defined'
                }
            }))


            this.getRegion('wrap3').show(new TableView({
                collection: this.dtriggers,
                columns: [
                    { name: 'connected', label: 'Connected', cell: TableUtils.SelectInputCell, options: TableUtils.YesNo },
                    { name: 'deviceid', label: 'Device', cell: TableUtils.SelectInputCell, options: this.devices, none: true },
                    { name: 'requiresunset', label: 'Require Sunset', cell: TableUtils.SelectInputCell, options: TableUtils.YesNo },
                    { name: 'requirelast', label: 'Require Last', cell: TableUtils.SelectInputCell, options: TableUtils.YesNo },
                    { name: 'propertyprofileid', label: 'Profile', cell: TableUtils.SelectInputCell, options: this.profiles },
                    { label: '', cell: TableUtils.EnableCell, enabled: 'active', editable: false },
                    { label: '', cell: TableUtils.OptionsCell, editable: false },
                ],
                loading: true,
                backgrid: {
                    emptyText: 'No triggers defined'
                }
            }))
        },

    })

})