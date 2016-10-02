define(['backbone.marionette', 'views/table', 'utils/table',
    'collections/properties', 
    'models/property',
    'collections/propertytypes'], 
    function(Marionette, TableView, TableUtils, Properties, Property, PropertyTypes) {
    

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
        template: _.template('<a href="/property/add" class="button r"><i class="fa fa-plus"></i> Add Property</a><div class="wrp"></div><h1>New Properties</h1><a href="#" class="button r src"><i class="fa fa-search"></i> Discover Properties</a><div class="wrp2"></div>'),
        regions: {
            'wrap': '.wrp',
            'wrap2': '.wrp2'
        },

        events: {
            'click a.src': 'startSearch',
        },

        startSearch: function(e) {
            e.preventDefault()
            this.allproperties.fetch().done(this.getProperties.bind(this))
        },

        saveProperty: function(m, v) {
            if ('isSelected' in m.changedAttributes()) return
            if ('value' in m.changedAttributes()) return
            if ('devicename' in m.changedAttributes()) return
            if (!m.get('new')) m.save(m.changedAttributes(), { patch: true })
        },

        initialize: function(options) {
            this.listenTo(this.collection, 'change', this.saveProperty, this)

            this.types = new PropertyTypes()
            this.ready = this.types.fetch()

            this.listenTo(app, 'mqtt:message', this.updateList, this)

            this.allproperties = new Properties(null, { state: { pageSize: 9999 }, subscribe: false})
            this.newproperties = new Properties(null, { model: AddrProperty })
        },
                                          
        onRender: function() {
            $.when(this.ready).done(this.doOnRender.bind(this))
        },

        getProperties: function() {
            app.mqtt.subscribe('+/+/+/$properties')
            app.mqtt.subscribe('+/+/+/$type')
            app.mqtt.subscribe('+/+/$name')
        },

        updateList: function(topic, payload) {
            var parts = topic.split('/')
            if (topic.match(/^\w+\/\w+\/\w+\/\$properties$/)) {
                var props = payload.split(',')
                _.each(props, function(p) {
                    var pr = p.split(':')

                    var addr = topic.replace(/\$properties/, pr[0])
                    var exists = this.allproperties.findWhere({ address: addr })
                    if (exists) return

                    var prop = new AddrProperty({
                        address: addr,
                        devicestring: parts[1],
                        nodestring: parts[2],
                        propertystring: pr[0],
                    })

                    this.newproperties.add(prop)
                }, this)
            }

            if (topic.match(/^\w+\/\w+\/\w+\/\$type$/)) {
                this.newproperties.each(function(p) {
                    if (p.get('address').startsWith(topic.replace(/\/\$type/, ''))) {
                        var ty = this.types.findWhere({ name: payload })
                        if (ty) p.set('propertytypeid', ty.get('propertytypeid'))
                    }
                }, this)
            }

            if (topic.match(/^\w+\/\w+\/\$name$/)) {
                this.newproperties.each(function(p) {
                    if (p.get('address').startsWith(topic.replace(/\/\$name/, ''))) {
                        p.set('devicename', payload)      
                    }
                }, this)
            }
        },

        doOnRender: function() {
            var columns = [{ name: 'friendlyname', label: 'Name', cell: TableUtils.ValidatedCell, editable: true },
                         { name: 'devicestring', label: 'Device', cell: TableUtils.ValidatedCell, editable: true },
                         { name: 'nodestring', label: 'Node', cell: TableUtils.ValidatedCell, editable: true },
                         { name: 'propertystring', label: 'Property', cell: TableUtils.ValidatedCell, editable: true },
                         { name: 'propertytypeid', label: 'Type', cell: TableUtils.SelectInputCell, editable: true, options: this.types },
                         { name: 'value', label: 'Last Value', cell: 'string', editable: false },]

            this.table = new TableView({ 
                mobileHidden: [1,2,3],
                collection: this.collection, 
                columns: columns, 
                tableClass: 'properties', 
                filter: 's', loading: true, 
                search: this.getOption('params') && this.getOption('params').s,
                backgrid: { emptyText: 'No properties found', } 
            })

            this.getRegion('wrap').show(this.table)
            this.table.focusSearch()


            var columns = [{ name: 'address', label: 'Address', cell: 'string', editable: false },
                         { name: 'value', label: 'Last Value', cell: 'string', editable: false },
                         { name: 'devicename', label: 'Device Name', cell: 'string', editable: false },
                         { name: 'propertytypeid', label: 'Type', cell: TableUtils.SelectInputCell, editable: true, options: this.types },
                         { name: 'friendlyname', label: 'Friendly Name', cell: InputCell, editable: false },
                         { label: '', cell: AddCell, editable: false }]

            this.table2 = new TableView({ 
                mobileHidden: [1,2,3],
                collection: this.newproperties, 
                columns: columns, 
                tableClass: 'properties', 
                filter: false, loading: true, 
                backgrid: { emptyText: 'No unmapped properties found', } 
            })


            this.getRegion('wrap2').show(this.table2)
        },

    })

})