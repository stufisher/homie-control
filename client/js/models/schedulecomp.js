define(['backbone'], function(Backbone) {

	return Backbone.Model.extend({
        idAttribute: 'schedulecomponentid',
        urlRoot: '/schedule/component'
    })

})