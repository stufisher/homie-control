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
        example: '{"directions":[{"propertysubgroupid":7,"id":1},{"propertysubgroupid":8,"id":2}]}',
        
        description: 'Page for transport information',

        parameters: {
            directions: {
                title: 'Directions',
                description: 'collection of properties grouped into a direction',
                type: 'collection',
                collection: DirectionModels,
            }
        },

        validation: {
            directions: {
                required: true,
                validCollection: true,
            }
        }
    })

})
