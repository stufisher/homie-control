define(['backbone.paginator', 'models/schedule', 'utils/kvcollection'], function(PageableCollection, Schedule, KVCollection) {

    return PageableCollection.extend(_.extend({}, KVCollection, {
    	mode: 'client',
        model: Schedule,
        url: '/schedule',

        keyAttribute: 'name',
        valueAttribute: 'scheduleid',

        initialize: function(models, options) {
        	this.on('change:isSelected', this.onSelectedChanged, this);
        },


        onSelectedChanged: function(model) {
            this.each(function(model) {
                if (model.get('isSelected') === true && !model._changing) {
                    model.set({isSelected: false}, { silent: false })
                }
            })

            this.trigger('selected:change')
        },
    }))

})