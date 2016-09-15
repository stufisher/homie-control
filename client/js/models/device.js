define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
        idAttribute: 'deviceid',
        urlRoot: '/device',

        validation: {
            name: {
                required: true,
                pattern: 'wwsdash',
            },

            macaddress: {
                required: true,
                pattern: 'macaddress',  
            },
        }

    })

})