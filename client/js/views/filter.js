define(['backbone', 'backbone.marionette'], function(Backbone, Marionette) {
  
  var FilterItem = Backbone.Model.extend({
    isSelected: false,

    setSelected: function(selected) {
        this.set('isSelected', selected)
    }
      
  })
    
  var FilterCollection = Backbone.Collection.extend({
      model: FilterItem,
      
      initialize: function() {
          this.on('change:isSelected', this.onSelectedChanged, this);
      },
          
      onSelectedChanged: function(model) {
          this.each(function(model) {
              if (model.get('isSelected') === true && !model._changing) {
                  model.set({isSelected: false})
              }
          })
          this.trigger('selected:change')
      }
  })
    
  var FilterView = Marionette.View.extend({
    tagName: 'li',
    template: _.template("<%=name%>"),
    events: { 'click': 'select' },
      
    initialize: function(options) {
      this.model.on('change:isSelected', this.onSelectedChanged.bind(this))
    },
    
    onSelectedChanged: function() {
      this.model.get('isSelected') ? this.$el.addClass('current') : this.$el.removeClass('current')
    },
      
    onRender: function() {
      this.$el.attr('id', this.model.get('id'))
      if (this.model.get('isSelected')) this.$el.addClass('current')
    },
      
    select: function(e) {
      this.model.get('isSelected') ? this.model.set({isSelected: false}) : this.model.set({isSelected: true});
    }
  })

    
  /*
   List of filter types that can be toggled by appending a param to the
   PagableCollection behind it
   
   
  */

  return Marionette.CollectionView.extend({
    childView: FilterView,
    tagName: 'ul',
    name: 't',
    mobile: false,
    urlFragment: 'ty',
    url: true,

    filters: [
        {id: 'dc', name: 'Data Collections'},
        {id: 'gr', name: 'Grid Scans'},
        {id: 'fc', name: 'Full Collections'},
        {id: 'ap', name: 'Auto Integrated'},
        {id: 'sc', name: 'Screenings'},
        {id: 'edge', name: 'Edge Scans'},
        {id: 'mca', name: 'MCA Spectra'},
        {id: 'rb', name: 'Robot Actions'},
        {id: 'ac', name: 'Sample Actions'},
        {id: 'flag', name: 'Favourites'}
    ],
      
    initialize: function(options) {
        this.filterablecollection = options.collection
        this.collection = new FilterCollection(options.filters || this.getOption('filters'))
        if (options.value) {
            var sel = this.collection.findWhere({ id: options.value })
            if (sel) sel.setSelected(true)
        }
        this.listenTo(this.collection, 'selected:change', this._filter.bind(this))
        
        var self = this
        if (this.filterablecollection) this.filterablecollection.queryParams[this.getOption('name')] = function () {
          return self.selected();
        };
        
    },
      
    _filter: function() {
        var id = this.selected()
        this.trigger('selected:change', id, this.selectedName())
        if (this.filterablecollection) this.filterablecollection.getFirstPage({reset: true, fetch: true});
        
        if (this.getOption('url')) {
            if (this.getOption('urlFragment')) {
                var url = window.location.pathname.replace(new RegExp('\\/'+this.getOption('urlFragment')+'(\\/\\w+)?'), '')+(id ? '/'+this.getOption('urlFragment')+'/'+id : '')
            } else {
                var url = window.location.pathname.replace(/\/\w+$/, '')+(id ? '/'+id : '')
            }
            window.history.pushState({}, '', url)
        }
    },
      
    selected: function() {
      var selected = this.collection.findWhere({ isSelected: true })
      return selected ? selected.get('id') : null
    },
      
    selectedName: function() {
      var selected = this.collection.findWhere({ isSelected: true })
      return selected ? selected.get('name') : null
    },
      
      
    onRender: function() {
        if (this.getOption('mobile')) {
            var self = this
            
            var vals = '<option value="">- Filter -</option>' + this.collection.map(function(e) {
                return '<option value="'+e.get('id')+'">'+e.get('name')+'</option>'
            })
            
            $('span.search-mobile').append('<select class="filter-mobile">'+vals+'</select>')
            
            $('span.search-mobile').addClass('split')
            $('select.filter-mobile').unbind('change').bind('change', function(e) {
                var m = self.collection.findWhere({ id: $('select.filter-mobile').val() })
                if (m) m.setSelected(true)
                    
                else {
                    var s = self.collection.findWhere({ isSelected: true })
                    s.setSelected(false)
                }
            })
        }
    },
      
    onDestroy: function() {
      if (this.getOption('mobile')) {
        $('select.filter-mobile').unbind('change')
        $('span.search-mobile').removeClass('split').find('select.filter-mobile').remove()
      }
    },
      
  })
       
})