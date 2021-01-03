define(['backbone.marionette',
    'collections/properties',
    'utils',
    'moment',
    'tpl!templates/pages/transport.html',
    'tpl!templates/pages/transport_dir.html',
    ], function(Marionette, 
        Properties, utils, moment,
        template, dirtemplate) {


    var TimeView = Marionette.View.extend({
        tagName: 'li',
        template: _.template('<span clas="time"><%-time%></span> <span class="due"><%-duein%><% if (delay) { %><span class="delay">+<%-delay.toFixed(1)%></span><% } %>min</span>')
    })


    var TimesView = Marionette.CollectionView.extend({
        tagName: 'ul',
        childView: TimeView,
    })


    var DirectionView = Marionette.View.extend({
        template: dirtemplate,
        className: 'direction',

        ui: {
            name: '.name',
        },

        regions: {
            rtimes: '.times'
        },


        initialize: function(options) {
            this.times = new Backbone.Collection()
            this.properties = new Properties(null, { queryParams: { propertysubgroupid: this.model.get('propertysubgroupid') } })
            this.ready = this.properties.fetch()
        },

        addListeners: function() {
            this.properties.each(function(m) {
                if (m.get('propertystring').startsWith('direction')) {
                    this.pname = m
                    this.listenTo(this.pname, 'sync change', this.updateName, this)
                }

                if (m.get('propertystring').startsWith('scheduled')) {
                    this.scheduled = m
                    this.listenTo(this.scheduled, 'change', this.updateTimes, this)
                }

                if (m.get('propertystring').startsWith('realtime')) {
                    this.realtime = m
                    this.listenTo(this.realtime, 'change', this.updateTimes, this)
                }

            }, this)

            // this.updateTimes()
            this.updateName()
        },


        updateName: function() {
            this.ui.name.text(this.pname.get('value'))
        },


        updateTimes: function(m) {
            var times = []
            var schd = this.scheduled.get('value')
            var real = this.realtime.get('value')

            if (typeof(real) != typeof('') || typeof(schd) != typeof('')) return
            schd = schd.split(',')
            real = real.split(',')

            _.each(schd, function(s,i) {
                var sc = moment().startOf('day').add(s, 'seconds')
                var mins = sc.diff(moment(), 'minutes')
                var delay = (real[i] - s)/60
                times.push({ time: sc.format('HH:mm'), duein: mins < 1 ? '<1' : mins, delay: delay })
            })

            this.times.reset(times)
        },

        onRender: function() {
            $.when(this.ready).done(this.addListeners.bind(this))

            this.getRegion('rtimes').show(new TimesView({ collection: this.times }))
        },
    })



    var DirectionsView = Marionette.CollectionView.extend({
        childView: DirectionView,
    })



    return Marionette.View.extend({
        template: template,

        regions: {
            rdirs: '.dirs',
        },

        initialize: function(options) {
            this.config = options.config
        },

        onRender: function() {
            this.dview = new DirectionsView({ collection: this.config.get('directions') })
            this.getRegion('rdirs').show(this.dview)
        },

    })



})