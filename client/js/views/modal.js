define(['backbone.marionette'], function(Marionette) {

    var ButtonView = Marionette.View.extend({
        tagName: 'a',
        template: _.template('<span><%=label%></span>'),
        className: function() {
            return 'button '+this.model.get('label').toLowerCase()
        },

        onRender: function() {
            this.$el.prop('href', '#')
        }
    })

    var ButtonsView = Marionette.CollectionView.extend({
        childView: ButtonView,
    })

    //return DialogView = Marionette.View.extend({
    return DialogView = Marionette.View.extend({
        template: _.template('<div class="view"></div><div class="buttons"></div>'),
        
        regions: {
            rview: '.view',
            rbuttons: '.buttons',
        },

        buttons: {
            'Close': 'closeDialog',
        },
        
        events: {

        },
        
        generateButtons: function() {
            var buttons = new Backbone.Collection()
            _.each(this.getOption('buttons'), function(e,l) {
                this.events['click a.'+l.toLowerCase()] = this.getOption(e).bind(this)
                buttons.add({ label: l })
            }, this)

            this.undelegateEvents()
            this.delegateEvents()

            this.getRegion('rbuttons').show(new ButtonsView({ collection: buttons }))
        },
        
        
        setTitle: function(options) {
            app.dialog.setTitle({ title: options.title })
        },
        
        
        onRender: function() {
            if (this.getOption('view')) {
                this.getOption('view').$el.find('.no_mobile').hide()
            }

            this.setTitle({ title: this.getOption('title') })
            this.generateButtons()

        },
        
        onDomRefresh: function() {
            if (this.getOption('view')) {
                this.getRegion('rview').show(this.getOption('view'))
                this.getOption('view').triggerMethod('dom:refresh')
            }
            
            this.$el.find('.no_mobile').hide()
            console.log('fixed', this.getOption('fixed'))
            if (this.getOption('fixed')) this.$el.parent().parent().css('width', '50%')
            else this.$el.parent().parent().css('width', 'auto')
        },
        
        onDestroy: function() {
            if (this.getOption('view')) this.getOption('view').destroy()
        },
        
        closeDialog: function(e) {
            if (e) e.preventDefault()
            this.trigger('close')
            app.dialog.hideDialog()
        },
        
    });

})