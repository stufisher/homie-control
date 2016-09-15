define(['backbone.paginator', 'models/device', 'utils/kvcollection'], function(PageableCollection, Device, KVCollection) {

    return PageableCollection.extend(_.extend({}, KVCollection, {
    	mode: 'client',
        model: Device,
        url: '/device',

        keyAttribute: 'name',
        valueAttribute: 'deviceid',
    }))

})