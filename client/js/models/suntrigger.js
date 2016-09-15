define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
        idAttribute: 'suntriggerid',
        urlRoot: '/trigger/sun',

        validation: {
            sunset: {
                required: true,
                pattern: 'number',
            },

            requiredevice: {
                required: true,
                pattern: 'number',
            },

            propertyprofileid: {
                required: true,
                pattern: 'number',
            },

        }

    })

})