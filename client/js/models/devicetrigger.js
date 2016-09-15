define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
        idAttribute: 'devicetriggerid',
        urlRoot: '/trigger/device',

        validation: {
            deviceid: {
                required: false,
                pattern: 'number',
            },

            requiresunset: {
                required: false,
                pattern: 'number',
            },

            requirelast: {
                required: false,
                pattern: 'number',
            },

            propertyprofileid: {
                required: true,
                pattern: 'number',
            },

            connected: {
                required: true,
                pattern: 'number',
            },

        }

    })

})