define(['backbone.marionette',
    'collections/properties',
    'views/gauge',
    'utils',

    'tpl!templates/pages/weather.html',
	'tpl!templates/pages/weather_forecast.html',
	], function(Marionette, 
        Properties, GaugeView, utils,
        template, forecasttemplate) {


    var ForecastView = Marionette.View.extend({
        template: forecasttemplate,
        className: 'zone',

        ui: {
            name: '.name',
        },

        initialize: function(options) {
            this.properties = new Properties(null, { queryParams: { propertysubgroupid: this.model.get('propertysubgroupid') } })
            this.ready = this.properties.fetch()
            console.log('fore', this.model)
        },

        onRender: function() {
            $.when(this.ready).done(this.addListeners.bind(this))
        },

        updateName: function() {
            this.ui.name.html(this.properties.at(0).get('propertysubgroup'))
        },

        updateValue: function(model) {
            var k = model.get('propertystring')
            var el = this.$el.find('.'+k)

            if (k == 'icon') {
                el.addClass('wi-forecast-io-'+model.get('value'))

            } else if (k == 'winddir') {
                el.addClass('from-'+model.get('value')+'-deg')
                

            } else el.text(this.translate(k, model.get('value')))
        },

        translate: function(key, value) {
            if (key == 'humidity') {
                return (value * 100).toFixed(0)
            }

            if (key == 'wind' || key == 'gust') {
                return value ? value.toFixed(1) : value
            }

            return value
        },


        addListeners: function() {
            this.properties.each(function(m) {
                this.listenTo(m, 'sync change', this.updateValue, this)
                this.updateValue(m, m.get('value'))
            }, this)

            this.updateName()
        },

    })



    var ForecastsView = Marionette.CollectionView.extend({
        childView: ForecastView,
    })



	return Marionette.View.extend({
		template: template,

        regions: {
            rforecasts: '.forecasts',
        },

        ui: {
            fsun: '.fsun',
        },


        initialize: function(options) {
            this.config = options.config
            this.current = new Properties(null, { queryParams: { propertysubgroupid: this.config.get('current') }})
            this.astronomy = new Properties(null, { queryParams: { propertysubgroupid: this.config.get('astronomy') }})

            this.ready = []
            this.ready.push(this.current.fetch())
            this.ready.push(this.astronomy.fetch())
        },


        updateValue: function(model) {
            var k = model.get('propertystring')
            var el = this.$el.find('.status .'+k)

            if (k == 'icon') {
                el.addClass('wi-forecast-io-'+model.get('value'))
            } else if (k == 'moonphase') {
                el.addClass('wi-moon-'+(model.get('value')*28).toFixed(0))

            } else if (k == 'winddir') {
                el.addClass('from-'+model.get('value')+'-deg')

            } else  el.text(this.translate(k, model.get('value')))
        },

        translate: function(key, value) {
            if (key == 'humidity') {
                return (value * 100).toFixed(0)
            }
            
            if (key == 'windspeed' || key == 'gustspeed') {
                return value ? value.toFixed(1) : value
            }
            return value
        },


        addListeners: function() {
            this.current.each(function(m) {
                this.listenTo(m, 'sync change', this.updateValue, this)
                this.updateValue(m, m.get('value'))
            }, this)

            this.astronomy.each(function(m) {
                this.listenTo(m, 'sync change', this.updateValue, this)
                this.updateValue(m, m.get('value'))
            }, this)
        },


        onRender: function() {
            $.when.apply($, this.ready).done(this.addListeners.bind(this))

            this.fview = new ForecastsView({ collection: this.config.get('forecasts') })
            this.getRegion('rforecasts').show(this.fview)
        },

	})



})