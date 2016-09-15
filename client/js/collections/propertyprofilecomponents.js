define(['backbone.paginator', 'models/propertyprofilecomponent'], function(PageableCollection, PropertyProfileComponent) {

    return PageableCollection.extend({
    	mode: 'client',
        model: PropertyProfileComponent,
        url: '/profile/component',
    })

})