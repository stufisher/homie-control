define(['backbone.marionette',
    'collections/properties',
    'views/gauge',
    'views/radar',
    'utils',

    'tpl!templates/pages/weather.html',
    'moment',
    'Flot', 'Flot-stack'
	], function(Marionette, 
        Properties, GaugeView, RadarView, utils,
        template, moment) {


    var DailyView = Marionette.View.extend({
        className: 'daily',
        template: _.template(''),

        initialize: function(options) {
            this.properties = options.properties

            this.ready = []
            this.ready.push(this.properties.fetch())
        },

        addListeners: function() {
            this.properties.each(function(m) {
                this.listenTo(m, 'sync change', this.redrawDaily, this)
            }, this)

            this.redrawDaily()
        },


        onRender: function() {
            $.when.apply($, this.ready).done(this.addListeners.bind(this))
        },

        redrawDaily: function() {
            this.$el.empty()

            var len = this.properties.at(0).get('value')
            if (len) len = len.split(',').length

            var daily = _.map(_.range(len), function(i) { return { } })
            _.each(_.range(len), function(i) {
                daily[i]['day'] = moment().add(i, 'days').format('ddd')
            }, this)

            this.properties.each(function(p) {
                var val = p.get('value')
                var k = p.get('propertystring')
                if (typeof(val) == typeof('')) {
                    var vals = val.split(',')    
                    _.each(vals, function(v, i) {
                        daily[i][k] = this.translate(k, v)
                    }, this)
                }
            }, this)

            var min = _.min(_.map(_.pluck(daily, 'templow'), function(t) { return parseFloat(t) }))
            var max = _.max(_.map(_.pluck(daily, 'temphigh'), function(t) { return parseFloat(t) }))
            
            _.each(daily, function(d, i) {
                this.$el.append('<div class="day" style="grid-row: 1; grid-column: '+(i+1)+'">'+d.day+'</div>')
                this.$el.append('<div class="icon" style="grid-row: 2; grid-column: '+(i+1)+'"><i class="wi wi-forecast-io-'+d.icon+'"></i></div>')
                this.$el.append('<div class="temp" style="grid-row: 3; grid-column: '+(i+1)+'">'+this.drawBar({ model: d, min: min, max: max })+'</div>')
                this.$el.append('<div class="pop" style="grid-row: 4; grid-column: '+(i+1)+'"><i class="wi wi-umbrella"></i> '+d.pop+'%</div>')
                this.$el.append('<div class="wind" style="grid-row: 5; grid-column: '+(i+1)+'"><i class="wi wi-strong-wind"></i> '+d.wind+' ('+d.gust+') <i class="wi wi wi-wind from-'+d.winddir+'-deg"></i></div>')
            }, this)
        },


        drawBar: function(options) {
            var padperdeg = this.getOption('padPerDeg') || 15
            var maxpad = (options.max - options.model.temphigh) * padperdeg
            var minpad = (options.model.templow - options.min) * padperdeg
            var range = (options.model.temphigh - options.model.templow) * padperdeg
            return '<div class="temps"><div class="high" style="padding-top: '+maxpad+'px">'+options.model.temphigh+'&deg;</div><div class="bar" style="height: '+range+'px"></div><div class="low" style="padding-bottom: '+minpad+'px">'+options.model.templow+'&deg;</div></div>'
        },

        translate: function(key, value) {
            if (key == 'pop') {
                return (parseFloat(value) * 100).toFixed(0)
            }
            
            if (key == 'wind' || key == 'gust') {
                return value ? parseFloat(value).toFixed(0) : value
            }

            if (key.indexOf('templow') > -1 || key == 'temphigh') {
                return parseFloat(value).toFixed(0)
            }

            return value
        },

    })


	var WeatherView = Marionette.View.extend({
		template: template,

        regions: {
            rforecasts: '.forecasts',
            rdaily: '.rdaily',
            rradar: '.rradar',
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
                return value ? value.toFixed(0) : value
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
                'Possible Light Rain': '#80a5d6',
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
            }, this)
            this.redrawChart()

            this.astronomy.each(function(m) {
                this.listenTo(m, 'sync change', this.updateValue, this)
                this.updateValue(m, m.get('value'))
            }, this)
        },


        onRender: function() {
            $.when.apply($, this.ready).done(this.addListeners.bind(this))
            this.getRegion('rdaily').show(new DailyView({ translate: this.translate, properties: new Properties(null, { queryParams: { propertysubgroupid: this.config.get('daily') }}) }))
            this.getRegion('rradar').show(new RadarView())
        },

	})


    WeatherView.dailyView = DailyView

    return WeatherView


})