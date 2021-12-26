define(['backbone', 'models/config'], function(Backbone, Config) {
    
    return Config.extend({
        example: '{"propertygroupid":5}',
        
        description: 'Page for transport information',

        parameters: {
            propertygroupid: {
                title: 'Data Group',
                description: 'Group containing a `data` property',
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
