define(['backbone.marionette',

    'collections/properties',
    'collections/propertysubgroups',

    'utils',
    'moment',

    'tpl!templates/pages/sonos_group.html',
    'tpl!templates/pages/sonos_player.html',
    'tpl!templates/pages/sonos.html'], 

    function(Marionette,
    Properties, PropertySubGroups,
    utils, moment,
    grouptemplate, playertemplate, template) {


    var ZoneView = Marionette.View.extend({
        template: playertemplate,
        className: 'sonos-player',

        ui: {
            cover: '.cover img',
            name: 'h2.name',
            elapsed: '.elapsed',
            remain: '.remain',
            prog: 'progress',

            artist: '.artist',
            album: '.album',
            track: '.track',

            icon: '.playing .fa',
            fav: 'select[name=fav]',
        },

        events: {
            'click a.playing': 'changeState',
            'click a.next': 'next',
            'click a.prev': 'prev',
            'click a.load': 'loadFavourite',
        },

        templateContext: function() {
            return {
                appurl: app.appurl
            }
        },

        initialize: function(options) {
            this.properties = new Properties(null, { queryParams: { propertysubgroupid: this.model.get('propertysubgroupid') } })
            this.ready = this.properties.fetch()
        },

        addListeners: function() {
            this.properties.each(function(p) {
                _.each(['album', 'artist', 'track'], function(prop) {
                    if (p.get('propertystring') == prop) {
                        this[prop] = p
                        this.listenTo(this[prop], 'sync change', this.update.bind(this, prop))
                        this.update(prop)
                    }
                }, this)

                if (p.get('propertystring') == 'cover') {
                    this._cover = p
                    this.listenTo(this._cover, 'change:value', this.drawCover)
                    this.drawCover()
                }

                if (p.get('propertystring') == 'length') {
                    this.listenTo(p, 'change:value', this.updateLength, this)
                    this.updateLength(p)
                }

                if (p.get('propertystring') == 'progress') {
                    this.listenTo(p, 'change:value', this.updateProgress, this)
                    this.updateProgress(p)
                }

                if (p.get('propertystring') == 'playing') {
                    this.listenTo(p, 'change:value', this.updatePlaying, this)
                    this.updatePlaying(p)
                    this._playing = p
                }

                _.each(['next', 'previous', 'favourite'], function(prop) {
                    if (p.get('propertystring') == prop) {
                        this[prop] = p
                    }
                }, this)
            }, this)

            this.updateName()

            this.listenTo(this.getOption('favourites'), 'sync change', this.updateFavourites)
            this.updateFavourites()
        },

        onRender: function() {
            $.when(this.ready).done(this.addListeners.bind(this))
        },

        loadFavourite: function(e) {
            e.preventDefault()
            this.favourite.save({ value: this.ui.fav.val(), retained: 0 }, { patch: true })
        },

        changeState: function(e) {
            e.preventDefault()
            this._playing.save({ value: this._playing.get('value') ? 0 : 1, retained: 0 }, { patch: true })
        },

        next: function(e) {
            e.preventDefault()
            this.next.save({ value: 1, retained: 0 }, { patch: true })
        },

        prev: function(e) {
            e.preventDefault()
            this.prev.save({ value: 1, retained: 0 }, { patch: true })
        },

        updateFavourites: function() {
            var favs = JSON.parse(this.getOption('favourites').get('value'))
            var opts = favs.map(function(f) { return '<option value="'+f+'">'+f+'</option>'})
            this.ui.fav.html(opts)
        },

        updatePlaying: function(p) {
            p.get('value') ? this.ui.icon.addClass('fa-stop').removeClass('fa-play')
                           : this.ui.icon.addClass('fa-play').removeClass('fa-stop')
        },

        updateLength: function(model) {
            this.ui.prog.attr('max', model.get('value'))
        },

        updateProgress: function(model) {
            this.ui.prog.val(model.get('value'))
            if (this.ui.prog.attr('max') > 0) this.ui.remain.text('-'+moment((this.ui.prog.attr('max')-model.get('value'))*1000).format('mm:ss'))
            this.ui.elapsed.text(moment(model.get('value')*1000).format('mm:ss'))
        },

        updateName: function() {
            this.ui.name.html(this._cover.get('propertysubgroup'))
        },

        update: function(property) {
            this.ui[property].text(this[property].get('value') ? this[property].get('value') : '')
        },

        drawCover: function() {
            if (this._cover.get('value')) {
                this.ui.cover.attr('src', 'data:image/jpeg;base64,'+this._cover.get('value'))
            } else {
                this.ui.cover.attr('src', app.appurl+'/assets/images/no-cover.png')
            }
            
        },

    })


    var MemberView = Marionette.View.extend({
        template: _.template('<%-name%><a href="#" class="button button-small remove"><i class="fa fa-minus"></i></a>'),
        tagName: 'li',
        events: {
            'click a.remove': 'removeFrom'
        },

        removeFrom: function(e) {
            e.preventDefault()
            var remove = this.getOption('remove')
            remove.save({ value: this.model.get('name'), retained: 0 }, { patch: true })
        }
    })

    var MembersView = Marionette.CollectionView.extend({
        tagName: 'ul',
        className: 'sonos-members',
        childView: MemberView,
        childViewOptions: function() {
            return { remove: this.getOption('remove') }
        }
    })


    var GroupView = Marionette.View.extend({
        template: grouptemplate,
        className: 'sonos-zone',

        regions: {
            rmembers: '.rmembers',
            rplayer: '.rplayer',
        },

        ui: {
            add: 'select[name=add]',
            vol: '.volume input',
        },

        events: {
            'click a.add': 'addToZone',
            'change @ui.vol': 'setGroupVolume',
        },

        setGroupVolume: function(e) {
            var groupVol = this.getOption('volume')
            groupVol.save({ value: this.model.get('coordinator')+','+this.ui.vol.val(), retained: 0 }, { patch: true })
        },

        addToZone: function(e) {
            e.preventDefault()

            var add = this.getOption('add')
            add.save({ value: this.model.get('coordinator')+','+this.ui.add.val(), retained: 0 }, { patch: true })
        },

        initialize: function(options) {
            this.listenTo(this.model, 'change:volume', this.updateVolume)

            this.zone = this.getOption('subGroups').findWhere({ name: this.model.get('coordinator') })
            this.zoneView = new ZoneView({ model: this.zone, favourites: this.getOption('favourites') })
        },

        onRender: function() {
            var members = new Backbone.Collection(this.model.get('members').map(function(m) { 
                return { name: m }
            }))
            this.getRegion('rmembers').show(new MembersView({ collection: members, remove: this.getOption('remove') }))
            this.updateZones()

            
            if (this.zone) {
                this.getRegion('rplayer').show(this.zoneView)
            }
            
            this.updateVolume()
        },

        updateZones: function() {
            var opts = ''
            this.model.collection.each(function(m) {
                if (m.get('coordinator') !== this.model.get('coordinator')) {
                    opts += '<option value="'+m.get('coordinator')+'">'+m.get('coordinator')+'</option>'
                }
            }, this)

            this.ui.add.html(opts)
        },

        updateVolume: function() {
            this.ui.vol.val(this.model.get('volume'))
        }
    })

    var GroupsView = Marionette.CollectionView.extend({
        childView: GroupView,
        childViewOptions: function() {
            return { 
                add: this.getOption('add'), remove: this.getOption('remove'), 
                subGroups: this.getOption('subGroups'), 
                favourites: this.getOption('favourites'),
                volume: this.getOption('volume')
            }
        }
    })


    var GroupModel = Backbone.Model.extend({
        idAttribute: 'coordinator'
    })

    var GroupsCollection = Backbone.Collection.extend({
        model: GroupModel,
    })


    var VolumeView = Marionette.View.extend({
        template: _.template('<input type="range" min="0" max="100" /> <%-friendlyname%>'),
        tagName: 'li',

        ui: {
            vol: 'input'
        },

        events: {
            'change @ui.vol': 'setVolume',
        },

        initialize: function(options) {
            this.listenTo(this.model, 'change:value', this.updateVolume)
        },

        onRender: function() {
            this.updateVolume()
        },

        setVolume: function(e) {
            this.model.save({ value: e.target.value, retained: 0 }, { patch: true })
        },

        updateVolume: function() {
            console.log('updateVolume', this.model.get('value'))
            this.ui.vol.val(this.model.get('value'))
        }
    })

    var VolumesView = Marionette.CollectionView.extend({
        tagName: 'ul',
        className: 'sonos-volumes',
        childView: VolumeView,
    })

    return Marionette.View.extend({
        template: template,
        className: 'sonos',

        events: {
            'click a.resume': 'resume',
            'click a.pause': 'pause',
        },

        regions: {
            rgroups: '.rgroups',
            rvolumes: '.rvolumes',
        },

        initialize: function(options) {
            this.config = options.config
            this.controls = new Properties(null, { queryParams: { propertysubgroupid: this.config.get('controlsgroupid') } })
            this.zones = new Properties(null, { queryParams: { propertysubgroupid: this.config.get('zonesgroupid') } })
            this.volumes = new Properties(null, { queryParams: { propertysubgroupid: this.config.get('volumesgroupid') } })
            this.propertysubgroups = new PropertySubGroups(null, { queryParams: { propertygroupid: this.config.get('propertygroupid')  } })

            this.ready = []
            this.ready.push(this.controls.fetch())
            this.ready.push(this.zones.fetch())
            this.ready.push(this.volumes.fetch())
            this.ready.push(this.propertysubgroups.fetch())

            this.groups = new GroupsCollection()
        },

        resume: function(e) {
            e.preventDefault()
            this.resume.save({ value: 1, retained: 0 }, { patch: true })
        },

        pause: function(e) {
            e.preventDefault()
            this.pause.save({ value: 1, retained: 0 }, { patch: true })
        },

        onRender: function() {
            $.when.apply($, this.ready).done(this.doOnRender.bind(this))
        },

        addListeners: function() {
            this.controls.each(function(p) {
                _.each(['pause', 'resume', 'favourites', 'volume'], function(prop) {
                    if (p.get('propertystring') == prop) {
                        this[prop] = p
                    }
                }, this)
            }, this)

            this.zones.each(function(p) {
                _.each(['add', 'remove'], function(prop) {
                    if (p.get('propertystring') == prop) {
                        this[prop] = p
                    }
                }, this)

                if (p.get('propertystring') == 'current') {
                    this.groupsp = p
                    this.listenTo(p, 'change:value', this.updateGroups, this)
                    this.updateGroups(p)
                }
            }, this)
        },

        doOnRender: function() {
            this.addListeners()

            this.gview = new GroupsView({ 
                collection: this.groups, 
                add: this.add, remove: this.remove, 
                subGroups: this.propertysubgroups, 
                favourites: this.favourites,
                volume: this.volume,
            })
            this.getRegion('rgroups').show(this.gview)
            console.log('\vols', this.volumes)
            this.getRegion('rvolumes').show(new VolumesView({ collection: this.volumes }))
        },

        updateGroups: function() {
            this.groups.reset(JSON.parse(this.groupsp.get('value')))
        }

    })

})