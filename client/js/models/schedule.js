define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
        idAttribute: 'scheduleid',
        urlRoot: '/schedule',

        defaults: {
        	start: '01/01',
        	end: '31/12',
        	name: 'New Schedule',
            enabled: 0,
        	requiredevice: 0,
        },

        validation: {
            name: {
                required: true,
                pattern: 'alnum',
            },

            propertyid: {
                required: true,
                pattern: 'number',
            },

            start: {
                required: true,
                pattern: 'dmdate',
            },

            end: {
                required: true,
                pattern: 'dmdate',
            },
        }

    })

})