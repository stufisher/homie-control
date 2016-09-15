define(['backbone.paginator', 'models/suntrigger', 'utils/kvcollection'], function(PageableCollection, SunTrigger, KVCollection) {

    return PageableCollection.extend(_.extend({}, KVCollection, {
    	mode: 'client',
        model: SunTrigger,
        url: '/trigger/sun',
    }))

})