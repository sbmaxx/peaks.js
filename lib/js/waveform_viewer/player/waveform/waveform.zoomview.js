/**
 * WAVEFORM.ZOOMVIEW.JS
 *
 * This module handles all functionality related to the zoomed in
 * waveform view canvas and initialises its own instance of the axis
 * object.
 *
 */
define([
  "m/bootstrap",
  "m/player/waveform/waveform.axis",
  "m/player/waveform/waveform.mixins",
  ], function (bootstrap, WaveformAxis, mixins) {

  function WaveformZoomView(waveformData, $container, options) {
    var that = this;

    that.drawing = false; //Tracks whether the last frame has finished drawing for requestFrameAnimation on scroll
    that.runAnimation = true; //Tracks whether the last frame has finished drawing for requestFrameAnimation on continuos animation

    // Create array with resampled data for each animation frame (need to know duration, resample points per frame)
    that.frameData = [];

    that.currentSegmentId = 0;

    that.options = options;
    that.rootData = waveformData; //original waveform data
    that.playing = false;
    that.seeking = false;
    that.update = true; //Tracks whether the waveform needs to be updated
    that.overview = true;

    that.current_zoom_level = options.zoomLevels.length - 1;
    that.current_sample_rate = options.zoomLevels[that.current_zoom_level];
    that.new_zoom_index = 0;
    that.cur_scale = 0;

    that.currentTime = 0;

    that.data = that.rootData.resample({ //resampled waveform data
                  scale: options.zoomLevels[that.current_zoom_level]
                });

    that.pixelLength = that.data.adapter.length;
    that.pixelsPerSecond = that.data.pixels_per_second;
    that.frameOffset = 0; // the pixel offset of the current frame being displayed

    that.$container = $container;
    that.width = that.$container.width();
    that.height = options.height;

    that.stage = new Kinetic.Stage({
      container: $container[0],
      width: that.width,
      height: that.height,
    });

    that.zoomWaveformLayer = new Kinetic.Layer();
    that.uiLayer = new Kinetic.Layer();

    that.background = new Kinetic.Rect({
      x: 0,
      y: 0,
      width: that.width,
      height: that.height,
    });

    that.zoomWaveformLayer.add(that.background);

    that.axis = new WaveformAxis(that, 'WaveformZoomView');

    that.createZoomWaveform();
    that.axis.drawAxis(0);
    that.createUi();
    that.updateZoomButtons();

    // INTERACTION ===============================================

    that.stage.on("mousedown mouseup", function (event) {
      if (event.targetNode &&
        !event.targetNode.attrs.draggable &&
        !event.targetNode.parent.attrs.draggable) {
        if (event.type == "mousedown") {
          that.seeking = true;
          var x = event.layerX, dX, p;

          // Set playhead position
          that.currentTime = that.data.time(that.frameOffset + x);
          that.syncPlayhead(that.frameOffset + x);

          // enable drag if necessary
          that.stage.on("mousemove", function (event) {
            dX = event.layerX > x ? x - event.layerX : (x - event.layerX)*1;
            x = event.layerX;
            p = that.frameOffset+dX;
            p = p < 0 ? 0 : p > (that.pixelLength - that.width) ? (that.pixelLength - that.width) : p;
            that.updateZoomWaveform(p);
          });
          $(document).on("mouseup", function () {
            that.stage.off("mousemove");
            that.seeking = false;
          });
          //Keyboard Interactions for setting in and out marker
          $(document).on("keydown", function (e) {
            var isCtrl = e.ctrlKey;
            var isShift = e.shiftKey;
            //CTRL + I to set in marker
            if ($("#drag").css("opacity") !== "1") {
              $(that.$container.selector).css("cursor", "pointer");
              if (isCtrl && e.keyCode == 73) {
                bootstrap.pubsub.emit("setting_in_marker", that.currentTime);
              } else if (isCtrl && e.keyCode == 79) { //CTRL + O to set out marker
                if (that.currentSegmentId !== undefined) {
                  bootstrap.pubsub.emit("setting_out_marker", that.currentTime, that.currentSegmentId);
                }
              }
            }
          });
          $(document).on("keyup", function (e) {
            var isShift = e.shiftKey;
            if (!isShift) {
              $(that.$container.selector).css("cursor", "pointer");
              event.targetNode.attrs.draggable = false;
              event.targetNode.parent.attrs.draggable = false;
            }
          });
        } else {
          that.stage.off("mousemove");
          that.seeking = false;
        }
      }
    });

    //Mouse Scroll Interaction
    that.stage.on("mouseover", function (event) {
      that.$container.bind('mousewheel', function(e, delta) {
        if (that.playing) {
          return;
        }
        //prevent only the actual wheel movement
        if (delta !== 0) {
            e.preventDefault();
        }
        //if (that.current_zoom_level === peaks.options.zoomLevels.length - 1) {
          //return;
        //}
        //Resamples all audio in case the user has stops scrolling and wants to navigate the waveform
        clearTimeout($.data(this, 'timer'));
        $.data(this, 'timer', setTimeout(function() {
          that.data = that.rootData.resample({
            scale: that.current_sample_rate
          });
          that.pixelsPerSecond = that.data.pixels_per_second;
          that.setLayerVisibility(true);
          that.updateZoomButtons();
          that.update = true;
          that.seekFrame(that.data.at_time(that.currentTime));
        }, 1000));

        delta = e.originalEvent.wheelDelta;

        var new_zoom_index;
        var divisor;

        if (that.current_sample_rate >= 8192) {
          divisor = 3;
        } else {
          divisor = 15;
        }

        if (delta > 0) {
          //Zoom Out
          that.cur_scale = Math.round(that.current_sample_rate + Math.abs(delta / divisor));
          //Determines which zoom level user wants to GO TO and where user is COMING FROM
          for (var i = 0; i < peaks.options.zoomLevels.length; i++) {
            if ((that.cur_scale >= that.current_sample_rate) && (that.cur_scale <= peaks.options.zoomLevels[i])) {
              that.oldZoomLevel = i - 1;
              that.new_zoom_index = i;
              that.overview = false;
              break;
            }
          }
          if (that.cur_scale >= options.zoomLevels[options.zoomLevels.length - 1]) {
            that.cur_scale = options.zoomLevels[options.zoomLevels.length - 1];
            that.oldZoomLevel = options.zoomLevels.length - 1;
            that.new_zoom_index = options.zoomLevels.length - 1;
            that.overview = true;
            $("#alert").text("Oh no! Highest zoom level reached. Cannot zoom out any further.");
            if ($("#alert").hasClass("hidden")) {
              $("#alert").removeClass("hidden").addClass("visible");
            }
          }
        } else {
          //Zoom In
          that.cur_scale = Math.round(that.current_sample_rate - Math.abs(delta / divisor));
          //Determines which zoom level user wants to GO TO (new zoom index) and where user is COMING FROM (old zoom level)
          for (var x = peaks.options.zoomLevels.length - 1; x >= 0; x--) {
            if ((that.cur_scale <= that.current_sample_rate) && (that.cur_scale >= peaks.options.zoomLevels[x])) {
              that.oldZoomLevel = x + 1;
              that.new_zoom_index = x;
              //that.current_zoom_level = undefined;
              break;
            }
          }
          if (that.cur_scale <= options.zoomLevels[0]) {
            that.cur_scale = options.zoomLevels[0];
            that.oldZoomLevel = 0;
            that.new_zoom_index = 0;
            $("#alert").text("Oh no! Lowest zoom level reached. Cannot zoom in any further.");
            if ($("#alert").hasClass("hidden")) {
              $("#alert").removeClass("hidden").addClass("visible");
            }
          }
          that.overview = false;
        }

        if ((that.cur_scale < options.zoomLevels[options.zoomLevels.length - 1]) && (that.cur_scale > options.zoomLevels[0])) {
          if ($("#alert").hasClass("visible")) {
            $("#alert").removeClass("visible").addClass("hidden");
          }
        }

        that.old_sample_rate = that.current_sample_rate;
        that.current_sample_rate = that.cur_scale;

        that.current_zoom_level = undefined;

        peaks.currentZoomLevel = that.oldZoomLevel;

        that.requestWaveform();
      });
    });

    // EVENTS ====================================================

    bootstrap.pubsub.on("timing_display_changed", function() {
      that.seekFrame(that.data.at_time(that.currentTime));
    });

    bootstrap.pubsub.on("segment_created", function (segmentId) {
      that.currentSegmentId = segmentId;
    });

    bootstrap.pubsub.on("player_time_update", function (time) {
      if (!that.seeking && !that.playing) {
        that.currentTime = time;
        //If at the highest zoom level i.e. the oveview don't need to update the waveform as it slows the response to seekeing
        if (that.overview) {
          that.update = false;
        }
        that.seekFrame(that.data.at_time(that.currentTime));
      }
    });

    bootstrap.pubsub.on("overview_user_seek", function (time) {
      that.currentTime = time;
      if (that.overview) {
        that.update = false;
      }
      that.seekFrame(that.data.at_time(that.currentTime));
    });

    bootstrap.pubsub.on("player_play", function (time) {
      that.playing = true;
      that.currentTime = time;
      that.playFrom(time, that.data.at_time(time));
    });

    bootstrap.pubsub.on("player_pause", function (time) {
      that.playing = false;
      that.currentTime = time;
      if (that.playheadLineAnimation) {
        that.playheadLineAnimation.stop();
      }
      that.syncPlayhead(that.data.at_time(that.currentTime));
    });

    bootstrap.pubsub.on("waveform_zoom_level_changed", function (zoom_level, type) {
      if (that.playing) {
        return;
      }

      if (zoom_level != that.current_zoom_level) {

        //Need to set that.overview variable to sort out navigating overview after animation and keyboard zoom level change
        if (zoom_level === peaks.options.zoomLevels.length - 1) {
          that.overview = true;
        } else {
          that.overview = false;
        }
        //Zoom Level
        that.oldZoomLevel = that.current_zoom_level;
        that.current_zoom_level = zoom_level;

        //Samples Per Pixel
        that.old_sample_rate = that.current_sample_rate;
        that.current_sample_rate = options.zoomLevels[zoom_level];

        that.new_zoom_index = that.current_zoom_level;

        that.data = that.rootData.resample({
          scale: that.current_sample_rate
        });
        that.pixelsPerSecond = that.data.pixels_per_second;

        that.update = true;

        if (type === "buttons") {
          //that.runAnimation = true;
          that.startZoomAnimation();
        } else if (type === "keyboard") {
          /*if (that.current_zoom_level === peaks.options.zoomLevels.length - 1) {
            if ((that.tagLayer) && (peaks.waveform.tags.tagLayerVisibility === true)) {
              that.tagLayer.setVisible(false);
            }
          }*/
          that.seekFrame(that.data.at_time(that.currentTime));
        }
        that.updateZoomButtons();
      }
    });

    bootstrap.pubsub.on("window_resized", function (width, newWaveformData) {
      that.width = width;
      that.data = newWaveformData;
      that.stage.setWidth(that.width);
      that.updateZoomWaveform(that.frameOffset);
      bootstrap.pubsub.emit("zoomview_resized");
    });

    // KEYBOARD EVENTS =========================================

    bootstrap.pubsub.on("kybrd_left", function () {
      that.currentTime -= that.options.nudgeIncrement;
      that.seekFrame(that.data.at_time(that.currentTime));
    });

    bootstrap.pubsub.on("kybrd_right", function () {
      that.currentTime += that.options.nudgeIncrement;
      that.seekFrame(that.data.at_time(that.currentTime));
    });

    bootstrap.pubsub.on("kybrd_shift_left", function () {
      that.currentTime -= (that.options.nudgeIncrement*10);
      that.seekFrame(that.data.at_time(that.currentTime));
    });

    bootstrap.pubsub.on("kybrd_shift_right", function () {
      that.currentTime += (that.options.nudgeIncrement*10);
      that.seekFrame(that.data.at_time(that.currentTime));
    });
  }

  // WAVEFORM ZOOMVIEW FUNCTIONS =========================================

  /*
  * Set the visibility for all data overlays of zoomview waveform
  *
  * @param {boolean} visible
  */
  WaveformZoomView.prototype.setLayerVisibility = function (visible) {
    var that = this;

    if ((that.segmentLayer) && (peaks.waveform.segments.segmentLayerVisibility === true)) {
      that.segmentLayer.setVisible(visible);
    }
    if ((that.speakerLayer) && (peaks.waveform.speaker_segments.speakerLayerVisibility === true)) {
      that.speakerLayer.setVisible(visible);
    }
    if ((that.tagLayer) && (peaks.waveform.tags.tagLayerVisibility === true)) {
      that.tagLayer.setVisible(visible);
    }
    if(that.uiLayer) {
      that.uiLayer.setVisible(visible);
    }
  };

  /*
  * Updates the waveform resampling data a new scale
  */
  WaveformZoomView.prototype.updateScrollWaveform = function() {
    var that = this;
    var input_index;
    var output_index;

    //Hide Axis
    //that.axis.axisShape.setAttr('opacity', 0);
    //Hide Segments
    that.setLayerVisibility(false);

    var newWidthSeconds = that.width * that.cur_scale / that.rootData.adapter.sample_rate;

    //added to fix zooming at the start frame
    if ((that.currentTime >= 0) && (that.currentTime <= 0 + newWidthSeconds/2)) { //or newWidthSeconds/2
      //var firstframeOffsetTime = (0 * that.cur_scale) / that.rootData.adapter.sample_rate;
      //console.log("FRAME OFFSET TIME IN UPDATE:", firstframeOffsetTime);

      input_index = 0;//(firstframeOffsetTime * that.rootData.adapter.sample_rate) / that.old_sample_rate;
      output_index = 0;//(firstframeOffsetTime * that.rootData.adapter.sample_rate) / that.cur_scale; //sample rate = 44100
    //Added to fix zooming at the last frame
    } else if ((that.currentTime <= that.rootData.duration) && (that.currentTime >= that.rootData.duration - newWidthSeconds/2)) {
      var lastframeOffsetTime = that.rootData.duration - newWidthSeconds;

      input_index = (lastframeOffsetTime * that.rootData.adapter.sample_rate) / that.old_sample_rate;
      output_index = (lastframeOffsetTime * that.rootData.adapter.sample_rate) / that.cur_scale; //sample rate = 44100
    } else {
      //Partial resampling
      var oldPixelIndex = (that.currentTime * that.rootData.adapter.sample_rate) / that.old_sample_rate;
      input_index = oldPixelIndex - (that.width/2);
      var newPixelIndex = (that.currentTime * that.rootData.adapter.sample_rate) / that.cur_scale; //sample rate = 44100
      output_index = newPixelIndex - (that.width/2);
    }

    that.data = that.rootData.resample({
      scale: that.current_sample_rate,
      input_index: Math.floor(input_index),
      output_index: Math.floor(output_index),
      width: that.width
    });
    that.pixelsPerSecond = that.data.pixels_per_second;
    //Draw waveform
    that.zoomWaveformShape.setDrawFunc(function(canvas) {
      mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
    });
    that.zoomWaveformLayer.draw();
    that.drawing = false;
    //Update the refwaveform on the overview container
    bootstrap.pubsub.emit("waveform_zoom_displaying", output_index * that.data.seconds_per_pixel, (output_index+that.width) * that.data.seconds_per_pixel);
  };

  /*
  * Request animation frame when scroll zooming to achieve speed and smoothness
  * Only calls the update to waveform if the last update has been completed
  */
  WaveformZoomView.prototype.requestWaveform = function() {
    var that = this;
    if(!that.drawing) {
      requestAnimationFrame(that.updateScrollWaveform.bind(that));
      that.drawing = true;
    }
  };

  /*
  * Changes to CSS to give feedback to the user when they can no longer zoom in or zoom out
  */
  WaveformZoomView.prototype.updateZoomButtons = function() {
    //Feedback to user on zooming abilities
    var that = this;
    if ((peaks.currentZoomLevel == '0') && (that.new_zoom_index == '0')) {
      $("#zoomIn").attr("disable", "true");
      $("#zoomIn").css("opacity", 0.2);
      $("#zoomIn").on("mouseover", function (event) {
        $("#zoomIn").css("cursor", "not-allowed");
      });
    } else {
      $("#zoomIn").removeAttr("disable");
      $("#zoomIn").css("opacity", 1);
      $("#zoomIn").on("mouseover", function (event) {
        $("#zoomIn").css("cursor", "pointer");
      });
    }

    if (((peaks.currentZoomLevel == peaks.options.zoomLevels.length - 1) && (that.new_zoom_index == peaks.options.zoomLevels.length - 1)) || (that.current_zoom_level === peaks.options.zoomLevels.length - 1)) {
      $("#zoomOut").attr("disable", "true");
      $("#zoomOut").css("opacity", 0.2);
      $("#zoomOut").on("mouseover", function (event) {
        $("#zoomOut").css("cursor", "not-allowed");
      });
    } else {
      $("#zoomOut").removeAttr("disable");
      $("#zoomOut").css("opacity", 1);
      $("#zoomOut").on("mouseover", function (event) {
        $("#zoomOut").css("cursor", "pointer");
      });
    }
  };

  /*
  * Create the intial zoomview waveform
  */
  WaveformZoomView.prototype.createZoomWaveform = function() {
    var that = this;
    that.zoomWaveformShape = new Kinetic.Shape({
      drawFunc: function(canvas) {
        that.data.offset(0, that.width);

        mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
      },
      fill: that.options.zoomWaveformColor,
      strokeWidth: 0
    });
    that.zoomWaveformLayer.add(that.zoomWaveformShape);
    that.stage.add(that.zoomWaveformLayer);
    bootstrap.pubsub.emit("waveform_zoom_displaying", 0 * that.data.seconds_per_pixel, that.width * that.data.seconds_per_pixel);
  };

  /*
  * Create the playhead and the playhead time objects
  */
  WaveformZoomView.prototype.createUi = function() {
    var that = this;

    that.zoomPlayheadLine = new Kinetic.Line({
      points: [{x: 0, y: 0},{x: 0, y: that.height}],
      stroke: 'rgba(0,0,0,1)',
      strokeWidth: 1
    });

    that.zoomPlayheadText = new Kinetic.Text({
      x:2,
      y: /*that.height - 12,*/ 12,
      text: "00:00:00",
      fontSize: 11,
      fontFamily: 'sans-serif',
      fill: '#ffff',
      align: 'right'
    });

    that.zoomPlayheadGroup = new Kinetic.Group({
      x: 0,
      y: 0
    }).add(that.zoomPlayheadLine).add(that.zoomPlayheadText);

    that.uiLayer.add(that.zoomPlayheadGroup);
    that.stage.add(that.uiLayer);
  };

  /*
  * Redraws the zoomview waveform when any variables have been changed
  *
  * @param {int} pixelOffset [indicated the playhead position]
  */
  WaveformZoomView.prototype.updateZoomWaveform = function (pixelOffset) {
    var that = this;

    that.frameOffset = pixelOffset;

    that.pixelLength = that.data.adapter.length;

    var display = (that.playheadPixel >= pixelOffset) && (that.playheadPixel <= pixelOffset + that.width); //i.e. playhead is within the zoom frame width

    if (display) {
      var remPixels = that.playheadPixel - pixelOffset;

      that.zoomPlayheadGroup.show().setAttr("x", remPixels + 0.5);
      that.zoomPlayheadText.setText(mixins.niceTime(that.data.time(that.playheadPixel), false));
    } else {
      that.zoomPlayheadGroup.hide();
    }

    that.uiLayer.draw();

    that.zoomWaveformShape.setDrawFunc(function(canvas) {
      that.data.offset(pixelOffset, pixelOffset + that.width);

      mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
    });

    that.zoomWaveformLayer.draw();

    that.axis.drawAxis(that.data.time(pixelOffset));
    // if (that.snipWaveformShape) that.updateSnipWaveform(that.currentSnipStartTime, that.currentSnipEndTime);

    bootstrap.pubsub.emit("waveform_zoom_displaying", pixelOffset * that.data.seconds_per_pixel, (pixelOffset+that.width) * that.data.seconds_per_pixel);
    bootstrap.pubsub.emit("waveform_zoom_displaying_finished", pixelOffset * that.data.seconds_per_pixel, (pixelOffset+that.width) * that.data.seconds_per_pixel);
  };

  /*
  * Moves the zoomview playhead when audio is being played
  *
  * @param {int} time
  * @param {int} startPosition
  */
  WaveformZoomView.prototype.playFrom = function (time, startPosition) {
    var that = this;

    if (that.playheadLineAnimation) {
      that.playheadLineAnimation.stop();
    }

    startPosition = startPosition - that.frameOffset;
    var startSeconds = time;
    var frameSeconds = 0;

    that.playheadLineAnimation = new Kinetic.Animation(function (frame) {
      var time = frame.time,
          timeDiff = frame.timeDiff,
          frameRate = frame.frameRate;

      var seconds = time / 1000;
      var positionInFrame = Math.round(startPosition + (that.pixelsPerSecond * (seconds-frameSeconds)));

      that.playheadPixel = that.frameOffset + positionInFrame;
      bootstrap.pubsub.emit("zoomview_playhead_moved", that.playheadPixel);

      if (positionInFrame > that.width) {
        that.newFrame();
        that.zoomPlayheadGroup.setAttr("x", 0);
        that.zoomPlayheadText.setText(mixins.niceTime(that.data.time(0), false));
        startPosition = 0;
        var s = seconds - frameSeconds;
        frameSeconds += s; // TODO: ??
      } else {
        that.zoomPlayheadGroup.setAttr("x", positionInFrame + 0.5);
        that.zoomPlayheadText.setText(mixins.niceTime(that.data.time(that.frameOffset + positionInFrame), false));
      }
    }, that.uiLayer);

    that.playheadLineAnimation.start();
  };

  WaveformZoomView.prototype.newFrame = function () {
    var that = this;
    that.frameOffset += that.width;
    that.updateZoomWaveform(that.frameOffset);
  };

  /*
  * Redraws the playhead and the time text when it has changed
  *
  * @param {int} pixelIndex [indicated new position of playhead relative the the current zoomview data]
  */
  WaveformZoomView.prototype.syncPlayhead = function (pixelIndex) {
    var that = this;
    that.playheadPixel = pixelIndex;
    var display = (that.playheadPixel >= that.frameOffset) && (that.playheadPixel <= that.frameOffset + that.width);
    if (display) {
      var remPixels = that.playheadPixel - that.frameOffset; //places playhead at centre of zoom frame i.e. remPixels = 500
      that.zoomPlayheadGroup.show().setAttr("x", remPixels + 0.5);
      that.zoomPlayheadText.setText(mixins.niceTime(that.data.time(that.playheadPixel), false));
    } else {
      that.zoomPlayheadGroup.hide();
    }

    //If audio is being played then you have to set the correct position for where the playhead should start playing in zoomview
    if (that.playing) {
      that.playFrom(that.currentTime, pixelIndex);
    }

    that.uiLayer.draw();
    bootstrap.pubsub.emit("waveform_seek", that.data.time(pixelIndex));
  };

  /*
  * Redraws the correct part of the waveform depending on the current zoom level
  *
  * {int} pixelIndex
  */
  WaveformZoomView.prototype.seekFrame = function (pixelIndex) {
    var that = this;
    var upperLimit = that.data.adapter.length - that.width;

    //if (pixelIndex > that.width && pixelIndex < upperLimit) {
      that.frameOffset = pixelIndex - Math.round(that.width / 2);
    //} else if (pixelIndex >= upperLimit) {
      //that.frameOffset = upperLimit;
    //} else {
      //that.frameOffset = 0;
    //}

    //console.log("UPPER LIMIT", upperLimit, "PIXEL INDEX:", pixelIndex, "FRAME OFFSET IN SEEKFRAME", that.frameOffset);

    if (that.frameOffset <= 0) {
      that.frameOffset = 0;
    } else if (that.frameOffset + that.width >= that.data.adapter.length) {
      that.frameOffset = upperLimit;
    }

    that.syncPlayhead(pixelIndex);
    if (that.update) {
      that.updateZoomWaveform(that.frameOffset);
    }
  };

  /*
  * Update the zoom waveform when running a continous animated zoom
  *
  */
  WaveformZoomView.prototype.startZoomAnimation = function () {
    var that = this;
    var direction;
    var oldSampleRate = that.old_sample_rate;
    var numOfFrames = 20;
    var input_index;
    var output_index;

    //Fade out the time axis and the segments
    //that.axis.axisShape.setAttr('opacity', 0);
    //Fade out segments
    that.setLayerVisibility(false);

    // Determine whether zooming in or out
    if (that.oldZoomLevel > that.current_zoom_level) {
      direction = "In";
      numOfFrames = 30;
    } else {
      direction = "Out";
      numOfFrames = 15;
    }


    for (var i = 0; i < numOfFrames; i++) {
      // Work out interpolated resample scale using that.current_zoom_level and that.oldZoomLevel
      var frame_sample_rate = Math.round(that.old_sample_rate + ((i+1)*(that.current_sample_rate - that.old_sample_rate)/numOfFrames));
      //Determine the timeframe for the zoom animation (start and end of dataset for zooming animation)

      var newWidthSeconds = that.width * frame_sample_rate / that.rootData.adapter.sample_rate;

      //added to fix zooming at the start frame
      if ((that.currentTime >= 0) && (that.currentTime <= 0 + newWidthSeconds/2)) {
        //var frameOffsetTime = (0 * frame_sample_rate) / that.rootData.adapter.sample_rate;
        input_index = 0;//(frameOffsetTime * that.rootData.adapter.sample_rate) / oldSampleRate;
        output_index = 0;//(frameOffsetTime * that.rootData.adapter.sample_rate) / frame_sample_rate; //sample rate = 44100
      //added to fix the zooming at the end frame
      } else if ((that.currentTime <= that.rootData.duration) && (that.currentTime >= that.rootData.duration - newWidthSeconds/2)) {
        var lastFrameOffsetTime = that.rootData.duration - newWidthSeconds;

        input_index = (lastFrameOffsetTime * that.rootData.adapter.sample_rate) / oldSampleRate;
        output_index = (lastFrameOffsetTime * that.rootData.adapter.sample_rate) / frame_sample_rate; //sample rate = 44100
      } else {
        //This way calculates the index of the start time at the scale we are coming from and the scale we are going to
        var oldPixelIndex = (that.currentTime * that.rootData.adapter.sample_rate) / oldSampleRate;
        input_index = oldPixelIndex - (that.width/2);
        var newPixelIndex = (that.currentTime * that.rootData.adapter.sample_rate) / frame_sample_rate; //sample rate = 44100
        output_index = newPixelIndex - (that.width/2);
      }

      var resampled = that.rootData.resample({ // rootData should be swapped for your resampled dataset
        scale: frame_sample_rate,
        input_index: Math.floor(input_index),
        output_index: Math.floor(output_index),
        width: that.width
      });

      that.frameData.push(
        resampled
      );

      oldSampleRate = frame_sample_rate;
    }

    that.requestStart();

    // Start an animation that displays the data on the frame
    /*that.zoomAnimation = new Kinetic.Animation(function (frame) {
      if (that.frameData.length > 0) {
        var time = frame.time,
          timeDiff = frame.timeDiff,
          frameRate = frame.frameRate;
        var seconds = time / 1000;

        //console.log("Frame Rate:", frameRate);

        var intermediate_data = that.frameData.shift();

        //Send correct resampled waveform data object to drawFunc and draw it
        that.zoomWaveformShape.setDrawFunc(function(canvas) {
          mixins.waveformDrawFunction.call(this, intermediate_data, canvas, mixins.interpolateHeight(that.height));
        });
      }
      else {
        //Once all intermediate frames have been drawn
        that.zoomAnimation.stop();
        //Fade in the segments
        that.setLayerVisibility(true);

        that.seekFrame(that.data.at_time(that.currentTime));
      }
    }, that.zoomWaveformLayer);

    that.zoomAnimation.start();*/
  };

  WaveformZoomView.prototype.requestStart = function() {
    var that = this;
    if (that.runAnimation) {
      that.runAnimation = false;
      that.updateAnimationWaveform();
    }
  };

  WaveformZoomView.prototype.updateAnimationWaveform = function () {
    var that = this;

    if (that.frameData.length > 0) {

      var intermediate_data = that.frameData.shift();

      //Send correct resampled waveform data object to drawFunc and draw it
      that.zoomWaveformShape.setDrawFunc(function(canvas) {
        mixins.waveformDrawFunction.call(this, intermediate_data, canvas, mixins.interpolateHeight(that.height));
      });
      that.zoomWaveformLayer.draw();
      //Update the refwaveform on the overview container
      //bootstrap.pubsub.emit("waveform_zoom_displaying", output_index * that.data.seconds_per_pixel, (output_index+that.width) * that.data.seconds_per_pixel);
      requestAnimationFrame( function () {
        that.updateAnimationWaveform();
      });
    } else {
      //Once all intermediate frames have been drawn
      that.runAnimation = true;
      //Fade in the segments
      that.setLayerVisibility(true);
      that.seekFrame(that.data.at_time(that.currentTime));
      //that.requestStart();
    }
  };

  return WaveformZoomView;
});
