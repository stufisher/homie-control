define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
        idAttribute: 'propertysubgroupid',
        urlRoot: '/property/subgroup',

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