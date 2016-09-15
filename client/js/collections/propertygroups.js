define(['backbone.paginator', 'models/propertygroup', 'utils/kvcollection'], function(PageableCollection, PropertyGroup, KVCollection) {

    return PageableCollection.extend(_.extend({}, KVCollection, {
    	mode: 'client',
        model: PropertyGroup,
        url: '/property/group',

        keyAttribute: 'name',
        valueAttribute: 'propertygroupid',

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