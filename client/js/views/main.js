define(['backbone.marionette',
	'paho-mqtt-js',
	'utils',
	'tpl!templates/main.html'], 
	function (Marionette, MQTT, utils, template) {
	

	// Pages
	var PageView = Marionette.View.extend({
		tagName: 'li',
		template: _.template('<a href="/pages/<%=slug%>"><%=title%></a>'),

		modelEvents: {
		  	'change:isSelected': 'select',
		},

		select: function() {
		  	console.log('select')
		  	this.$el.addClass('active')
		}
	})

	var PagesView = Marionette.CollectionView.extend({
		tagName: 'ul',
		childView: PageView,
		collectionEvents: {
	  		'change': 'render'
		}
	})


	return Marionette.View.extend({
		template: template,
		regions: {
			content: '.main',
      		rpages: '.pages',
		},

		events: {
			'click a.menu': 'toggleMenu',
			'click ul a': 'removeActive',
		},


		toggleMenu: function(e) {
			e.preventDefault()
			$('body').toggleClass('active')
		},

		removeActive: function() {
			$('body').removeClass('active')
		},


		initialize: function(options) {
		    app.mqtt = new Paho.MQTT.Client(app.config.mqtt.host,'WebClient'+(new Date()).getTime())
  			app.mqtt.onMessageArrived = this.mqttOnMessage.bind(this)
      		app.mqtt.onConnectionLost = this.mqttOnDisconnect.bind(this)
      		this.mqttConnect({ username: app.config.mqtt.username, password: app.config.mqtt.password})
		},

		onRender: function() {
			this.getRegion('rpages').show(new PagesView({ collection: app.pages }))
		},


		// Region Wrappers
		title: function(options) {
			this.$el.find('header h1').text(options.title)
		},

		alert: function(options) {
			if (options && options.persist) {
                this.getRegion('content').$el.find('.content .'+options.persist).remove()
            }
              
            this.getRegion('content').$el.find('.content').prepend(new utils.alert(options).render().$el)
		},

		message: function(options) {
			this.getRegion('content').show(new utils.generic_msg(options))
		},




		// MQTT
		mqttOnConnect: function() {
		  	console.log('Connected to broker')
		},

		mqttOnMessage: function(message) {
		  	app.trigger('mqtt:message', message.destinationName, message.payloadString)
		},

		mqttOnDisconnect: function() {
		  	console.log('Disconnected from broken, retry in 2s')
		  	setTimeout(this.mqttConnect.bind(this), 2000)
		},

		mqttConnect: function() {
		  	app.mqtt.connect({ onSuccess: this.mqttOnConnect.bind(this) })
		},

	})

})
