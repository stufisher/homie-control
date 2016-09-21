define(['backbone', 'backbone.marionette',
    'views/main',
    'collections/pages',
    'json!config.json',
        ],
function(Backbone, Marionette,
  MainView, Pages, config
  ) {

    var App = Marionette.Application.extend({
        region: 'body',

        onStart: function() {
            this.config = config
            console.log(config)

            this.apiurl = config.apiurl
            this.appurl = config.appurl


            this.pages = new Pages()
            this.pages.fetch()

            require(['router'], this.starthistory.bind(this))
            
            this.main = new MainView()
            this.showView(this.main)

            this.content = this.main.getRegion('content')
        },

        starthistory: function() {
            if(Backbone.history){
                Backbone.history.start({ pushState: true, root: app.appurl });
                
                if (Backbone.history && Backbone.history._hasPushState) {
                    var $document = $(window.document);
                    var openLinkInTab = false;
                    
                    var is_relative_to_page = function(href) {
                        return href.match(/^\/|(http:|https:|ftp:|mailto:|javascript:)/) === null;
                    };
                    
                    var is_routable = function(href) {
                        console.log('routable', href.indexOf('/'))
                        return href.indexOf("#") === -1 && (is_relative_to_page(href) || href.indexOf(Backbone.history.root) > -1 || href.indexOf('/') == 0) && (href.indexOf(app.apiurl) != 0);
                    };
                    
                    $document.keydown(function(e) {
                        if (e.ctrlKey || e.keyCode === 91) {
                            openLinkInTab = true;
                        }
                    });
                    
                    $document.keyup(function(e) {
                        openLinkInTab = false;
                    });
                    
                    $document.on("click", "a", function(e) {
                        var href =  $(this).attr("href");
                        if (!href) return
                        if (is_routable(href)) {
                            e.preventDefault();
                            Backbone.history.navigate(href, true);
                        } 
                    });
                }
            }
        },


        title: function(options) {
            $('title').html('Homie Control - '+options.title)
            this.main.title(options)
        },

        navigate: function(route,  options){
            options || (options = {});
            Backbone.history.navigate(route, options);
        },

        alert: function(options) {
            this.main.alert(options)
        },
        
        
        message: function(options) {
            this.main.message(options)
        },

        mobile: function() {
          return $(window).width() <= 600
        }
    })

    window.app = new App()
    console.log('app', app)


    // Single Event for window scrolling
    $(window).scroll(_.debounce(function() {
        app.trigger('window:scroll')
    }, 10))

    // Allow us to set a global base url for the API
    var oldSync = Backbone.sync;
    Backbone.sync = function(method, model, options) {
        var url = _.isFunction(model.url) ? model.url() : model.url;

        if (url) {
            options = options || {};
            options.url = app.apiurl+url
        }
        
        return oldSync.call(this, method, model, options);
    }



    return app
  
})
