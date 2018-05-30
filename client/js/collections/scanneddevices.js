define(['backbone.paginator', 'models/scanneddevice', 'utils/kvcollection'], function(PageableCollection, ScannedDevice, KVCollection) {

    return PageableCollection.extend(_.extend({}, KVCollection, {
    	mode: 'client',
        model: ScannedDevice,
        url: '/admin/device/scan',

        keyAttribute: 'ssid',
        valueAttribute: 'ssid',
    }))

})