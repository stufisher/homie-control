define(['backbone.marionette',
    'models/property',
    'collections/properties',
    'views/gauge',
    'utils',

    'tpl!templates/pages/ac.html',
	], function(Marionette, 
        Property, Properties, GaugeView, utils,
        template) {


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
            name: '.name',
            sp: '.speed',
            sl: '.sleep',
        },

        events: {
            'click a.enable': 'toggleEnable',
            'click a.sleep': 'toggleSleep',
            'click a.speed': 'toggleSpeed',
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

        toggleSleep: function(e) {
            e.preventDefault()

            var newv = this.sleep.get('value') ? 0 : 1
            var self = this
            this.sleep.set({ value: newv }, { silent: true })
            this.sleep.save(this.sleep.changedAttributes(), {
                patch: true,
                success: function() {
                    self.updateSleep()
                }
            })
        },

        toggleSpeed: function(e) {
            e.preventDefault()

            var cur = parseInt(this.speed.get('value'))
            var newv = cur == 1 ? 2 : (cur == 2 ? 3 : 1)
            var self = this
            this.speed.set({ value: newv }, { silent: true })
            this.speed.save(this.speed.changedAttributes(), {
                patch: true,
                success: function() {
                    self.updateSpeed()
                }
            })
        },


        initialize: function(options) {
            this.config = options.config
            this.gauge = new GaugeView({ min: 18, max: 32 })
            this.listenTo(this.gauge, 'value:hover', this.hoverSP, this)
            this.listenTo(this.gauge, 'value:change', this.setSP, this)

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
                if (m.get('propertytype') == 'enable') {
                    this.listenTo(m, 'sync change', this.updateEnable, this)
                    this.enable = m
                    this.updateEnable(m)
                }
                if (m.get('propertytype') == 'temperatureset') {
                    this.listenTo(m, 'sync change', this.updateTempSP, this)
                    this.tempsp = m
                    this.updateTempSP(m)
                }

                if (m.get('propertytype') == 'switch' && m.get('propertystring') == 'sleep') {
                    this.listenTo(m, 'sync change', this.updateSleep, this)
                    this.sleep = m
                    this.updateSleep(m)
                }

                if (m.get('propertytype') == 'switch' && m.get('propertystring') == 'speed') {
                    this.listenTo(m, 'sync change', this.updateSpeed, this)
                    this.speed = m
                    this.updateSpeed(m)
                }

            }, this)
        },


        onRender: function() {
            $.when(this.ready).done(this.addListeners.bind(this))
            this.getRegion('g').show(this.gauge)
        },


        updateSpeed: function(model) {
            this.ui.sp.find('i').removeClass('fa-spinner')
            this.speed.get('value')
        },

        updateSleep: function(model) {
            this.ui.sl.find('i').removeClass('fa-spinner')
            this.sleep.get('value') ? this.ui.sl.addClass('active') : this.ui.sl.removeClass('active')
        },


        updateEnable: function(model) {
            this.ui.en.find('i').removeClass('fa-spinner')
            this.enable.get('value') ? this.ui.en.addClass('active') : this.ui.en.removeClass('active')
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