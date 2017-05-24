define(['backbone.marionette', 'views/table', 'utils/table',
    'models/device'], 
    function(Marionette, TableView, TableUtils, Device) {
    

    var OptionsCell = Backgrid.Cell.extend({
        events: {
            'click a.enable': 'toggleEnable',
            'click a.del': 'delModel',
            'click a.save': 'saveModel',
        },

        saveModel: function(e) {
            e.preventDefault()

            var self = this
            this.model.save({}, { 
                success: function() {
                    self.model.set('new', false)
                    self.render()
                }
            })
        },

        delModel: function(e) {
            e.preventDefault()
            this.model.destroy()
        },

        toggleEnable: function(e) {
            e.preventDefault()
            this.model.set('active', this.model.get('active') ? 0 : 1)

        },

        initialize: function(options) {
            OptionsCell.__super__.initialize.call(this,options)
            this.listenTo(this.model, 'change:active', this.select, this)
        },

        select: function() {
            var i = this.$el.find('a.enable')
            this.model.get('active') ? i.addClass('active') : i.removeClass('active')

        },


        render: function() {
            this.$el.empty()
            if (this.model.get('new')) {
                this.$el.html('<a href="#" class="button save"><i class="fa fa-check"></i></a> <a href="#" class="button del"><i class="fa fa-times"></i></a>')
            } else {
                this.$el.html('<a href="#" class="button enable"><i class="fa fa-power-off"></i></a> <a href="#" class="button del"><i class="fa fa-times"></i></a>')
            }
            this.select()

            this.delegateEvents()
            return this
        }

    })


    var StatusCell = Backgrid.Cell.extend({
        initialize: function(options) {
            StatusCell.__super__.initialize.call(this,options)
            this.listenTo(this.model, 'change:connected', this.select, this)
        },

        select: function() {
            var i = this.$el.find('i.connected')
            this.model.get('connected') ? i.addClass('active') : i.removeClass('active')
            this.model.get('connected') ? i.prop('title', 'Device Connected') :i.prop('title', 'Device Disconnected')
        },


        render: function() {
            this.$el.empty()
            this.$el.html('<i class="fa fa-plug connected"></i></a>')
            this.select()

            this.delegateEvents()
            return this
        }

    })    


    return Marionette.View.extend({
        className: 'content',
        template: _.template('<a href="#" class="button add r"><i class="fa fa-plus"></i> Add Device</a><div class="wrp"></div>'),
        regions: {
            'wrap': '.wrp',
        },

        events: {
            'click a.add': 'addDevice',
        },

        addDevice: function(e) {
            e.preventDefault()
            this.collection.add(new Device({ new: true }))
        },

        initialize: function(options) {
            this.listenTo(this.collection, 'change', this.saveDevice, this)
        },

        saveDevice: function(m, v) {
            console.log('model changed', arguments)
            if (!m.get('new')) m.save(m.changedAttributes(), { patch: true })
        },


        onRender: function() {
            this.getRegion('wrap').show(new TableView({
                collection: this.collection,
                columns: [
                    { name: 'name', label: 'Name', cell: TableUtils.ValidatedCell },
                    { name: 'macaddress', label: 'MAC Address', cell: TableUtils.ValidatedCell },
                    { name: 'ipaddress', label: 'IP Address', cell: 'string', editable: false },
                    { label: '', cell: StatusCell, editable: false },
                    { label: '', cell: OptionsCell, editable: false },
                ],
                loading: true,
            }))
        },

    })

})