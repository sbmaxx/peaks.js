/**
 * WAVEFORM.OVERVIEW.JS
 *
 * This module handles all functionality related to the overview
 * timeline canvas and initialises its own instance of the axis
 * object.
 * 
 */ 
 define([
  "m/bootstrap",
  "m/player/waveform/waveform.axis",
  "m/player/waveform/waveform.mixins"
    ], function (bootstrap, WaveformAxis, mixins) {

  function WaveformOverview(waveformData, $container, options) {
    var that = this;
    that.options = options;
    that.data = waveformData;
    that.$container = $container;
    that.width = that.$container.width();
    that.height = options.overviewHeight;
    that.frameOffset = 0;
    that.seeking = false;

    that.stage = new Kinetic.Stage({
      container: $container[0],
      width: that.width,
      height: that.height
    });

    that.waveformLayer = new Kinetic.Layer();

    that.background = new Kinetic.Rect({
      x: 0,
      y: 0,
      width: that.width,
      height: that.height
    });

    that.waveformLayer.add(that.background);

    that.uiLayer = new Kinetic.Layer();
    that.refLayer = new Kinetic.Layer();

    that.axis = new WaveformAxis(that, 'WaveformOverview');

    //that.createWaveform();
    that.stage.add(that.waveformLayer);

    that.createRefWaveform();
    that.axis.drawAxis(0);
    that.createUi();

    // INTERACTION ===============================================

    that.stage.on("mousedown mouseup", function (event) {
      if (event.targetNode &&
        !event.targetNode.attrs.draggable &&
        !event.targetNode.parent.attrs.draggable) {
        if (event.type == "mousedown") {
          that.seeking = true;

          var width = that.refWaveformRect.getWidth();

          if (peaks.currentZoomLevel !== peaks.options.zoomLevels.length - 1) {
            that.updateRefWaveform(
              that.data.time(event.layerX),
              that.data.time(event.layerX + width)
            );
          }

          that.playheadPixel = event.layerX;
          that.updateUi(that.playheadPixel);

          bootstrap.pubsub.emit("overview_user_seek", that.data.time(event.layerX));

          that.stage.on("mousemove", function (event) {
            if (peaks.currentZoomLevel !== peaks.options.zoomLevels.length - 1) {
              that.updateRefWaveform(
                that.data.time(event.layerX),
                that.data.time(event.layerX + width)
              );
            }
            that.playheadPixel = event.layerX;
            that.updateUi(that.playheadPixel);
            bootstrap.pubsub.emit("overview_user_seek", that.data.time(event.layerX));
          });
          $(document).on("mouseup", function () {
            that.stage.off("mousemove");
            that.seeking = false;
          });
        } else {
          that.stage.off("mousemove");
          that.seeking = false;
        }
      }
    });

    /* 
    * Zoom when user has selected segment on overview waveform and press 'SHIFT+' or 'SHIFT-' 
    * Triggers zoom view zoom level change
    */
    $(document).on("keydown", function (e) {
      var isShift = e.shiftKey;
      var zoomLevelIndex = peaks.currentZoomLevel;

      //Need to get the current zoom level; check if it is good practice to use peaks object from main.js and html page.
      if ((isShift && e.keyCode == 187) || (isShift && e.keyCode == 189)) {
        //Make sure user hasn't reached either highest or lowest zoom level
        if ((zoomLevelIndex === peaks.options.zoomLevels.length - 1) && (isShift && e.keyCode == 189))  {
          $("#alert").text("Oh no! Highest zoom level reached. Cannot zoom out any further.");
          if ($("#alert").hasClass("hidden")) {
            $("#alert").removeClass("hidden").addClass("visible");
          }
        } else if ((zoomLevelIndex === 0) && (isShift && e.keyCode == 187)) {
          $("#alert").text("Oh no! Lowest zoom level reached. Cannot zoom in any further.");
          if ($("#alert").hasClass("hidden")) {
            $("#alert").removeClass("hidden").addClass("visible");
          }
        } else {
          //Zoom Out
          if (isShift && e.keyCode == 187) { //make sure these are universal key codes?
            zoomLevelIndex = peaks.currentZoomLevel - 1;
          //Zoom In
          } else if (isShift && e.keyCode == 189) {
            zoomLevelIndex = peaks.currentZoomLevel + 1;
          } 
          if ($("#alert").hasClass("visible")) {
            $("#alert").removeClass("visible").addClass("hidden");
          }
          //check to ensure new zoom level is not out of bounds and then reset current zoom level
          if (zoomLevelIndex >= peaks.options.zoomLevels.length){
            zoomLevelIndex = peaks.options.zoomLevels.length - 1;
          }

          if (zoomLevelIndex < 0){
            zoomLevelIndex = 0;
          }

          peaks.currentZoomLevel = zoomLevelIndex;
          bootstrap.pubsub.emit("waveform_zoom_level_changed", zoomLevelIndex, "keyboard");
        }
      } 
    });
    
    // EVENTS ====================================================

    bootstrap.pubsub.on("timing_display_changed", function() {
      that.updateUi(that.playheadPixel);
    });

    bootstrap.pubsub.on("player_time_update", function (time) {
      if (!that.seeking) {
        that.currentTime = time;
        that.playheadPixel = that.data.at_time(that.currentTime);
        that.updateUi(that.playheadPixel);
        bootstrap.pubsub.emit("overview_playhead_moved", that.playheadPixel);
      }
    });

    bootstrap.pubsub.on("waveform_zoom_displaying", function (start, end) {
      that.updateRefWaveform(start, end);
    });

    bootstrap.pubsub.on("resizeEndOverview", function (width, newWaveformData) {
      that.width = width;
      that.data = newWaveformData;
      that.stage.setWidth(that.width);
      //that.updateWaveform();
      bootstrap.pubsub.emit("overview_resized");
    });
  }

  // WAVEFORM OVERVIEW FUNCTIONS ====================================================

  /* 
  * Creates the overview waveform shape
  */
  WaveformOverview.prototype.createWaveform = function() {
    var that = this;
    this.waveformShape = new Kinetic.Shape({
      drawFunc: function(canvas) {
        mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
      },
      fill: that.options.overviewWaveformColor,
      strokeWidth: 0
    });
    this.waveformLayer.add(this.waveformShape);
    this.stage.add(this.waveformLayer);
  };

  /* 
  * Creates reference Waveform to inform users where they are in overview waveform based on current zoom level
  */
  WaveformOverview.prototype.createRefWaveform = function () {
    var that = this;

    /*this.refWaveformShape = new Kinetic.Shape({
      drawFunc: function(canvas) {
        mixins.waveformOffsetDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
      },
      fill: that.options.zoomWaveformColor,
      strokeWidth: 0
    });*/

    this.refWaveformRect = new Kinetic.Rect({
      x:0,
      y:11,
      width: 0,
      stroke: "grey",
      strokeWidth: 1.8,
      height: 28,
      fill:'grey',
      opacity: 0.3,
      cornerRadius: 10,
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffset: {x:3,y:3},
      shadowOpacity: 0.8
    });

    this.refLayer.add(this.refWaveformRect);
    this.stage.add(this.refLayer);
  };

  /* 
  * Create the playhead to position where you are in the audio
  */
  WaveformOverview.prototype.createUi = function() {
    var that = this;
    this.playheadLine = new Kinetic.Line({
      points: that._getPlayheadPoints(0),
      stroke: 'rgba(0,0,0,1)',
      strokeWidth: 1
    });
    this.uiLayer.add(this.playheadLine);
    this.stage.add(this.uiLayer);
  };

  /*WaveformOverview.prototype.updateWaveform = function () {
    var that = this;
    that.waveformShape.setDrawFunc(function(canvas) {
      mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
    });
    that.waveformLayer.draw();
  };

  WaveformOverview.prototype.updateRefWaveform = function (time_in, time_out) {
    var that = this;

    var offset_in = that.data.at_time(time_in);
    var offset_out = that.data.at_time(time_out);

    that.refWaveformShape.setDrawFunc(function(canvas) {
      that.data.set_segment(offset_in, offset_out, "zoom");

      mixins.waveformOffsetDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
    });

    that.refWaveformShape.setWidth(that.data.at_time(time_out) - that.data.at_time(time_in));
    that.refLayer.draw();
  };*/

  /*
  * Update the reference waveform when the user changes position on waveform or changes zoom level
  *
  * @param {int} time_in
  * @param {int} time_out
  */
  WaveformOverview.prototype.updateRefWaveform = function (time_in, time_out) {
    var that = this;

    var offset_in = that.data.at_time(time_in);
    var offset_out = that.data.at_time(time_out);

    that.data.set_segment(offset_in, offset_out, "zoom");
    mixins.waveformRectDrawFunction.call(this, that.data);

    that.refWaveformRect.setWidth(that.data.at_time(time_out) - that.data.at_time(time_in));

    //if (peaks.currentZoomLevel === peaks.options.zoomLevels.length - 1) {
      //that.refWaveformRect.hide();
    //} else {
      //that.refWaveformRect.show();
    //}
    that.refLayer.draw();
  };

  /* 
  * Update the position of the playhead when user navigates through audio 
  *
  * @param {int} updated pixel position of playhead
  */
  WaveformOverview.prototype.updateUi = function (pixel) {
    var that = this;
    that.playheadLine.setAttr("points", that._getPlayheadPoints(pixel));
    that.uiLayer.draw();
  };

  WaveformOverview.prototype._getPlayheadPoints = function (pixelOffset) {
    var that = this;
    return [{x:pixelOffset+0.5, y:0},{x:pixelOffset+0.5, y:that.height}];
  };

  return WaveformOverview;
});
