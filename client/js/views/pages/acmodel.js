define(['backbone', 'models/config'], function(Backbone, Config) {
	
	return Config.extend({
        example: '{"controlpropertysubgroup":"5"}',
        
        description: 'Page to show ac set point, current temperature, enable, etc',

        parameters: {
            controlpropertysubgroup: {
                title: 'Control Subgroup',
                description: 'containing properties of type: temperature (control read), enable, speed, sleep',
                type: 'propertysubgroup',
            }
        },

        validation: {
            controlpropertysubgroup: {
                require: true,
                pattern: 'number'
            },
        }
    })

})
