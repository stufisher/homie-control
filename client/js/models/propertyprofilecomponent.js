define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
        idAttribute: 'propertyprofilecomponentid',
        urlRoot: '/profile/component',

        validation: {
        	propertyprofileid: {
        		required: true,
        		pattern: 'number',
        	},

        	propertyid: {
        		required: true,
        		pattern: 'number',
        	},

        	value: {
        		required: true,
        		pattern: 'number',
        	}
        }
    })

})