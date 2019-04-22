define(['backbone.marionette',

	'models/property',
	'collections/properties',
	'collections/propertysubgroups',

	'tpl!templates/pages/input.html'], 

	function(Marionette,
	Property, Properties, PropertySubGroups,
	template) {

	var IView = Marionette.View.extend({
		tagName: 'a',
		className: 'button',

		modelEvents: {
			'change:value': 'updateState',
		},

		ui: {
			meter: 'meter',
		},


		initialize: function(options) {
			this.rms = new Property({ address: this.model.get('address').replace('/selected', '/rms') })
			this.listenTo(this.rms, 'change:value', this.updateMeter)
		},

		updateMeter: function() {
			this.ui.meter.val(this.rms.get('value'))
		},

		getTemplate: function() {
			return _.template('<i class="fa '+(this.model.get('icon') ? this.model.get('icon') : 'fa-volume-off')+' fa-2x fa-fw"></i> <%=propertysubgroup%> <meter min="-80" max="0" high="-20"></meter>')
		},

		onRender: function() {
			this.$el.attr('href', '#')
			this.updateState()
		},

		events: {
			click: 'toggle',
		},

		updateState: function() {
			if (parseInt(this.model.get('value'))) this.$el.addClass('active')
			else this.$el.removeClass('active')		
		},

		toggle: function(e) {
			e.preventDefault()
			this.model.set('value', parseInt(this.model.get('value')) == 1 ? 0 : 1, { silent: true })
			
			var self = this
			this.model.save(this.model.changedAttributes(), { patch: true })
		},
	})

	var CView = IView.extend({
		getTemplate: function() {
			return _.template('<i class="fa '+(this.model.get('icon') ? this.model.get('icon') : 'fa-volume-off')+' fa-2x fa-fw"></i> <%=propertysubgroup%>')
		},
	})

	var RView = Marionette.View.extend({
		tagName: 'a',
		className: function() {
			return 'button'
		},

		getTemplate: function() {
			return _.template('<i class="fa '+(this.model.get('icon') ? this.model.get('icon') : 'fa-keyboard-o')+' fa-2x fa-fw"></i> <%=friendlyname%>')
		},

		onRender: function() {
			this.$el.attr('href', '#')
		},

		events: {
			click: 'send',
		},

		send: function(e) {
			e.preventDefault()
			this.model.save({ value: 1, retained: 0 }, { patch: true })
		},
	})

	var ICollectionView = Marionette.CollectionView.extend({
		// childView: IView,
		childView: function(p) {
			console.log('col view', p.get('propertysubgroup'), p)
			if (p.get('nodestring').startsWith('input')) return IView
			else if (p.get('propertysubgroup').startsWith('Remote')) return RView
			else return CView
		}
	})


	var IGView = Marionette.View.extend({
		template: _.template('<div class="sws">'),
		regions: {
			rsws: '.sws',
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