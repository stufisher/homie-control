define(['backbone', 'models/config'], function(Backbone, Config) {

    return Config.extend({
        example: '{"properties": 21, "weather": 45, "directions":[{"propertysubgroupid":7,"id":1},{"propertysubgroupid":8,"id":2}]}',
        
        description: 'Dashboard',

        parameters: {
            properties: {
                title: 'Properties',
                description: 'Collection of properties to use on dashboard',
                type: 'propertygroup',
            },

            weather: {
                title: 'Daily Weather',
                description: 'Collection of properties to for weather forecast',
                type: 'propertysubgroup',
            },

            transport: {
                title: 'Transport Data',
                description: 'Group containing `data` transport property',
                type: 'propertygroup',
            },

            calendar: {
                title: 'Calendar Group',
                description: 'Group containing calendar binary property',
                type: 'propertygroup',
            },
        },

        validation: {
            properties: {
                require: true,
                pattern: 'number'
            },

            weather: {
                require: true,
                pattern: 'number'
            },

            transport: {
                required: true,
                pattern: 'number'
            },

            calendar: {
                require: true,
                pattern: 'number'
            },
        }
    })

})
