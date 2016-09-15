define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
        idAttribute: 'propertyprofileid',
        urlRoot: '/profile',

        defaults: {
            components: 0
        },

        validation: {
        	name: {
        		required: true,
        		pattern: 'wwsdash',
        	},

        	propertygroupid: {
        		required: true,
        		pattern: 'number',
        	},

            propertysubgroupid: {
                required: false,
                pattern: 'number',
            },
        }
    })

})