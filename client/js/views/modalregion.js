define(['backbone.marionette'], function(Marionette) {
    
    return Marionette.Region.extend({
        el: '#modal .modalContent',

        events: {
            'click .button': 'click',
        },

        click: function(e) {
            e.preventDefault()
            console.log('clicked')
        },

        constructor: function () {
            Marionette.Region.prototype.constructor.apply(this, arguments);
            this.on("show", this.showDialog, this);
        },
        
        showDialog: function (view) {
            view.on("close", this.hideModal, this);
            this.$el.closest('#modal').addClass('active');
        },
        
        hideDialog: function () {
            this.$el.closest('#modal').removeClass('active');
        },

        setTitle: function(options) {
            this.$el.siblings('h2').html(options.title)
        },
    
        
    });

})