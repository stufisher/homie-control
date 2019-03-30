define(['backbone.marionette', 'moment',
    'tpl!templates/pages/console.html'
	], function(Marionette, moment, template) {

	return Marionette.View.extend({
        className: 'console',
		template: template,

        ui: {
            c: 'pre',
            title: '.title',
            topic: 'input[name=topic]',
            msg: 'input[name=message]',
            ret: 'input[name=retained]',
        },

        events: {
            'click button[name=send]': 'sendMQTT',
        },


        sendMQTT: function(e) {
            if (e) e.preventDefault()

            var message = new Paho.MQTT.Message(this.ui.msg.val())
            message.destinationName = this.ui.topic.val()
            if (this.ui.ret.is(':checked')) message.set_retained(true)

            app.mqtt.send(message)
        },

        parseMQTT: function(topic, payload) {
            if (this.getOption('subscription')) {
                if (!topic.startsWith(this.getOption('subscription'))) return
            }

            this.ui.c.append('<p>'+moment().format('HH:mm:ss')+': '+topic+'\t'+payload+'</p>')

            var self = this
            clearTimeout(this.timeout)
            setTimeout(function() {
                self.timeout = self.ui.c.animate({ scrollTop: self.ui.c.prop('scrollHeight')}, 500)
            }, 500)
        },

        initialize: function(options) {
            this.timeout = null
            this.listenTo(app, 'mqtt:message', this.parseMQTT, this)

            if (options && options.subscription) {
                if (app.mqtt.isConnected()) {
                    app.mqtt.subscribe(options.subscription+'/#')
                }
            }
        },

        onRender: function() {
            if (this.getOption('subscription')) {
                this.ui.title.text('Subscription: '+this.getOption('subscription'))
                this.ui.topic.val(this.getOption('subscription'))
            }
        },

        onDomRefresh: function() {
            this.ui.c.height($(window).height()-135)
        }

	})

})