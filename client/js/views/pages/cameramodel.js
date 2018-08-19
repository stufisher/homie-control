define(['backbone', 'models/config'], function(Backbone, Config) {

	
	return Config.extend({
        example: '{"propertygroupid":"8"}',

        description: 'Page showing a picamera',

        defaults: {
            propertygroupid: null
        },

        parameters: {
            propertygroupid: {
                title: 'Camera Group',
                description: 'Camera propertygroup',
                type: 'propertygroup',
            },
        },

        validation: {
            propertygroupid: {
                require: true,
                pattern: 'number'
            },
        }
    })

})
