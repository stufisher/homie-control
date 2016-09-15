define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
        idAttribute: 'propertygroupid',
        urlRoot: '/property/group',

        defaults: {
            properties: 0
        },

        validation: {
            name: {
                required: true,
                pattern: 'wwsdash',
            }
        }

    })

})