define(['backbone.marionette', 'backgrid', 'views/search', 'views/pages'], function(Marionette, Backgrid, Search, Pages) {
    
  /*
    Generic Table UI with Paginator
  */
  return Marionette.View.extend({
    template: _.template('<div class="perp"></div><div class="srch clearfix"></div><div class="table bg"></div><div class="page_wrap"></div>'),
    regions: { 'table': '.table', 'pages': '.page_wrap', search: '.srch', pp: '.perp' },
      
    pages: true,

    mobileHidden: [],
      
    initialize: function(options) {
                    
      this.collection = options.collection
      if (options.loading) {
        this.listenTo(this.collection, 'request', this.displaySpinner);
        this.listenTo(this.collection, 'sync', this.removeSpinner);
        this.listenTo(this.collection, 'error', this.removeSpinner);
      }

      if (app.mobile()) {
          _.each(this.getOption('mobileHidden'), function(v) {
              options.columns[v].renderable = false
          })
      }
                                      
      //options.collection.fetch()
      var gridopts = $.extend({}, { columns: options.columns, collection: options.collection, className: options.tableClass }, options.backgrid)
      this.grid = new Backgrid.Grid(gridopts)
        
      if (this.getOption('pages')) this.paginator = new Pages({ collection: options.collection, noUrl: options.noPageUrl })
        
      if (options.filter) this.filter = new Search({ collection: options.collection, name: options.filter, url: !options.noSearchUrl, value: options.search });
    },
                                      
    displaySpinner: function() {
      this.getRegion('table').$el.addClass('loading')
    },

    removeSpinner: function() {
      this.getRegion('table').$el.removeClass('loading')
    },
                                      
    onRender: function() {
      console.log('render')
      this.getRegion('table').show(this.grid)
      if (this.getOption('pages')) this.getRegion('pages').show(this.paginator)
      if (this.filter) this.getRegion('search').show(this.filter)
    },
    
    focusSearch: function() {
      this.$el.find('input[type=search]').focus()
    }
  })
        
})
