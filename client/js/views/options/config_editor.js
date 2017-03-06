define(['backbone.marionette',
    'collections/propertygroups',
    'collections/propertysubgroups',
    'views/form',
    'utils/editable',
    'tpl!templates/config_editor.html',
    'backbone', 'backbone.validation', 'utils/validation'
    ], function(Marionette, PropertyGroups, PropertySubgroups, FormView, Editable, 
        template, Backbone) {
    

    var ConfigElementView = Marionette.View.extend({
        tagName: 'li',
        template: _.template('<span class="label"><%=title%></span><span class="<%=name%>"><input name="value"></span><span class="small"><%=description%></span>'),
        events: {
            'change select': 'updateModel',
            'change input': 'updateModel',
            'keyup select': 'updateModel',
            'keyup input': 'updateModel',
        },

        ui: {
            value: '[name="value"]',
        },

        updateModel: function() {
            var m = this.model.get('model')
            m.set(this.model.get('name'), this.ui.value.val())
            console.log('update model', m)
        },

        beforeRender: function() {},
        afterRender: function() {},

        onRender: function() {
            this.beforeRender()
            var m = this.model.get('model')
            this.ui.value.val(m.get(this.model.get('name')))
            this.afterRender()
        },
    })



    var ConfigPropertySubGroupElement = ConfigElementView.extend({
        template: _.template('<span class="label"><%=title%><br /><span class="small"><%=description%></span></span><span class="<%=name%>"><select name="value"></select></span>'),

        beforeRender: function() {
            this.ui.value.html(this.getOption('propertysubgroups').opts())
        },
    })

    var ConfigPropertyGroupElement = ConfigElementView.extend({
        template: _.template('<span class="label"><%=title%><br /><span class="small"><%=description%></span></span><span class="<%=name%>"><select name="value"></select></span>'),

        beforeRender: function() {
            this.ui.value.html(this.getOption('propertygroups').opts())
        },
    })


    var CollectionElementItem = Marionette.View.extend({
        tagName: 'li',
        template: _.template('<a href="#" class="button rem r"><i class="fa fa-times"></i></a><div class="rwrap"></div>'),

        regions: {
            wrap: '.rwrap'
        },

        events: {
            'click a.rem': 'removeModel',
        },

        removeModel: function(e) {
            this.model.destroy()
        },

        onRender: function() {
            this.collection = new Backbone.Collection()
            _.each(_.result(this.model, 'parameters'), function(p,key) {
                this.collection.add(new Backbone.Model({
                    name: key,
                    type: p.type,
                    title: p.title,
                    description: p.description,
                    model: this.model,
                }))
            }, this)

            this.getRegion('wrap').show(new ConfigElementsView({
                collection: this.collection,
                propertygroups: this.getOption('propertygroups'),
                propertysubgroups: this.getOption('propertysubgroups'),
            }))
        },
    })


    var CollectionElements = Marionette.CollectionView.extend({
        tagName: 'ul',
        className: 'sub',
        childView: CollectionElementItem,
        childViewOptions: function() {
            return {
                propertygroups: this.getOption('propertygroups'),
                propertysubgroups: this.getOption('propertysubgroups'),
            }
        }
    })


    var CollectionElement = Marionette.View.extend({
        tagName: 'li',
        className: 'clearfix',
        template: _.template('<span class="label"><%=title%><br/><span class="small"><%=description%></span><a href="#" class="button add"><i class="fa fa-plus"></i> Add</a></span><div class="div rwrap"></div>'),

        regions: {
            wrap: '.rwrap',
        },

        events: {
            'click a.add': 'addModel',
        },

        addModel: function(e) {
            e.preventDefault()

            this.collection.add(new this.collection.model({

            }))

        },


        onRender: function() {
            var m = this.model.get('model')
            this.collection = m.get(this.model.get('name'))
            this.getRegion('wrap').show(new CollectionElements({ 
                collection: this.collection,
                propertygroups: this.getOption('propertygroups'),
                propertysubgroups: this.getOption('propertysubgroups'),
            }))
        }
    })


    var ConfigElementsView = Marionette.CollectionView.extend({
        tagName: 'ul',
        className: 'props',
        childView: function(m) {
            var types = {
                propertysubgroup: ConfigPropertySubGroupElement,
                propertygroup: ConfigPropertyGroupElement,
                collection: CollectionElement,
            }

            var temp = m.get('type') in types ? types[m.get('type')] 
                                              : ConfigElementView

            return temp
        },

        childViewOptions: function() {
            return {
                propertygroups: this.getOption('propertygroups'),
                propertysubgroups: this.getOption('propertysubgroups'),
            }
        }
    })
    
    var ConfigEditor = Marionette.View.extend({
        template: _.template('<p><%=description%></p><div class="rwrap"></div>'),
        regions: {
            'wrap': '.rwrap',
        },

        templateContext: function() {
            return {
                description: _.result(this.model, 'description'),
            }
        },

        initialize: function() {
            this.buildCollection()
        },

        buildCollection: function() {
            this.collection = new Backbone.Collection()
            _.each(_.result(this.model, 'parameters'), function(p,key) {
                this.collection.add(new Backbone.Model({
                    name: key,
                    type: p.type,
                    title: p.title,
                    description: p.description,
                    model: this.model,
                }))
            }, this)
            // console.log('config col', this.collection)
        },

        onRender: function() {
            this.getRegion('wrap').show(new ConfigElementsView({ 
                collection: this.collection,
                propertygroups: this.getOption('propertygroups'),
                propertysubgroups: this.getOption('propertysubgroups'),
            }))
        },
    })

        
    return Marionette.View.extend({
        className: 'content',
        template: template,

        regions: {
            rmod: '.model'
        },

        events: {
            'click a.save': 'saveModel'
        },

        saveModel: function(e) {
            e.preventDefault()

            var json = this.model.toJSON()
            var self = this
            this.model.save({
                config: json.config
            }, {
                patch: true,
                success: function() {
                    app.trigger('options:show')
                },
            })
        },

        initialize: function(options) {
            if (!this.model.get('configobj')) this.model.initConfig()
        },

        onRender:function() {
            var edit = new Editable({ model: this.model, el: this.$el })

            this.ready = []

            this.propertygroups = new PropertyGroups(null, { state: { pageSize: 9999 } })
            this.ready.push(this.propertygroups.fetch())

            this.propertysubgroups = new PropertySubgroups(null, { state: { pageSize: 9999 } })
            this.ready.push(this.propertysubgroups.fetch())

            $.when.apply($, this.ready).done(this.doOnRender.bind(this))
        },

        doOnRender: function() {
            this.getRegion('rmod').show(new ConfigEditor({ 
                model: this.model.get('configobj'),
                propertygroups: this.propertygroups,
                propertysubgroups: this.propertysubgroups,
            }))
        },
        
    })
        
})
