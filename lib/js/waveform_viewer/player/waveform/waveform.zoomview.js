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

    that.ticking = false;
    that.cur_scale;

    that.options = options;
    that.rootData = waveformData; //original waveform data
    that.playing = false;
    that.seeking = false;

    that.scale = 1;

    that.current_zoom_level = 0;
    that.current_sample_rate = options.zoomLevels[that.current_zoom_level];
    that.currentTime = 0;
    that.new_zoom_index = 0;

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
      height: that.height
    });

    that.zoomWaveformLayer = new Kinetic.Layer();
    that.uiLayer = new Kinetic.Layer();

    that.background = new Kinetic.Rect({
      x: 0,
      y: 0,
      width: that.width,
      height: that.height
    });

    that.currentZoomText = new Kinetic.Text({
      x:that.$container.width() - 100,
      y:12,
      text: "Current Zoom: " + peaks.currentZoomLevel,
      fontSize: 11,
      fontFamily: 'sans-serif',
      fill: '#0000',
    });

    that.zoomWaveformLayer.add(that.background);
    that.zoomWaveformLayer.add(that.currentZoomText);

    that.currentZoomText.hide();

    that.axis = new WaveformAxis(that);

    that.createZoomWaveform();
    that.axis.drawAxis(0);
    that.createUi();

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
        } else {
          that.stage.off("mousemove");
          that.seeking = false;
        }
      }
    });

    //Mouse Scroll Interaction
    that.stage.on("mouseover", function (event) {
      that.$container.bind('mousewheel', function(e, delta) {
        //Resamples all audio in case the user has stops scrolling and wants to navigate the waveform
        clearTimeout($.data(this, 'timer'));
        $.data(this, 'timer', setTimeout(function() {
          that.data = that.rootData.resample({
            scale: that.current_sample_rate
          });
          that.pixelsPerSecond = that.data.pixels_per_second;
          if (that.segmentLayer) {
            that.segmentLayer.setVisible(true);
          }
          that.updateZoomButtons();
          that.seekFrame(that.data.at_time(that.currentTime));
        }, 1000));

        delta = e.originalEvent.wheelDelta;

        //prevent only the actual wheel movement
        if (delta !== 0) {
            e.preventDefault();
        }

        var zoom_direction = Math.max(-1, Math.min(1, delta));
        var new_zoom_index;

        if (delta > 0) {
          //console.log("Zoom Out");
          that.cur_scale = Math.round(that.current_sample_rate + Math.abs(delta / 5));
          //Determines which zoom level user wants to GO TO and where user is COMING FROM
          for (var i = 0; i < peaks.options.zoomLevels.length; i++) {
            if ((that.cur_scale >= that.current_sample_rate) && (that.cur_scale <= peaks.options.zoomLevels[i])) {
              that.oldZoomLevel = i - 1;
              that.new_zoom_index = i;
              break;
            }
          }
          if (that.cur_scale >= 4096) {
            that.cur_scale = 4096;
            that.oldZoomLevel = 3;
            that.new_zoom_index = 3;
          }
        } else {
          //console.log("Zoom In");
          that.cur_scale = Math.round(that.current_sample_rate - Math.abs(delta / 10));
          //Determines which zoom level user wants to GO TO (new zoom index) and where user is COMING FROM (old zoom level)
          for (var x = peaks.options.zoomLevels.length - 1; x >= 0; x--) {
            if ((that.cur_scale <= that.current_sample_rate) && (that.cur_scale >= peaks.options.zoomLevels[x])) {
              that.oldZoomLevel = x + 1;
              that.new_zoom_index = x;
              break;
            }
          }
          if (that.cur_scale <= 512) {
            that.cur_scale = 512;
            that.oldZoomLevel = 0;
            that.new_zoom_index = 0;
          }
        }

        that.old_sample_rate = that.current_sample_rate;
        that.current_sample_rate = that.cur_scale;

        peaks.currentZoomLevel = that.oldZoomLevel;

        that.requestWaveform();
      });
    });

    // EVENTS ====================================================

    bootstrap.pubsub.on("player_time_update", function (time) {
      if (!that.seeking && !that.playing) {
        that.currentTime = time;
        that.seekFrame(that.data.at_time(that.currentTime));
      }
    });

    bootstrap.pubsub.on("overview_user_seek", function (time) {
      that.currentTime = time;
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

    bootstrap.pubsub.on("show_current_zoom_level", function () {
      that.currentZoomText.show().setText("Current Zoom: " + peaks.currentZoomLevel);
      that.zoomWaveformLayer.draw();
    });

    bootstrap.pubsub.on("hide_current_zoom_level", function () {
      that.currentZoomText.hide();
      that.zoomWaveformLayer.draw();
    });

    bootstrap.pubsub.on("waveform_zoom_level_changed", function (zoom_level) {
      if (that.playing) {
        return;
      }

      if (zoom_level != that.current_zoom_level) {
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
        that.startZoomAnimation();
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

  WaveformZoomView.prototype.update = function() {
    var that = this;

    //Hide Axis
    //that.axis.axisShape.setAttr('opacity', 0);
    //Hide Segments
    if (that.segmentLayer) {
      that.segmentLayer.setVisible(false);
    }

    //Partial resampling
    var oldPixelIndex = (that.currentTime * that.rootData.adapter.sample_rate) / that.old_sample_rate;
    var input_index = oldPixelIndex - (that.width/2); 
    var newPixelIndex = (that.currentTime * that.rootData.adapter.sample_rate) / that.cur_scale; //sample rate = 44100
    var output_index = newPixelIndex - (that.width/2);

    that.data = that.rootData.resample({
      scale: that.current_sample_rate,
      input_index: Math.floor(input_index),
      output_index: Math.floor(output_index),
      length: that.width
    });
    that.pixelsPerSecond = that.data.pixels_per_second;
    //Draw waveform
    that.zoomWaveformShape.setDrawFunc(function(canvas) {
      mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
    });
    that.zoomWaveformLayer.draw();
    that.ticking = false;
    //Update the refwaveform on the overview container
    bootstrap.pubsub.emit("waveform_zoom_displaying", output_index * that.data.seconds_per_pixel, (output_index+that.width) * that.data.seconds_per_pixel);
  };

  WaveformZoomView.prototype.requestWaveform = function() {
    var that = this;
    if(!that.ticking) {
      requestAnimationFrame(that.update.bind(that));
      that.ticking = true;
    }
  };

  WaveformZoomView.prototype.updateZoomButtons = function() {
    //Feedback to user on zooming abilities 
    var that = this;
    if ((peaks.currentZoomLevel == '0') && (that.new_zoom_index == '0')) {
      $("#zoomIn").attr("disable", "true");
      $("#zoomIn").css("opacity", 0.2);
    } else {
      $("#zoomIn").removeAttr("disable");
      $("#zoomIn").css("opacity", 1);
    }

    if ((peaks.currentZoomLevel == peaks.options.zoomLevels.length - 1) && (that.new_zoom_index == peaks.options.zoomLevels.length - 1)) {
      $("#zoomOut").attr("disable", "true");
      $("#zoomOut").css("opacity", 0.2);
    } else {
      $("#zoomOut").removeAttr("disable");
      $("#zoomOut").css("opacity", 1);
    }
  }

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

  WaveformZoomView.prototype.createUi = function() {
    var that = this;

    that.zoomPlayheadLine = new Kinetic.Line({
      points: [{x: 0, y: 0},{x: 0, y: that.height}],
      stroke: 'rgba(0,0,0,1)',
      strokeWidth: 1
    });

    that.zoomPlayheadText = new Kinetic.Text({
      x:2,
      y: 12,
      text: "00:00:00",
      fontSize: 11,
      fontFamily: 'sans-serif',
      fill: '#aaa',
      align: 'right'
    });

    that.zoomPlayheadGroup = new Kinetic.Group({
      x: 0,
      y: 0
    }).add(that.zoomPlayheadLine).add(that.zoomPlayheadText);

    that.uiLayer.add(that.zoomPlayheadGroup);
    that.stage.add(that.uiLayer);
  };

  WaveformZoomView.prototype.updateZoomWaveform = function (pixelOffset) {
    var that = this;

    that.frameOffset = pixelOffset;

    var display = (that.playheadPixel >= pixelOffset) && (that.playheadPixel <= pixelOffset + that.width); //i.e. playhead is within the zoom frame width

    if (display) {
      var remPixels = that.playheadPixel - pixelOffset;

      that.zoomPlayheadGroup.show().setAttr("x", remPixels + 0.5);
      that.zoomPlayheadText.setText(mixins.niceTime(that.data.time(that.playheadPixel), false));
    } else {
      that.zoomPlayheadGroup.hide();
    }

    if (that.currentZoomText.isVisible()) {
      that.currentZoomText.setText("Current Zoom: " + peaks.currentZoomLevel);
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
  };

  // UI functions ==============================

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

    that.uiLayer.draw();
    bootstrap.pubsub.emit("waveform_seek", that.data.time(pixelIndex));
  };

  WaveformZoomView.prototype.seekFrame = function (pixelIndex) {
    var that = this;
    var upperLimit = that.data.adapter.length - that.width;

    if (pixelIndex > that.width && pixelIndex < upperLimit) {
      that.frameOffset = pixelIndex - Math.round(that.width / 2);
    } else if (pixelIndex >= upperLimit) {
      that.frameOffset = upperLimit;
    } else {
      that.frameOffset = 0;
    }

    that.syncPlayhead(pixelIndex);
    that.updateZoomWaveform(that.frameOffset);
  };

  WaveformZoomView.prototype.startZoomAnimation = function () {
    var that = this;
    var direction;
    var oldSampleRate = that.old_sample_rate;
    var numOfFrames = 20;

    //Fade out the time axis and the segments
    //that.axis.axisShape.setAttr('opacity', 0);
    //Fade out segments
    if (that.segmentLayer) {
      that.segmentLayer.setVisible(false);
    }

    // Determine whether zooming in or out
    if (that.oldZoomLevel > that.current_zoom_level) {
      direction = "In";
      numOfFrames = 25;
    } else {
      direction = "Out";
      numOfFrames = 15;
    }

    // Create array with resampled data for each animation frame (need to know duration, resample points per frame)
    var frameData = [];
    for (var i = 0; i < numOfFrames; i++) {
      // Work out interpolated resample scale using that.current_zoom_level and that.oldZoomLevel
      var frame_sample_rate = Math.round(that.old_sample_rate + ((i+1)*(that.current_sample_rate - that.old_sample_rate)/numOfFrames));
      //Determine the timeframe for the zoom animation (start and end of dataset for zooming animation)
      
      //This way calculates the index of the start time at the scale we are coming from and the scale we are going to
      var oldPixelIndex = (that.currentTime * that.rootData.adapter.sample_rate) / oldSampleRate;
      var input_index = oldPixelIndex - (that.width/2); 
      var newPixelIndex = (that.currentTime * that.rootData.adapter.sample_rate) / frame_sample_rate; //sample rate = 44100
      var output_index = newPixelIndex - (that.width/2); 

      var resampled = that.rootData.resample({ // rootData should be swapped for your resampled dataset
        scale: frame_sample_rate,
        input_index: Math.floor(input_index),
        output_index: Math.floor(output_index),
        length: that.width
      });
      
      frameData.push(
        resampled
      );
      
      oldSampleRate = frame_sample_rate;
    }

    // Start an animation that displays the data on the frame
    that.zoomAnimation = new Kinetic.Animation(function (frame) {
      if (frameData.length > 0) {
        var time = frame.time,
          timeDiff = frame.timeDiff,
          frameRate = frame.frameRate;
        var seconds = time / 1000;

        var intermediate_data = frameData.shift();

        //Send correct resampled waveform data object to drawFunc and draw it
        that.zoomWaveformShape.setDrawFunc(function(canvas) {
          mixins.waveformDrawFunction.call(this, intermediate_data, canvas, mixins.interpolateHeight(that.height));
        });
      }
      else {
        //Once all intermediate frames have been drawn
        that.zoomAnimation.stop();
        //Fade in the segments
        if (that.segmentLayer) {
          that.segmentLayer.setVisible(true);
        }
        that.seekFrame(that.data.at_time(that.currentTime));
      }   
    }, that.zoomWaveformLayer);  

    that.zoomAnimation.start();
  };

  return WaveformZoomView;
});
