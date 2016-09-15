define(['backbone.marionette',
    'collections/properties',
    'collections/pages',
    'models/page',
    'utils/editable',
    'views/table', 'utils/table',
    'tpl!templates/options.html',
    'backbone', 'backbone.validation'
    ], function(Marionette, Properties, Pages, Page, Editable, 
        TableView, TableUtils,
        template, Backbone) {
    
    var ConfigCell = Backgrid.Cell.extend({
        initialize: function(options) {
            ConfigCell.__super__.initialize.call(this,options)
            this.listenTo(this.model, 'change', this.render, this)
        },

        render: function() {
            this.$el.empty()
            if (this.model.get('pageid')) {
                this.$el.html('<a href="/options/'+this.model.get('pageid')+'" class="button"><i class="fa fa-cog"></i></a>')
            }

            return this
        }
    })
        
    return Marionette.View.extend({
        className: 'content',
        template: template,

        regions: {
            rp: '.rp'
        },

        events: {
            'click a.add': 'addPage',
        },

        addPage: function(e) {
            this.collection.add(new Page({ new: true }))
        },

        saveModel: function(m,v) { 
            console.log('model changed', arguments)
            if (m.get('new')) return
            if ('isSelected' in m.changedAttributes()) return
            if (!m.get('new')) m.save(m.changedAttributes(), { patch: true })
        },
        
        initialize: function(options) {
            Backbone.Validation.bind(this);
            this.properties = new Properties(null, { subscribe: false })
            this.properties.state.pageSize = 9999
            this.ready = this.properties.fetch()

            this.collection = app.pages
            this.listenTo(this.collection, 'change', this.saveModel)
            console.log('pages', this.collection)
        },

        getProperties: function() {
            return this.properties.kv()
        },
        

        getTemplates: {
            array: function() {
                return _.map(app.config.templates, function(t) { return [t, t] })
            }
        },
        
        onRender: function() {
            $.when(this.ready).done(this.doOnRender.bind(this))

            var columns = [
                { name: 'title', label: 'Title', cell: TableUtils.ValidatedCell, editable: true },
                { name: 'slug', label: 'Slug', cell: TableUtils.ValidatedCell, editable: true },
                { name: 'template', label: 'Template', cell: TableUtils.SelectInputCell, editable: true, options: this.getTemplates },
                { name: 'display_order', label: 'Order', cell: TableUtils.ValidatedCell, editable: true },
                { label: '', cell: ConfigCell, editable: false  },
                { label: '', cell: TableUtils.OptionsCell, editable: false },
            ]

            this.table = new TableView({ 
                mobileHidden: [3],
                collection: this.collection, 
                columns: columns, 
                tableClass: 'pages', 
                filter: false, loading: true, 
                backgrid: { emptyText: 'No pages found', } 
            })


            this.getRegion('rp').show(this.table)
        },

        doOnRender:function() {
            _.each(['heating_reading_property', 'heating_control_property', 'profile_exec_property'], function(k,i) {
                var p = this.properties.findWhere({ propertyid: parseInt(this.model.get(k)) })
                // if (p) this.model.set(k+'_name', )
                if (p) this.$el.find('.'+k).html(p.get('friendlyname'))
            }, this)

            var edit = new Editable({ model: this.model, el: this.$el })
            edit.create('latitude', 'text');
            edit.create('longitude', 'text');
            edit.create('timezone', 'text');
            edit.create('heating_reading_property', 'select', { data: this.getProperties.bind(this) });
            edit.create('heating_control_property', 'select', { data: this.getProperties.bind(this) });
            edit.create('profile_exec_property', 'select', { data: this.getProperties.bind(this) });
        },
        
    })
        
})
