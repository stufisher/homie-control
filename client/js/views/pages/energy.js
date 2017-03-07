define(['backbone.marionette',

	'collections/properties',
	'collections/propertysubgroups',
	'collections/propertyprofiles',

	'utils',

	'tpl!templates/pages/energy.html'], 

	function(Marionette,
	Properties, PropertySubGroups, PropertyProfiles,
	utils,
	template) {

	var PView = Marionette.View.extend({
		tagName: 'li',
		template: _.template('<span class="title"><%=friendlyname%></span><span class="value"></span><span class="unit"></span>'),
		modelEvents: {
			'change:value': 'updateState',
		},

		ui: {
			val: '.value',
			unit: '.unit',
		},

		onRender: function() {
			this.updateState()

			var units = {
				voltage: 'V',
				current: 'A',
				power: 'W',
				rate: '/s',
			}

			if (this.model.get('propertytype') in units)
				this.ui.unit.text(units[this.model.get('propertytype')])
		},

		updateState: function() {
            this.model.set({ value: this.model.get('value').toFixed(2) }, { silent: true })
            utils.easeText({
                model: this.model,
                el: this.ui.val
            })
        },
	})

	var PCollectionView = Marionette.CollectionView.extend({
		tagName: 'ul',
		childView: PView,
	})


	var GView = Marionette.View.extend({
		className: 'status',
		template: _.template('<h2><%=name%></h2><div class="sws"></div>'),
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
			this.getRegion('rsws').show(new PCollectionView({ collection: this.properties }))
		},
	})

	var GCollectionView = Marionette.CollectionView.extend({
		childView: GView,
		childViewOptions: function() {
			return {
				properties: this.getOption('properties'),
			}
		}
	})

	return Marionette.View.extend({
		template: template,

		regions: {
			rsgs: '.sgs'
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
			this.getRegion('rsgs').show(new GCollectionView({ 
				collection: this.propertysubgroups, 
				properties: this.properties, 
			}))
		},

	})

})