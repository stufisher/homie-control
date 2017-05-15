define(['backbone.marionette',
    'views/table',
    'utils/table',

    'models/repeater',
    'collections/repeaters',
    
    'collections/properties',
    'collections/propertygroups',
    'collections/propertysubgroups',
	], function(Marionette,
        TableView, TableUtils,
        Repeater, Repeaters,
        Properties, PropertyGroups, PropertySubGroups) {
	

	return Marionette.View.extend({
		template: _.template('<a href="#" class="button r ar"><i class="fa fa-plus"></i> Add Repeater</a><div class="wrp"></div>'),
        regions: {
            'wrap': '.wrp',
        },

        events: {
            'click a.ar': 'addRepeater',
        },

        addRepeater: function(e) {
            e.preventDefault()
            this.repeaters.add(new Repeater({ new: true }))
        },


		initialize: function(options) {
            this.repeaters = new Repeaters()
            this.repeaters.fetch()

            this.listenTo(this.repeaters, 'change', this.saveModel, this)

            this.ready = []

            this.properties = new Properties(null, { subscribe: false })
            this.properties.state.pageSize = 9999
            this.ready.push(this.properties.fetch())

            this.groups = new PropertyGroups()
            this.ready.push(this.groups.fetch())

            this.subgroups = new PropertySubGroups()
            this.ready.push(this.subgroups.fetch())
		},

        saveModel: function(m, v) {
            console.log('model changed', m.changedAttributes())
            if ('new' in m.changedAttributes()) return
            if ('repeaterpropertyid' in m.changedAttributes()) {
                var p = this.properties.findWhere({ propertyid: parseInt(m.get('repeaterpropertyid')) })
                if (p) m.set('repeateraddress', p.get('address'))
            }

            if ('propertyid' in m.changedAttributes()) {
                var p = this.properties.findWhere({ propertyid: parseInt(m.get('propertyid')) })
                if (p) m.set('propertyaddress', p.get('address'))
            }

            if (!m.get('new')) m.save(m.changedAttributes(), { patch: true })
        },

        onRender: function() {
            $.when.apply($, this.ready).done(this.doOnRender.bind(this))
        },

        doOnRender: function() {
            this.getRegion('wrap').show(new TableView({
                collection: this.repeaters,
                mobileHidden: [1,3],
                columns: [
                    { name: 'repeaterpropertyid', label: 'Property', cell: TableUtils.SelectInputCell, options: this.properties },
                    { name: 'repeateraddress', label: 'Address', cell: 'string', editable: false },
                    { name: 'propertyid', label: 'Property', cell: TableUtils.SelectInputCell, options: this.properties, none: true },
                    { name: 'propertyaddress', label: 'Address', cell: 'string', editable: false },
                    { name: 'propertygroupid', label: 'Group', cell: TableUtils.SelectInputCell, options: this.groups, none: true },
                    { name: 'propertysubgroupid', label: 'SubGroup', cell: TableUtils.SelectInputCell, options: this.subgroups, none: true },
                    { name: 'round', label: 'Round', cell: TableUtils.SelectInputCell, options: TableUtils.YesNo },
                    { label: '', cell: TableUtils.OptionsCell, editable: false },
                ],
                loading: true,
                filter: 's',
                backgrid: { emptyText: 'No Repeaters Defined' },
            }))
        },
	})

})