define(['backbone.marionette', 'views/modal', 'jquery','jquery-color'], function(Marionette, ModalView, $) {

  return {
       
    // Convert timestamp string into javascript date object
    _date_to_unix: function(strtime) {
       var dt = strtime.trim().split(' ')
       var dmy = dt[0].split('-')
       var hms = dt[1].split(':')
       var date = new Date(dmy[2], dmy[1]-1, dmy[0], hms[0], hms[1], hms[2], 0)
       return date
    },
      

    // Convert seconds to friendly time
    friendlyTime: function(secs) {
        var days = Math.floor(secs / (60 * 60 * 24));
        var divisor_for_hours = secs % (60 * 60 * 24);
        var hours = Math.floor(divisor_for_hours / (60 * 60));
        var divisor_for_minutes = secs % (60 * 60);
        var minutes = Math.floor(divisor_for_minutes / 60);
        var divisor_for_seconds = divisor_for_minutes % 60;
        var seconds = Math.ceil(divisor_for_seconds);

        var text =  ''
        if (days > 0) text += days+'d'
        if (hours > 0) text += ' '+hours+'h'
        if (minutes > 0) text += ' '+minutes+'m'
        if (seconds > 0 && days == 0 && hours == 0) text += ' '+seconds+'s'

        return text
    },
      
      
      
      
    // Reasonable default plot options
    default_plot: {
      grid: {
        borderWidth: 0,
      },
      series: {
        points: {
          show: true,
          radius: 1,
        }
      },
    },
      
    labelFormatter: function (label, series) {
        return "<div style='font-size:8pt; text-align:center; padding:2px; color:white;'>" + label + "<br/>" + Math.round(series.percent) + "%<br />(" + series.data[0][1].toFixed(1) + "hr)</div>";
    },
      
    labelFormatterNo: function (label, series) {
        return "<div style='font-size:8pt; text-align:center; padding:2px; color:white;'>" + label + "<br/>" + Math.round(series.percent) + "%<br />(" + series.data[0][1] + ")</div>";
    },

      
    // Generic Message View
    generic_msg: Marionette.View.extend({
        className: 'content',
        template: _.template('<div><p><%=msg%></p></div>'),
        templateContext: function() {        
            return {
                msg: this.message,
                // title: this.title,
            }
        },
        
        initialize: function(options) {
            this.message = options.message
            // this.title = options.title
            app.title({ title: options.title })
        }
    }),
      

    // Alert Message View
    alert: Marionette.View.extend({
        persist: false,
        scrollTo: true,
        
        className: 'message alert',
        tagName: 'p',
        template: _.template('<%=msg%>'),
        templateHelpers: function() {        
            return {
                msg: this.getOption('message'),
            }
        },
        
        onRender: function() {
            var self = this
            
            if (this.getOption('scrollTo')) {
                $('html, body').animate({
                    scrollTop: this.$el.offset().top }, 500, function() { self.$el.toggle('highlight')
                })
            }

            if (this.getOption('persist')) this.$el.addClass(this.getOption('persist'))
            
            if (!this.getOption('persist')) {
                setTimeout(function() {
                    self.$el.fadeOut(function() {
                        self.destroy()
                    })
                    
                }, 10000)
            }
        },
    }),
      
    // Confirmation dialog
    confirm: function(options) {
        var ConfirmDialog = ModalView.extend({
            title: options.title,
            template: _.template(options.content),
            buttons: {
                'Ok': 'onOK',
                'Cancel': 'closeDialog',
            },
            
            onOK: function() {
                options.callback()
                this.closeDialog()
            },
        })
        app.dialog.show(new ConfirmDialog())
    },
      
      
    // Return x,y coordinate for a mouse event
    get_xy: function(e, obj) {
        if (e.offsetX == undefined) {
            return [e.pageX-$(obj).offset().left, e.pageY-$(obj).offset().top]
        } else {
            return [e.offsetX, e.offsetY]
        }
    },
      
    
    // Generate colour gradient from 0-1
    rainbow: function(val, width, cent) {
        var col = val*2*Math.PI
        if (width === undefined) width = 126
        if (cent === undefined) cent = 127
        return 'rgb('+ Math.floor(Math.sin(col)*width+cent) + ',' + Math.floor(Math.sin(col+2*Math.PI/3)*width+cent) + ',' + Math.floor(Math.sin(col+4*Math.PI/3)*width+cent)+ ')'
    },
      
    getColors: function(len) {
        return _.map(_.range(len), function (o, i) {
            return $.Color({ hue: (i*360/len), saturation: 0.90, lightness: 0.40, alpha: 1 }).toHexString();
        })
    },

    // nabbed from interwebs
    shadeColor: function(color, percent) {   
        var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
        return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
    },

    blendColors: function(c0, c1, p) {
        var f=parseInt(c0.slice(1),16),t=parseInt(c1.slice(1),16),R1=f>>16,G1=f>>8&0x00FF,B1=f&0x0000FF,R2=t>>16,G2=t>>8&0x00FF,B2=t&0x0000FF;
        return "#"+(0x1000000+(Math.round((R2-R1)*p)+R1)*0x10000+(Math.round((G2-G1)*p)+G1)*0x100+(Math.round((B2-B1)*p)+B1)).toString(16).slice(1);
    },
      
      
    // Check if an element is in view
    inView: function(element, threshold) {
        var $w = $(window)
        var th = threshold || 0
        
        if (element.is(":hidden")) return;
        
        var wt = $w.scrollTop(),
        wb = wt + $w.height(),
        et = element.offset().top,
        eb = et + element.height();
        
        return (eb >= wt - th && et <= wb + th)
    },


    round: function(value, decimals) {
        return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
    },   

    easeText: function(options) {
        // console.log(options)
        try {
            var newValue = parseFloat(options.model.get('value'))
        } catch(err) {
            var newValue = 0
        }

        try {
            var oldValue = parseFloat(options.model.previous('value'))
        } catch(err) {
            var oldValue = 0
        }

        if (options.round !== undefined) {
            if (options.round > 0) {
                newValue = this.round(newValue, options.round)
                oldValue = this.round(oldValue, options.round)
            } else {
                newValue = Math.round(newValue)
                oldValue = Math.round(oldValue)
            }
        }

        var numParts = newValue.toFixed(options.round).split('.');
        var endingPrecision = 0;

        if (numParts.length > 1) {
            endingPrecision = numParts[1].length;
        }

        numParts = oldValue.toFixed(options.round).split('.');
        var startingPrecision = 0;

        if (numParts.length > 1) {
            startingPrecision = numParts[1].length;
        }

        $({transitionValue: oldValue, precisionValue: startingPrecision}).animate({transitionValue: newValue, precisionValue: endingPrecision}, {
            duration: options.duration || 500,
            step: function () {
                options.el.text(this.transitionValue.toFixed(this.precisionValue));
            },
            done: function () {
                options.el.text(newValue.toFixed(this.precisionValue));
            }
        });
    },
      
  }
    
})