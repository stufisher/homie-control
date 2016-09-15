define(['backbone.paginator', 'models/propertysubgroup', 'utils/kvcollection'], function(PageableCollection, PropertySubGroup, KVCollection) {

    return PageableCollection.extend(_.extend({}, KVCollection, {
    	mode: 'client',
        model: PropertySubGroup,
        url: '/property/subgroup',

        initialize: function(models, options) {
        	this.on('change:isSelected', this.onSelectedChanged, this);
        },

        keyAttribute: 'name',
        valueAttribute: 'propertysubgroupid',

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