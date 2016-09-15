define(['backbone', 'models/config'], function(Backbone, Config) {
	
	return Config.extend({
        example: '{"readpropertysubgroup":"4","controlpropertysubgroup":"5"}',
        
        description: 'Page to show heating set point, current temperature, enable, override, as well as a group of other temperature sensors',

        parameters: {
            readpropertysubgroup: {
                title: 'Reading Subgorup',
                description: 'containing properties of type: temperature',
                type: 'propertysubgroup',
            },

            controlpropertysubgroup: {
                title: 'Control Subgroup',
                description: 'containing properties of type: temperature (control read), switch (boiler), enable, override, and motion',
                type: 'propertysubgroup',
            }
        },

        validation: {
            readpropertysubgroup: {
                require: true,
                pattern: 'number'
            },

            controlpropertysubgroup: {
                require: true,
                pattern: 'number'
            },
        }
    })

})
