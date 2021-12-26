define(['backbone.marionette',
	'collections/properties',
	'collections/propertysubgroups',
	'tpl!templates/pages/camera.html'], 

	function(Marionette,
	Properties, PropertySubGroups,
	template) {

	var MetaItemView = Marionette.View.extend({
		tagName: 'li',
		template: _.template('<span class="title"><%=friendlyname%></span><span class="value"></span>'),
		modelEvents: {
			'change:value': 'updateState',
		},

		ui: {
			val: '.value',
		},

		onRender: function() {
			this.updateState()
		},

		updateState: function() {
			var v = this.model.get('value')
			v ? this.ui.val.addClass('alert') : this.ui.val.removeClass('alert')
			this.ui.val.text(v ? 'True' : 'False')
        },
	})

	var MetaCollectionView = Marionette.CollectionView.extend({
		tagName: 'ul',
		childView: MetaItemView,
	})


	var FrameView = Marionette.View.extend({
		className: 'frame',
		template: _.template('<img alt="<%-friendlyname%>" />'),

		ui: {
			frame: 'img'
		},

		initialize: function() {
			this.refresh = true
		},

		setRefresh: function(value) {
			this.refresh = value
		},

		onRender: function() {
			this.listenTo(this.model, 'change:value', this.drawFrame)
		},

		drawFrame: function() {
			if (this.refresh) this.ui.frame.attr('src', 'data:image/jpeg;base64,'+this.model.get('value'))
		},
	})

	var FrameCollectionView = Marionette.CollectionView.extend({
		className: 'frames',
		childView: FrameView
	})


	var CameraView = Marionette.View.extend({
		className: 'camera',
		template: template,

		regions: {
			live: {
				replaceElement: true,
				el: '.live',
			},
			notifications: '.notifications',
			archive: {
				replaceElement: true,
				el: '.archive',
			}
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
        	var live = this.propertysubgroups.findWhere({ name: 'Live' })
        	this.getRegion('live').show(new FrameCollectionView({
        		collection: new Properties(this.properties.where({ propertysubgroupid: live.get('propertysubgroupid')}))
        	}))

        	var not = this.propertysubgroups.findWhere({ name: 'Notifications' })
        	this.getRegion('notifications').show(new MetaCollectionView({
        		collection: new Properties(this.properties.where({ propertysubgroupid: not.get('propertysubgroupid')}))
        	}))

        	var arch = this.propertysubgroups.findWhere({ name: 'Archiver' })
            this.getRegion('archive').show(new FrameCollectionView({
        		collection: new Properties(this.properties.where({ propertysubgroupid: arch.get('propertysubgroupid')}))
        	}))
        },

	})


	CameraView.frameView = FrameView
	return CameraView

})
