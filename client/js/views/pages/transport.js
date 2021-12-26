define(['backbone.marionette',
    'collections/properties',
    'moment',
    'tpl!templates/pages/transport.html',
    'tpl!templates/pages/transport_dir.html',
    ], function(Marionette, 
        Properties, moment,
        template, dirtemplate) {


    var TimeView = Marionette.View.extend({
        tagName: 'li',
        template: _.template('<span clas="time"><%-time%></span> <span class="due"><%-duein%><% if (delay) { %><span class="delay">+<%-delay.toFixed(1)%></span><% } %>min</span> <% if (isRealtime) {%><i class="fa fa-wifi" /><%}%>')
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
            this.listenTo(this.model, 'sync update reset', this.updateTimes)
            console.log('direction', this.model)
        },

        updateTimes: function(m) {
            this.ui.name.text(this.model.get("destination"))

            var times = []
            _.each(this.model.get("times"), function(time) {
                var sc = moment().startOf('day').add(time["scheduled"], 'seconds')
                var mins = sc.diff(moment(), 'minutes')
                var delay = (time["realtime"] - time["scheduled"])/60
                times.push({ 
                    time: sc.format('HH:mm'), 
                    duein: mins < 1 ? '<1' : mins, 
                    delay: delay, 
                    isRealtime: time["isRealtime"]
                })
            })

            this.times.reset(times)
        },

        onRender: function() {
            this.updateTimes()
            this.getRegion('rtimes').show(new TimesView({ collection: this.times }))
        },
    })

    var DirectionsView = Marionette.CollectionView.extend({
        childView: DirectionView,
    })


    var ServiceView = Marionette.View.extend({
        template: _.template('<h2><i class="fa fa-<%-type == \'Tram\' ? \'train\': \'bus\'%>" />: <%-service%></h2><div class="rdirections"></div>'),
        className: "service",

        regions: {
            rdirections: '.rdirections',
        },
        
        initialize: function(options) {
            this.collection = new Backbone.Collection()
            this.listenTo(this.model, 'update sync reset', this.updateDirections)
        },

        onRender: function() {
            this.getRegion('rdirections').show(new DirectionsView({ collection: this.collection }))
            this.updateDirections()
        },

        updateDirections: function() {
            this.collection.reset(_.values(this.model.get("directions")))
        }

    })

    var ServicesView = Marionette.CollectionView.extend({
        childView: ServiceView
    })


    return Marionette.View.extend({
        template: template,

        regions: {
            rservices: '.rservices',
        },

        initialize: function(options) {
            this.data = null
            this.collection = new Backbone.Collection()

            this.config = options.config
			this.properties = new Properties(null, { queryParams: { propertygroupid: this.config.get('propertygroupid') } })
            this.ready = this.properties.fetch()
        },

        onRender: function() {
            var self = this
            $.when(this.ready).done(function() {
                self.addListener()
            })
            this.getRegion('rservices').show(new ServicesView({ collection: this.collection }))
        },

        addListener: function() {
            this.properties.each(function(m) {
                if (m.get('propertystring') == 'data') {
                    this.data = m
                    this.listenTo(this.data, 'sync change', this.updateData, this)
                    this.updateData()
                }
            }, this)
        },

        updateData: function() {
            var data = JSON.parse(this.data.get("value"))
            console.log("update data", data)
            this.collection.reset(_.values(data))
        }

    })

})
