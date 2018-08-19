define(['backbone', 'models/config'], function(Backbone, Config) {

	
	return Config.extend({
        example: '{"propertygroupid":"8"}',

        description: 'Page showing an airplay device',

        defaults: {
            propertygroupid: null
        },

        parameters: {
            propertygroupid: {
                title: 'Airplay Group',
                description: 'Airplay propertygroup',
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
