define(['backbone', 'models/config'], function(Backbone, Config) {

    var ZoneModel = Config.extend({
        parameters: {
            propertysubgroupid: {
                title: 'Device Subgroup',
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
        example: '{"propertygroupid":"8"}',

        description: 'Page showing a sonos system',

        defaults: {
            propertygroupid: null
        },

        parameters: {
            controlsgroupid: {
                title: 'Sonos Controls Subgroup',
                description: 'Sonos propertysubgroup',
                type: 'propertysubgroup',
            },

            zonesgroupid: {
                title: 'Sonos Zones Subgroup',
                description: 'Sonos propertysubgroup',
                type: 'propertysubgroup',
            },

            volumesgroupid: {
                title: 'Sonos Volumes Subgroup',
                description: 'Sonos propertysubgroup',
                type: 'propertysubgroup',
            },

            zones: {
                title: 'Sonos Devices',
                description: 'Collection of properties grouped into a device',
                type: 'collection',
                collection: ZoneModels,
            }
        },

        validation: {
            controlsgroupid: {
                require: true,
                pattern: 'number'
            },
            
            zonesgroupid: {
                require: true,
                pattern: 'number'
            },

            volumesgroupid: {
                require: true,
                pattern: 'number'
            },
        }
    })

})
