define(['backbone'], function(Backbone) {

  var Search = Backbone.View.extend({
    /** @property */
    tagName: 'div',

    /** @property */
    className: 'search hide',

    /** @property {function(Object, ?Object=): string} template */
    template: function (data) {
      return '<input type="search" ' + (data.placeholder ? 'placeholder="' + data.placeholder + '"' : '') + ' name="' + data.name + '" ' + (data.value ? 'value="' + data.value + '"' : '') + '/>'
    },

    /** @property */
    events: {
      "keyup input[type=search]": "search",
      "click a[data-backgrid-action=clear]": "clear",
      "submit": "search"
    },

    /** @property {string} [name='q'] Query key */
    name: "s",

    /** @property {string} [value] The search box value.  */
    value: null,

    /**
       @property {string} [placeholder] The HTML5 placeholder to appear beneath
       the search box.
    */
    placeholder: 'Search',

    url: true,
    urlFragment: 's',
      
    /**
       @param {Object} options
       @param {Backbone.Collection} options.collection
       @param {string} [options.name]
       @param {string} [options.value]
       @param {string} [options.placeholder]
       @param {function(Object): string} [options.template]
    */
    initialize: function (options) {
      Search.__super__.initialize.apply(this, arguments);
      this.name = options.name || this.name;
      this.value = options.value || this.value;
      this.placeholder = options.placeholder || this.placeholder
      this.template = options.template || this.template;
        
      //this.url = options.url || this.url
      if (options.url == false) this.url = false
      this.urlFragment = options.urlFragment || this.urlFragment

      // Persist the query on pagination
      var collection = this.collection, self = this;
      if (Backbone.PageableCollection &&
          collection instanceof Backbone.PageableCollection &&
          collection.mode == "server") {
        collection.queryParams[this.name] = function () {
          return self.searchBox().val() || null;
        };
      }
      this.search = _.debounce(this.search, 400)
    },

    /**
       Event handler. Clear the search box and reset the internal search value.
     */
    clearSearchBox: function() {
      this.value = null;
      this.searchBox().val(null);
      this.showClearButtonMaybe();
    },

    /**
       Event handler. Show the clear button when the search box has text, hide
       it otherwise.
     */
    showClearButtonMaybe: function () {
      var $clearButton = this.clearButton();
      var searchTerms = this.searchBox().val();
      if (searchTerms) $clearButton.show();
      else $clearButton.hide();
    },

    /**
       Returns the search input box.
     */
    searchBox: function () {
      return this.$el.find("input[type=search]");
    },

    /**
       Returns the clear button.
     */
    clearButton: function () {
      return this.$el.find("a[data-backgrid-action=clear]");
    },


    /**
       Returns the current search query.
     */
    query: function() {
      this.value = this.searchBox().val();
      return this.value;
    },

    /**
       Upon search form submission, this event handler constructs a query
       parameter object and pass it to Collection#fetch for server-side
       filtering.

       If the collection is a PageableCollection, searching will go back to the
       first page.
    */
    search: function (e) {
      if (e) e.preventDefault();

      var data = {};
      var query = this.query();
      if (query) data[this.name] = query;

      var collection = this.collection;

      // go back to the first page on search
      if (Backbone.PageableCollection &&
          collection instanceof Backbone.PageableCollection) {
        collection.getFirstPage({data: data, reset: true, fetch: true});
      }
      else collection.fetch({data: data, reset: true});
        if (this.url) {
            if (this.urlFragment) {
                var url = window.location.pathname.replace(new RegExp('\\/'+this.urlFragment+'\\/(\\w|-)+'), '')+(this.value ? '/'+this.urlFragment+'/'+this.value : '')
            } else {
                var url = window.location.pathname.replace(/\/\w+$/, '')+(this.value ? '/'+this.value : '')
            }
            window.history.pushState({}, '', url)
        }
    },

    /**
       Event handler for the clear button. Clears the search box and refetch the
       collection.

       If the collection is a PageableCollection, clearing will go back to the
       first page.
    */
    clear: function (e) {
      if (e) e.preventDefault();
      this.clearSearchBox();

      var collection = this.collection;

      // go back to the first page on clear
      if (Backbone.PageableCollection &&
          collection instanceof Backbone.PageableCollection) {
        collection.getFirstPage({reset: true, fetch: true});
      }
      else collection.fetch({reset: true});
    },
    

    /**
       Renders a search form with a text box, optionally with a placeholder and
       a preset value if supplied during initialization.
    */
    render: function () {
      $('input.search-mobile').focus().keyup(function() {
        $('input[type=search]').val($(this).val()).trigger('keyup')
      }).parent('span').addClass('enable')
      $('#sidebar,.cont_wrap').addClass('searchbox')
        
      this.$el.empty().append(this.template({
        name: this.name,
        placeholder: this.placeholder,
        value: this.value
      }));
      this.showClearButtonMaybe();
      this.delegateEvents();
      return this;
    },
      
    destroy: function() {
      $('input.search-mobile').unbind('keyup').parent('span').removeClass('enable')
      $('#sidebar,.cont_wrap').removeClass('searchbox')
    },
      
      
  });
       
  return Search
})
