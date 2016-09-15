define(['backbone.paginator', 'models/propertyprofile', 'utils/kvcollection'], function(PageableCollection, PropertyProfile, KVCollection) {

    return PageableCollection.extend(_.extend({}, KVCollection, {
    	mode: 'client',
        model: PropertyProfile,
        url: '/profile',

        keyAttribute: 'name',
        valueAttribute: 'propertyprofileid',

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