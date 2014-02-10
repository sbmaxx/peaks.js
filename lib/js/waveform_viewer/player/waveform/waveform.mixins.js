/**
 * WAVEFORM.MIXINS.JS
 *
 * Common functions used in multiple modules are
 * collected here for DRY purposes.
 */
define(function () {

  // Private methods

  /**
   * Create a Left or Right side handle group in Kinetic based on given options.
   * @param  {int}      height    Height of handle group container (canvas)
   * @param  {string}   color     Colour hex value for handle and line marker
   * @param  {Boolean}  inMarker  Is this marker the inMarker (LHS) or outMarker (RHS)
   * @return {Function}
   */
  var createHandle = function (height, color, inMarker) {

    /**
     * @param  {Boolean}  draggable If true, marker is draggable
     * @param  {Object}   segment   Parent segment object with in and out times
     * @param  {Object}   parent    Parent context
     * @param  {Function} onDrag    Callback after drag completed
     * @return {Kinetic Object}     Kinetic group object of handle marker elements
     */
    return function (draggable, segment, parent, onDrag) {
      var markerTop     = 0,
          markerX       = 0.5,
          handleTop     = (height / 2) - 10.5,
          handleBottom  = (height / 2) + 9.5,
          markerBottom  = height,
          handleX       = inMarker ? -19.5 : 19.5;

      var handlePoints = [
        [markerX, markerTop],
        [markerX, handleTop],
        [handleX, handleTop],
        [handleX, handleBottom],
        [markerX, handleBottom],
        [markerX, markerBottom]
      ];

      var group = new Kinetic.Group({
        draggable: draggable,
        dragBoundFunc: function(pos) {
          var limit;

          if (inMarker) {
            limit = segment.outMarker.getX() - segment.outMarker.getWidth();
            if (pos.x > limit) pos.x = limit;
          }
          else {
            limit = segment.inMarker.getX() + segment.inMarker.getWidth();
            if (pos.x < limit) pos.x = limit;
          }

          return {
            x: pos.x,
            y: this.getAbsolutePosition().y
          };
        }
      }).on("dragmove", function (event) {
        onDrag(segment, parent);
      });

      var xPosition = inMarker ? -24 : 24;

      var text = new Kinetic.Text({
        x: xPosition,
        y: (height / 2) - 5,
        text: "",
        fontSize: 10,
        fontFamily: 'sans-serif',
        fill: "#000",
        textAlign: "center"
      });
      text.hide();
      group.label = text;
      group.add(text);

      var handle = new Kinetic.Polygon({
        points: handlePoints,
        fill: color,
        stroke: color,
        strokeWidth: 1
      }).on("mouseover", function (event) {
        text.show();
        $("#zoom-container").css("cursor", "e-resize");
        if (inMarker) {
          text.setX(xPosition - text.getWidth());
          $("#zoom-container").css("cursor", "w-resize");
        }
        segment.view.segmentLayer.draw();
      }).on("mouseout", function (event) {
        text.hide();
        $("#zoom-container").css("cursor", "pointer");
        segment.view.segmentLayer.draw();
      });
      group.add(handle);

      return group;
    };
  };

  /**
   * Draw a waveform on a canvas context
   * @param  {Object}   ctx           Canvas Context to draw on
   * @param  {Array}    min           Min values for waveform
   * @param  {Array}    max           Max values for waveform
   * @param  {Int}      offset_start  Where to start drawing
   * @param  {Int}      offset_length How much to draw
   * @param  {Function} y             Calculate height (see fn interpolateHeight)
   */
  var drawWaveform = function (ctx, min, max, offset_start, offset_length, y) {
    ctx.beginPath();

    min.forEach(function(val, x){
      ctx.lineTo(offset_start + x + 0.5, y(val) + 0.5);
    });

    max.reverse().forEach(function(val, x){
      ctx.lineTo(offset_start + (offset_length - x) + 0.5, y(val) + 0.5);
    });

    ctx.closePath();
  };

  // Public API
  return {

    interpolateHeight: function interpolateHeightGenerator (total_height){
      var amplitude = 256;
      return function interpolateHeight (size){
        return total_height - ((size + 128) * total_height) / amplitude;
      };
    },

    /**
     * Draws a whole waveform
     *
     * @param {WaveformData} waveform
     * @param {Canvas} canvas
     * @param {Function} y interpolateHeightGenerator instance
     */
    waveformDrawFunction: function (waveform, canvas, y) {
      var offset_length = waveform.offset_length,
          ctx = canvas.getContext();
      drawWaveform(ctx, waveform.min, waveform.max, 0, offset_length, y);
      canvas.fillStroke(this);
    },

    /**
     * Draw a single segment  waveform shape
     *
     * @param {WaveformData} waveform
     * @param {Canvas} canvas
     * @param {interpolateHeight} y
     */
    /*waveformSegmentDrawFunction: function(waveform, id, canvas, y){
      if (waveform.segments[id] === undefined){
        return;
      }
      var segment = waveform.segments[id],
          offset_length = segment.offset_length,
          offset_start = segment.offset_start - waveform.offset_start,
          ctx = canvas.getContext();
      drawWaveform(ctx, segment.min, segment.max, offset_start, offset_length, y);
      canvas.fillStroke(this);
    },*/

    /**
     * Draw a single segment rectangle 
     *
     * @param {WaveformData} waveform
     * @param {int} id
     * @param {Kinetic Group} view
     */
    waveformSegmentDrawFunction: function(waveform, id, view) {
      if (waveform.segments[id] === undefined){
        return;
      }
      var segment = waveform.segments[id],
        offset_length = segment.offset_length,
        offset_start = segment.offset_start - waveform.offset_start;
        view.waveformShape.setAttrs({
          x: offset_start,
          width: offset_length
        });
    },

    /**
     * Draw a single segment rectangle on zoomview
     *
     * @param {WaveformData} waveform
     * @param {int} id
     * @param {Kinetic Group} zoomview
     */
    /*waveformZoomviewSegmentDrawFunction: function(waveform, id, zoomview) {
      if (waveform.segments[id] === undefined){
        return;
      }
      var segment = waveform.segments[id],
        offset_length = segment.offset_length,
        offset_start = segment.offset_start - waveform.offset_start;
        zoomview.waveformShape.setAttrs({
          x: offset_start,
          width: offset_length
        });
        /*zoomview.rectangle.setAttrs({
          x: offset_start,
          width: offset_length
        });
        zoomview.genderText.setAttrs({
          x: offset_start,
          width: offset_length
        });
    },

    /**
     * Draw a single segment rectangle on overview
     *
     * @param {WaveformData} waveform
     * @param {int} id
     * @param {Kinetic Group} overview
     */
    /*waveformOverviewSegmentDrawFunction: function(waveform, id, overview) {
      if (waveform.segments[id] === undefined){
        return;
      }
      var segment = waveform.segments[id],
        offset_length = segment.offset_length,
        offset_start = segment.offset_start - waveform.offset_start;
        overview.waveformShape.setAttrs({
          x: offset_start,
          width: offset_length
        });
    },*/

    /**
     * Draw a tag on waveform
     *
     * @param {WaveformData} waveform
     * @param {int} id
     * @param {Kinetic Group} view
     */
    waveformTagDrawFunction: function(waveform, id, view) {
      if (waveform.segments[id] === undefined){
        return;
      }
      var segment = waveform.segments[id],
        offset_length = segment.offset_length,
        offset_start = segment.offset_start - waveform.offset_start;

        if ((view.waveformShapeOne) && (view.waveformShapeTwo)) {
          view.waveformShapeOne.setPoints([offset_start,0,offset_start,10]);
          view.waveformShapeTwo.setPoints([offset_start,view.view.height,offset_start,view.view.height - 10]);
        }
        if ((view.circle)) {
          //var xIndex = /*offset_start - (zoomview.circle.getRadius())/2;*/ offset_start - (view.waveformShape.getWidth())/2;
          var circlePosition = offset_start + (view.circle.getRadius())/2;
          /*view.waveformShape.setAttrs({
            x: xIndex
          });
          view.text.setAttrs({
            x: xIndex
          });*/
          view.circle.setAttrs({
            x: circlePosition
          });
        }

    },

    /**
     * Draw a keyword on zoomview waveform
     *
     * @param {WaveformData} waveform
     * @param {int} id
     * @param {Kinetic Group} view
     */
    waveformKeywordDrawFunction: function(waveform, id, zoomview, width) {
      if (waveform.segments[id] === undefined){
        return;
      }
      var segment = waveform.segments[id],
        offset_length = segment.offset_length,
        offset_start = segment.offset_start - waveform.offset_start;
      zoomview.text.setAttrs({
        x: offset_start,
        align: 'center'
      });
      zoomview.hitRegion.setAttrs({
        x: offset_start - (width/2),
        width: width
      });
    },

    waveformKeywordLabelDrawFunction: function(waveform, id, zoomview, canvas) {
      if (waveform.segments[id] === undefined){
        return;
      }
      var segment = waveform.segments[id],
        offset_length = segment.offset_length,
        offset_start = segment.offset_start - waveform.offset_start,
        ctx = canvas.getContext();
      ctx.beginPath();
      ctx.moveTo(offset_start, 0);
      ctx.lineTo(offset_start, 37);
      if ((offset_start + 95) >= canvas.getWidth()) {
        ctx.lineTo(offset_start - 5, 32);
        ctx.lineTo(offset_start - 5, 27);
        ctx.lineTo(offset_start - 95, 27);
        ctx.lineTo(offset_start - 95, 47);
        ctx.lineTo(offset_start - 5, 47);
        ctx.lineTo(offset_start - 5, 42);
      } else {
        ctx.lineTo(offset_start + 5, 32);
        ctx.lineTo(offset_start + 5, 27);
        ctx.lineTo(offset_start + 95, 27);
        ctx.lineTo(offset_start + 95, 47);
        ctx.lineTo(offset_start + 5, 47);
        ctx.lineTo(offset_start + 5, 42);
      }
      ctx.lineTo(offset_start, 37);
      ctx.lineTo(offset_start, 240);
      canvas.fillStroke(this);
      if (((offset_start + 95) >= canvas.getWidth())) {
        zoomview.text.setAttrs({
          x: offset_start - 95,
          align: 'center'
        });
      } 
    },
    /**
     * Draw a reference waveform on overview
     *
     * @param {WaveformData} waveform
     * @param {Canvas} canvas
     * @param {Function} y interpolateHeightGenerator instance
     */
    waveformOffsetDrawFunction: function(waveform, canvas, y){
      if (waveform.segments.zoom === undefined){
        return;
      }
      var offset_length = waveform.segments.zoom.offset_length,
          offset_start = waveform.segments.zoom.offset_start - waveform.offset_start,
          ctx = canvas.getContext();
      drawWaveform(ctx, waveform.segments.zoom.min, waveform.segments.zoom.max, offset_start, offset_length, y);
      canvas.fillStroke(this);
    },

    /**
     * Draw a reference rectangle on overview
     *
     * @param {WaveformData} waveform
     */
    waveformRectDrawFunction: function(waveform) {
      if (waveform.segments.zoom === undefined){
        return;
      }

      this.refWaveformRect.setAttrs({
        x: waveform.segments.zoom.offset_start - waveform.offset_start,
        width: waveform.segments.zoom.offset_length
      });
    },

    /**
     * Format a time nicely
     * @param  {int}      time            Time in seconds to be formatted
     * @param  {Boolean}  dropHundredths  Don't display hundredths of a second if true
     * @return {String}   Formatted time string
     */
    niceTime: function (time, dropHundredths) {
      var hundredths, seconds, minutes, hours, result = [];

      hundredths = Math.floor((time % 1) * 100);
      seconds = Math.floor(time);
      minutes = Math.floor(seconds / 60);
      hours = Math.floor(minutes / 60);

      if (hours>0) result.push(hours);//+ "h"); // Hours

      if (peaks.timingDisplay === '1') {
        result.push(minutes % 60);
        result.push(seconds % 60);
      } else if (peaks.timingDisplay === '2') {
        result.push(minutes % 60 + "m"); // Mins
        if ((seconds % 60) > 0) {
          result.push(seconds % 60 + "s"); // Seconds
        }
      }

      for (var i = 0; i < result.length; i++) {
        var x = result[i];
        if (x < 10) {
          result[i] = "0" + x;
        } else {
          result[i] = x;
        }
      }

      if (peaks.timingDisplay === '1') {
        result = result.join(":");
      } else if (peaks.timingDisplay === '2') {
        result = result.join(" ");
      }

      if (!dropHundredths) {
        if (hundredths < 10) {
          hundredths = "0" + hundredths;
        }

        result += "." + hundredths; // Hundredths of a second
      }

      return result;
    },

    /**
     * Return a function that on execution creates and returns a new
     * IN handle object
     * @param  {Object}   options Root Peaks.js options containing config info for handle
     * @return {Function} Provides Kinetic handle group on execution
     */
    defaultInMarker: function (options) {
      return createHandle(options.height, options.outMarkerColor, true);
    },

    /**
     * Return a function that on execution creates and returns a new
     * OUT handle object
     * @param  {Object}   options Root Peaks.js options containing config info for handle
     * @return {Function} Provides Kinetic handle group on execution
     */
    defaultOutMarker: function (options) {
      return createHandle(options.height, options.outMarkerColor, false);
    },

    defaultSegmentLabelDraw: function (options) {
      return function (segment, parent) {
        return new Kinetic.Text({
          x: 12,
          y: 12,
          text: parent.labelText,
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          fill: "#000",
          textAlign: "center"
        });
      };
    },
  };
});
