define(['backbone', 'models/config'], function(Backbone, Config) {

	
	return Config.extend({
        example: '{"propertygroupid":"8"}',

        description: 'Page showing multiple switches grouped by subgroup, if the subgroup has profiles these will be displayed too',

        defaults: {
            propertygroupid: null
        },

        parameters: {
            propertygroupid: {
                title: 'Switches Group',
                description: 'Switch propertygroup',
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
