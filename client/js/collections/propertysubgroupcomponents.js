define(['backbone.paginator', 'models/propertysubgroupcomponent'], function(PageableCollection, PropertySubGroupComponent) {

    return PageableCollection.extend({
    	mode: 'client',
        model: PropertySubGroupComponent,
        url: '/property/subgroup/component',
    })

})