define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
        // idAttribute: 'optionid',
        urlRoot: '/option',

        validation: {
            latitude: {
                required: true,
                pattern: 'number',
            },

            longitude: {
                required: true,
                pattern: 'number',
            },

            timezone: {
                required: true,
                // pattern: 'wwsdash',  
            },

            heating_reading_property: {
                required: false,
                pattern: 'number',
            },

            heating_control_property: {
                required: false,
                pattern: 'number',
            },

            profile_exec_property: {
                required: false,
                pattern: 'number',
            },

            trigger_email_to: {
                required: false,
                pattern: 'email'
            },

            scan_interface: {
                required: false,
                pattern: 'word',
            },

            archiver_source_property: {
                required: false,
                pattern: 'number',
            },

            archiver_root: {
                required: false,
            },
        }

    })

})
