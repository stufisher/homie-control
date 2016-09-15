define(['backbone', 'backbone.validation'], function(Backbone) {

    _.extend(Backbone.Validation.patterns, {
        wwsdash: /^(\w|\s|\-)+$/,
        wwsbdash: /^(\w|\s|\-|\(|\))+$/,
        wwdash: /^(\w|\-)+$/,
        datetime: /^\d\d-\d\d-\d\d\d\d \d\d:\d\d$/,
        edate: /^\d\d-\d\d-\d\d\d\d$/,
        word: /^\w+$/,
        macaddress: /^\w\w\:\w\w\:\w\w\:\w\w\:\w\w\:\w\w$/,
        property: /^([A-z0-9]|\$)+$/,
        alnum: /^([A-z0-9])+$/,
        dmdate: /^\d\d\/\d\d$/,
    });
    
    _.extend(Backbone.Validation.messages, {
        required: 'This field is required',
        wwsdash: 'This field must contain only letters, numbers, spaces, underscores, and dashes',
        wwdash: 'This field must contain only letters, numbers, underscores, and dashes',
        datetime: 'Please specify a valid date and time',
        edate: 'Please specify a valid date (european style)',
        word: 'This field must contain only letters and numbers',
        macaddress: 'This field must be of the form of a mac address',
        property: 'This field may only contain alpha numeric characters and $',
        alnum: 'This field may only contain alpha numeric characters',
        dmdate: 'This field must be of the format dd/mm',
    });

    _.extend(Backbone.Validation.validators, {
        validModel: function (value, attr, customValue, model) {
            if (value && !value.isValid(true)) {
                return 'Invalid ' + attr;
            }
        },
        validCollection: function (value, attr, customValue, model) {
            var errors = value.map(function (entry) {
                return entry.isValid(true);
            });
            if (_.indexOf(errors, false) !== -1) {
                return 'Invalid collection of ' + attr;
            }
        }
    })

})

