define(['backbone.marionette',
    'views/table',
    'utils/table',
    'tpl!templates/properties/propertygroups.html',

    'collections/properties',
    'collections/propertygroups',
    'collections/propertygroupcomponents',
    'models/propertygroup',
    'models/propertygroupcomponent',

    'collections/propertysubgroups',
    'collections/propertysubgroupcomponents',
    'models/propertysubgroup',
    'models/propertysubgroupcomponent',
	], function(Marionette,
        TableView, TableUtils,
		template,
        Properties, PropertyGroups, PropertyGroupComponents, PropertyGroup, PropertyGroupComponent,
        PropertySubGroups, PropertySubGroupComponents, PropertySubGroup, PropertySubGroupComponent) {
	

	return Marionette.View.extend({
		template: template,

        regions: {
            rprs: '.rprs',
            rcps: '.rcps',
            rscps: '.rscps',
            rsgrs: '.rsgrs',
        },

        events: {
            'click a.ag': 'addGroup',
            'click a.ac': 'addComponent',
            'click a.asg': 'addSubGroup',
            'click a.asc': 'addSubComponent',
        },

        addGroup: function(e) {
            e.preventDefault()
            this.groups.add(new PropertyGroup({ new: true }))
        },

        addComponent: function(e) {
            e.preventDefault()
            if (!this.getGroup()) return
            this.components.add(new PropertyGroupComponent({ new: true, propertygroupid: this.getGroup() }))
        },  


        addSubGroup: function(e) {
            e.preventDefault()
            if (!this.getGroup()) return
            this.subgroups.add(new PropertySubGroup({ new: true, propertygroupid: this.getGroup() }))
        },

        addSubComponent: function(e) {
            e.preventDefault()
            if (!this.getSubGroup()) return
            this.subcomponents.add(new PropertySubGroupComponent({ new: true, propertysubgroupid: this.getSubGroup() }))
        },  


        getGroup: function() {
            var p = this.groups.findWhere({ isSelected: true })
            if (p) {
                return p.get('propertygroupid')  
            }
        },

        getSubGroup: function() {
            var p = this.subgroups.findWhere({ isSelected: true })
            if (p) {
                return p.get('propertysubgroupid')  
            }
        },

        refreshComponents: function() {
            this.components.fetch()
            this.subproperties.fetch()

            var self = this
            this.subgroups.fetch().done(function() { 
                if (self.subgroups.length)
                    self.subgroups.first().set('isSelected', true )
            })
        },

        refreshSubComponents: function() {
            this.subcomponents.fetch()
        },

		initialize: function(options) {
            this.properties = new Properties(null, { subscribe: false })
            this.properties.state.pageSize = 9999
            this.properties.fetch()

            this.groups = new PropertyGroups()
            this.listenTo(this.groups, 'change', this.saveModel, this)
            this.ready = this.groups.fetch()

            this.components = new PropertyGroupComponents()
            this.listenTo(this.components, 'change', this.saveModel, this)
            this.components.state.pageSize = 9999
            this.components.queryParams.propertygroupid = this.getGroup.bind(this)

            this.subproperties = new Properties(null, { subscribe: false })
            this.subproperties.state.pageSize = 9999
            this.subproperties.queryParams.propertygroupid = this.getGroup.bind(this)

            this.subgroups = new PropertySubGroups()
            this.listenTo(this.subgroups, 'change', this.saveModel, this)
            this.subgroups.queryParams.propertygroupid = this.getGroup.bind(this)

            this.subcomponents = new PropertySubGroupComponents()
            this.listenTo(this.subcomponents, 'change', this.saveModel, this)
            this.subcomponents.state.pageSize = 9999
            this.subcomponents.queryParams.propertysubgroupid = this.getSubGroup.bind(this)

            this.listenTo(this.groups, 'selected:change', this.refreshComponents, this)
            this.listenTo(this.subgroups, 'selected:change', this.refreshSubComponents, this)
		},

        saveModel: function(m, v) {
            console.log('model changed', arguments)
            if ('isSelected' in m.changedAttributes()) return
            if ('propertyid' in m.changedAttributes()) {
                var p = this.properties.findWhere({ propertyid: parseInt(m.get('propertyid')) })
                if (p) m.set('address', p.get('address'))
            }

            if (!m.get('new')) m.save(m.changedAttributes(), { patch: true })
        },

        onRender: function() {
            this.getRegion('rprs').show(new TableView({
                mobileHidden: [2],
                collection: this.groups,
                columns: [
                    { name: '', label: '', cell: TableUtils.SelectedCell, editable: false },
                    { name: 'name', label: 'Name', cell: TableUtils.ValidatedCell },
                    { name: 'properties', label: 'Properties', cell: 'string', editable: false },
                    { name: 'history', label: 'Show History', cell: TableUtils.SelectInputCell, options: TableUtils.YesNo },
                    { label: '', cell: TableUtils.OptionsCell, editable: false },
                ],
                loading: true,
                backgrid: { emptyText: 'No Groups Defined' },
            }))

            this.getRegion('rcps').show(new TableView({
                mobileHidden: [1],
                collection: this.components,
                columns: [
                    { name: 'propertyid', label: 'Property', cell: TableUtils.SelectInputCell, options: this.properties },
                    { name: 'address', label: 'Address', cell: 'string', editable: false },
                    { label: '', cell: TableUtils.OptionsCell, editable: false },
                ],
                loading: true,
                backgrid: { emptyText: 'No Components Defined' },
            }))

            this.getRegion('rsgrs').show(new TableView({
                mobileHidden: [2],
                collection: this.subgroups,
                columns: [
                    { name: '', label: '', cell: TableUtils.SelectedCell, editable: false },
                    { name: 'name', label: 'Name', cell: TableUtils.ValidatedCell },
                    { name: 'properties', label: 'Properties', cell: 'string', editable: false },
                    { label: '', cell: TableUtils.OptionsCell, editable: false },
                ],
                loading: true,
                backgrid: { emptyText: 'No Subgroups Defined' },
            }))

            this.getRegion('rscps').show(new TableView({
                mobileHidden: [1],
                collection: this.subcomponents,
                columns: [
                    { name: 'propertyid', label: 'Property', cell: TableUtils.SelectInputCell, options: this.subproperties },
                    { name: 'address', label: 'Address', cell: 'string', editable: false },
                    { label: '', cell: TableUtils.OptionsCell, editable: false },
                ],
                loading: true,
                backgrid: { emptyText: 'No Subgroup Components Defined' },
            }))

            var self = this
            $.when(this.ready).done(function() { 
                if (self.groups.length)
                    self.groups.first().set('isSelected', true )
            })
        },
	})

})