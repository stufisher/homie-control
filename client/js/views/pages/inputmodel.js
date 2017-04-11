define(['backbone', 'models/config'], function(Backbone, Config) {

	
	return Config.extend({
        example: '{"propertygroupid":"8"}',

        description: 'Page showing an audio input selector',

        defaults: {
            propertygroupid: null
        },

        parameters: {
            propertygroupid: {
                title: 'Input Selector Group',
                description: 'Selector propertygroup',
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
