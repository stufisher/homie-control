define(['backbone.marionette',

	'collections/properties',
	'collections/propertysubgroups',

	'utils',
	'moment',

	'tpl!templates/pages/airplay.html'], 

	function(Marionette,
	Properties, PropertySubGroups,
	utils, moment,
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
			this.ui.val.text(this.model.get('value'))
        },
	})

	var MetaCollectionView = Marionette.CollectionView.extend({
		tagName: 'ul',
		childView: MetaItemView,
	})


	var ProgressView = Marionette.View.extend({
		template: _.template('<span class="elapsed"></span><progress></progress><span class="remain"></span>'),

		ui: {
			elapsed: '.elapsed',
			remain: '.remain',
			prog: 'progress',
		},


		onRender: function(options) {
			this.collection.each(function(p) {
				if (p.get('propertystring') == 'length') {
					this.listenTo(p, 'change:value', this.updateLength, this)
					this.updateLength(p)
				}

				if (p.get('propertystring') == 'progress') {
					this.listenTo(p, 'change:value', this.updateProgress, this)
					this.updateProgress(p)
				}
			}, this)
		},


		updateLength: function(model) {
			console.log('update length', this)
			this.ui.prog.attr('max', model.get('value'))
		},

		updateProgress: function(model) {
			this.ui.prog.val(model.get('value'))
			this.ui.remain.text('-'+moment((this.ui.prog.attr('max')-model.get('value'))*1000).format('mm:ss'))
			this.ui.elapsed.text(moment(model.get('value')*1000).format('mm:ss'))
		}

	})


	var VolumeView = Marionette.View.extend({
		template: _.template('<a href="#" class="button down"><i class="fa-2x fa-fw fa fa-volume-down"></i></a></span> <meter></meter> <a href="#" class="button up"><i class="fa-2x fa-fw fa fa-volume-up"></i></a>'),

		ui: {
			prog: 'meter',
		},

		events: {
			'click a.up': 'clickUp',
			'click a.down': 'clickDown',
		},


		onRender: function(options) {
			this.collection.each(function(p) {
				if (p.get('propertystring') == 'volume') {
					this.listenTo(p, 'change:value', this.updateVolume, this)
					this.updateVolume(p)
				}

				if (p.get('propertystring') == 'volmin') {
					this.listenTo(p, 'change:value', this.updateMin, this)
					this.updateMin(p)
				}

				if (p.get('propertystring') == 'volmax') {
					this.listenTo(p, 'change:value', this.updateMax, this)
					this.updateMax(p)
				}

				if (p.get('propertystring') == 'volumedown') {
					this._volume_down = p
				}

				if (p.get('propertystring') == 'volumeup') {
					this._volume_up = p
				}
			}, this)
		},


		clickUp: function(e) {
			e.preventDefault()
			this._volume_up.save({ value: 1, retained: 0 }, { patch: true })
		},

		clickDown: function(e) {
			e.preventDefault()
			this._volume_down.save({ value: 1, retained: 0 }, { patch: true })
		},


		updateVolume: function(model) {
			console.log('update vol', model.get('value'))
			this.ui.prog.val(model.get('value'))
		},

		updateMin: function(model) {
			this.ui.prog.attr('min', model.get('value'))
		},

		updateMax: function(model) {
			this.ui.prog.attr('max', model.get('value'))
		},

	})


	var StatusItemView = Marionette.View.extend({
		tagName: 'a',
		className: function() {
			return 'button'
		},

		getTemplate: function() {
			return _.template('<i class="fa '+(this.model.get('icon') ? this.model.get('icon') : 'fa-keyboard-o')+' fa-fw '+(this.model.get('icon') == 'fa-pause' ? 'fa-4x' : 'fa-2x')+'"></i>')
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


	var StatusView = Marionette.CollectionView.extend({
		childView: StatusItemView
	})


	return Marionette.View.extend({
		template: template,
		className: 'airplay',

		ui: {
			cover: '.cover img'
		},

		regions: {
			rmeta: '.meta',
			rprog: '.progress',
			rvol: '.volume',
			rremote: '.remote',
		},

		templateContext: function() {
			return {
				appurl: app.appurl
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
			var meta = this.propertysubgroups.findWhere({ name: 'Meta' })
			var meta_props = this.properties.where({ propertysubgroupid: meta.get('propertysubgroupid')})
			this.getRegion('rmeta').show(new MetaCollectionView({ 
				collection: new Properties(meta_props),
			}))


			var cover = this.propertysubgroups.findWhere({ name: 'Cover' })
			var cover_props = new Properties(this.properties.where({ propertysubgroupid: cover.get('propertysubgroupid')}))
			cover_props.each(function(p) {
				if (p.get('propertystring') == 'mime') {
					this._cover_mime = p
				}

				if (p.get('propertystring') == 'image' || p.get('propertystring') == 'thumb') {
					this._cover = p
					this.listenTo(this._cover, 'change:value', this.drawCover)
					this.drawCover()
				}
			}, this)


			var prog = this.propertysubgroups.findWhere({ name: 'Progress' })
			this.getRegion('rprog').show(new ProgressView({ 
				collection: new Properties(this.properties.where({ propertysubgroupid: prog.get('propertysubgroupid')})),
			}))


			var vol = this.propertysubgroups.findWhere({ name: 'Volume' })
			this.getRegion('rvol').show(new VolumeView({ 
				collection: new Properties(this.properties.where({ propertysubgroupid: vol.get('propertysubgroupid')})),
			}))

			var remote = this.propertysubgroups.findWhere({ name: 'Remote' })
			this.getRegion('rremote').show(new StatusView({ 
				collection: new Properties(this.properties.where({ propertysubgroupid: remote.get('propertysubgroupid')})),
			}))
		},


		drawCover: function() {
			var img = this.arrayBufferToBase64(this._cover.get('value'))
			var mime = this._cover_mime || 'image/jpeg'
			if (img) {
				this.ui.cover.attr('src', 'data:'+mime+';base64,'+img)
			} else {
				this.ui.cover.attr('src', app.appurl+'/assets/images/no-cover.png')
			}
			
		},


		arrayBufferToBase64:function(buffer) {
		    var binary = ''
		    var bytes = new Uint8Array(buffer)
		    var len = bytes.byteLength
		    for (var i = 0; i < len; i++) {
		        binary += String.fromCharCode( bytes[ i ] )
		    }
		    return window.btoa(binary)
		},

	})

})