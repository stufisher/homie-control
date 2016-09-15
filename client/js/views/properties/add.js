define(['backbone.marionette', 'views/table', 'utils/table',
    'collections/properties', 
    'models/property',
    'collections/propertytypes'], 
    function(Marionette, TableView, TableUtils, Properties, Property, PropertyTypes) {
    

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

            var days = Math.floor(secs / (60 * 60 * 24));
            var divisor_for_hours = secs % (60 * 60 * 24);
            var hours = Math.floor(divisor_for_hours / (60 * 60));
            var divisor_for_minutes = secs % (60 * 60);
            var minutes = Math.floor(divisor_for_minutes / 60);
            var divisor_for_seconds = divisor_for_minutes % 60;
            var seconds = Math.ceil(divisor_for_seconds);

            var text =  ''
            if (days > 0) text += days+'d'
            if (hours > 0) text += ' '+hours+'h'
            if (minutes > 0) text += ' '+minutes+'m'
            if (seconds > 0 && days == 0 && hours == 0) text += ' '+seconds+'s'

            this.$el.html(text)

            return this
        }
    })



    var InputCell = Backgrid.Cell.extend({
        events: {
            'change input': 'updateValue'
        },

        updateValue: function(e) {
            this.model.set('friendlyname', this.$el.find('input').val())
        },

        render: function() {
            this.$el.html('<input/>')
            return this
        },
    })

    var TypeCell = Backgrid.Cell.extend({
        events: {
            'change select': 'updateValue'
        },

        updateValue: function(e) {
            this.model.set('propertytypeid', this.$el.find('select').val())
            var types = this.column.get('types')
            var t = types.findWhere({ propertytypeid: this.$el.find('select').val() })
            if (t) this.model.set('propertytype', t.get('name'))
        },

        render: function() {
            var types = this.column.get('types')
            this.$el.html('<select>'+types.opts()+'</select>')
            this.model.set('propertytypeid', types.first().get('propertytypeid'))
            this.model.set('propertytype', types.first().get('name'))
            return this
        },
    })

    var AddCell = Backgrid.Cell.extend({
        events: {
            'click a.add': 'addProperty'
        },

        addProperty: function(e) {
            e.preventDefault()
            var self = this
            var model = new Property(this.model.toJSON())
            model.save({}, {
                success: function() {
                    self.model.collection.remove(self.model)
                    self.column.get('properties').add(model)
                }
            })
        },

        render: function() {
            this.$el.html('<a href="#" class="button add"><i class="fa fa-plus"></i></a>')
            return this
        },
    })

    var AddrProperty = Property.extend({
        idAttribute: 'address',
    })

    
    return Marionette.View.extend({
        className: 'content',
        template: _.template('<a href="/property/add" class="button r"><i class="fa fa-plus"></i> Add Property</a><div class="wrp"></div><div class="wrp2"></div>'),
        regions: {
            'wrap': '.wrp',
            'wrap2': '.wrp2'
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
                }))
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


        saveProperty: function(m, v) {
            if ('isSelected' in m.changedAttributes()) return
            if ('value' in m.changedAttributes()) return
            if ('devicename' in m.changedAttributes()) return
            // console.log('model changed', arguments)
            if (!m.get('new')) m.save(m.changedAttributes(), { patch: true })
        },

        initialize: function(options) {
            this.listenTo(this.collection, 'change', this.saveProperty, this)

            this.types = new PropertyTypes()
            this.ready = this.types.fetch()

            this.devices = new Properties(null, { model: AddrProperty })
            var columns = [
                         { name: 'devicestring', label: 'Address', cell: 'string', editable: false },
                         { name: 'devicename', label: 'Name', cell: 'string', editable: false },
                         { label: 'Online', cell: OnlineCell, editable: false },
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
            $.when(this.ready).done(this.doOnRender.bind(this))
        },

        doOnRender: function() {
            var columns = [{ name: 'friendlyname', label: 'Name', cell: 'string', editable: true },
                         { name: 'devicestring', label: 'Device', cell: 'string', editable: true },
                         { name: 'nodestring', label: 'Node', cell: 'string', editable: true },
                         { name: 'propertystring', label: 'Property', cell: 'string', editable: true },
                         { name: 'propertytypeid', label: 'Type', cell: TableUtils.SelectInputCell, editable: true, options: this.types },
                         { name: 'value', label: 'Last Value', cell: 'string', editable: false },]

            this.table = new TableView({ 
                mobileHidden: [1,2,3],
                collection: this.collection, 
                columns: columns, 
                tableClass: 'properties', 
                filter: 's', loading: true, 
                backgrid: { emptyText: 'No properties found', } })


            this.getRegion('wrap').show(this.table)
            this.getRegion('wrap2').show(this.table2)

            this.table.focusSearch()
        },

    })

})