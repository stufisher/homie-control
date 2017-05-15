define(['backbone.paginator', 'models/repeater', 'utils/kvcollection'], function(PageableCollection, Repeater, KVCollection) {

    return PageableCollection.extend(_.extend({}, KVCollection, {
        mode: 'server',
        model: Repeater,
        url: '/repeater',

        keyAttribute: 'repeateradddress',
        valueAttribute: 'repeaterpropertyid',

        parseState: function(r, q, state, options) {
            return { totalRecords: r.total }
        },

        parseRecords: function(r, options) {
            return r.data
        },
    }))

})