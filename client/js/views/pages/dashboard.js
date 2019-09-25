define(['backbone.marionette', 
	'collections/properties',

	'views/pages/weather',
	'views/pages/transport',
	'views/pages/camera',
	'views/radar',

	'utils',

	'moment',
    'tpl!templates/pages/dashboard.html'
	], function(Marionette, 
		Properties,
		WeatherView, TransportView, CameraView, RadarView,
		utils,
		moment, template) {

	var DashRadarView = RadarView.extend({
		theme: 'dark', 
		zoomControls: false,
	})

	return Marionette.View.extend({
        className: 'dashboard rotate',
		template: template,

		regions: {
			transport: '.transport',
			weather: '.weather',
			camera: '.camera',
			radar: '.rradar',
		},

        ui: {
            time: '.time',
            date: '.date',

            current: '.current',
            sun: '.sun',
            shade: '.shade',

           	icon: '.icon',
           	pop: '.pop',
           	windspeed: '.windspeed',
           	winddir: '.winddir',
           	gustspeed: '.gustspeed',

           	power: '.power',

           	camera: '.camera',
        },

        events: {
            
        },


        initialize: function(options) {
            this.config = options.config
			this.properties = new Properties(null, { queryParams: { propertygroupid: this.config.get('properties') } })

			this.ready = []
			this.ready.push(this.properties.fetch())

			this.timethread = null
		},

		onRender: function() {
			$.when.apply($, this.ready).done(this.doOnRender.bind(this))

			this.timeTick()
			
			this.getRegion('weather').show(new WeatherView.dailyView({ 
				padPerDeg: 7, 
				properties: new Properties(null, { queryParams: { propertysubgroupid: this.config.get('weather') }})
			}))

			this.getRegion('transport').show(new TransportView({ 
				config: new Backbone.Model({ 
					directions: this.config.get('directions')
				})
			}))



			this.getRegion('radar').show(new DashRadarView())
		},

		doOnRender: function() {
			this.addListeners()
		},

		onDomRefresh: function() {
			this.$el.closest('.wrapper').siblings('.sidebar').hide()
		},


		updateValue: function(elment, round, model) {
			console.log('updateValue', elment, model.get('value'))

			if (model.get('propertystring') == 'icon') {
				this.ui[elment].addClass('wi-forecast-io-'+model.get('value'))

			} else if (model.get('propertystring') == 'winddir') {
                this.ui[elment].addClass('from-'+model.get('value')+'-deg')

			} else {
				utils.easeText({
					round: round,
                    model: model,
                    el: this.ui[elment]
                })
			}
		},

		addListeners: function() {
			var propertymap = {
				'Living Room Temp': { element: 'current', round: 1 },
				'Front Temp Sun': 	{ element: 'sun', round: 1 },
				'Front Temp Shade': { element: 'shade', round: 1 },
				'Weather Current Icon': { element: 'icon', round: 1 },
				'Weather Current POP': { element: 'pop', round: 0 },
				'Weather Current Wind Dir': { element: 'winddir' },
				'Weather Current Wind Speed': { element: 'windspeed', round: 0 },
				'Weather Current Gust Speed': { element: 'gustspeed', round: 0 },
				'Power': { element: 'power', round: 0 },
			}

			this.properties.each(function(p) {
				_.each(propertymap, function(obj, name) {
					if (p.get('friendlyname') == name) {
						this.listenTo(p, 'sync change', this.updateValue.bind(this, obj.element, obj.round))
						this.updateValue(obj.element, obj.round, p)
					}
				}, this)

				if (p.get('propertystring') == 'frame') {
					this.frameView = new CameraView.frameView({ model: p })
					this.getRegion('camera').show(this.frameView)
				}

				if (p.get('nodestring') == 'motion') {
					this.listenTo(p, 'change:value', this.toggleMotion, this)
					this.toggleMotion(p)
				}
			}, this)
		},


		toggleMotion: function(model) {
			this.frameView.setRefresh(model.get('value') == 1)
			model.get('value') == 1 ? this.ui.camera.find('.frame').fadeIn() : this.ui.camera.find('.frame').fadeOut()
		},


        timeTick: function() {
        	this.ui.time.text(moment().format('HH:mm'))
        	this.ui.date.text(moment().format('ddd Do MMMM'))
        	this.timethread = setTimeout(this.timeTick.bind(this), 10*1000)
        },

        onDestroy: function() {
        	clearTimeout(this.timethread)
        	this.$el.closest('.wrapper').siblings('.sidebar').show()
        },

	})

})