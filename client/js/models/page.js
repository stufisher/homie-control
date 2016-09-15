define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
        idAttribute: 'pageid',
        urlRoot: '/page',

        defaults: {
            pageid: null,
            title: '',
            slug: '',
            config: null,
            display_order: 0,
        },

        initialize: function() {
            if (this.get('config') && !this.get('configobj')) this.initConfig()
        },

        initConfig: function() {
            var self = this
            require(['views/pages/'+this.get('template')+'model'], function(ConfigModel) {
                self.set('configobj', new ConfigModel(JSON.parse(self.get('config'))))
                // console.log('init mod', self.get('configobj'))
            })
        },

        toJSON: function() {
            var json = _.clone(this.attributes);
            for(var attr in json) {
                if((json[attr] instanceof Backbone.Model) || (json[attr] instanceof Backbone.Collection)) {
                    json[attr] = json[attr].toJSON();
                }
            }

            json['config'] = JSON.stringify(json['configobj'])

            return json;
        },

        validation: {
            title: {
                required: true,
                pattern: 'wwsdash'
            },

            slug: {
                required: true,
                pattern: 'alnum'
            },

            template: {
                required: true,
                pattern: 'alnum'
            },

            display_order: {
                required: false,
                pattern: 'number'
            },

            // config: {
            //     required: true,
            //     validModel: true,
            // }
        }

    })

})