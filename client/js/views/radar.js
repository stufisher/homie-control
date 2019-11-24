define(['backbone.marionette',
    'leaflet',
    'moment',
    'models/options',

    ], function(Marionette, L, moment, Options) {


    var MapTimestamps = Backbone.Collection.extend({
        originalSync: true,
        url: 'https://tilecache.rainviewer.com/api/maps.json',

        parse: function(r, options) {
            var list = _.map(r, function(i) { return { timestamp: i }})
            return list.slice(this.start)
        },

        initialize: function(options) {
            this.start = options.start || 0
            this.on('change:isSelected', this.onSelectedChanged, this);
        },
                
        onSelectedChanged: function(model) {
            if (this.inUpdate) return

            this.inUpdate = true
            this.each(function(model) {
                if (model.get('isSelected') === true && !model._changing) {
                    model.set({isSelected: false})
                }
            })
            this.inUpdate = false
            this.trigger('selected:change', model)
        }
    })

    return Marionette.View.extend({
        template: _.template('<div class="label"></div><div class="map"></div>'),
        className: 'radar',

        height: 500,
        opacity: 0.9,
        interval: 500,
        zoom: 8,
        theme: 'light',
        zoomControl: true,
        iterateZoom: false,
        start: 0,

        ui: {
            map: '.map',
            label: '.label',
        },

        initialize: function(options) {
            console.log('radar options', options)
            this.types = {
                osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                light: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png',
                dark: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_nolabels/{z}/{x}/{y}.png',
                radar: 'https://tilecache.rainviewer.com/v2/radar/{ts}/{size}/{z}/{x}/{y}/{color}/{options}.png',
                'ref-dark': 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_only_labels/{z}/{x}/{y}.png',
                'ref-light': 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png',
            }

            this.timestamps = new MapTimestamps({ start: this.start })
            this.timestampTimeout = null
            this.listenTo(this.timestamps, 'sync', this.renderLayers)
            this.listenTo(this.timestamps, 'selected:change', this.setOpacity)

            this.radarLayers = {}
            this.currentFrame = 0

            this.frameTimeout = null
            this.iterateZoomTimeout = null
            this.zoomIteration = 0

            this.options = new Options()
            this.ready = this.options.fetch()

            this.listenTo(app, 'mqtt:connect', this.getTimestamps.bind(this))
        },

        onDestroy: function() {
            clearTimeout(this.frameTimeout)
            clearTimeout(this.timestampTimeout)
            clearTimeout(this.iterateZoomTimeout)
        },

        onRender: function() {
            this.ui.map.height(this.getOption('height'))
        },

        doZoomIteration: function() {
            clearTimeout(this.iterateZoomTimeout)
            this.zoomIteration++
            if (this.zoomIteration > 2) this.zoomIteration = 0

            this.map.setZoom(this.getOption('zoom')-this.zoomIteration, { animate: false })
            this.iterateZoomTimeout = setTimeout(this.doZoomIteration.bind(this), 1000 * 20)
        },

        getTimestamps: function() {
            clearTimeout(this.timestampTimeout)

            this.timestamps.fetch()
            this.timestampTimeout = setTimeout(this.getTimestamps.bind(this), 1000 * 60 * 10)
        },

        nextFrame: function() {
            clearTimeout(this.frameTimeout)
            this.currentFrame++
            if (this.currentFrame >= this.timestamps.length) this.currentFrame = 0

            this.timestamps.at(this.currentFrame).set({ isSelected: true })

            var interval = this.currentFrame == (this.timestamps.length - 1) ? this.getOption('interval')*2 : this.getOption('interval')
            this.frameTimeout = setTimeout(this.nextFrame.bind(this), interval)
        },

        setOpacity: function() {
            this.timestamps.each(function(ts) {
                var t = ts.get('timestamp')
                if (t in this.radarLayers) {
                    this.radarLayers[t].setOpacity(ts.get('isSelected') ? this.getOption('opacity') : 0)
                }
            }, this)

            var sel = this.timestamps.findWhere({ isSelected: true })
            if (sel) {
                var m = moment.unix(sel.get('timestamp'))
                this.ui.label.text(m.format('HH:mm'))
            }
        },

        renderLayers: function() {
            this.timestamps.each(function(ts, i) {
                var t = ts.get('timestamp')
                if (!(t in this.radarLayers)) {
                    this.radarLayers[t] = L.tileLayer(this.types.radar, {
                        ts: t,
                        size: 512,
                        color: 4,
                        options: '1_1',
                        opactiy: 0,
                    })
                    this.radarLayers[t].addTo(this.map)
                }
            }, this)

            _.each(this.radarLayers, function(layer, key) {
                var ts = this.timestamps.findWhere({ timestamp: parseInt(key) })
                if (!ts) this.map.removeLayer(layer)
            }, this)

            this.ref.bringToFront()
            this.nextFrame()
        },

        onDomRefresh: function() {
            this.ready.done(this.doOnDomRefresh.bind(this))
        },

        doOnDomRefresh: function() {
            this.map = L.map(this.ui.map[0], { 
                attributionControl: false,
                zoomControl: this.getOption('zoomControl'),
            }).setView([this.options.get('latitude'), this.options.get('longitude')], this.getOption('zoom'));

            console.log('types', this.types, this.getOption('theme'))
            this.base = L.tileLayer(this.types[this.getOption('theme')]).addTo(this.map)
            this.ref = L.tileLayer(this.types['ref-'+this.getOption('theme')]).addTo(this.map)

            this.getTimestamps()
            if (this.getOption('iterateZoom')) this.doZoomIteration()
        },

    })

})
