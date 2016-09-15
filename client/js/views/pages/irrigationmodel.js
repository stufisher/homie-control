define(['backbone', 'models/config'], function(Backbone, Config) {

    var ZoneModel = Config.extend({
        parameters: {
            propertysubgroupid: {
                title: 'Zone Subgroup',
                description: 'Containing properties of type: humidity, humidityset, switch (pump), enable, and override',
                type: 'propertysubgroup',
            },

            id: {
                title: 'Zone Order',
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

    var ZoneModels = Backbone.Collection.extend({
        model: ZoneModel,
    })

	
	return Config.extend({
        example: '{"temperatures":11,"zones":[{"propertysubgroupid":7,"id":1},{"propertysubgroupid":8,"id":2},{"propertysubgroupid":9,"id":3},{"propertysubgroupid":10,"id":4}]}',
        
        description: 'Page for irrigation control',

        parameters: {
            temperatures: {
                title: 'Temperature Subgroup',
                description: 'containing properties of type: temperature (value1, value2), and switch (low, high)',
                type: 'propertysubgroup',
            },

            zones: {
                title: 'Zones',
                description: 'collection of properties grouped into a zone',
                type: 'collection',
                collection: ZoneModels,
            }
        },

        validation: {
            temperatures: {
                require: true,
                pattern: 'number',
            },

            zones: {
                required: true,
                validCollection: true,
            }
        }
    })

})
