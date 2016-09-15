define(['backbone.paginator', 'models/propertytrigger', 'utils/kvcollection'], function(PageableCollection, PropertyTrigger, KVCollection) {

    return PageableCollection.extend(_.extend({}, KVCollection, {
    	mode: 'client',
        model: PropertyTrigger,
        url: '/trigger/property',
    }))

})