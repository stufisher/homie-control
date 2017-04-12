define(['backbone.marionette',

	'collections/properties',
	'collections/propertysubgroups',

	'tpl!templates/pages/input.html'], 

	function(Marionette,
	Properties, PropertySubGroups,
	template) {

	var IView = Marionette.View.extend({
		tagName: 'a',
		className: function() {
			return 'button'
		},

		modelEvents: {
			'change:value': 'updateState',
		},

		getTemplate: function() {
			return _.template('<i class="fa '+(this.model.get('icon') ? this.model.get('icon') : 'fa-volume-off')+' fa-2x fa-fw"></i> <%=propertysubgroup%>')
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
			this.model.set('value', this.model.get('value') == 1 ? 0 : 1, { silent: true })
			
			var self = this
			this.model.save(this.model.changedAttributes(), { patch: true })
		},
	})

	var ICollectionView = Marionette.CollectionView.extend({
		childView: IView,
	})


	var IGView = Marionette.View.extend({
		template: _.template('<div class="sws">'),
		regions: {
			rsws: '.sws',
			rsps: '.sps',
		},

		initialize: function() {
			this.properties = new Properties()

			this.updateProperties()
		},

		updateProperties: function() {
			sws = this.getOption('properties').where({ propertysubgroupid: this.model.get('propertysubgroupid') })
			this.properties.reset(sws)
		},

		onRender: function() {
			this.getRegion('rsws').show(new ICollectionView({ collection: this.properties }))
		},
	})

	var IGCollectionView = Marionette.CollectionView.extend({
		childView: IGView,
		childViewOptions: function() {
			return {
				properties: this.getOption('properties'),
			}
		}
	})

	return Marionette.View.extend({
		template: template,
		className: 'lighting',

		regions: {
			rinputs: '.inputs'
		},

		initialize: function(options) {
			this.config = options.config
			this.properties = new Properties(null, { queryParams: { propertygroupid: this.config.get('propertygroupid') } })
			this.propertysubgroups = new PropertySubGroups(null, { queryParams: { propertygroupid: this.config.get('propertygroupid')  } })

			this.ready = []
			this.ready.push(this.properties.fetch())
			this.ready.push(this.propertysubgroups.fetch())
		},

		onRender: function() {
			$.when.apply($, this.ready).done(this.doOnRender.bind(this))
		},

		doOnRender: function() {
			this.getRegion('rinputs').show(new IGCollectionView({ 
				collection: this.propertysubgroups, 
				properties: this.properties, 
			}))
		},

	})

})