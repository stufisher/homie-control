define(['models/config'], function(Config) {
    
    return Config.extend({
        example: '{"calendar":12}',
        
        description: 'Page for calendar view',

        parameters: {
            calendar: {
                title: 'Calendar',
                description: 'Property group container binary property with calendar information',
                type: 'propertygroup',
            },
        },

        validation: {
            current: {
                require: true,
                pattern: 'number',
            },
        }
    })

})
