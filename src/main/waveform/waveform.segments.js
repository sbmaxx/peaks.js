/**
 * WAVEFORM.SEGMENTS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of segments
 */
define([
  "peaks/waveform/waveform.mixins"
  ], function (mixins) {
  'use strict';

  return function (peaks) {
    var self = this;

    self.segments = [];
    self.currentInMarker = [];
    self.views = [peaks.waveform.waveformZoomView, peaks.waveform.waveformOverview].map(function(view){
      if (!view.segmentLayer) {
        view.segmentLayer = new Kinetic.Layer();
        view.stage.add(view.segmentLayer);
        view.segmentLayer.moveToTop();
      }

      return view;
    });

    var createSegmentWaveform = function (segmentId, startTime, endTime, editable, color, labelText) {
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

      segmentGroups.forEach(function(segmentGroup, i){
        var view = self.views[i];

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

        segmentGroup.label = new peaks.options.segmentLabelDraw(segmentGroup, segment);
        segmentGroup.add(segmentGroup.label.hide());

        if (editable) {
          var draggable = true;
          if (segmentGroup === segmentOverviewGroup) {
            draggable = false;
          }
          segmentGroup.inMarker = new peaks.options.segmentInMarker(draggable, segmentGroup, segment, segmentHandleDrag);
          segmentGroup.add(segmentGroup.inMarker);

          segmentGroup.outMarker = new peaks.options.segmentOutMarker(draggable, segmentGroup, segment, segmentHandleDrag);
          segmentGroup.add(segmentGroup.outMarker);
        }

        view.segmentLayer.add(segmentGroup);
      });

      segment.zoom = segmentZoomGroup;
      segment.zoom.view = peaks.waveform.waveformZoomView;
      segment.overview = segmentOverviewGroup;
      segment.overview.view = peaks.waveform.waveformOverview;
      segment.color = color;
      segment.editable = editable;

      return segment;
    };

    var updateSegmentWaveform = function (segment) {
      // Binding with data
      peaks.waveform.waveformOverview.data.set_segment(peaks.waveform.waveformOverview.data.at_time(segment.startTime), peaks.waveform.waveformOverview.data.at_time(segment.endTime), segment.id);
      peaks.waveform.waveformZoomView.data.set_segment(peaks.waveform.waveformZoomView.data.at_time(segment.startTime), peaks.waveform.waveformZoomView.data.at_time(segment.endTime), segment.id);

      // Overview
      var overviewStartOffset = peaks.waveform.waveformOverview.data.at_time(segment.startTime);
      var overviewEndOffset = peaks.waveform.waveformOverview.data.at_time(segment.endTime);

      /*segment.overview.waveformShape.setDrawFunc(function(canvas) {
        mixins.waveformSegmentDrawFunction.call(this, peaks.waveform.waveformOverview.data, segment.id, canvas, mixins.interpolateHeight(peaks.waveform.waveformOverview.height));
      });*/

      mixins.waveformOverviewSegmentDrawFunction(peaks.waveform.waveformOverview.data, segment.id, segment.overview);

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


      // Zoom
      var zoomStartOffset = peaks.waveform.waveformZoomView.data.at_time(segment.startTime);
      var zoomEndOffset = peaks.waveform.waveformZoomView.data.at_time(segment.endTime);

      var frameStartOffset = peaks.waveform.waveformZoomView.frameOffset;
      var frameEndOffset = peaks.waveform.waveformZoomView.frameOffset + peaks.waveform.waveformZoomView.width;

      if (zoomStartOffset < frameStartOffset) zoomStartOffset = frameStartOffset;
      if (zoomEndOffset > frameEndOffset) zoomEndOffset = frameEndOffset;

      if (peaks.waveform.waveformZoomView.data.segments[segment.id].visible) {
        var startPixel = zoomStartOffset - frameStartOffset;
        var endPixel = zoomEndOffset - frameStartOffset;

        segment.zoom.show();
        /*segment.zoom.waveformShape.setDrawFunc(function(canvas) {
          mixins.waveformSegmentDrawFunction.call(this, peaks.waveform.waveformZoomView.data, segment.id, canvas, mixins.interpolateHeight(peaks.waveform.waveformZoomView.height));
        });*/
        mixins.waveformZoomviewSegmentDrawFunction(peaks.waveform.waveformZoomView.data, segment.id, segment.zoom);

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

      // Label
      // segment.zoom.label.setX(0);
      // segment.zoom.label.setY(12);
    };

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
      self.currentInMarker.pop();
    };

    var getSegmentColor = function () {
      var c;
      if (peaks.options.randomizeSegmentColor) {
        var g = function () { return Math.floor(Math.random()*255); };
        c = 'rgba('+g()+', '+g()+', '+g()+', 1)';
      } else {
        c = peaks.options.segmentColor;
      }
      return c;
    };

    this.init = function () {
      peaks.on("waveform_zoom_displaying", self.updateSegments);

      peaks.emit("segments.ready");
    };

    /**
     * Update the segment positioning accordingly to each view zoom level and so on.
     *
     * Also performs the rendering.
     *
     * @api
     */
    this.updateSegments = function () {
      this.segments.getSegments().forEach(updateSegmentWaveform);
      self.render();
      /*if (that.currentInMarker.length == 1) {
        updateMarkers(that.currentInMarker[0]);
      }
      if (that.currentOutMarker.length == 1) {
        updateMarkers(that.currentOutMarker[0]);
      }*/
    };

    /**
     * Manage a new segment and propagates it into the different views
     *
     * @api
     * @param {Number} startTime
     * @param {Number} endTime
     * @param {Boolean} editable
     * @param {String=} color
     * @param {String=} labelText
     * @return {Object}
     */
    this.createSegment = function (startTime, endTime, editable, color, labelText) {
      var segmentId = "segment" + self.segments.length;

      if ((startTime >= 0) === false){
        throw new TypeError("[waveform.segments.createSegment] startTime should be a positive value");
      }

      if ((endTime > 0) === false){
        throw new TypeError("[waveform.segments.createSegment] endTime should be a positive value");
      }

      if ((endTime > startTime) === false){
        throw new RangeError("[waveform.segments.createSegment] endTime should be higher than startTime");
      }

      var segment = createSegmentWaveform(segmentId, startTime, endTime, editable, color, labelText);

      updateSegmentWaveform(segment);
      self.segments.push(segment);

      return segment;
    };

    this.remove = function removeSegment(segment){
      var index = null;

      this.segments.some(function(s, i){
        if (s === segment){
          index = i;
          return true;
        }
      });

      if (typeof index === 'number'){
        segment = this.segments[index];

        segment.overview.destroy();
        segment.zoom.destroy();
      }

      return index;
    };

    /**
     * Performs the rendering of the segments on screen
     *
     * @api
     * @see https://github.com/bbcrd/peaks.js/pull/5
     * @since 0.0.2
     */
    this.render = function renderSegments(){
      self.views.forEach(function(view){
        view.segmentLayer.draw();
      });
    };

    /*var updateMarkers = function(marker) {
      // Overview pixel index
      var overviewStartX = waveformView.waveformOverview.data.at_time(marker.Time);

      mixins.waveformOverviewMarkerDrawFunction(overviewStartX, marker.overview, marker.overview.view);

      marker.overview.view.segmentLayer.draw();

      var zoomStartX = waveformView.waveformZoomView.data.at_time(marker.Time);

      var frameStartOffset = waveformView.waveformZoomView.frameOffset;

      if (zoomStartX < frameStartOffset) {
        marker.zoom.hide();
      }
      else {
        marker.zoom.show();
        var startPixel = zoomStartX - frameStartOffset;
        mixins.waveformOverviewMarkerDrawFunction(startPixel, marker.zoom, marker.zoom.view);
      }
    };

    //Should be same process for in and out marker
    var setSegmentInMarker = function(startTime, markerType) {
      var marker = {
        Time: startTime
      };

      //Create Marker Line
      var markerZoomGroup = new Kinetic.Group();
      var markerOverviewGroup = new Kinetic.Group();

      var markerGroups = [markerZoomGroup, markerOverviewGroup];

      for (var i = 0; i < markerGroups.length; i++) {
        var view = views[i];
        var markerGroup = markerGroups[i];

        if (!view.segmentLayer) {
          view.segmentLayer = new Kinetic.Layer();
          view.stage.add(view.segmentLayer);
          view.segmentLayer.moveToTop();
        }

        markerGroup.waveformShape = new Kinetic.Line({
          points: [0, 0, 0, view.height],
          stroke: "a0a0a0",
          strokeWidth: 1
        });

        markerGroup.add(markerGroup.waveformShape);

        view.segmentLayer.add(markerGroup);
        view.segmentLayer.draw();
      }

      marker.zoom = markerZoomGroup;
      marker.zoom.view = waveformView.waveformZoomView;
      marker.overview = markerOverviewGroup;
      marker.overview.view = waveformView.waveformOverview;

      console.log("In Marker", marker, "startTime", startTime);

      return marker;
    };

    this.setSegmentOutMarker = function(endTime) {

    };*/

    // EVENTS ====================================================

    peaks.on("setting_in_marker", function(startTime) {
      /*var marker = setSegmentInMarker(startTime, markerType);
      if (markerType == "in") {
        var oldMarker = that.currentInMarker.pop();
        if (oldMarker != undefined) {
          oldMarker.zoom.waveformShape.destroy();
          oldMarker.overview.waveformShape.destroy();
        }
        that.currentInMarker.push(marker);
      } else {
        that.currentOutMarker.pop();
        that.currentOutMarker.push(marker);
      }
      //Join in and out markers when both have been set
      /*if ((that.currentInMarker.length == 1) && (that.currentOutMarker.length == 1)) {
        //Create a segment using the in and out marker start and end time (returns a segment)
        //updateSegmentwaveform(segment)
        //Empty arrays and remove lines
      }*/

      //Update Markers to draw
      //updateMarkers(marker);

      var segment = self.createSegment(startTime, startTime, true);
      var oldMarker = self.currentInMarker.pop();
      if (oldMarker !== undefined) {
        oldMarker.zoom.destroy();
        oldMarker.overview.destroy();
      }

      self.currentInMarker.push(segment);
      segment.zoom.inMarker.attrs.draggable = false;
      self.peaks.emit("segment_created", segment);
    });

    peaks.on("setting_out_marker", function(startTime, segment) {
      segment.endTime = startTime;
      segment.zoom.inMarker.attrs.draggable = true;

      updateSegmentWaveform(segment);
      self.currentInMarker.pop();
    });
  };
});