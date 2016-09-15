define(['backbone.paginator', 'models/schedulecomp'], function(PageableCollection, ComponentModel) {


    var Components = Backbone.Collection.extend({

        initialize: function(models, options) {
            this.titleModel = { name: options.day, class:'title' }
            this.add(this.titleModel)
        },

        softReset: function(models) {
            if (models) {
                models.unshift(this.titleModel)
                this.reset(models)

            } else this.reset(this.titleModel)
        },  

    })


    return PageableCollection.extend({
        mode: 'client',
        model: ComponentModel,
        url: '/schedule/component',


        initialize: function(models, options) {
            coll = []
            _.each({ 0: '&nbsp;', 1: 'Sun', 2:'Mon', 3:'Tue', 4:'Wed', 5:'Thu', 6: 'Fri', 7:'Sat'}, function(v,k) {
                coll.push({ dayid: parseInt(k), day: v, components: new Components(null, { day: v }) })
            })

            coll[0].class = 'head'

            this.days = new Backbone.Collection(coll)
            this.days.each(function(m) {
                m.allcomponents = this
            }, this)

            console.log('init', this.days)
            this.on('sync', this.updateDays, this)
            this.on('add', this.maybeUpdateDays, this)
        },

        maybeUpdateDays: function(model) {
            if (model.get('new')) this.updateDays()
        },

        updateDays: function() {
            console.log('update days')

            var colls = {}
            _.each(_.range(7), function(i) {
                colls[i+1] = []
            })

            this.each(function(m) {
                colls[m.get('day')].push(m)
            }, this)

            this.days.each(function(m) {
                if (m.get('dayid') == 0) return
                m.get('components').softReset(colls[m.get('dayid')])
            })
        },

    })

})