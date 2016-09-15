define(['backbone.marionette',

	'collections/properties',
	'collections/propertysubgroups',
	'collections/propertyprofiles',

	'tpl!templates/pages/switches.html'], 

	function(Marionette,
	Properties, PropertySubGroups, PropertyProfiles,
	template) {
	

	var SPView = Marionette.View.extend({
		tagName: 'a',
		className: 'button',
		template: _.template('<i class="fa fa-user fa-2x fa-fw"></i><%=name%>'),

		events: {
			click: 'onClick',
		},

		onRender: function() {
			this.$el.attr('href', '#')
		},

		onClick: function(e) {
			e.preventDefault()
			this.model.set({ value: 1 }, { silent: true })
			this.model.save(this.model.changedAttributes(), { patch: true })
		},
	})

	var SPCollectionView = Marionette.CollectionView.extend({
		childView: SPView,
	})

	var SWView = Marionette.View.extend({
		tagName: 'a',
		className: function() {
			return 'button'
		},

		modelEvents: {
			'change:value': 'updateState',
		},

		getTemplate: function() {
			return _.template('<i class="fa '+(this.model.get('icon') ? this.model.get('icon') : 'fa-lightbulb-o')+' fa-2x fa-fw"></i><%=friendlyname%>')
		},

		onRender: function() {
			this.$el.attr('href', '#')
			this.updateState()
		},

		events: {
			click: 'toggle',
		},

		updateState: function() {
			if (this.model.get('value') != '0' && this.model.get('value') != '0.0') this.$el.addClass('active')
			else this.$el.removeClass('active')		
		},

		toggle: function(e) {
			e.preventDefault()
			var on = this.model.get('propertytype') == 'shutter' ? '2' : '1'
			this.model.set('value', this.model.get('value') == on ? '0' : on, { silent: true })
			
			var self = this
			this.model.save(this.model.changedAttributes(), { patch: true })
		},
	})

	var SWCollectionView = Marionette.CollectionView.extend({
		childView: SWView,
	})


	var SGView = Marionette.View.extend({
		template: _.template('<h2><%=name%></h2><div class="sws"></div><div class="sps"></div>'),
		regions: {
			rsws: '.sws',
			rsps: '.sps',
		},

		initialize: function() {
			this.properties = new Properties()
			this.profiles = new PropertyProfiles()

			this.updateProperties()
			this.updateProfiles()
		},

		updateProperties: function() {
			sws = this.getOption('properties').where({ propertysubgroupid: this.model.get('propertysubgroupid') })
			this.properties.reset(sws)
		},

		updateProfiles: function() {
			sps = this.getOption('profiles').where({ propertysubgroupid: this.model.get('propertysubgroupid') })
			this.profiles.reset(sps)
		},

		onRender: function() {
			this.getRegion('rsws').show(new SWCollectionView({ collection: this.properties }))
			this.getRegion('rsps').show(new SPCollectionView({ collection: this.profiles }))
		},
	})

	var SGCollectionView = Marionette.CollectionView.extend({
		childView: SGView,
		childViewOptions: function() {
			return {
				properties: this.getOption('properties'),
				profiles: this.getOption('profiles'),
			}
		}
	})

	return Marionette.View.extend({
		template: template,
		className: 'lighting',

		regions: {
			rsgs: '.sgs'
		},

		initialize: function(options) {
			this.config = options.config
			this.properties = new Properties(null, { queryParams: { propertygroupid: this.config.get('propertygroupid') } })
			this.propertysubgroups = new PropertySubGroups(null, { queryParams: { propertygroupid: this.config.get('propertygroupid')  } })
			this.propertyprofiles = new PropertyProfiles(null, { queryParams: { propertygroupid: this.config.get('propertygroupid')  } })

			this.ready = []
			this.ready.push(this.properties.fetch())
			this.ready.push(this.propertysubgroups.fetch())
			this.ready.push(this.propertyprofiles.fetch())
		},

		onRender: function() {
			$.when.apply($, this.ready).done(this.doOnRender.bind(this))
		},

		doOnRender: function() {
			this.getRegion('rsgs').show(new SGCollectionView({ 
				collection: this.propertysubgroups, 
				properties: this.properties, 
				profiles: this.propertyprofiles
			}))
		},

	})

})