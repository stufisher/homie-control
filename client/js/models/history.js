define(['backbone.paginator'], function(PageableCollection) {
	
	return PageableCollection.extend({
		mode: 'client',
		poll: false,
		frequency: 60000,

		url: '/history',

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
