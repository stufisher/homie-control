define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
        idAttribute: 'ssid',
        urlRoot: '/admin/device/scan',

        validation: {
            name: {
                required: true,
                pattern: 'wwsdash',
            },

        }

    })

})