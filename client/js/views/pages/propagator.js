define(['backbone.marionette',
    'collections/properties',
    'views/gauge',
    'utils',

    'tpl!templates/pages/propagator.html',
	'tpl!templates/pages/propagator_zone.html',
	], function(Marionette, 
        Properties, GaugeView, utils,
        template, zonetemplate) {


    var ZoneView = Marionette.View.extend({
        template: zonetemplate,
        className: 'zone',

        regions: {
            g: '.g',
        },

        ui: {
            temp: '.temperature',
            hum: '.humidity',
            pump: '.pump',
            en: '.enable',
            name: 'h2.name',
        },

        events: {
            'click a.enable': 'toggleEnable',
        },

        onDomRefresh: function() {
            this.gauge.triggerMethod('dom:refresh')
        },


        toggleEnable: function(e) {
            e.preventDefault()

            var newv = this.enable.get('value') ? 0 : 1
            var self = this
            this.enable.set({ value: newv }, { silent: true })
            this.enable.save(this.enable.changedAttributes(), {
                patch: true,
                success: function() {
                    self.updateEnable()
                }
            })
        },


        initialize: function(options) {
            this.revertThread = null

            console.log('zone', this.model, this.model.get('propertysubgroupid'))
            // this.group = 
            this.properties = new Properties(null, { queryParams: { propertysubgroupid: this.model.get('propertysubgroupid') } })
            this.ready = this.properties.fetch()

            this.gauge = new GaugeView({ min: 15, max: 30 })
            this.listenTo(this.gauge, 'value:change', this.updateSP, this)
            this.listenTo(this.gauge, 'value:hover', this.hoverSP, this)
        },

        addListeners: function() {
            console.log(this.model.get('id'), 'properties', this.properties)
            this.properties.each(function(m) {
                if (m.get('propertytype') == 'humidity') {
                    this.humidity = m
                    this.listenTo(this.humidity, 'sync change', this.updateHum, this)
                }

                if (m.get('propertytype') == 'temperature') {
                    this.temp = m
                    this.listenTo(this.temp, 'sync change', this.updateTemp, this)
                }

                if (m.get('propertytype') == 'temperatureset') {
                    this.tempsp = m
                    this.listenTo(this.tempsp, 'sync change', this.updateTempSP, this)
                }

                if (m.get('propertytype') == 'switch') {
                    this.pump = m
                    this.listenTo(this.pump, 'sync change', this.updatePump, this)
                }

                if (m.get('propertytype') == 'enable') {
                    this.enable = m
                    this.listenTo(this.enable, 'sync change', this.updateEnable, this)
                }
            }, this)

            this.updateHum()
            this.updateName()
            this.updateTempSP()
            this.updateTemp()
            this.updatePump()
            this.updateEnable()
        },

        onRender: function() {
            $.when(this.ready).done(this.addListeners.bind(this))
            this.getRegion('g').show(this.gauge)
        },

        updateName: function() {
            this.ui.name.html(this.humidity.get('propertysubgroup'))
        },

        updateTempSP: function(e) {
            this.gauge.value({ value: this.tempsp.get('value') })
        },

        updateSP: function(val) {
            this.tempsp.set({ value: val })
            this.tempsp.save(this.tempsp.changedAttributes(), {patch: true})
        },


        hoverSP: function(val) {
            clearTimeout(this.revertThread)
            var self = this
            var last = this.ui.hum.text()
            this.ui.temp.addClass('glow')
            this.ui.temp.html(val)
            this.revertThread = setTimeout(function() {
                self.ui.temp.removeClass('glow')
                self.updateTemp(null, null, { animate: false })
            }, 1000)
        },


        updatePump: function() {
            this.pump.get('value') ? this.ui.pump.addClass('active') : this.ui.pump.removeClass('active')
        },

        updateEnable: function() {
            this.ui.en.find('i').removeClass('fa-spinner')
            this.enable.get('value') ? this.ui.en.addClass('active') : this.ui.en.removeClass('active')
        },


        updateTemp: function(e, model, options) {
            if (!this.temp.get('value')) return
            if (options && !options.animate)
                this.ui.temp.text(this.temp.get('value'))    
            else
                utils.easeText({
                    model: this.temp,
                    el: this.ui.temp
                })
        },

        updateHum: function(e, model, options) {
            if (!this.humidity.get('value')) return
            utils.easeText({
                model: this.humidity,
                el: this.ui.hum
            })
        },
    })



    var ZonesView = Marionette.CollectionView.extend({
        childView: ZoneView,

        onDomRefresh: function() {
            this.children.each(function(v) {
                v.triggerMethod('dom:refresh')
            })
        },
    })



	return Marionette.View.extend({
		template: template,

        regions: {
            rzones: '.zones',
        },

        ui: {
            temp: '.temp',
            hum: '.hum',
            light: '.light',
        },

        events: {

        },

        updateTemp: function() {
            this.temp.set({ value: this.temp.get('value').toFixed(1) }, { silent: true })
            utils.easeText({
                model: this.temp,
                el: this.ui.temp
            })
        },

        updateHum: function() {
            if (!this.hum) return
            this.hum.set({ value: this.hum.get('value').toFixed(1) }, { silent: true })
            utils.easeText({
                model: this.hum,
                el: this.ui.hum
            })
        },

        updateLight: function() {
            if (!this.light) return

            utils.easeText({
                model: this.light,
                el: this.ui.light
            })
        },


        initialize: function(options) {
            this.config = options.config
            this.temperatures = new Properties(null, { queryParams: { propertysubgroupid: this.config.get('supplementary') }})
            this.ready = this.temperatures.fetch()
        },


        addListeners: function() {
            this.temperatures.each(function(m) {
                if (m.get('propertytype') == 'temperature') {
                    this.temp = m
                    this.listenTo(this.temp, 'sync change', this.updateTemp, this)
                }

                if (m.get('propertytype') == 'humidity') {
                    this.hum = m
                    this.listenTo(this.hum, 'sync change', this.updateHum, this)
                }

                if (m.get('propertytype') == 'light') {
                    this.light = m
                    this.listenTo(this.light, 'sync change', this.updateLight, this)
                }
            }, this)

            this.updateTemp()
            this.updateHum()
            this.updateLight()
        },


        onRender: function() {
            $.when(this.ready).done(this.addListeners.bind(this))

            console.log('zones', this.getOption('zones'))
            this.zview = new ZonesView({ collection: this.config.get('zones') })
            this.getRegion('rzones').show(this.zview)
        },

        onDomRefresh: function() {
            this.zview.triggerMethod('dom:refresh')
        },


	})



})