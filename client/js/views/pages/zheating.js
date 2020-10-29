define(['backbone.marionette',
    'collections/properties',
    'views/gauge',
    'utils',

    'tpl!templates/pages/zheating.html',
	'tpl!templates/pages/zheating_zone.html',
    'tpl!templates/pages/heating_zone.html',
	], function(Marionette, 
        Properties, GaugeView, utils,
        template, zonetemplate, temptemplate) {


    var TempView = Marionette.View.extend({
        className: 'zone',
        template: temptemplate,

        ui: {
            temp: '.temp',
        },

        modelEvents: {
            'sync change': 'updateTemp'
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

    })


    var TempsView = Marionette.CollectionView.extend({
        childView: TempView,
    })



    var ZoneView = Marionette.View.extend({
        template: zonetemplate,
        className: 'zone single',

        regions: {
            g: '.g',
        },

        ui: {
            temp: '.temp',
            heat: '.zheat',
            enabled: '.zenable',
            boost: '.zboost',
            away: '.zaway',
            scheduled: '.zscheduled',
            name: 'h2.name',
            sp: 'input[name=sp]',
            boosttime: 'input[name=zboosttime]',
        },

        events: {
            'click a.zenable': 'toggleEnable',
            'click a.zboost': 'toggleBoost',
            'click @ui.sp': 'updateTempSP',
            'keydown @ui.boosttime': 'setBoostTime',
        },

        onDomRefresh: function() {
            this.gauge.triggerMethod('dom:refresh')
        },

        selectedSP: function() {
            return this.$el.find('input[name=sp]:checked').val() + 'set'
        },

        initialize: function(options) {
            this.revertThread = null

            this.properties = new Properties(null, { queryParams: { propertysubgroupid: this.model.get('propertysubgroupid') } })
            this.ready = this.properties.fetch()

            this.gauge = new GaugeView({ min: 5, max: 30 })
            this.listenTo(this.gauge, 'value:change', this.updateSP, this)
            this.listenTo(this.gauge, 'value:hover', this.hoverSP, this)
        },

        addListeners: function() {
            this.properties.each(function(m) {
                if (m.get('propertytype') == 'temperature') {
                    this.temp = m
                    this.listenTo(this.temp, 'sync change', this.updateTemp, this)
                    this.updateTemp()
                }

                if (m.get('propertytype') == 'switch') {
                    this.heat = m
                    this.listenTo(this.heat, 'sync change', this.update.bind(this, 'heat'))
                    this.update('heat')
                }

                if (m.get('propertytype') == 'integer') {
                    this.boosttime = m
                    this.listenTo(this.boosttime, 'sync change', this.updateBoostTime)
                    this.updateBoostTime()
                }

                _.each(['enabled', 'scheduled', 'boost', 'away'], function(prop) {
                    if (m.get('propertystring') == prop) {
                        this[prop] = m
                        this.listenTo(this[prop], 'sync change', this.update.bind(this, prop))
                        this.update(prop)
                    }
                }, this)

                _.each(['temperatureset', 'awayset', 'boostset'], function(prop) {
                    if (m.get('propertystring') == prop) {
                        this[prop] = m
                        this.listenTo(this[prop], 'sync change', this.updateTempSP)
                    }
                }, this)
            }, this)

            this.updateName()
            this.updateTempSP()
        },

        onRender: function() {
            $.when(this.ready).done(this.addListeners.bind(this))
            this.getRegion('g').show(this.gauge)
        },

        updateBoostTime: function() {
            this.ui.boosttime.val(this.boosttime.get('value'))
        },

        setBoostTime: function(e) {
            console.log('setBoostTime', e.key)
            if (e.key == 'Enter') {
                this.boosttime.set({ value: this.ui.boosttime.val() }, { silent: true })
                this.boosttime.save(this.boosttime.changedAttributes(), { patch: true })
            }
        },

        updateName: function() {
            this.ui.name.html(this.temp.get('propertysubgroup'))
        },

        updateTempSP: function(e) {
            var model = this[this.selectedSP()]
            this.gauge.value({ value: model.get('value') })
        },

        updateSP: function(val) {
            var model = this[this.selectedSP()]
            model.set({ value: val })
            model.save(model.changedAttributes(), { patch: true })
        },

        hoverSP: function(val) {
            clearTimeout(this.revertThread)
            var self = this
            var last = this.ui.temp.text()
            this.ui.temp.addClass('glow')
            this.ui.temp.html(val)
            this.revertThread = setTimeout(function() {
                self.ui.temp.removeClass('glow')
                self.updateTemp(null, null, { animate: false })
            }, 1000)
        },

        update: function(property) {
            this.ui[property].find('i').removeClass('fa-spinner')
            this[property].get('value') == 1 ? this.ui[property].addClass('active') : this.ui[property].removeClass('active')
        },

        toggleEnable: function(e) {
            e.preventDefault()
            this.toggle('enabled')
        },

        toggleBoost: function(e) {
            e.preventDefault()
            this.toggle('boost')
        },

        toggle: function(prop) {
            var newv = this[prop].get('value') ? 0 : 1
            var self = this
            this[prop].set({ value: newv }, { silent: true })
            this[prop].save(this[prop].changedAttributes(), {
                patch: true,
                success: function() {
                    self.update(prop)
                }
            })
        },

        updateTemp: function(model, options) {
            if (options && !options.animate) {
                this.ui.temp.text(this.temp.get('value').toFixed(1))    
            } else {
                utils.easeText({
                    model: this.temp,
                    el: this.ui.temp,
                    round: 1
                })
            }
            
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
        className: 'zoned',

        regions: {
            rzones: '.zheating',
            rtemps: '.temps',
        },

        ui: {
            heat: '.heat',
            enabled: '.enabled',
            scheduled: '.scheduled',
            boost: '.boost',
            away: '.away',
        },

        events: {
            'click a.enabled': 'toggleEnabled',
            'click a.boost': 'toggleBoost',
            'click a.away': 'toggleAway',
        },


        initialize: function(options) {
            this.config = options.config
            
            this.ready = []

            this.temps = new Properties()
            this.temps.queryParams.propertysubgroupid = this.config.get('readpropertysubgroup')
            this.ready.push(this.temps.fetch())

            this.control = new Properties()
            this.control.queryParams.propertysubgroupid = this.config.get('controlpropertysubgroup')
            this.ready.push(this.control.fetch())
        },

        addListeners: function() {
            this.control.each(function(m) {
                if (m.get('propertytype') == 'switch') {
                    this.heat = m
                    this.listenTo(this.heat, 'sync change', this.update.bind(this, 'heat'))
                    this.update('heat')
                }
                
                _.each(['enabled', 'scheduled', 'boost', 'away'], function(prop) {
                    if (m.get('propertystring') == prop) {
                        this[prop] = m
                        this.listenTo(this[prop], 'sync change', this.update.bind(this, prop))
                        this.update(prop)
                    }
                }, this)
            }, this)
        },


        onRender: function() {
            $.when.apply($, this.ready).done(this.addListeners.bind(this))

            this.zview = new ZonesView({ collection: this.config.get('zones') })
            this.getRegion('rzones').show(this.zview)
            this.getRegion('rtemps').show(new TempsView({ collection: this.temps }))
        },

        onDomRefresh: function() {
            this.zview.triggerMethod('dom:refresh')
        },


        update: function(property) {
            this[property].get('value') == 1 ? this.ui[property].addClass('active') : this.ui[property].removeClass('active')
        },


        toggleEnabled: function(e) {
            e.preventDefault()
            this.toggle('enabled')
        },

        toggleBoost: function(e) {
            e.preventDefault()
            this.toggle('boost')
        },

        toggleAway: function(e) {
            e.preventDefault()
            this.toggle('away')
        },

        toggle: function(prop) {
            var newv = this[prop].get('value') ? 0 : 1
            var self = this
            this[prop].set({ value: newv }, { silent: true })
            this[prop].save(this[prop].changedAttributes(), {
                patch: true,
                success: function() {
                    self.update(prop)
                }
            })
        },

	})

})
