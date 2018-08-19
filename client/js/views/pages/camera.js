define(['backbone.marionette',

	'collections/properties',
	'collections/propertysubgroups',
	'collections/propertyprofiles',

	'utils',

	'tpl!templates/pages/camera.html'], 

	function(Marionette,
	Properties, PropertySubGroups, PropertyProfiles,
	utils,
	template) {


	arrayBufferToBase64 = function(buffer) {
	    var binary = ''
	    var bytes = new Uint8Array(buffer)
	    var len = bytes.byteLength
	    for (var i = 0; i < len; i++) {
	        binary += String.fromCharCode(bytes[i])
	    }
	    return window.btoa(binary)
	}


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
		template: _.template('<img class="frame stream" alt="<%-friendlyname%>" />'),

		ui: {
			frame: 'img'
		},

		onRender: function() {
			this.listenTo(this.model, 'change:value', this.drawFrame)
		},

		drawFrame: function() {
			var img = arrayBufferToBase64(this.model.get('value'))
			this.ui.frame.attr('src', 'data:image/jpeg;base64,'+img)
		},
	})


	var FrameCollectionView = Marionette.CollectionView.extend({
		childView: FrameView
	})


	return Marionette.View.extend({
		className: 'camera',
		template: template,

		regions: {
			live: '.live',
			notifications: '.notifications',
			archive: '.archive',
		},

		ui: {
			frames: '.frames',
			current: 'input[name=current]'
		},

		events: {
			'change @ui.current': 'setCurrent',
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
            _.each(this.properties.where({ propertysubgroupid: arch.get('propertysubgroupid')}), function(m) {
                if (m.get('propertytype') == 'binary') {
                    this.getRegion('archive').show(new FrameView({ model: m }))
                }

                if (m.get('propertystring') == 'frames') {
                	this._frames_property = m
                    this.listenTo(this._frames_property, 'sync change', this.updateFrames, this)
                    this.updateFrames()
                }

                if (m.get('propertystring') == 'frameno') {
                	this._frame_property = m
                    this.listenTo(this._frame_property, 'sync change', this.updateCurrent, this)
                    this.updateCurrent()
                }
            }, this)
        },


        setCurrent: function(e) {
        	if (this._frame_property) {
        		this._frame_property.set({ value: this.ui.current.val() }, { silent: true })
				this._frame_property.save(this._frame_property.changedAttributes(), { patch: true })
        	}
        },

		updateCurrent: function() {
			this.ui.current.val(this._frame_property.get('value'))
		},

		updateFrames: function() {
			this.ui.frames.text(this._frames_property.get('value'))
			this.ui.current.prop('max', this._frames_property.get('value')-1)
		},

	})

})