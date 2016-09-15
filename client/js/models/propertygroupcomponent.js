define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
        idAttribute: 'propertygroupcomponentid',
        urlRoot: '/property/group/component',

        validation: {
            propertyid: {
                required: true,
                pattern: 'number',
            },
            
            propertygroupid: {
                required: true,
                pattern: 'number',
            },
        }

    })

})