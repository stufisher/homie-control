define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
        idAttribute: 'propertysubgroupcomponentid',
        urlRoot: '/property/subgroup/component',

        validation: {
            propertyid: {
                required: true,
                pattern: 'number',
            },
            
            propertysubgroupid: {
                required: true,
                pattern: 'number',
            },
        }

    })

})