define(['backbone', 'models/config'], function(Backbone, Config) {

	
	return Config.extend({
        example: '{"propertygroupid":"8"}',

        description: 'Page showing verious energy monitoring outputs',

        defaults: {
            propertygroupid: null
        },

        parameters: {
            propertygroupid: {
                title: 'Energy Monitor Group',
                description: 'Energy propertygroup',
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
