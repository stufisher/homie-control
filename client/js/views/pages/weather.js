define(['backbone.marionette',
    'collections/properties',
    'views/gauge',
    'utils',

    'tpl!templates/pages/weather.html',
	'tpl!templates/pages/weather_forecast.html',
    'Flot', 'Flot-stack'
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
            if (key == 'humidity' || key == 'pop') {
                return (value * 100).toFixed(0)
            }

            if (key == 'wind' || key == 'gust') {
                return value ? value.toFixed(1) : value
            }

            if (key.indexOf('temp') > -1) {
                return value.toFixed(0)
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
            rchart: '.rchart',
        },


        initialize: function(options) {
            this.config = options.config
            this.current = new Properties(null, { queryParams: { propertysubgroupid: this.config.get('current') }})
            this.hourly = new Properties(null, { queryParams: { propertysubgroupid: this.config.get('hourly') }})
            this.astronomy = new Properties(null, { queryParams: { propertysubgroupid: this.config.get('astronomy') }})

            this.ready = []
            this.ready.push(this.current.fetch())
            this.ready.push(this.hourly.fetch())
            this.ready.push(this.astronomy.fetch())
        },


        updateValue: function(model) {
            var k = model.get('propertystring')
            var el = this.$el.find('.status .'+k)

            if (k == 'icon') {
                el.addClass('wi-forecast-io-'+model.get('value'))
            } else if (k == 'moonphase') {
                el.addClass('wi-moon-'+(parseFloat(model.get('value'))*28).toFixed(0))

            } else if (k == 'winddir') {
                el.addClass('from-'+model.get('value')+'-deg')

            } else  el.text(this.translate(k, model.get('value')))
        },

        translate: function(key, value) {
            if (key == 'humidity' || key == 'pop') {
                return (value * 100).toFixed(0)
            }
            
            if (key == 'windspeed' || key == 'gustspeed') {
                return value ? value.toFixed(1) : value
            }

            if (key.indexOf('temp') > -1 || key == 'feelslike') {
                return value.toFixed(0)
            }

            return value
        },


        redrawChart: function() {
            var summaries = this.hourly.findWhere({ propertystring: 'summary' })
            var vals = summaries.get('value')
            if (!vals) return

            var len = 0
            var ticks = [
                { propertystring: 'timestamps', unit: '', round: false, val: [] },
                { propertystring: 'temperature', unit: '\xB0', round: true, val: [] },
                { propertystring: 'gust', unit: 'kh', round: true, val: [] },
            ]

            _.each(ticks, function(t) {
                var model = this.hourly.findWhere({ propertystring: t.propertystring })
                if (model) {
                    var val = model.get('value')
                    if (val) {
                        t.val = _.map(val.split(','), function(v,i) { return [i,(t.round ? Math.round(v) : v )+t.unit] })    
                        len = val.split(',').length
                    }
                }    
            }, this)

            var width = this.ui.rchart.width()
            var interval = _.max([1, Math.round(len * 40 / width)])
            _.each(ticks, function(t) {
                t.val = t.val.filter(function(t,i) {
                    return i % interval == 0
                })
            }, this)


            var options = {
                series: {
                    bars: {
                        lineWidth: 0,
                        horizontal: true,
                        show: true,
                    },
                    stack: true,
                },
                tooltip: true,
                tooltipOpts: {
                    content: this.getTooltip.bind(this),
                },
                legend: {
                    show: false
                },
                grid: {
                    borderWidth: 0,
                    hoverable: true,
                },
                yaxis: {
                    ticks: [],
                },
                xaxis: {
                    tickLength: 0,
                },
                xaxes: [
                    { ticks: ticks[0].val, position: 'top' }, 
                    { ticks: ticks[1].val, max: len, position: 'bottom', font: { size: 14, color: '#aaa' } },
                    { ticks: ticks[2].val, max: len, position: 'bottom', font: { size: 12, color: '#bbb' } }
                ]
            }

            var cols = {
                'Light Rain': '#80a5d6',
                'Light Rain and Breezy': '#80a5d6',
                'Rain': '#4a80c7',
                'Foggy': '#ccc',
                'Overcast': '#878f9a',
                'Mostly Cloudy': '#b6bfcb',
                'Partly Cloudy': '#d5dae2',
                'Clear': '#eeeef5',
            }

            var data = []
            var lastsummary = vals.split(',')[0];
            var count = 0;
            _.each(vals.split(','), function(v) {
                if (v != lastsummary) {
                    data.push({ label: lastsummary, data: [[count, 0]], color: cols[lastsummary] })
                    count = 0;
                }

                count++;
                lastsummary = v
            })
            data.push({ label: lastsummary, data: [[count, 0]], color: cols[lastsummary] })

            data.push({ data: [0,len], xaxis: 2 })
            data.push({ data: [0,len], xaxis: 3 })

            $.plot(this.ui.rchart, data, options)
        },


        getTooltip: function(lab, x, y, item) {
            return item.series.label
        },


        addListeners: function() {
            this.current.each(function(m) {
                this.listenTo(m, 'sync change', this.updateValue, this)
                this.updateValue(m, m.get('value'))
            }, this)

            this.hourly.each(function(m) {
                this.listenTo(m, 'sync change', this.redrawChart, this)
                this.redrawChart()
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