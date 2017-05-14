define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
        idAttribute: 'propertyid',
        urlRoot: '/property',

        initialize: function(attrs, options) {
            this._subscribe = true
            if (options && 'subscribe' in options) this._subscribe = options.subscribe

            this.on('sync change:address', this.maybeSubscribe, this)
            this.listenTo(app, 'mqtt:message', this.updateValue, this)
            this.maybeSubscribe()
        },

        maybeSubscribe: function() {
            if (this._subscribe) {
                this.subscribe()
                this.listenTo(app, 'mqtt:connect', this.subscribe, this)
            }
        },

        updateValue: function(topic, payload) {
            // console.log('mqtt in model', topic, payload, topic == this.get('address'))
            if (topic == this.get('address')) {
                this.set('value', isNaN(payload) ? payload : parseFloat(payload))
            } 

        },

        subscribe: function() {
            if (app.mqtt.isConnected()) {
                // if (this.get('address') && this.get('propertyid')) {
                if (this.get('address')) {
                    app.mqtt.subscribe(this.get('address'))
                    console.log('subscribing to:', this.get('address'))
                }
            } else {
                setTimeout(this.subscribe.bind(this), 2000)
            }
        },

        onDestroy: function() {
            console.log('destroy')
            if (this.get('address') && this.get('propertyid')) {
                app.mqtt.unsubscribe(this.get('address'))
            }
        },

        validation: {
            devicestring: {
                required: true,
                pattern: 'alnum'
            },

            nodestring: {
                required: true,
                pattern: 'property'
            },

            propertystring: {
                required: false,
                pattern: 'property'
            },

            propertytypeid: {
                required: false,
                pattern: 'number'
            },

            friendlyname: {
                required: true,
                pattern: 'wwsdash'
            },

        }

    })

})