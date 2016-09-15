define(['backbone.marionette',
    'collections/properties',
    'collections/propertygroups',
    'collections/propertysubgroups',

	'models/propertyprofile',
	'collections/propertyprofiles',
	'models/propertyprofilecomponent',
	'collections/propertyprofilecomponents',

    'views/table',
    'utils/table',

    'tpl!templates/profiles/profiles.html',
	], function(Marionette,
        Properties, PropertyGroups, PropertySubGroups,
		PropertyProfile, PropertyProfiles,
		PropertyProfileComponent, PropertyProfileComponents,
        TableView, TableUtils,
		template) {
	

	return Marionette.View.extend({
		template: template,

        regions: {
            rprs: '.rprs',
            rcps: '.rcps',
        },

        events: {
            'click a.ap': 'addProfile',
            'click a.ac': 'addComponent',
        },

        addProfile: function(e) {
            e.preventDefault()
            this.profiles.add(new PropertyProfile({ new: true }))
        },

        addComponent: function(e) {
            e.preventDefault()
            this.components.add(new PropertyProfileComponent({ new: true, propertyprofileid: this.getProfile() }))
        },  

        getProfile: function() {
            var p = this.profiles.findWhere({ isSelected: true })
            if (p) return p.get('propertyprofileid')
        },

        getGroup: function() {
            var p = this.profiles.findWhere({ isSelected: true })
            if (p) {
                if (p.get('global')) return null
                else return p.get('propertygroupid')  
            }
        },

        refreshComponents: function() {
            this.properties.fetch().done(this.refreshComponents2.bind(this))
        },

        refreshComponents2: function() {
            this.components.fetch()
        },

		initialize: function(options) {
            this.properties = new Properties(null, { subscribe: false })
            this.properties.queryParams.propertygroupid = this.getGroup.bind(this)

            this.ready = []

            this.propertygroups = new PropertyGroups()
            this.propertysubgroups = new PropertySubGroups()
            this.ready.push(this.propertygroups.fetch())
            this.ready.push(this.propertysubgroups.fetch())

            this.components = new PropertyProfileComponents()
            this.components.queryParams.propertyprofileid = this.getProfile.bind(this)

			this.profiles = new PropertyProfiles()
            this.listenTo(this.profiles, 'change', this.saveModel, this)
            this.listenTo(this.profiles, 'selected:change', this.refreshComponents, this)
            var self = this
            this.profiles.fetch().done(function() {
                if (self.profiles.length) self.profiles.first().set({ isSelected: true })
            })
		},

        saveModel: function(m, v) {
            console.log('model changed', arguments)
            if ('isSelected' in m.changedAttributes()) return
            if ('propertygroupid' in m.changedAttributes()) {
                // this.propertysubgroups.queryParams.propertygroupid = m.get('propertygroupid')
                // this.propertysubgroups.fetch()
            }

            if (!m.get('new')) m.save(m.changedAttributes(), { patch: true })
        },

        onRender: function() {
            $.when.apply($, this.ready).done(this.doOnRender.bind(this))
        },

        doOnRender: function() {
            this.getRegion('rprs').show(new TableView({
                collection: this.profiles,
                columns: [
                    { name: '', label: '', cell: TableUtils.SelectedCell, editable: false },
                    { name: 'name', label: 'Name', cell: TableUtils.ValidatedCell },
                    { name: 'propertygroupid', label: 'Group', cell: TableUtils.SelectInputCell, options: this.propertygroups },
                    { name: 'propertysubgroupid', label: 'Subgroup', cell: TableUtils.SelectInputCell, options: this.propertysubgroups },
                    { name: 'components', label: 'Comps', cell: 'string' },
                    { label: '', cell: TableUtils.OptionsCell, editable: false },
                ],
                loading: true,
            }))

            this.getRegion('rcps').show(new TableView({
                collection: this.components,
                columns: [
                    { name: 'propertyid', label: 'Property', cell: TableUtils.SelectInputCell, options: this.properties },
                    { name: 'value', label: 'Value', cell: TableUtils.ValidatedCell },
                    { label: '', cell: TableUtils.OptionsCell, editable: false },
                ],
                loading: true,
            }))
        },
	})

})