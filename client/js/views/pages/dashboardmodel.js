define(['backbone', 'models/config'], function(Backbone, Config) {

    var DirectionModel = Config.extend({
        parameters: {
            propertysubgroupid: {
                title: 'Direction Subgroup',
                description: 'Containing properties of type: humidity, humidityset, switch (pump), enable, and override',
                type: 'propertysubgroup',
            },

            id: {
                title: 'Direction Order',
                description: '',
                type: 'input',
            }
        },

        validation: {
            propertysubgroupid: {
                require: true,
                pattern: 'number'
            },

            id: {
                require: true,
                pattern: 'number'
            },
        }
    })

    var DirectionModels = Backbone.Collection.extend({
        model: DirectionModel,
    })

    
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

            directions: {
                title: 'Transport Directions',
                description: 'Collection of properties grouped into a direction',
                type: 'collection',
                collection: DirectionModels,
            }
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

            directions: {
                required: true,
                validCollection: true,
            }
        }
    })

})
