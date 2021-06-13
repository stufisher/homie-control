define(['backbone.marionette',
    'collections/properties',
    'utils',
    'moment',
    'tpl!templates/pages/transport.html',
    'tpl!templates/pages/transport_dir.html',
    ], function(Marionette, 
        Properties, utils, moment,
        template, dirtemplate) {

    var EventView = Marionette.View.extend({
        className: 'event',
        tagName: 'li',
        getTemplate: function() {
            if (this.model.get('all_day')) {
                return _.template('<div class="title">All Day</div><div><%-title%></div>')
            } else {
                return _.template('<div class="title"><%-start%> - <%-end%></div><div><%-title%></div>')
            }
        }
    })

    var EmptyEventsView = Marionette.View.extend({
        tagName: 'li',
        className: 'event',
        template: _.template('Nothing Planned'),
    })

    var EventsView = Marionette.CollectionView.extend({
        tagName: 'ul',
        className: 'events',
        childView: EventView,
        emptyView: EmptyEventsView
    })

    var DayView = Marionette.View.extend({
        tagName: 'li',
        className: 'day',
        template: _.template('<h1><%-day%> <span class="date"><%-date%></span></h1><div class="revents"></div>'),

        regions: {
            revents: '.revents'
        },

        onRender: function() {
            var Events = new Backbone.Collection(this.model.get('events'))

            this.eview = new EventsView({ collection: Events })
            this.getRegion('revents').show(this.eview)
        }
    })

    var DaysView = Marionette.CollectionView.extend({
        tagName: 'ul',
        childView: DayView
    })

    return Marionette.View.extend({
        template: _.template('<div class="rdays calendar"></div>'),
        className: "dcalendar",

        regions: {
            rdays: '.rdays',
        },

        initialize: function(options) {
            this.days = new Backbone.Collection()
            this.config = options.config
            this.group = new Properties(null, { queryParams: { propertygroupid: this.config.get('calendar') }})
            this.group.fetch().done(this.mapProperty.bind(this))
        },

        mapProperty: function() {
            this.group.each(function(m) {
                this.listenTo(m, 'sync change', this.updateDays, this)
                this.updateDays(m)
            }, this)
        },

        updateDays: function(model) {
            console.log('update days', model)
            var days = JSON.parse(model.get('value'))
            this.days.reset(days)
        },

        onRender: function() {
            this.dview = new DaysView({ collection: this.days })
            this.getRegion('rdays').show(this.dview)
        },

    })

})
