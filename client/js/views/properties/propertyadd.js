define(['backbone.marionette', 'views/form', 
    'models/property',
    'collections/properties',
    'collections/propertytypes',
    'tpl!templates/properties/propertyadd.html'], 
    function(Marionette, TableView, Property, Properties, PropertyTypes, template) {
    
    
    return FormView.extend({
        template: template,
        
        ui: {
            type: 'select[name=propertytypeid]'
        },

        createModel: function() {
            this.model = new Property()
        },

        updateTypes: function() {
            this.ui.type.html(this.types.opts())
        },
        
        initialize: function(options) {
            this.types = new PropertyTypes()
            this.types.fetch().done(this.updateTypes.bind(this))
        },

        success: function(model, response, options) {
            console.log('success from propadd', this.model)
            app.trigger('properties:show')
        },
    })

})