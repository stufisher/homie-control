define(['backbone.marionette',
    'models/history',
    'tpl!templates/heating/usage.html',
    'jquery', 'jquery.flot',
	], function(Marionette, 
        HistoryModel,
        template, $) {

	return Marionette.View.extend({
		template: template,

        ui: {
            daily: '.daily',
            monthly: '.monthly',
        },

        events: {
            
        },

        _baseOpts: { 
            grid: {
                borderWidth: 0,
            },
            bars: {
                show: true,
                barWidth: 0.8,
                align: 'center'
            },

            xaxis: {
                tickLength: 0,
            },
            yaxis: {
                tickLength: 0
            },
        },


        initialize: function(options) {
            this.usage = new HistoryModel({ location: options.location, param: 'usage' })
            this.usagem = new HistoryModel({ location: options.location, param: 'usage' })

        },

        onRender: function() {
            this._ready1 = this.usage.fetch()
            this._ready2 = this.usagem.fetch({ data: { type: 'month' } })
        },

        onShow: function() {
            $.when(this._ready1).done(this.plotDaily.bind(this))
            $.when(this._ready2).done(this.plotMonthly.bind(this))
        },

        plotDaily: function() {
            var opts = this.getOption('_baseOpts')
            opts.xaxis.ticks = [[0,'Mon'], [1,'Tue'], [2,'Wed'], [3,'Thu'], [4,'Fri'], [5,'Sat'], [6,'Sun']]

            $.plot(this.ui.daily, this.usage.get('data'), opts)
        },

        plotMonthly: function() {
            var opts = this.getOption('_baseOpts')
            opts.xaxis.ticks = [[1,'Jan'], [2,'Feb'], [3,'Mar'], [4,'Apr'], [5,'May'], [6,'Jun'], 
                [7,'Jul'], [8,'Aug'], [9,'Sep'], [10,'Oct'], [11,'Nov'], [12,'Dec']]

            $.plot(this.ui.monthly, this.usagem.get('data'), opts)
        },


	})



})