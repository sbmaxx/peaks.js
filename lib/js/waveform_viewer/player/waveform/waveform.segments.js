/**
 * WAVEFORM.SEGMENTS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of segments
 */
define([
  "m/bootstrap",
  "m/player/waveform/waveform.mixins",
  ], function (bootstrap, mixins) {

  return function (waveformView, options) {
    var that = this;

    that.segments = [];
    that.currentInMarker = [];
    that.segmentLayerVisibility = true;
    that.currentSegment = undefined;

    var views = [waveformView.waveformZoomView, waveformView.waveformOverview];

    // WAVEFORM SEGMENTS FUNCTIONS ====================================================

    /* 
    * Create the segment object graphic drawings for the overview and zoomview waveform
    *
    * @param  {string} segmentId
    * @param  {int} startTime
    * @param  {int} endTime
    * @param  {boolean} editable
    * @param  {string} color
    * @param  {string} labelText
    *
    * @return {Object} segment object
    */
    var createSegmentWaveform = function (segmentId, startTime, endTime, editable, color, labelText) {
      var that = this;

      var segment = {
        id: segmentId,
        startTime: startTime,
        endTime: endTime,
        labelText: labelText || ""
      };

      var segmentZoomGroup = new Kinetic.Group();
      var segmentOverviewGroup = new Kinetic.Group();

      var segmentGroups = [segmentZoomGroup, segmentOverviewGroup];

      color = color || getSegmentColor();

      var menter = function (event) {
        this.parent.label.show();
        this.parent.view.segmentLayer.draw();
      };

      var mleave = function (event) {
        this.parent.label.hide();
        this.parent.view.segmentLayer.draw();
      };

      for (var i = 0; i < segmentGroups.length; i++) {
        var view = views[i];
        var segmentGroup = segmentGroups[i];

        if (!view.segmentLayer) {
          view.segmentLayer = new Kinetic.Layer();
          view.stage.add(view.segmentLayer);
          view.segmentLayer.moveToTop();
        }

        if (segmentGroup == segmentOverviewGroup) {
          segmentGroup.waveformShape = new Kinetic.Rect({
            fill: color,
            strokeWidth: 0,
            y:11,
            x:0,
            width: 0,
            height: 28,
            opacity:0.4
          });
        } else {
          segmentGroup.waveformShape = new Kinetic.Rect({
            fill: color,
            strokeWidth: 0,
            y:3,
            x:0,
            width: 0,
            height: view.height,
            opacity:0.4
          });
          /*segmentGroup.waveformShape = new Kinetic.Shape({
            fill: color,
            strokeWidth: 0,
            opacity: 1
          });*/
        }

        segmentGroup.waveformShape.on("mouseenter", menter);
        segmentGroup.waveformShape.on("mouseleave", mleave);

        segmentGroup.add(segmentGroup.waveformShape);

        segmentGroup.label = new options.segmentLabelDraw(segmentGroup, segment);
        segmentGroup.add(segmentGroup.label.hide());

        if (editable) {
          var draggable = true;
          if (segmentGroup == segmentOverviewGroup) {
            draggable = false;
          }
          segmentGroup.inMarker = new options.segmentInMarker(draggable, segmentGroup, segment, segmentHandleDrag);
          segmentGroup.add(segmentGroup.inMarker);

          segmentGroup.outMarker = new options.segmentOutMarker(draggable, segmentGroup, segment, segmentHandleDrag);
          segmentGroup.add(segmentGroup.outMarker);
        } 

        view.segmentLayer.add(segmentGroup);
        view.segmentLayer.draw();
      }

      segment.zoom = segmentZoomGroup;
      segment.zoom.view = waveformView.waveformZoomView;
      segment.overview = segmentOverviewGroup;
      segment.overview.view = waveformView.waveformOverview;
      segment.color = color;
      segment.editable = editable;

      return segment;
    };

    /* 
    * Update each segment drawing when the zoom level is changed.
    *
    * @param  {Object} segment
    */
    var updateSegmentWaveform = function (segment) {
      // Binding with data
      waveformView.waveformOverview.data.set_segment(waveformView.waveformOverview.data.at_time(segment.startTime), waveformView.waveformOverview.data.at_time(segment.endTime), segment.id);
      waveformView.waveformZoomView.data.set_segment(waveformView.waveformZoomView.data.at_time(segment.startTime), waveformView.waveformZoomView.data.at_time(segment.endTime), segment.id);

      // Overview
      var overviewStartOffset = waveformView.waveformOverview.data.at_time(segment.startTime);
      var overviewEndOffset = waveformView.waveformOverview.data.at_time(segment.endTime);

      /*segment.overview.waveformShape.setDrawFunc(function(canvas) {
        mixins.waveformSegmentDrawFunction.call(this, waveformView.waveformOverview.data, segment.id, canvas, mixins.interpolateHeight(waveformView.waveformOverview.height));
      });*/

      mixins.waveformSegmentDrawFunction(waveformView.waveformOverview.data, segment.id, segment.overview);

      segment.overview.setWidth(overviewEndOffset - overviewStartOffset);

      if (segment.editable) {
        if (segment.overview.inMarker) segment.overview.inMarker.show().setX(overviewStartOffset - segment.overview.inMarker.getWidth());
        if (segment.overview.outMarker) segment.overview.outMarker.show().setX(overviewEndOffset);

        // Change Text
        segment.overview.inMarker.label.setText(mixins.niceTime(segment.startTime, false));
        segment.overview.outMarker.label.setText(mixins.niceTime(segment.endTime, false));
      }

      // Label
      // segment.overview.label.setX(overviewStartOffset);

      segment.overview.view.segmentLayer.draw();

      // Zoom
      var zoomStartOffset = waveformView.waveformZoomView.data.at_time(segment.startTime);
      var zoomEndOffset = waveformView.waveformZoomView.data.at_time(segment.endTime);

      var frameStartOffset = waveformView.waveformZoomView.frameOffset;
      var frameEndOffset = waveformView.waveformZoomView.frameOffset + waveformView.waveformZoomView.width;

      if (zoomStartOffset < frameStartOffset) zoomStartOffset = frameStartOffset;
      if (zoomEndOffset > frameEndOffset) zoomEndOffset = frameEndOffset;

      if (waveformView.waveformZoomView.data.segments[segment.id].visible) {
        var startPixel = zoomStartOffset - frameStartOffset;
        var endPixel = zoomEndOffset - frameStartOffset;

        segment.zoom.show();
        /*segment.zoom.waveformShape.setDrawFunc(function(canvas) {
          mixins.waveformSegmentDrawFunction.call(this, waveformView.waveformZoomView.data, segment.id, canvas, mixins.interpolateHeight(waveformView.waveformZoomView.height));
        });*/
        mixins.waveformSegmentDrawFunction(waveformView.waveformZoomView.data, segment.id, segment.zoom);

        if (segment.editable) {
          if (segment.zoom.inMarker) segment.zoom.inMarker.show().setX(startPixel - segment.zoom.inMarker.getWidth());
          if (segment.zoom.outMarker) segment.zoom.outMarker.show().setX(endPixel);

          // Change Text
          segment.zoom.inMarker.label.setText(mixins.niceTime(segment.startTime, false));
          segment.zoom.outMarker.label.setText(mixins.niceTime(segment.endTime, false));
        }

      } else {
        segment.zoom.hide();
      }

      //Segment Details displayed to the user
      $("#startTime").text(mixins.niceTime(segment.startTime, false));
      $("#endTime").text(mixins.niceTime(segment.endTime, false));
      var duration = segment.endTime - segment.startTime;
      $("#durationTime").text(mixins.niceTime(duration, false));

      segment.zoom.view.segmentLayer.draw();
      segment.zoom.view.segmentLayer.moveToTop();
    };

    /* 
    * Handles when the user drags the segment markers
    *
    * @param  {Object} thisSeg
    * @param  {Object} segment
    */
    var segmentHandleDrag = function (thisSeg, segment) {
      if (thisSeg.inMarker.getX() > 0) {
        var inOffset = thisSeg.view.frameOffset + thisSeg.inMarker.getX() + thisSeg.inMarker.getWidth();
        segment.startTime = thisSeg.view.data.time(inOffset);
      }

      if (thisSeg.outMarker.getX() < thisSeg.view.width) {
        var outOffset = thisSeg.view.frameOffset + thisSeg.outMarker.getX();
        segment.endTime = thisSeg.view.data.time(outOffset);
      }

      updateSegmentWaveform(segment);
      that.currentInMarker.pop();
      that.currentSegmentId = undefined;
    };

    /* 
    * Generate random colour for segment
    */
    var getSegmentColor = function () {
      var c;
      if (options.randomizeSegmentColor) {
        var g = function () { return Math.floor(Math.random()*255); };
        c = 'rgba('+g()+', '+g()+', '+g()+', 1)';
      } else {
        c = options.segmentColor;
      }
      return c;
    };

    /* 
    * Listens for the zoomview waveform to be changed
    */
    that.init = function () {
      bootstrap.pubsub.on("waveform_zoom_displaying", this.updateSegments);
    };

    /* 
    * Updates each segment when the zoomview waveform is changed
    */
    this.updateSegments = function () {
      that.segments.forEach(function(segment){
        updateSegmentWaveform(segment);
      });
      /*if (that.currentInMarker.length == 1) {
        updateMarkers(that.currentInMarker[0]);
      }
      if (that.currentOutMarker.length == 1) {
        updateMarkers(that.currentOutMarker[0]);
      }*/
    };

    /* 
    * Create the keyword object ensuring you give is an ID
    *
    * @param  {int} startTime
    * @param  {int} endTime
    * @param  {boolean} editable
    * @param  {string} color
    * @param  {string} labelText
    */
    this.createSegment = function (startTime, endTime, editable, color, labelText) {
      var segmentId = "segment" + that.segments.length;
      var segmentIndexPos = that.segments.length;

      var segment = createSegmentWaveform(segmentId, startTime, endTime, editable, color, labelText);
      
      updateSegmentWaveform(segment);
      that.segments.push(segment);
      return segmentIndexPos;
    };

    /* 
    * Change visibility of the segment layer
    *
    * @param  {boolean} visible [Indicates if the segments should be displayed or not]
    */
    this.segmentLayerVisible = function(visible) {
      var that = this;
      for (var i = 0; i < views.length; i++) {
        var view = views[i];
        if (!view.segmentLayer) {
          view.segmentLayer = new Kinetic.Layer();
          view.stage.add(view.segmentLayer);
          view.segmentLayer.moveToTop();
        }
        view.segmentLayer.setVisible(visible);
        if (visible === true) {
          that.updateSegments();
        }
      }
      if (visible === false) {
        that.segmentLayerVisibility = false;
      } else {
        that.segmentLayerVisibility = true;
      }
    };

    // EVENTS ====================================================

    bootstrap.pubsub.on("setting_in_marker", function(startTime) {
      //When the user has set an in marker and no out marker but sets another in marker , destrioy the old in marker set
      var oldMarkerId = that.currentInMarker.pop();
      if (oldMarkerId !== undefined) {
        var oldMarker = that.segments[oldMarkerId];
        oldMarker.zoom.destroy();
        oldMarker.overview.destroy();
        that.segments.splice(oldMarkerId, 1);
      }
      //Create segment with the endTime set to the start time so it just appears as a marker
      var segmentId = that.createSegment(startTime, startTime, true);
      that.currentInMarker.push(segmentId);
      that.currentSegmentId = segmentId;
      bootstrap.pubsub.emit("segment_created", segmentId);
    });

    bootstrap.pubsub.on("setting_out_marker", function(startTime, segmentId) {
      //Set the endTime of the current segment being created
      var idOfSegment = segmentId || that.currentSegmentId;
      if (idOfSegment !== undefined) {
        var segment = that.segments[idOfSegment];

        if (segment !== undefined) {
          if (segment.startTime > startTime) {
            segment.endTime = segment.startTime;
            segment.startTime = startTime;
          } else {
            segment.endTime = startTime;
          }

          updateSegmentWaveform(segment);
          //Remove in marker reference
          that.currentInMarker.pop();
          that.currentSegmentId = undefined;
          //Store the current segment if the user wishes to play it back
          that.currentSegment = idOfSegment;
          bootstrap.pubsub.emit("segment_created", undefined);
        }
      }
    });

    /* 
    * Makes the segments editable if in cut mode and non-editable if not in cut mode by 
    * changing the visibility of the markers.
    */
    bootstrap.pubsub.on("segment_selection", function(selection) {
      that.segments.forEach(function(segment){
        if (selection === true) {
          segment.editable = false;
          segment.zoom.inMarker.hide();
          segment.zoom.outMarker.hide();
          that.currentSegment = undefined;
        } else {
          segment.editable = true;
          segment.zoom.inMarker.show();
          segment.zoom.outMarker.show();
        }
        segment.zoom.view.segmentLayer.draw();
      });
    });

    /*
    * Play back the current segment using the audio player functions
    */
    bootstrap.pubsub.on("play_current_segment", function() {
      if (that.currentSegment !== undefined) {
        var segment = that.segments[that.currentSegment];

        if (segment !== undefined) {
          //OPTION 1: If current segment is not visible then move the frame to correct position before playing
          if (!waveformView.waveformZoomView.data.segments[segment.id].visible) {
            bootstrap.pubsub.emit("overview_user_seek", segment.startTime);
          }
          //OPTIONS 2: Only play the segment if it is currently visible in zoom view frame 
          //if (waveformView.waveformZoomView.data.segments[segment.id].visible) {
            var currentSegmentStartTime = segment.startTime;
            bootstrap.pubsub.emit("waveform_seek", currentSegmentStartTime);
            peaks.player.play();
          //} 
        }
      }
    });

    /*
    * Stops the audio at the end of the segment using the audio player functions
    */
    bootstrap.pubsub.on("zoomview_playhead_moved", function (currentPixel) {
      if (that.currentSegment !== undefined) {
        var segment = that.segments[that.currentSegment];

        if (segment !== undefined) {
          var currentSegmentEndPixel = waveformView.waveformZoomView.data.at_time(segment.endTime);
          if (currentPixel === currentSegmentEndPixel) {
            peaks.player.pause();
          }
        }
      }
    });
  };
});
