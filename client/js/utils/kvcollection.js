define(['backbone'], function(Backbone) {
    
    return {
        opts: function(options) {
            return this.map(function(m) { return '<option value="'+m.get(this.valueAttribute)+'">'+m.get(this.keyAttribute)+'</option>' }, this)
        },

        kv: function() {
            var kv = {}
            this.each(function(m) {
                kv[m.get(this.valueAttribute)] = m.get(this.keyAttribute)
            }, this)
            return kv
        },

        array: function(options) {
            var arr = []
            if (options.none) arr.push(['-', ''])

            this.each(function(m) {
                arr.push([m.get(this.keyAttribute), m.get(this.valueAttribute)])
            }, this)

            return arr
        }
    }

})