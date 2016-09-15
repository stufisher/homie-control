define(['backbone.marionette', 'backgrid'], function(Marionette, Backgrid) {
    

    var SelectedCell = Backgrid.Cell.extend({
        events: {
            'click': 'onClick',
        },
        
        onClick: function(e) {
            e.preventDefault()
            if (!this.model.get('new'))
                this.model.set('isSelected', true)
        },

        initialize: function(options) {
            SelectedCell.__super__.initialize.call(this,options)
            this.listenTo(this.model, 'change:isSelected', this.select, this)
        },

        select: function() {
            var i = this.$el.find('i')
            this.model.get('isSelected') ? i.addClass('fa-angle-right') : i.removeClass('fa-angle-right')
        },

        render: function() {
            this.$el.empty()

            this.$el.html('<i class="fa fa-2x"></i>')

            this.select()
            this.delegateEvents()
            return this
        }
    })


    var OptionsCell = Backgrid.Cell.extend({
        events: {
            'click a.del': 'delModel',
            'click a.save': 'saveModel',
        },

        saveModel: function(e) {
            e.preventDefault()

            var self = this
            this.model.save({}, { 
                success: function() {
                    self.model.set('new', false)
                    self.render()
                }
            })
        },

        delModel: function(e) {
            e.preventDefault()
            this.model.destroy()
        },

        render: function() {
            this.$el.empty()
            if (this.model.get('new')) {
                this.$el.html('<a href="#" class="button save"><i class="fa fa-check"></i></a> <a href="#" class="button del"><i class="fa fa-times"></i></a>')
            } else {
                this.$el.html('<a href="#" class="button del"><i class="fa fa-times"></i></a>')
            }

            this.delegateEvents()
            return this
        }
    })

    var EnableCell = Backgrid.Cell.extend({
        events: {
            'click a.enable': 'toggleEnable',
        },

        toggleEnable: function(e) {
            e.preventDefault()
            this.model.set(this._enabled, this.model.get(this._enabled) ? 0 : 1)

        },

        initialize: function(options) {
            EnableCell.__super__.initialize.call(this,options)
            this._enabled = this.column.get('enabled') ? this.column.get('enabled') : 'enabled'
            this.listenTo(this.model, 'change:'+this._enabled, this.renderEnable, this)
        },

        renderEnable: function() {
            var i = this.$el.find('a.enable')
            this.model.get(this._enabled) ? i.addClass('active') : i.removeClass('active')
        },

        render: function() {
            this.$el.empty()
            if (this.model.get('new')) {
                this.$el.html('')
            } else {
                this.$el.html('<a href="#" class="button enable"><i class="fa fa-power-off"></i></a>')
            }

            this.renderEnable()
            this.delegateEvents()
            return this
        }
    })


    var ValidatedCell = Backgrid.Cell.extend({
        fromRaw: function (value, model) {
            return value
        },

        toRaw: function(value, model) {
            var prop = this.column.get('name')
            var msg = this.model.preValidate(prop, value)
            console.log(prop, msg, model.validation[prop])

            return msg ? undefined : value
        },

        initialize: function(options) {
            ValidatedCell.__super__.initialize.call(this,options)

            this.formatter.toRaw = this.toRaw.bind(this)
            this.formatter.fromRaw = this.fromRaw.bind(this)

            _.extend(this.model, Backbone.Validation.mixin);
        }
    })

  
    return {
        ClickableRow: Backgrid.Row.extend({
            events: {
                'click': 'onClick',
            },
            
            onClick: function(e) {
                if ($(e.target).is('i') || $(e.target).is('a') || $(e.target).hasClass('editable')) return
                if (this.cookie && this.model.get('PROP')) app.cookie(this.model.get('PROP'))
                app.trigger(this.event, this.model.get(this.argument))
            },
        }),
        
        TemplateCell: Backgrid.Cell.extend({
            render: function() {
                this.$el.empty();

                if (!this.column.get('test') || (this.column.get('test') && this.model.get(this.column.get('test')))) {
                    
                    var temp = _.isFunction(this.getTemplate) ? _.result(this, 'getTemplate') : this.column.get('template')
                    var t = _.isFunction(temp) ? temp : _.template(temp)

                    var data = _.extend({}, this.model.toJSON(), { APIURL: app.apiurl })
                    this.$el.html(t(data))
                }
                
                this.delegateEvents();
                return this;
            }
        }),
        
        
        HTMLCell: Backgrid.Cell.extend({
            render: function(column) {
                this.$el.empty();
                this.$el.html(this.model.get(this.column.get('name')));
                if (!this.column.get('center')) this.$el.addClass('la')
                this.delegateEvents();
                return this;
            }
        }),

        SelectedCell: SelectedCell,
        OptionsCell: OptionsCell,
        EnableCell: EnableCell,
        ValidatedCell: ValidatedCell,

        SelectInputCell: Backgrid.SelectCell.extend({
            optionValues: function() {
                return this.column.get('options').array({ none: this.column.get('none')} )
            }
        }),

        YesNo: {
            array: function() {
                return [['Yes', '1'], ['No', '0']]
            }
        },
        
    }
    
})
    