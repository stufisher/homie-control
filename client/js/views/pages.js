define(['backbone.marionette', 'backgrid', 'backgrid-paginator'], function(Marionette, Backgrid) {

    return Marionette.View.extend({
        template: _.template('<div class="per_page"><select name="pp"></select></div>'),
        events: {
            'change select': 'changePageSize',
        },
        
        ui: {
            pp: 'select[name=pp]',
        },
        
        initialize: function(options) {
            this.paginator = new Backgrid.Extension.Paginator({ className: 'pages pp', collection: options.collection, url: !options.noUrl })
        },
        
        pages: [5,15,25,50,100,500],
        
        onRender: function() {
            var current = this.getOption('collection').state.pageSize
            
            
            this.ui.pp.html(_.map(this.getOption('pages'), function(p) { return '<option value="'+p+'">'+p+'</option>' }).join('')).val(current)
            
            this.$el.append(this.paginator.render().$el)
        },
        
        changePageSize: function() {
            console.log(this.$el.find('select').val())
            this.getOption('collection').setPageSize(parseInt(this.ui.pp.val()))
        }
        
    })

})