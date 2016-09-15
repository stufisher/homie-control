define(['backbone'], function(Backbone){

	return Backbone.Model.extend({

		initialize: function(attrs, options) {
			_.each(_.result(this, 'parameters'), function(p, key) {
				if (p.type =='collection') {
					this.set(key, new p.collection(this.get(key)))
				}
			}, this)
		},

		toJSON: function() {
		  	var json = _.clone(this.attributes);
		  	for(var attr in json) {
		    	if((json[attr] instanceof Backbone.Model) || (json[attr] instanceof Backbone.Collection)) {
		      		json[attr] = json[attr].toJSON();   
		    	}
		  	}
		  	return json;
		}

	})
	
})
