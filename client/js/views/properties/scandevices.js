define(['backbone.marionette', 'views/table', 'utils/table', 'utils',
    'collections/scanneddevices'], 
    function(Marionette, TableView, TableUtils, utils,
        ScannedDevices) {
    

    var SignalCell = Backgrid.Cell.extend({
        initialize: function(options) {
            SignalCell.__super__.initialize.call(this,options)
            this.listenTo(this.model, 'change reset', this.render, this)
        },

        render: function() {
            if (this.model.get('signal'))
                this.$el.html('<meter min="0" max="100" low="50" value="'+this.model.get('signal')+'"></meter>')
            return this
        }
    })


    var NodesCell = Backgrid.Cell.extend({
        initialize: function(options) {
            NodesCell.__super__.initialize.call(this,options)
            this.listenTo(this.model, 'change reset', this.render, this)
        },

        render: function() {
            this.$el.empty()

            if (this.model.get('nodes')) {
                var nodes = []
                _.each(this.model.get('nodes'), function(n) {
                    nodes.push('<li>'+n.id+' ('+n.type+')</li>')
                })

                this.$el.html('<ul>'+nodes.join('')+'</ul>')

            } else {
                this.$el.html('<i class="fa fa-spin fa-cog"></i>')
            }

            return this
        }
    })


    var ConfigureCell = Backgrid.Cell.extend({
        events: {
            'click a.configure': 'configure',
        },

        configure: function(e) {
            e.preventDefault()

            if (!this.model.get('name')) return

            this.$el.find('i').addClass('fa-spin')

            var self = this
            Backbone.ajax({
                url: app.apiurl+'/admin/device/config',
                data: {
                    ssid: this.model.get('ssid'),
                    name: this.model.get('name')
                },
                dataType: 'json',

                success: function(resp) {
                    self.$el.html('<i class="fa fa-check"></i>')
                },

                error: function(resp) {
                    self.$el.find('i').removeClass('fa-spin')
                }
            })

        },

        render: function() {
            this.$el.html('<a href="#" class="button configure"><i class="fa fa-cog"></i></a>')
            return this
        },
    })


    
    return Marionette.View.extend({
        className: 'content',
        template: _.template('<a href="#" class="button refresh r"><i class="fa fa-refresh"></i> Refresh</a><div class="wrp"></div>'),
        regions: {
            'wrap': '.wrp'
        },

        ui: {
            ref: 'a.refresh',
        },

        events: {
            'click @ui.ref': 'refreshDevices',
        },


        refreshDevices: function(e) {
            e.preventDefault()
            this.devices.fetch()
            this.ui.ref.find('i').addClass('fa-spin')
        },


        queryDevice: function() {
            var self = this
            var model = this.devices.at(this.queryId)

            if (model) {
                Backbone.ajax({
                    url: app.apiurl+'/admin/device/info',
                    data: {
                        ssid: model.get('ssid')
                    },
                    dataType: 'json',

                    success: function(resp) {
                        model.set({
                            firmware_name: resp.firmware.name,
                            firmware_version: resp.firmware.version,
                            nodes: resp.nodes,
                            homie_version: resp.homie_esp8266_version
                        })

                        if (self.queryId < self.devices.length) {
                            self.queryId++
                            setTimeout(self.queryDevice.bind(self), 5000)
                        }
                    }
                })
            }
        },


        queryDevices: function() {
            this.ui.ref.find('i').removeClass('fa-spin')

            if (!this.devices.length) return
            this.queryId = 0
            setTimeout(this.queryDevice.bind(this), 2000)
        },


        initialize: function(options) {
            this.queryId = 0

            this.devices = new ScannedDevices()
            this.listenTo(this.devices, 'sync', this.queryDevices)
            this.devices.fetch()

            var columns = [
                { name: 'ssid', label: 'Id', cell: 'string', editable: false },
                { name: 'chan', label: 'Channel', cell: 'string', editable: false },
                { label: 'Signal', cell: SignalCell, editable: false },
                { name: 'homie_version', label: 'Homie Version', cell: 'string', editable: false },
                { name: 'firmware_name', label: 'FW Name', cell: 'string', editable: false },
                { name: 'firmware_version', label: 'FW Version', cell: 'string', editable: false },
                { label: 'Nodes', cell: NodesCell, editable: false },
                { name: 'name', label: 'Friendly Name', cell: TableUtils.ValidatedCell, editable: true },
                { label: 'Configure', cell: ConfigureCell, editable: false },
            ]

            this.table = new TableView({ collection: this.devices, 
                mobileHidden: [3,4,5,6,7],
                columns: columns, 
                tableClass: 'devices', 
                filter: false, 
                backgrid: { emptyText: 'No devices found', } 
            })
            
        },
                                          
        onRender: function() {
            this.getRegion('wrap').show(this.table)
        },

    })

})