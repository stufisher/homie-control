define(['backbone.marionette',
    'models/schedule',
    'collections/schedules',

    'models/schedulecomp',
    'collections/schedulecomps',
    'views/table',
    'utils/table',

    'collections/properties',

    'tpl!templates/schedule/schedule.html',
    'utils',
    'jquery'
	], function(Marionette, 
        ScheduleModel, ScheduleCollection, ComponentModel, ComponentCollection, TableView, TableUtils, Properties,
        template, utils, $) {


    function getTime(options) {
        var xy = options.xy
        var w = options.w
        var len = options.length || 1

        var lenh = Math.floor(len)
        var lenm = Math.floor((len%1) * 60)

        var ph = ((w - 60)/24)
        var t = (xy[0] - 60) / ph 

        if (t < 0) return

        var h = Math.floor(t)
        var m = Math.floor((t % 1) * 60)
        var m = m - m % 5

        var e = h+lenh
        var em = m + lenm
        var start = (h < 10 ? '0'+h : h) +':'+(m < 10 ? '0'+m : m)
        var end = (e < 10 ? '0'+e : e) +':'+(em < 10 ? '0'+em : em)

        return { start: start, end: end }
    }


    var ComponentView = Marionette.View.extend({
        modelEvents: {
            change: 'render'
        },

        tagName: 'li',
        className: 'comp',
        getTemplate: function() {
            if (this.model.get('class') == 'title' || this.model.get('class') == 'head')
                return _.template('<%=name%>')
            else
                return _.template('&nbsp;')
        },

        className: function() {
            if (this.model.get('class') == 'title') return 'title'
        },

        events: {
            mousedown: 'onMouseDown',
            mousemove: 'onMouseMove',
            dblclick: 'deleteComp',
            touchstart: 'onMouseDown',
            touchmove: 'onMouseMove',
        },

        deleteComp: function(e) {
            e.preventDefault()
            this.model.destroy()
        },


        onMouseMove: function(e) {
            if (e.originalEvent.touches && e.originalEvent.touches.length >  1) return
            e.preventDefault()
            if (e.originalEvent.touches && e.originalEvent.touches.length) e = e.originalEvent.touches[0];

            if (e.offsetX > this.$el.width()) this.$el.css('cursor', 'e-resize')
                else this.$el.css('cursor', 'move')
        },

        onMouseDown: function(e) {
            if (e.originalEvent.touches && e.originalEvent.touches.length >  1) return
            e.preventDefault()
            if (e.originalEvent.touches && e.originalEvent.touches.length) {
                if (this.lastClick && (new Date() - this.lastClick < 1000)) {
                    this.deleteComp(e)
                    return
                }
                this.lastClick = new Date()

                e = e.originalEvent.touches[0]
            }

            if (!e.offsetX) {
                rect = e.target.getBoundingClientRect()
                e.offsetX = e.clientX - rect.left
            }

            if (e.offsetX > this.$el.width()) {
                this.trigger('component:stretch', this, this.model, { x: e.pageX, y: e.pageY })
            }
            else
                this.trigger('component:move', this, this.model, { x: e.pageX, y: e.pageY })
        },


        onRender: function() {
            if (this.model.get('class') == 'title' || this.model.get('class') == 'head') 
                return

            var parts = this.model.get('startt').split(':')
            var sdec = parseInt(parts[0]) + parseFloat(parts[1])/60 
            var parts = this.model.get('endt').split(':')
            var edec = parseInt(parts[0]) + parseFloat(parts[1])/60 

            this.$el.css('left', 'calc( 60px + (((100% - 60px) / 24 )) * '+sdec+')')
            this.$el.css('width', 'calc( ( (100% - 60px) /24 * '+(edec-sdec)+') - 11px )')
        },

        initialize: function() {
            this.lastClick = null
        },

        // left: calc(60px + (((100% - 60px) / 24)) * <hour>)
        // width: calc( ( (100% - 60px) /24 - 11px ) * <len>)
    })


    var ComponentsView = Marionette.CollectionView.extend({
        tagName: 'ul',
        childView: ComponentView,

        events: {
            mouseup: 'endComponentMove',
            mousemove: 'moveComponent',
            touchend: 'endComponentMove',
            touchmove: 'moveComponent',
        },

        endComponentMove: function(e) {
            var self = this
            setTimeout(function() {
                self.trigger('component:move', false)
            }, 200)

            if (!this.componentmove) return
            this.componentmove.view.model.save()
            this.componentmove = null
        },

        onChildviewComponentMove: function(view, model, xy) {
            this.componentmove = { view: view, start: xy }
            this.trigger('component:move', true)
        },

        onChildviewComponentStretch: function(view, model, xy) {
            this.componentmove = { view: view, start: xy, stretch: true }
            this.trigger('component:move', true)
        },

        moveComponent: function(e) {
            if (!this.componentmove) return

            if (e.originalEvent.touches && e.originalEvent.touches.length >  1) return
            e.preventDefault()
            if (e.originalEvent.touches && e.originalEvent.touches.length) e = e.originalEvent.touches[0];

            var delx = e.pageX - this.componentmove.start.x
            var pos = this.componentmove.view.$el.position()
            var w = this.$el.width()

            var extra = 0
            if (this.componentmove.stretch) {
                extra = this.componentmove.view.$el.outerWidth()
            }

            var newtime = getTime({ w: w, xy: [pos.left + delx + extra], length: this.componentmove.view.model.get('length') })

            if (Math.abs(delx) > 5) {
                if (this.componentmove.stretch) {
                    this.componentmove.view.model.set({
                        endt: newtime.start
                    })
                } else {
                    this.componentmove.view.model.set({
                        startt: newtime.start,
                        endt: newtime.end
                    })
                }
                this.componentmove.start.x = e.pageX
            }
        },


    })



    var DayView = Marionette.View.extend({
        tagName: 'li',
        template: _.template('<div class="comps"></div>'),
        regions: {
            comps: '.comps',
        },

        className: function() {
            if (this.model.get('class') == 'head') return 'head'
        },

        events: {
            click: 'onClick',
        },

        onClick: function(e) {
            e.preventDefault()
            if ($(e.target).is('li.comp')) return
            if (this.componentMoving) return

            var xy = utils.get_xy(e, this.$el)
            var w = this.$el.find('ul').width()
            var time = getTime({ w: w, xy: xy})

            if (!time) return

            var sch = this.getOption('schedules').findWhere({ isSelected: true })
            var self = this
            var comp = new ComponentModel({ scheduleid: sch.get('scheduleid'), 
                startt: time.start, endt: time.end, 
                day: this.model.get('dayid'), new: true })
            comp.save({}, {
                success: function() {
                    self.model.allcomponents.add(comp)
                }
            })
        },

        initialize: function() {
            this.componentMoving = false

            if (this.model.get('class') == 'head') {
                var mods = []
                _.each(_.range(24), function(i) {
                    var n = (i < 10 ? '0'+i : i)+':00'
                    mods.push({ name: i % 4 == 0 ? n : '&nbsp;', class: 'head' })
                })

                this.model.get('components').softReset(mods)
            }
        },

        setCompMoveStatus: function(status) {
            console.log('set moving status', status)
            this.componentMoving = status
        },

        onRender: function() {
            this.compview = new ComponentsView({ collection: this.model.get('components') })
            this.listenTo(this.compview, 'component:move', this.setCompMoveStatus, this)
            this.getRegion('comps').show(this.compview)
        }
    })


    var DaysView = Marionette.CollectionView.extend({
        tagName: 'ul',
        childView: DayView,

        events: {
            mousewheel: 'onZoom',
            DOMMouseScroll: 'onZoom',
            touchmove: 'mobileZoom',
        },

        mobileZoom: function(e) {
            if (e.originalEvent.touches && e.originalEvent.touches.length == 2) {
                e.preventDefault()

                x = e.originalEvent.touches[0]
                y = e.originalEvent.touches[1]
                v = Math.sqrt(Math.pow(x.pageX-y.pageX,2)+Math.pow(x.pageY-y.pageY,2))
            
                if (v && this.lastv) {
                    var nw = (v > this.lastv ? 5 : -5) + this.width
                    if (nw < 100) nw = 100
                    this.$el.css('width', nw+'%')
                    this.width = nw
                }

                this.lastv = v
            }
        },

        childViewOptions: function() {
            return {
                schedules: this.getOption('schedules')
            }
        },

        initialize: function() {
            this.width = 100
            // this.onZoom = _.debounce(this.onZoom, 100)
            // this.mobileZoom = _.debounce(this.mobileZoom, 200)
        },

        onZoom: function(e) {
            // e.preventDefault()
            var o = e.originalEvent
            var delta = o.wheelDelta ? o.wheelDelta : -o.detail

            console.log('delta', delta)
            return
            this._doZoom(delta)
        },


        _doZoom: function(delta) {
            var nw = delta*5 + this.width
            if (nw < 100) nw = 100
            if (nw > 500) nw = 500
            this.$el.css('width', nw+'%')
            this.width = nw
        },
    })


    var DBOptionsCell = Backgrid.Cell.extend({
        render: function() {
            return this
        }
    })


	return Marionette.View.extend({
		template: template,

        regions: {
            scheds: '.schedules',
            sched: '.schedule',
        },

        events: {
            'click a.add': 'addSchedule',
            'click a.zi': 'zoomIn',
            'click a.zo': 'zoomOut',
        },

        zoomIn: function(e) {
            e.preventDefault()
            this.schedview._doZoom(10)
        },

        zoomOut: function(e) {
            e.preventDefault()
            this.schedview._doZoom(-10)
        },

        addSchedule: function(e) {
            e.preventDefault()
            this.schedules.add(new ScheduleModel({ new: true }))
        },

        fetchComponents: function() {
            var sel = this.schedules.findWhere({ isSelected: true })
            if (sel) {
                this.components.queryParams.scheduleid = sel.get('scheduleid')
                this.components.fetch()
            }
        },

        initialize: function(options) {
            this.schedules = new ScheduleCollection()
            this.listenTo(this.schedules, 'change', this.saveSchedule, this)
            this.listenTo(this.schedules, 'selected:change', this.fetchComponents, this)
            this.ready = this.schedules.fetch()
            this.properties = new Properties(null, { subscribe: false })
            this.properties.state.pageSize = 9999
            this.ready2 = this.properties.fetch()

            this.components = new ComponentCollection()
        },

        saveSchedule: function(m, v) {
            console.log('model changed', arguments)
            if ('isSelected' in m.changedAttributes()) return
            if (!m.get('new')) m.save(m.changedAttributes(), { patch: true })
        },

        setInitialSchedule: function() {
            this.schedules.at(0).set('isSelected', true)
            this.fetchComponents()
        },

        onRender: function() {
            $.when(this.ready).done(this.setInitialSchedule.bind(this))
            $.when(this.ready2).done(this.doOnRender.bind(this))
            this.schedview = new DaysView({ collection: this.components.days, schedules: this.schedules })
            this.getRegion('sched').show(this.schedview)
        },

        doOnRender: function() {
            this.getRegion('scheds').show(new TableView({
                collection: this.schedules,
                columns: [
                    { name: '', label: '', cell: TableUtils.SelectedCell, editable: false },
                    { name: 'name', label: 'Name', cell: TableUtils.ValidatedCell },
                    { name: 'start', label: 'Start', cell: TableUtils.ValidatedCell },
                    { name: 'end', label: 'End', cell: TableUtils.ValidatedCell },
                    { name: 'propertyid', label: 'Property', cell: TableUtils.SelectInputCell, options: this.properties },
                    { name: 'requiredevice', label: 'Require Device', cell: TableUtils.SelectInputCell, options: TableUtils.YesNo },
                    { name: 'invert', label: 'Invert', cell: TableUtils.SelectInputCell, options: TableUtils.YesNo },
                    { label: '', cell: TableUtils.EnableCell, editable: false },
                    { label: '', cell: TableUtils.OptionsCell, editable: false },
                ],
                loading: true,
            }))
        },

	})



})