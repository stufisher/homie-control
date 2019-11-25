define(['backbone.marionette',

    'collections/properties',
    'collections/propertysubgroups',

    'utils',
    'moment',

    'tpl!templates/pages/daapd.html'], 

    function(Marionette,
    Properties, PropertySubGroups,
    utils, moment,
    template) {


    var MetaItemView = Marionette.View.extend({
        tagName: 'li',
        template: _.template('<span class="title"><%=friendlyname.replace(\'Daapd \', \'\')%></span><span class="value"></span>'),
        modelEvents: {
            'change:value': 'updateState',
        },

        ui: {
            val: '.value',
        },

        onRender: function() {
            this.updateState()
        },

        updateState: function() {
            this.ui.val.text(this.model.get('value'))
        },
    })

    var MetaCollectionView = Marionette.CollectionView.extend({
        tagName: 'ul',
        childView: MetaItemView,
    })


    var ProgressView = Marionette.View.extend({
        template: _.template('<span class="elapsed"></span><progress></progress><span class="remain"></span>'),

        ui: {
            elapsed: '.elapsed',
            remain: '.remain',
            prog: 'progress',
        },

        onRender: function(options) {
            this.collection.each(function(p) {
                if (p.get('propertystring') == 'length') {
                    this.listenTo(p, 'change:value', this.updateLength, this)
                    this.updateLength(p)
                }

                if (p.get('propertystring') == 'progress') {
                    this.listenTo(p, 'change:value', this.updateProgress, this)
                    this.updateProgress(p)
                }
            }, this)
        },

        updateLength: function(model) {
            console.log('update length', model.get('value'))
            this.ui.prog.attr('max', model.get('value'))
        },

        updateProgress: function(model) {
            this.ui.prog.val(model.get('value'))
            if (this.ui.prog.attr('max') > 0) this.ui.remain.text('-'+moment((this.ui.prog.attr('max')-model.get('value'))*1000).format('mm:ss'))
            this.ui.elapsed.text(moment(model.get('value')*1000).format('mm:ss'))
        }

    })


    var VolumeView = Marionette.View.extend({
        template: _.template('<i class="fa fa-volume-down"></i> <input type="range" min="0" max="100" />'),

        ui: {
            vol: 'input[type=range]',
        },

        events: {
            'change input[type=range]': 'changeVolume',
        },


        onRender: function(options) {
            this.collection.each(function(p) {
                if (p.get('propertystring') == 'volume') {
                    this.listenTo(p, 'change:value', this.updateVolume, this)
                    this.updateVolume(p)
                    this._volume = p
                }
            }, this)
        },

        changeVolume: function(e) {
            this._volume.save({ value: e.target.value, retained: 0 }, { patch: true })
        },

        updateVolume: function(model) {
            this.ui.vol.val(model.get('value'))
        },
    })



    var QueueItemView = Marionette.View.extend({
        template: _.template('<%-title%> - <%-artist%> (<%-album%>)'),
        tagName: 'li',

        events: {
            click: 'play',
        },

        play: function(e) {
            e.preventDefault()

            var play = this.getOption('play')
            play.save({ value: this.model.get('id'), retained: 0}, { patch: true })
        }
    })

    var QueueView = Marionette.CollectionView.extend({
        tagName: 'ol',
        childView: QueueItemView,
        childViewOptions: function() {
            return {
                play: this._play
            }
        },

        initialize: function(options) {
            this.collection = new Backbone.Collection()

            options.properties.each(function(p) {
                if (p.get('propertystring') == 'queue') {
                    this.listenTo(p, 'change:value', this.updateQueue, this)
                    this.updateQueue(p)
                }

                if (p.get('propertystring') == 'play') {
                    this._play = p
                }
            }, this)

        },

        updateQueue: function(q) {
            var queue = JSON.parse(q.get('value'))
            if (queue) {
                this.collection.reset(queue.items)
            }
        },
    })


    var PlaylistView = Marionette.View.extend({
        template: _.template('<%-name%>'),
        tagName: 'li',
        events: {
            click: 'loadPlaylist',
        },

        loadPlaylist: function(e) {
            e.preventDefault()

            var add = this.getOption('add')
            add.save({ value: this.model.get('uri'), retained: 0 }, { patch: true })
        }
    })

    var PlaylistsView = Marionette.CollectionView.extend({
        tagName: 'ul',
        className: 'playlists',
        childView: PlaylistView,
        childViewOptions: function() {
            return {
                add: this.getOption('add')
            }
        }
    })

    var LibraryView = Marionette.View.extend({
        template: _.template('<h2>Playlists</h2><div class="playlists"></div>'),

        regions: {
            rplaylists: '.playlists'
        },

        initialize: function(options) {
            this.playlists = new Backbone.Collection()

            options.properties.each(function(p) {
                if (p.get('propertystring') == 'playlists') {
                    this.listenTo(p, 'change:value', this.updatePlaylists, this)
                    this.updatePlaylists(p)
                }

                if (p.get('propertystring') == 'add') {
                    this._add = p
                }
            }, this)
        },

        onRender: function() {
            this.getRegion('rplaylists').show(new PlaylistsView({ collection: this.playlists, add: this._add }))
        },

        updatePlaylists: function(p) {
            var playlists = JSON.parse(p.get('value'))
            if (playlists) {
                this.playlists.reset(playlists.playlists)
            }
        }
    })

    var OutputView = Marionette.View.extend({
        template: _.template('<div><%-name%></div><div><i class="fa fa-volume-down"></i> <input type="range" min="0" max="100" value="<%-volume%>" /></div><div><a href="#" class="button enabled <%-(selected ? \'on\': \'off\')%>"><i class="fa fa-fw fa-power-off"></i></div>'),
        className: 'grid grid-mobile',

        events: {
            'change input[type=range]': 'changeVolume',
            'click a.enabled': 'changeEnabled'
        },

        changeVolume: function(e) {
            var volume = this.getOption('volume')
            volume.save({ value: this.model.get('id')+','+e.target.value, retained: 0 }, { patch: true })
        },

        changeEnabled: function(e) {
            e.preventDefault()

            var enable = this.getOption('enable')
            enable.save({ value: this.model.get('id')+','+(this.model.get('selected') ? 0 : 1), retained: 0 }, { patch: true })
        }
    })

    var OutputsView = Marionette.CollectionView.extend({
        childView: OutputView,

        childViewOptions: function() {
            return {
                volume: this._volume,
                enable: this._enable,
            }
        },

        initialize: function(options) {
            this.collection = new Backbone.Collection()
            options.properties.each(function(p) {
                if (p.get('propertystring') == 'outputs') {
                    this.listenTo(p, 'change:value', this.updateOutputs, this)
                    this.updateOutputs(p)
                }

                if (p.get('propertystring') == 'volume') {
                    this._volume = p
                }

                if (p.get('propertystring') == 'enable') {
                    this._enable = p
                }
            }, this)
        },

        updateOutputs: function(op) {
            var outputs = JSON.parse(op.get('value'))
            if (outputs) {
                this.collection.reset(outputs.outputs)
            }
        }
    })

    var PlayerView = Marionette.View.extend({
        template: _.template('<a href="#" class="button prev"><i class="fa fa-fw fa-step-backward"></i></a> <a href="#" class="button playing"><i class="fa fa-fw "></i></a> <a href="#" class="button next"><i class="fa fa-fw fa-step-forward"></i></a>'),

        events: {
            'click a.playing': 'changeState',
            'click a.next': 'next',
            'click a.prev': 'prev',
        },

        ui: {
            icon: '.playing .fa'
        },

        changeState: function(e) {
            e.preventDefault()
            this._playing.save({ value: this._playing.get('value') ? 0 : 1, retained: 0 }, { patch: true })
        },

        next: function(e) {
            e.preventDefault()
            this._next.save({ value: 1, retained: 0 }, { patch: true })
        },

        prev: function(e) {
            e.preventDefault()
            this._prev.save({ value: 1, retained: 0 }, { patch: true })
        },

        updatePlaying: function(p) {
            p.get('value') ? this.ui.icon.addClass('fa-stop').removeClass('fa-play')
                           : this.ui.icon.addClass('fa-play').removeClass('fa-stop')
        },

        onRender: function() {
            this.collection.each(function(p) {
                console.log("PlayerView", p.get('propertystring'))
                if (p.get('propertystring') == 'playing') {
                    this.listenTo(p, 'change:value', this.updatePlaying, this)
                    this.updatePlaying(p)
                    this._playing = p
                }

                if (p.get('propertystring') == 'next') {
                    console.log('next')
                    this._next = p
                }

                if (p.get('propertystring') == 'previous') {
                    this._prev = p
                }
            }, this)
        },
    })


    return Marionette.View.extend({
        template: template,
        className: 'daapd',

        ui: {
            cover: '.cover img',
            queue: ".queue",
        },

        events: {
            'click .queue-toggle': 'toggleQueue'
        },

        regions: {
            rmeta: '.meta',
            rprog: '.progress',
            rvol: '.volume',
            rremote: '.remote',
            rplayer: '.player',
            rqueue: '.queue',
            rlibrary: '.library',
            routputs: '.outputs',
        },

        templateContext: function() {
            return {
                appurl: app.appurl
            }
        },

        toggleQueue: function(e) {
            e.preventDefault()
            this.ui.queue.slideToggle()
        },

        initialize: function(options) {
            this.config = options.config
            this.properties = new Properties(null, { queryParams: { propertygroupid: this.config.get('propertygroupid') } })
            this.propertysubgroups = new PropertySubGroups(null, { queryParams: { propertygroupid: this.config.get('propertygroupid')  } })

            this.ready = []
            this.ready.push(this.properties.fetch())
            this.ready.push(this.propertysubgroups.fetch())
        },

        onRender: function() {
            $.when.apply($, this.ready).done(this.doOnRender.bind(this))

            if (app.mobile()) this.ui.queue.addClass('hide')
        },

        doOnRender: function() {
            var meta = this.propertysubgroups.findWhere({ name: 'Meta' })
            var meta_props = this.properties.where({ propertysubgroupid: meta.get('propertysubgroupid')})
            this.getRegion('rmeta').show(new MetaCollectionView({ 
                collection: new Properties(meta_props),
            }))


            var cover = this.propertysubgroups.findWhere({ name: 'Cover' })
            var cover_props = new Properties(this.properties.where({ propertysubgroupid: cover.get('propertysubgroupid')}))
            cover_props.each(function(p) {
                if (p.get('propertystring') == 'mime') {
                    this._cover_mime = p
                }

                if (p.get('propertystring') == 'image' || p.get('propertystring') == 'thumb') {
                    this._cover = p
                    this.listenTo(this._cover, 'change:value', this.drawCover)
                    this.drawCover()
                }
            }, this)


            var prog = this.propertysubgroups.findWhere({ name: 'Progress' })
            this.getRegion('rprog').show(new ProgressView({ 
                collection: new Properties(this.properties.where({ propertysubgroupid: prog.get('propertysubgroupid')})),
            }))

            var vol = this.propertysubgroups.findWhere({ name: 'Volume' })
            this.getRegion('rvol').show(new VolumeView({ 
                collection: new Properties(this.properties.where({ propertysubgroupid: vol.get('propertysubgroupid')})),
            }))

            var player = this.propertysubgroups.findWhere({ name: 'Player' })
            this.getRegion('rplayer').show(new PlayerView({ 
                collection: new Properties(this.properties.where({ propertysubgroupid: player.get('propertysubgroupid')})),
            }))

            var queue = this.propertysubgroups.findWhere({ name: 'Queue' })
            this.getRegion('rqueue').show(new QueueView({ 
                properties: new Properties(this.properties.where({ propertysubgroupid: queue.get('propertysubgroupid')})),
            }))

            var library = this.propertysubgroups.findWhere({ name: 'Library' })
            this.getRegion('rlibrary').show(new LibraryView({ 
                properties: new Properties(this.properties.where({ propertysubgroupid: library.get('propertysubgroupid')})),
            }))

            var outputs = this.propertysubgroups.findWhere({ name: 'Outputs' })
            this.getRegion('routputs').show(new OutputsView({ 
                properties: new Properties(this.properties.where({ propertysubgroupid: outputs.get('propertysubgroupid')})),
            }))
        },


        drawCover: function() {
            var mime = this._cover_mime || 'image/jpeg'
            if (this._cover.get('value')) {
                this.ui.cover.attr('src', 'data:'+mime+';base64,'+this._cover.get('value'))
            } else {
                this.ui.cover.attr('src', app.appurl+'/assets/images/no-cover.png')
            }
            
        },

    })

})