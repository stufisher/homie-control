define(['backbone.marionette',
    'collections/properties',
    'views/gauge',
    'utils',

    'tpl!templates/pages/irrigation.html',
	'tpl!templates/pages/irrigation_zone.html',
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
            hum: '.humidity',
            pump: '.pump',
            en: '.enable',
            auto: '.auto',
            name: 'h2.name',
        },

        events: {
            'click a.enable': 'toggleEnable',
            'click a.auto': 'toggleAuto',
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

        toggleAuto: function(e) {
            e.preventDefault()

            var newv = this.auto.get('value') ? 0 : 1
            var self = this
            this.auto.set({ value: newv }, { silent: true })
            this.auto.save(this.auto.changedAttributes(), {
                patch: true,
                success: function() {
                    self.updateAuto()
                }
            })
        },


        initialize: function(options) {
            this.revertThread = null

            console.log('zone', this.model, this.model.get('propertysubgroupid'))
            // this.group = 
            this.properties = new Properties(null, { queryParams: { propertysubgroupid: this.model.get('propertysubgroupid') } })
            this.ready = this.properties.fetch()

            this.gauge = new GaugeView()
            this.listenTo(this.gauge, 'value:change', this.updateSP, this)
            this.listenTo(this.gauge, 'value:hover', this.hoverSP, this)
        },

        addListeners: function() {
            console.log(this.model.get('id'), 'properties', this.properties)
            this.properties.each(function(m) {
                if (m.get('propertytype') == 'humidity') {
                    console.log(this.model.get('id'), 'found hum', m)
                    this.humidity = m
                    this.listenTo(this.humidity, 'sync change', this.updateHum, this)
                }

                if (m.get('propertytype') == 'humidityset') {
                    this.humsp = m
                    this.listenTo(this.humsp, 'sync change', this.updateHumSP, this)
                }

                if (m.get('propertytype') == 'switch') {
                    this.pump = m
                    this.listenTo(this.pump, 'sync change', this.updatePump, this)
                }

                if (m.get('propertytype') == 'enable') {
                    this.enable = m
                    this.listenTo(this.enable, 'sync change', this.updateEnable, this)
                }

                if (m.get('propertytype') == 'override') {
                    this.auto = m
                    this.listenTo(this.auto, 'sync change', this.updateAuto, this)
                }
            }, this)

            this.updateHum()
            this.updateName()
            this.updateHumSP()
            this.updateAuto()
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

        updateHumSP: function(e) {
            this.gauge.value({ value: this.humsp.get('value') })
        },

        updateSP: function(val) {
            this.humsp.set({ value: val })
            this.humsp.save(this.humsp.changedAttributes(), {patch: true})
        },


        hoverSP: function(val) {
            clearTimeout(this.revertThread)
            var self = this
            var last = this.ui.hum.text()
            this.ui.hum.addClass('glow')
            this.ui.hum.html(val)
            this.revertThread = setTimeout(function() {
                self.ui.hum.removeClass('glow')
                self.updateHum(null, null, { animate: false })
            }, 1000)
        },


        updatePump: function() {
            this.pump.get('value') ? this.ui.pump.addClass('active') : this.ui.pump.removeClass('active')
        },

        updateEnable: function() {
            this.ui.en.find('i').removeClass('fa-spinner')
            this.enable.get('value') ? this.ui.en.addClass('active') : this.ui.en.removeClass('active')
        },

        updateAuto: function() {
            this.ui.auto.find('i').removeClass('fa-spinner')
            this.auto.get('value') ? this.ui.auto.addClass('active') : this.ui.auto.removeClass('active')
        },

        updateHum: function(e, model, options) {
            if (options && !options.animate)
                this.ui.hum.text(this.humidity.get('value'))    
            else
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
            fsun: '.fsun',
            fshade: '.fshade',
            fres: '.fres',
        },

        events: {

        },


        updateSunTemp: function() {
            this.suntemp.set({ value: this.suntemp.get('value').toFixed(1) }, { silent: true })
            utils.easeText({
                model: this.suntemp,
                el: this.ui.fsun
            })
        },

        updateShadeTemp: function() {
            this.shadetemp.set({ value: this.shadetemp.get('value').toFixed(1) }, { silent: true })
            utils.easeText({
                model: this.shadetemp,
                el: this.ui.fshade
            })
        },

        updateRes: function() {
            this.ui.fres.removeClass('active').removeClass('alert')

            if (this.rlow.get('value')) {
                this.ui.fres.addClass('alert')
                this.ui.fres.html('Low')
            }

            else if (this.rhigh.get('value')) {
                this.ui.fres.addClass('active')
                this.ui.fres.html('Full')

            } else {
                this.ui.fres.html('OK')
            }
        },


        initialize: function(options) {
            this.config = options.config
            this.temperatures = new Properties(null, { queryParams: { propertysubgroupid: this.config.get('temperatures') }})
            this.ready = this.temperatures.fetch()
        },


        addListeners: function() {
            this.temperatures.each(function(m) {
                if (m.get('propertytype') == 'temperature') {
                    if (m.get('propertystring') == 'value1') {
                        this.suntemp = m
                        this.listenTo(this.suntemp, 'sync change', this.updateSunTemp, this)
                    }

                    if (m.get('propertystring') == 'value2') {
                        this.shadetemp = m
                        this.listenTo(this.shadetemp, 'sync change', this.updateShadeTemp, this)
                    }

                }

                if (m.get('propertytype') == 'switch') {
                    if (m.get('propertystring') == 'high') {
                        this.rhigh = m
                        this.listenTo(this.rhigh, 'sync change', this.updateRes, this)

                    }

                    if (m.get('propertystring') == 'low') {
                        this.rlow = m
                        this.listenTo(this.rlow, 'sync change', this.updateRes, this)
                    }
                }


            }, this)

            this.updateRes()
            this.updateShadeTemp()
            this.updateSunTemp()
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