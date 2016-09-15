define(['backbone.marionette',
	], function(Marionette) {

	return Marionette.View.extend({
        className: 'console',
		template: _.template('<pre></pre>'),

        ui: {
            c: 'pre'
        },

        parseMQTT: function(topic, payload) {
            var now = new Date()

            // fuck you javascript
            var h = now.getHours()
            var m = now.getMinutes()
            var s = now.getSeconds()
            var ts = (h < 10 ? '0'+h : h) + ':' + (m < 10 ? '0'+m : m) + ':' + (s < 10 ? '0'+s : s)

            this.ui.c.append(ts+': '+topic+'\t'+payload+'\n')
            this.ui.c.animate({ scrollTop: this.ui.c.prop('scrollHeight')}, 500)
        },

        initialize: function(options) {
            this.listenTo(app, 'mqtt:message', this.parseMQTT, this)
        },

        onDomRefresh: function() {
            this.ui.c.height($(window).height()-110)
        }

	})

})