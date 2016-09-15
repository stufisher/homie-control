define(['backbone.paginator', 'models/propertygroupcomponent'], function(PageableCollection, PropertyGroupComponent) {

    return PageableCollection.extend({
    	mode: 'client',

    	state: {
    		pageSize: 15
    	},
    	
        model: PropertyGroupComponent,
        url: '/property/group/component',
    })

})