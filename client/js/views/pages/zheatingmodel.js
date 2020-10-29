define(['backbone', 'models/config'], function(Backbone, Config) {

    var ZoneModel = Config.extend({
        parameters: {
            propertysubgroupid: {
                title: 'Zone Subgroup',
                description: 'Containing properties of type: temperature, temperatureset, switch (radiator), enable, and override',
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
        
        description: 'Page for zoned heating control',

        parameters: {
            controlpropertysubgroup: {
                title: 'Control Subgroup',
                description: 'containing properties of type: boiler (switch), enable, boost, scheduled, away',
                type: 'propertysubgroup',
            },

            readpropertysubgroup: {
                title: 'Reading Subgorup',
                description: 'containing properties of type: temperature',
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
            controlpropertysubgroup: {
                require: true,
                pattern: 'number',
            },

            readpropertysubgroup: {
                require: true,
                pattern: 'number'
            },

            zones: {
                required: true,
                validCollection: true,
            }
        }
    })

})
