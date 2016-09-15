define(['backbone.paginator', 'models/devicetrigger', 'utils/kvcollection'], function(PageableCollection, DeviceTrigger, KVCollection) {

    return PageableCollection.extend(_.extend({}, KVCollection, {
    	mode: 'client',
        model: DeviceTrigger,
        url: '/trigger/device',
    }))

})