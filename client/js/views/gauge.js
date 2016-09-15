define(['backbone.marionette'], function(Marionette) {


	return Marionette.View.extend({
		template: false,

		className: 'gauge',
		tagName: 'canvas',

		min: 0,
		max: 100,
		value: 20,

		events: {
			'mousemove': 'mouseMove',
			'mouseover': 'mouseOver',
			'mouseout': 'mouseOut',
			'click': 'setValue',
		},

		initialize: function(options) {
			this.hoverVal = null
		},

		onRender: function() {
			this.canvas = this.$el[0]
            this.ctx = this.canvas.getContext('2d')

			// if (this.ctx) this.draw()
			// console.log(this.$el.parent().height())
		},

		onDomRefresh: function() {
			this.canvas.height = this.$el.parent().parent().outerHeight()/2
			this.canvas.width = this.$el.parent().parent().width()

			this.draw()
		},


		draw: function(options) {
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
			var w = this.canvas.width
			var h = this.canvas.height

			// var l = 15
			var pad = 5
			var sl = this.canvas.height * 0.15
			var prec = (this.getOption('max') - this.getOption('min'))/200
			
			_.each(_.range(90), function(i) {
				var l = sl

				var angle = 180*(i/90)
				var ar = angle * Math.PI / 180
				var val = this.getValFromAngle({ angle: angle })

				this.ctx.strokeStyle = '#ccc'
				if (this.hoverVal && this.hover)
					if (val < this.hoverVal) this.ctx.strokeStyle = '#aaa'
				
				if (Math.abs(val - this.getOption('value')) < prec) {
					this.ctx.strokeStyle = 'red'
					l *= 1.3
				}

				var x = w - (w/2-pad) * Math.cos(ar) - w/2
				var y = h - (h-pad) * Math.sin(ar)
				
				var x2 = w - (w/2 - l - pad) * Math.cos(ar) - w/2
				var y2 = h - (h - l - pad) * Math.sin(ar)

				// console.log(angle, ar, x,y,x2,y2, 'w', w, 'h', h)

				this.ctx.beginPath();
				this.ctx.moveTo(x,y);
				this.ctx.lineTo(x2,y2);
				this.ctx.stroke();

			}, this)
		},

		// mouseOver: function(e) {
		// 	this.hover = true
		// },

		mouseOut: function(e) {
			this.hover = false
			this.draw()
		},

		mouseMove: function(e) {
			var v = this.getDxDyR({ x: e.offsetX, y: e.offsetY })

			var minrad = 0.8*this.canvas.height

			var last = this.hover
			this.hover = v.r > minrad
			if (last&& v.r < minrad) this.draw()

			if (v.r < minrad) return

			var val = this.getValFromDxDy(v)

			this.hoverVal = val
			this.trigger('value:hover', this.hoverVal.toFixed(1))
			this.draw()
		},

		value: function(options) {
			this.options.value = options.value
			this.draw()
		},

		setValue: function(e) {
			this.options.value = this.hoverVal
			this.draw()
			this.trigger('value:change', this.hoverVal.toFixed(1))
		},

		getValFromAngle: function(options) {
			return options.angle/180*(this.getOption('max') - this.getOption('min')) + this.getOption('min')
		},


		getValFromDxDy: function(options) {
			var ang = 180-Math.atan2(options.dy, options.dx)*(180/Math.PI)
			return this.getValFromAngle({ angle: ang })
		},

		getDxDyR: function(options) {
			var x = options.x
            var y = options.y

            var xcent = this.canvas.width/2
            var ycent = this.canvas.height

            var dy = ycent-y
            var dx = x-xcent

            var r = Math.sqrt(Math.pow(dy, 2) + Math.pow(dx, 2))

            return { dx: dx, dy: dy, r: r }
		},



	})

})