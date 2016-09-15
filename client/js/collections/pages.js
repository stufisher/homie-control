define(['backbone.paginator', 'models/page', 'utils/kvcollection'], function(PageableCollection, Page, KVCollection) {

    return PageableCollection.extend(_.extend({}, KVCollection, {
    	mode: 'client',
        model: Page,
        url: '/page',

        keyAttribute: 'title',
        valueAttribute: 'pageid',
        
    }))

})