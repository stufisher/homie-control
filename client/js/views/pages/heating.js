define(['backbone.marionette',
    'models/property',
    'collections/properties',
    'views/gauge',
    'utils',

    'tpl!templates/pages/heating.html',
    'tpl!templates/pages/heating_zone.html',
	], function(Marionette, 
        Property, Properties, GaugeView, utils,
        template, zonetemplate) {


    var ZoneView = Marionette.View.extend({
        className: 'zone',
        template: zonetemplate,

        ui: {
            temp: '.temp',
            motion: '.motion',
        },

        modelEvents: {
            'sync change': 'updateTemp'
        },

        initialize: function(options) {
            this.motion = new Property()
            this.listenTo(this.motion, 'sync change', this.updateMotion, this)
        },

        onRender: function() {
            this.updateTemp()
        },

        updateTemp: function() {
            this.model.set({ value: this.model.get('value').toFixed(1) }, { silent: true })
            utils.easeText({
                model: this.model,
                el: this.ui.temp,
            })
        },

        updateMotion: function() {
            this.motion.get('value') ? this.ui.motion.addClass('active') : this.ui.motion.removeClass('active')
        },

    })


    var ZonesView = Marionette.CollectionView.extend({
        childView: ZoneView,
    })


	return Marionette.View.extend({
		template: template,

        regions: {
            g: '.g',
            zones: '.zones',
        },

        ui: {
            temp: '.temp',
            pump: '.pump',
            en: '.enable',
            auto: '.auto',
            motion: '.motion',
            name: '.name',
        },

        events: {
            'click a.enable': 'toggleEnable',
            'click a.auto': 'toggleAuto',
        },

        onDomRefresh: function() {
            console.log('zone dr')
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
            this.config = options.config
            this.gauge = new GaugeView({ min: 5, max: 30 })
            this.listenTo(this.gauge, 'value:hover', this.hoverSP, this)
            this.listenTo(this.gauge, 'value:change', this.setSP, this)

            this.temps = new Properties()
            this.temps.queryParams.propertysubgroupid = this.config.get('readpropertysubgroup')
            this.temps.fetch()

            this.control = new Properties()
            this.control.queryParams.propertysubgroupid = this.config.get('controlpropertysubgroup')
            this.ready = this.control.fetch()
        },


        addListeners: function() {
            this.control.each(function(m) {
                if (m.get('propertytype') == 'temperature') {
                    this.listenTo(m, 'sync change', this.updateTemp, this)
                    this.temp = m
                    this.updateTemp(m)
                }

                if (m.get('propertytype') == 'motion') {
                    this.listenTo(m, 'sync change', this.updateMotion, this)
                    this.updateMotion(m)
                }
                if (m.get('propertytype') == 'switch') {
                    this.listenTo(m, 'sync change', this.updatePump, this)
                    this.updatePump(m)
                }
                if (m.get('propertytype') == 'enable') {
                    this.listenTo(m, 'sync change', this.updateEnable, this)
                    this.enable = m
                    this.updateEnable(m)
                }
                if (m.get('propertytype') == 'override') {
                    this.listenTo(m, 'sync change', this.updateAuto, this)
                    this.auto = m
                    this.updateAuto(m)
                }
                if (m.get('propertytype') == 'temperatureset') {
                    this.listenTo(m, 'sync change', this.updateTempSP, this)
                    this.tempsp = m
                    this.updateTempSP(m)
                }

            }, this)
        },

        updateMotion: function(model) {
            console.log('update motion', arguments)
            model.get('value') ? this.ui.motion.addClass('active') : this.ui.motion.removeClass('active')
        },

        updatePump: function(model) {
            model.get('value') ? this.ui.pump.addClass('active') : this.ui.pump.removeClass('active')
        },


        onRender: function() {
            $.when(this.ready).done(this.addListeners.bind(this))

            this.getRegion('g').show(this.gauge)
            this.getRegion('zones').show(new ZonesView({ collection: this.temps }))
        },


        updateEnable: function(model) {
            this.ui.en.find('i').removeClass('fa-spinner')
            this.enable.get('value') ? this.ui.en.addClass('active') : this.ui.en.removeClass('active')
        },

        updateAuto: function(model) {
            // Over = 0 => Auto
            this.ui.auto.find('i').removeClass('fa-spinner')
            this.auto.get('value') ? this.ui.auto.removeClass('active') : this.ui.auto.addClass('active')
        },


        updateTemp: function(model, options) {
            console.log('ut', arguments)
            if (this.temp) this.ui.name.html(this.temp.get('friendlyname'))
            if (options && !options.animate) {
                this.ui.temp.text(this.temp.get('value').toFixed(1))    
            } else {
                this.temp.set({ value: this.temp.get('value').toFixed(1) }, { silent: true })
                utils.easeText({
                    model: this.temp,
                    el: this.ui.temp
                })
            }
            
        },

        updateTempSP: function(model) {
            this.gauge.value({ value: model.get('value') })
        },

        setSP: function(val) {
            this.tempsp.set({ value: val })
            this.tempsp.save(this.tempsp.changedAttributes(), { patch: true })
        },


        hoverSP: function(val) {
            // console.log('sp', val)
            clearTimeout(this.revertThread)

            var self = this
            this.ui.temp.addClass('glow')
            this.ui.temp.html(val)
            this.revertThread = setTimeout(function() {
                self.ui.temp.removeClass('glow')
                self.updateTemp(null, { animate: false })
            }, 1000)
        },

	})



})