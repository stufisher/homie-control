define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
        idAttribute: 'propertytriggerid',
        urlRoot: '/trigger/property',

        validation: {
            propertyid: {
                required: true,
                pattern: 'number',
            },

            value: {
                required: true,
                pattern: 'number',
            },

            comparator: {
                required: true,
                oneOf: ['==', '>=', '>', '<=', '<', '!=']
            },

            propertyprofileid: {
                required: false,
                pattern: 'number',
            },

            scheduleid: {
                required: false,
                pattern: 'number',
            },

            schedulestatus: {
                required: false,
                pattern: 'number',
            },

            email: {
                required: false,
                pattern: 'number'
            },

            push: {
                required: false,
                pattern: 'number'
            },

            delay: {
                required: false,
                pattern: 'number'
            },

        }

    })

})