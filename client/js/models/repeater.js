define(['backbone'], function(Backbone) {
    
    return Backbone.Model.extend({
        idAttribute: 'repeatermapid',
        urlRoot: '/repeater',

        validation: {
            propertyid: {
                required: false,
                pattern: 'digits',
            },

            propertygroupid: {
                required: false,
                pattern: 'digits',
            },

            propertysubgroupid: {
                required: false,
                pattern: 'digits',
            },

            round: {
                required: false,
                pattern: 'digits',
            },
        }
    })

})