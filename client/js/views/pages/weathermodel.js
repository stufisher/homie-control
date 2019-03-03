define(['backbone', 'models/config'], function(Backbone, Config) {
	
	return Config.extend({
        example: '{"temperatures":11,"zones":[{"propertysubgroupid":7,"id":1},{"propertysubgroupid":8,"id":2},{"propertysubgroupid":9,"id":3},{"propertysubgroupid":10,"id":4}]}',
        
        description: 'Page for weather forecast',

        parameters: {
            current: {
                title: 'Current Weather Conditions',
                description: 'Containing properties for current conditions',
                type: 'propertysubgroup',
            },

            daily: {
                title: 'Daily Weather Conditions',
                description: 'Containing properties for daily conditions',
                type: 'propertysubgroup',
            },

            hourly: {
                title: 'Hourly Weather Conditions',
                description: 'Containing properties for hourly conditions',
                type: 'propertysubgroup',
            },

            astronomy: {
                title: 'Astronomy Subgroup',
                description: 'Containing astronomy related properties (sunset, rise, moonphase)',
                type: 'propertysubgroup',
            },
        },

        validation: {
            current: {
                require: true,
                pattern: 'number',
            },
            
            daily: {
                require: true,
                pattern: 'number',
            },

            hourly: {
                require: true,
                pattern: 'number',
            },

            astronomy: {
                require: true,
                pattern: 'number',
            },

            days: {
                required: true,
                validCollection: true,
            }
        }
    })

})
