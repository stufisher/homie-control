define(['backbone.marionette',
    'models/history',
    'collections/propertygroups',
    'views/filter',
    'utils',
    'moment',
    'tpl!templates/history/hist.html',
    'jquery', 'Flot', 'Flot-time', 'Flot-selection', 'Flot-resize', 'flot.tooltip.pib',
	], function(Marionette, 
        HistoryModel, PropertyGroups,
        FilterView, utils, moment,
        template, $) {

	return Marionette.View.extend({
		template: template,

        ui: {
            plot: '.plot',
            gr: 'select[name=propertygroupid]',
            from: '.from',
            to: '.to',
        },

        regions: {
            filt: '.times',
        },

        events: {
            plotselected: 'zoom',
            'dblclick .plotwrap': 'reset',
            // plothover: 'plotHover',
            'touchstart .plotwrap': 'touchStart',
            'change @ui.gr': 'selectGroup',
        },


        _baseOpts: { 
            grid: {
                borderWidth: 0,
                hoverable: true,
            },

            xaxis: {
                mode: 'time',
                timezone: 'browser',
            },

            selection: {
                mode: 'x',
            },
            legend: {
                position: 'nw'
            },

            tooltip: true
        },


        touchStart: function(e) {
            if (e.originalEvent.touches && e.originalEvent.touches.length >  1) return
            e.preventDefault()
            if (e.originalEvent.touches && e.originalEvent.touches.length) {
                if (this.lastClick && (new Date() - this.lastClick < 1000)) {
                    this.reset(e)
                    return
                }
                this.lastClick = new Date()
            }
        },


        reset: function(e) {
            this.zoom(e, { 
                xaxis: {from: null, to: null},
                yaxis: {from: null, to: null},
            })
        },


        zoom: function (event, ranges) {
            if (!ranges.xaxis) return
            
            var opts = this.plot.getOptions()
            _.each(opts.xaxes, function(axis) {
                axis.min = ranges.xaxis.from
                axis.max = ranges.xaxis.to
            })
            // _.each(opts.yaxes, function(axis) {
            //     axis.min = ranges.yaxis.from
            //     axis.max = ranges.yaxis.to
            // })
            
            this.plot.setupGrid()
            this.plot.draw()
            this.plot.clearSelection()
        },

        updateGroups: function() {
            this.ui.gr.html(this.groups.opts())
            this.selectGroup()
        },

        selectGroup: function() {
            this.hist.queryParams.propertygroupid = this.ui.gr.val()
            this.hist.fetch()
        },

        initialize: function(options) {
            this.groups = new PropertyGroups()
            this.groups.queryParams.history = 1
            this.groups.fetch().done(this.updateGroups.bind(this))
            this.lastClick = null
            this.hist = new HistoryModel()
            this.listenTo(this.hist, 'sync', this.plot, this)

            this.listenTo(this.hist, 'request', this.displaySpinner);
            this.listenTo(this.hist, 'sync', this.removeSpinner);
            this.listenTo(this.hist, 'error', this.removeSpinner);

            this.filterview = new FilterView({
                collection: this.hist,
                name: 'type',
                filters: [
                    { id: 'day', name: 'Daily' },
                    { id: '48', name: '48h' },
                    { id: 'week', name: 'Weekly' },
                    { id: 'monthd', name: 'Monthly (Day)' },
                    { id: 'monthn', name: 'Monthly (Night)' },
                ],
                url: false,
            })
        },

        displaySpinner: function() {
            this.ui.plot.addClass('loading')
        },

        removeSpinner: function() {
            this.ui.plot.removeClass('loading')
        },

        onRender: function() {
            this.getRegion('filt').show(this.filterview)
        },

        onDomRefresh: function() {
            this.ui.plot.height($(window).height()-150)
            this.plot()
            console.log('dom reg', this.$el.closest('wrapper'))
        },

        plot: function() {
            var opts = this.getOption('_baseOpts')
            opts.tooltipOpts = { content: this.showToolTip.bind(this) }

            var sg = []
            var yx = []
            var types = {}
            this.hist.each(function(ser) {
                var gr = ser.get('grouping')
                var s = ser.get('propertysubgroupid')
                var ty = ser.get('propertytype')
                if (sg.indexOf(s) == -1) sg.push(s)
                if (yx.indexOf(gr) == -1) yx.push(gr)

                if (!(s in types)) types[s] = []
                if (!(ty in types[s])) types[s].push(ty)
            })

            var cols = utils.getColors(sg.length)

            var labels = []
            var data = []
            var ymax = {}
            this.hist.each(function(ser) {
                var tyi = types[ser.get('propertysubgroupid')].indexOf(ser.get('propertytype'))
                var col = utils.shadeColor(cols[sg.indexOf(ser.get('propertysubgroupid'))], ((tyi+1)/10))

                var y = yx.indexOf(ser.get('grouping'))
                if (!(y in ymax)) ymax[y] = 0
                _.each(ser.get('data'), function(e) {
                    if (e[1] > ymax[y]) ymax[y] = e[1]
                }, this)

                var series = { 
                    name: ser.get('name') ? ser.get('name') : ser.get('propertyid'), 
                    yaxis: y+1, 
                    color: col,
                    data: ser.get('data')
                }

                if (!(ser.get('propertysubgroup') in labels)) {
                    series.label = ser.get('propertysubgroup')
                    labels[ser.get('propertysubgroup')] =1
                }
                data.push(series)
            })

            opts.yaxes = []
            _.each(ymax, function(ym, i) {
                var ax = {}
                if (ym == 1 && yx.length > 1) ax.max = 5
                opts.yaxes.push(ax)
            }, this)

            // console.log('ymax', ymax)

            console.log('opts', opts)

            this.plot = $.plot(this.ui.plot, data, opts)

            if (this.hist.length) {
                var f = this.hist.at(0)
                if (f.get('data').length) {
                    var from = moment(f.get('data')[0][0])
                    var to = moment(_.last(f.get('data'))[0])

                    this.ui.from.text(from.format('ddd MMM Do YYYY hh:mm'))
                    this.ui.to.text(to.format('ddd MMM Do YYYY hh:mm'))
                }
            }
        },

        showToolTip: function(label, xval, yval, item) {
            // console.log('moo', arguments)
            return item.series.name + ': '+ yval.toFixed(1)
        },

	})



})