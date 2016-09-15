define(['backbone.marionette', 'views/table', 'utils/table', 'utils',
    'models/property', 'collections/properties'], 
    function(Marionette, TableView, TableUtils, utils,
        Property, Properties) {
    

    var OnlineCell = Backgrid.Cell.extend({
        initialize: function(options) {
            OnlineCell.__super__.initialize.call(this,options)
            this.listenTo(this.model, 'change reset', this.render, this)
        },

        render: function() {
            this.$el.html('<i class="fa fa-power-off '+(this.model.get('online') == 'true' ? 'active':'')+'"></i>')

            return this
        }
    })

    var SignalCell = Backgrid.Cell.extend({
        initialize: function(options) {
            OnlineCell.__super__.initialize.call(this,options)
            this.listenTo(this.model, 'change reset', this.render, this)
        },

        render: function() {
            if (this.model.get('signal') && this.model.get('online') == 'true')
                this.$el.html('<meter min="0" max="100" low="50" value="'+this.model.get('signal')+'"></meter>')
            return this
        }
    })

    var UptimeCell = Backgrid.Cell.extend({
        render: function() {
            if (this.model.get('online') != 'true') return this

            var secs = this.model.get(this.column.get('name'))
            this.$el.html(utils.friendlyTime(secs))

            return this
        }
    })


    var AddrProperty = Property.extend({
        idAttribute: 'address',
    })
    
    return Marionette.View.extend({
        className: 'content',
        template: _.template('<div class="wrp"></div>'),
        regions: {
            'wrap': '.wrp'
        },

        getDevices: function() {
            _.each(['name','online','fwname','fwversion','signal','uptime','localip'], function(v) {
                app.mqtt.subscribe('+/+/$'+v)
            }, this)
        },

        updateList: function(topic, payload) {
            var parts = topic.split('/')
            if (topic.match(/^\w+\/\w+\/\$name$/)) {
                this.devices.add(new AddrProperty({
                    address: topic,
                    devicestring: parts[1],
                    nodestring: parts[2],
                    devicename: payload
                }, { subscribe: false }))
            }

            var params = { fwname: 'firmware', 
                fwversion: 'version', 
                signal: 'signal', 
                online: 'online', 
                uptime: 'uptime',
                localip: 'ipaddress' }
            _.each(params, function(v, k) {
                var re = new RegExp('^\\w+\\/\\w+\\/\\$'+k+'$')
                if (topic.match(re)) {
                    var d = this.devices.each(function(u) {
                        if (u.get('devicestring').match(parts[1])) u.set(v, payload)
                    })
                }
            }, this)

        },


        initialize: function(options) {
            this.devices = new Properties(null, { model: AddrProperty, subscribe: false })
            var columns = [
                         { label: '', cell: OnlineCell, editable: false },
                         { name: 'devicestring', label: 'Address', cell: 'string', editable: false },
                         { name: 'devicename', label: 'Name', cell: 'string', editable: false },
                         { label: 'Signal', cell: SignalCell, editable: false },
                         { name: 'uptime', label: 'Uptime', cell: UptimeCell, editable: false },
                         { name: 'ipaddress', label: 'IP', cell: 'string', editable: false },
                         { name: 'firmware', label: 'Firmware', cell: 'string', editable: false },
                         { name: 'version', label: 'Version', cell: 'string', editable: false },
                        ]

            this.table2 = new TableView({ collection: this.devices, 
                mobileHidden: [3,4,5,6,7],
                columns: columns, 
                tableClass: 'devices', 
                filter: false, 
                backgrid: { emptyText: 'No devices found', } })
            
            this.listenTo(app, 'mqtt:message', this.updateList, this)
            
            this.getDevices()
        },
                                          
        onRender: function() {
            this.getRegion('wrap').show(this.table2)
        },

    })

})