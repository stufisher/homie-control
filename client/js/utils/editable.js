define(['backbone.marionette','jquery', 
    'jquery-editable',
    // 'jquery-ui', 'jquery.editable.datepicker', 'jquery-ui.timepicker'
    ], 
    function(Marionette, $) {
    
    
    // Autocomplete
    // $.editable.addInputType('autocomplete', {               
    //   element: function(settings, original) {
    //     $(this).append('<input type="text"/>');
    //     var hidden = $('<input id="prac" type="hidden"/>');
    //     $(this).append(hidden);
    //     return(hidden);
    //   },
                          
    //   plugin : function(settings, original) {
    //     var set = $.extend({ select: function(e,ui) { $('#prac').val(ui.item.id) } }, settings.autocomplete)
    //     $('input[type=text]', this).autocomplete(set);
    //   },
                          
    //   submit: function(settings, original) {
    //     if (!$('input[type=hidden]', this).val()) {
    //       original.reset()
    //       return false
    //     }
     
    //   },
    // })
    
    
    // // Datetimepicker
    // $.editable.addInputType('datetime', {
    //     element : function(settings, original) {
    //         settings.onblur = function(e) {
    //         };
                              
    //         var ele = $('<input value="'+original+'" />')
    //         $(this).append(ele)
    //         $(this).children('input').datetimepicker({ dateFormat: "dd-mm-yy" })
                              
    //         return ele
    //     },
    // });
    
    
    
    var defaults = {
        submit: 'Ok',
        style: 'display: inline',
    }
    
    var types = {
        date: {
            type: 'datepicker',
            onblur: 'ignore',
            datepicker: { dateFormat: 'dd-mm-yy' },
        },
        
        text: {
            width: '100px',
            height: '20px',
            type: 'text',
        },
        
        textlong: {
            width: '180px',
            height: '25px',
            type: 'text',
        },
        
        markdown: {
            type: 'textarea',
            rows: 5,
            onblur: 'ignore',
            callback: function(value, settings) {
                $(this).html(markdown.toHTML(value))
            },
            data: function(value,settings) {
                return settings.model.get(settings.attr)
            },
        },

        textarea: {
            type: 'textarea',
            rows: 5,
            onblur: 'ignore',
        },
        
        select: {
            type: 'select',
            onblur: 'ignore',
            callback: function(value, settings) {
                $(this).html(_.result(settings, 'data')[value]);
            }
        },
        
        autocomplete: {
            type: 'autocomplete',
            onblur: 'ignore',
        },
        
        datetime: {
            type: 'datetime',
            onblur: 'ignore',
        }
    }
    
    /**
     * jEditable editing of current model in place
     */
    return Marionette.Object.extend({
        /**
         * @constructor
         * @param {object} options - Pass through the current model and $el.
         */
        initialize: function(options) {
            this.model = options.model
            this.el = options.el
        },
        
        
        /**
         * Create an editable on the page
         * @constructor
         * @param {string} attr - The class into which to inject the editable, should match the model attribute
         * @param {string} type - The type of editable to show.
         * @param {object} options - Options to pass through to the jeditable constructor
         * @param {boolean} refetch - Refetch the model after saving (for selects, etc)
         */
        create: function(attr, type, options, refetch) {
            var submit = function(value, settings) {
                this.model.set(attr, value)
                console.log('valid', this.model.isValid(true), attr, 'changed', this.model.changedAttributes())
                var self = this
                this.model.save(this.model.changedAttributes(), { patch: true,
                    success: function() {
                        if (refetch) self.model.fetch()
                    },
                    error: function(a,b,c) {
                        console.log('editable error', a, 'xhr', b, 'opts',c)
                    }
                })
                    
                return refetch ? '' : value
            }
                
            var onsubmit = function(settings, td) {
                //console.log('onsubmit', settings, td, this)
                var invalid = this.model.preValidate(attr, $('[name=value]', td).val())
                
                if (invalid) {
                    $('input,select', td).addClass('ferror')
                    if ($('.errormessage', td).length) $(td).children('form').append('<span class="errormessage ferror">'+invalid+'</span>')
                } else {
                    $('input,select', td).removeClass('ferror')
                    $('.errormessage', td).remove()
                }
                
                return invalid ? false: true
            }
            
            this.el.find('.'+attr).editable(submit.bind(this), $.extend({}, defaults, types[type], options, { onsubmit: onsubmit.bind(this), attr: attr, model: this.model })).addClass('editable')
        }
        
    })
    
})