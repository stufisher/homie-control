define(['backbone'], function(Backbone) {
	
	return Backbone.Model.extend({
		// force post on save
		idAttribute: 'n/a',

		poll: false,
		frequency: 60000,

		url: function() {
			return '/'+this.get('location')+'/'+this.get('param')+'/'+this.get('id')
		},

		initialize: function(attrs, options) {
			this.refreshThread = null
			this.on('sync', this.scheduleRefresh, this)

		},


		scheduleRefresh: function() {
			if (!this.get('poll')) return

			clearTimeout(this.refreshThread)
			this.refreshThread = setTimeout(this.fetch.bind(this), this.get('frequency'))
		},

		stop: function() {
			clearTimeout(this.refreshThread)
		},

	})

})