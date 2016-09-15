define(['backbone.paginator', 'utils/kvcollection'], function(PageableCollection, KVCollection) {

    return PageableCollection.extend(_.extend({}, KVCollection, {
    	mode: 'client',
        url: '/property/type',

        keyAttribute: 'name',
        valueAttribute: 'propertytypeid',

    }))

})