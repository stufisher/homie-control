define(['backbone.paginator', 'models/property', 'utils/kvcollection'], function(PageableCollection, Property, KVCollection) {

    return PageableCollection.extend(_.extend({}, KVCollection, {
        mode: 'server',
        model: Property,
        url: '/property',
        subscribe: true,

        keyAttribute: 'friendlyname',
        valueAttribute: 'propertyid',

        initialize: function(models, options) {
            if (options && 'subscribe' in options) this.subscribe = options.subscribe
        },

        _prepareModel: function (model, options) {
            options.subscribe = this.subscribe
            return Backbone.Collection.prototype._prepareModel.call(this, model, options);
        },


        parseState: function(r, q, state, options) {
            return { totalRecords: r.total }
        },

        parseRecords: function(r, options) {
            return r.data
        },
    }))

})