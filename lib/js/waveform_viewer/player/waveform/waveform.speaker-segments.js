/**
 * WAVEFORM.SPEAKER-SEGMENTS.JS
 *
 * This module handles all functionality related to adding information on
 * the speakers onto the waveform. 
 *
 * TO DO: updatespeakerposition, updatespeakerwaveform combine somehow as a lot of code is repeated
 *        hidegenderlayer and genderlayervisibility combine somehow as a lot of of code repeated
 */
define([
  "m/bootstrap",
  "m/player/waveform/waveform.mixins",
  ], function (bootstrap, mixins) {

  return function (waveformView, speakerData, options) {
    var that = this;
    var speakerShowing;
    that.speakerData = speakerData;
    that.speakers = [];
    that.speakerLayerVisibility = true;

    var views = [waveformView.waveformZoomView, waveformView.waveformOverview];

    // EVENTS ====================================================

    // WAVEFORM SPEAKER SEGMENTS FUNCTIONS =========================================

    /* 
    * Listens for the zoomview waveform to be changed
    */
    that.init = function () {
      bootstrap.pubsub.on("waveform_zoom_displaying", this.updateSpeakerSegments);
    };

    /* 
    * Updates each speaker segment when the zoomview waveform is changed.
    * For speed and smoothness of zooming only poisitions of speaker segments are updated,
    * they are not drawn until they are hovered over.
    */
    this.updateSpeakerSegments = function() {
      that.speakers.forEach(function(speaker){
        updateSpeakerSegmentsPositions(speaker);
        //updateSpeakerSegmentWaveform(speaker);
      });
    };

    /* 
    * Updates each speaker segment position when zoom level is changed.
    *
    * @param {Object} speaker
    */
    var updateSpeakerSegmentsPositions = function(speaker) {
      // Binding with data
      waveformView.waveformOverview.data.set_segment(waveformView.waveformOverview.data.at_time(speaker.startTime), waveformView.waveformOverview.data.at_time(speaker.endTime), speaker.id);
      waveformView.waveformZoomView.data.set_segment(waveformView.waveformZoomView.data.at_time(speaker.startTime), waveformView.waveformZoomView.data.at_time(speaker.endTime), speaker.id);

      // Overview
      var overviewStartOffset = waveformView.waveformOverview.data.at_time(speaker.startTime);
      var overviewEndOffset = waveformView.waveformOverview.data.at_time(speaker.endTime);

      /*segment.overview.waveformShape.setDrawFunc(function(canvas) {
        mixins.waveformSegmentDrawFunction.call(this, waveformView.waveformOverview.data, segment.id, canvas, mixins.interpolateHeight(waveformView.waveformOverview.height));
      });*/

      mixins.waveformSegmentDrawFunction(waveformView.waveformOverview.data, speaker.id, speaker.overview);

      speaker.overview.setWidth(overviewEndOffset - overviewStartOffset);

      //speaker.overview.view.speakerLayer.draw();

      // Zoom
      var zoomStartOffset = waveformView.waveformZoomView.data.at_time(speaker.startTime);
      var zoomEndOffset = waveformView.waveformZoomView.data.at_time(speaker.endTime);

      var frameStartOffset = waveformView.waveformZoomView.frameOffset;
      var frameEndOffset = waveformView.waveformZoomView.frameOffset + waveformView.waveformZoomView.width;

      if (zoomStartOffset < frameStartOffset) zoomStartOffset = frameStartOffset;
      if (zoomEndOffset > frameEndOffset) zoomEndOffset = frameEndOffset;

      if (waveformView.waveformZoomView.data.segments[speaker.id].visible) {
        var startPixel = zoomStartOffset - frameStartOffset;
        var endPixel = zoomEndOffset - frameStartOffset;

        speaker.zoom.show();
        /*segment.zoom.waveformShape.setDrawFunc(function(canvas) {
          mixins.waveformSegmentDrawFunction.call(this, waveformView.waveformZoomView.data, segment.id, canvas, mixins.interpolateHeight(waveformView.waveformZoomView.height));
        });*/
        mixins.waveformSegmentDrawFunction(waveformView.waveformZoomView.data, speaker.id, speaker.zoom);

      } else {
        speaker.zoom.hide();
      }

      speaker.zoom.view.speakerLayer.draw();

    };

    /* 
    * Change visibility of the speaker segment layer
    *
    * @param  {boolean} visible [Indicates if the speaker segments should be displayed or not]
    */
    this.genderLayerVisible = function(visible) {
      var that = this;

      for (var speaker in that.speakers) {
        var speakerSegment = that.speakers[speaker];
        var waveformShapeOverview = speakerSegment.overview.waveformShape;
        var waveformShapeZoomview = speakerSegment.zoom.waveformShape;
        var colour = speakerSegment.colour;
        if (peaks.inCutMode === false) {
          waveformShapeOverview.setListening(false);
          waveformShapeOverview.setListening(false);
        }
        waveformShapeZoomview.setListening(false);
        waveformShapeZoomview.setListening(false);
        if (visible === true) {
          colour = "";
          waveformShapeOverview.setListening(true);
          waveformShapeOverview.setListening(true);
          waveformShapeZoomview.setListening(true);
          waveformShapeZoomview.setListening(true);
        } 
        /*waveformShape.setAttrs({
          fill: colour,
          opacity: 0.4
        });*/
      }
      that.speakers.forEach(function(speaker){
        updateSpeakerSegmentWaveform(speaker);
      });
      if (visible === false) {
        that.speakerLayerVisibility = false;
      } else {
        that.speakerLayerVisibility = true;
      }
    };

    /* 
    * Disables the events on the zoom speaker segments ONLY when in cut mode
    *
    * @param  {boolean} visible [Indicates if the speaker segments should be displayed or not]
    */    
    /*this.hideZoomGenderSegments = function(visible) {
      var that = this;

      for (var speaker in that.speakers) {
        var speakerSegment = that.speakers[speaker];
        var waveformShapeZoomview = speakerSegment.zoom.waveformShape;
        var colour = speakerSegment.colour;
        waveformShapeZoomview.setListening(false);
        waveformShapeZoomview.setListening(false);
        if (visible === true) {
          colour = "";
          waveformShapeZoomview.setListening(true);
          waveformShapeZoomview.setListening(true);
        } 
      }
      that.speakers.forEach(function(speaker){
        updateSpeakerSegmentWaveform(speaker);
      });
      if (visible === false) {
        that.speakerLayerVisibility = false;
      } else {
        that.speakerLayerVisibility = true;
      }
    };*/

    /* 
    * Create the speaker segment object graphic drawings for the overview and zoomview waveform
    *
    * @param  {string} segmentId
    * @param  {int} startTime
    * @param  {int} endTime
    * @param  {string} speakerId
    * @param  {string} gender
    * @param  {string} colour
    *
    * @return {Object} speaker segment object
    */
    var createSpeakerSegmentWaveform = function(segmentId, startTime, endTime, speakerId, gender, colour) {
      var that = this;

      var speaker = {
        id: segmentId,
        startTime: startTime,
        endTime: endTime,
        speakerId: speakerId,
        gender: gender,
        labelText: speakerId || "",
        colour: colour
      };

      var speakerZoomGroup = new Kinetic.Group();
      var speakerOverviewGroup = new Kinetic.Group();

      var speakerGroups = [speakerZoomGroup, speakerOverviewGroup];

      var menter = function (event) {
        $("#speaker-information").css({
          border:'2px solid',
          borderRadius:'5px',
          boxShadow: '1px 2px 5px #888888',
        });
        $("#speaker").text("Speaker: " + speaker.labelText);
        this.setAttrs({
          fill: colour,
          opacity:0.4
        });
        this.parent.view.speakerLayer.draw();
      };

      var mleave = function (event) {
        $("#speaker-information").css({
          border:'',
          borderRadius:'',
          boxShadow: ''
        });
        $("#speaker").text("");
        this.setAttrs({
          fill:"",
          opacity:0.4
        });
        this.parent.view.speakerLayer.draw();
      };

      for (var i = 0; i < speakerGroups.length; i++) {
        var view = views[i];
        var speakerGroup = speakerGroups[i];

        if (!view.speakerLayer) {
          view.speakerLayer = new Kinetic.Layer();
          view.stage.add(view.speakerLayer);
          view.speakerLayer.moveToTop();
        }

        if (speakerGroup == speakerOverviewGroup) {
          speakerGroup.waveformShape = new Kinetic.Rect({
            y:11,
            x:0,
            width: 0,
            height: 28,
            name:"overview"
          });
        } else {
          speakerGroup.waveformShape = new Kinetic.Rect({
            y:3,
            x:0,
            width: 0,
            height: view.height,
            name:"zoom"
          });
        }

        /*if (view == waveformView.waveformZoomView) {
          speakerGroup.genderText = new Kinetic.Text({
            x: 0,
            y: view.height - 15,
            text: gender,
            fontSize: 9,
            fontFamily: 'Aaargh',
            fill: '#555',
            width: 0,
            padding: 5,
            align: 'center'
          });

          speakerGroup.rectangle = new Kinetic.Rect({
            x: 0,
            y: view.height - 11,
            width: 0,
            height: speakerGroup.genderText.getHeight(),
            fill: "#ddd",
            stroke: "black",
            strokeWidth: 2,
            opacity: 0.5
          });

          speakerGroup.add(speakerGroup.rectangle);
          speakerGroup.add(speakerGroup.genderText);
        }*/

        speakerGroup.waveformShape.on("mousemove", menter);
        speakerGroup.waveformShape.on("mouseout", mleave);

        speakerGroup.waveformShape.setListening(true);

        speakerGroup.add(speakerGroup.waveformShape);

        //speakerGroup.label = new options.segmentLabelDraw(speakerGroup, speaker);
        //speakerGroup.add(speakerGroup.label.hide());

        view.speakerLayer.add(speakerGroup);
        view.speakerLayer.draw();
      }

      speaker.zoom = speakerZoomGroup;
      speaker.zoom.view = waveformView.waveformZoomView;
      speaker.overview = speakerOverviewGroup;
      speaker.overview.view = waveformView.waveformOverview;

      return speaker;
    };

    /* 
    * Update each speaker segment drawing, positions and redraws.
    *
    * @param  {Object} speaker
    */
    var updateSpeakerSegmentWaveform = function (speaker) {
      // Binding with data
      waveformView.waveformOverview.data.set_segment(waveformView.waveformOverview.data.at_time(speaker.startTime), waveformView.waveformOverview.data.at_time(speaker.endTime), speaker.id);
      waveformView.waveformZoomView.data.set_segment(waveformView.waveformZoomView.data.at_time(speaker.startTime), waveformView.waveformZoomView.data.at_time(speaker.endTime), speaker.id);

      // Overview
      var overviewStartOffset = waveformView.waveformOverview.data.at_time(speaker.startTime);
      var overviewEndOffset = waveformView.waveformOverview.data.at_time(speaker.endTime);

      /*segment.overview.waveformShape.setDrawFunc(function(canvas) {
        mixins.waveformSegmentDrawFunction.call(this, waveformView.waveformOverview.data, segment.id, canvas, mixins.interpolateHeight(waveformView.waveformOverview.height));
      });*/

      mixins.waveformSegmentDrawFunction(waveformView.waveformOverview.data, speaker.id, speaker.overview);

      speaker.overview.setWidth(overviewEndOffset - overviewStartOffset);

      speaker.overview.view.speakerLayer.draw();

      // Zoom
      var zoomStartOffset = waveformView.waveformZoomView.data.at_time(speaker.startTime);
      var zoomEndOffset = waveformView.waveformZoomView.data.at_time(speaker.endTime);

      var frameStartOffset = waveformView.waveformZoomView.frameOffset;
      var frameEndOffset = waveformView.waveformZoomView.frameOffset + waveformView.waveformZoomView.width;

      if (zoomStartOffset < frameStartOffset) zoomStartOffset = frameStartOffset;
      if (zoomEndOffset > frameEndOffset) zoomEndOffset = frameEndOffset;

      if (waveformView.waveformZoomView.data.segments[speaker.id].visible) {
        var startPixel = zoomStartOffset - frameStartOffset;
        var endPixel = zoomEndOffset - frameStartOffset;

        speaker.zoom.show();
        /*segment.zoom.waveformShape.setDrawFunc(function(canvas) {
          mixins.waveformSegmentDrawFunction.call(this, waveformView.waveformZoomView.data, segment.id, canvas, mixins.interpolateHeight(waveformView.waveformZoomView.height));
        });*/
        mixins.waveformSegmentDrawFunction(waveformView.waveformZoomView.data, speaker.id, speaker.zoom);

      } else {
        speaker.zoom.hide();
      }

      speaker.zoom.view.speakerLayer.draw();
    };

    that.createSpeakerSegments = function() {
      if (that.speakerData.segments) {
        var segmentId;
        var segmentArray = that.speakerData.segments;
        var currentSpeakerId = segmentArray[0].speaker["@id"];
        var currentStartTime = segmentArray[0].start;
        var currentEndTime = segmentArray[0].start + segmentArray[0].duration;
        var currentGender = segmentArray[0].speaker.gender;
        for (var speakerSegment = 1; speakerSegment < segmentArray.length; speakerSegment++) {
          segmentId = "speaker" + that.speakers.length;
          //speaker properties
          if (segmentArray[speakerSegment].speaker["@id"] === currentSpeakerId) {

            var newStartTime = segmentArray[speakerSegment].start;
            var newEndTime = segmentArray[speakerSegment].start + segmentArray[speakerSegment].duration;

            if (newStartTime <= currentEndTime + 1) {
              currentEndTime = newEndTime;
            } else {
              createSpeakerSegment(segmentId, currentStartTime, currentEndTime, currentSpeakerId, currentGender);
              currentStartTime = newStartTime;
              currentEndTime = newEndTime;
            }
          } else {
            createSpeakerSegment(segmentId, currentStartTime, currentEndTime, currentSpeakerId, currentGender);
            currentSpeakerId = segmentArray[speakerSegment].speaker["@id"];
            currentStartTime = segmentArray[speakerSegment].start;
            currentEndTime = segmentArray[speakerSegment].start + segmentArray[speakerSegment].duration;
            currentGender = segmentArray[speakerSegment].speaker.gender;
          }
        }
      } else {
        //throw new error and abort load
      }
    };


    /* 
    * Create the speaker segment
    *
    * @param  {string} segmentId
    * @param  {int} startTime
    * @param  {int} endTime
    * @param  {string} speakerId
    * @param  {string} gender
    */
    var createSpeakerSegment = function(segmentId, startTime, endTime, speakerId, gender) {
      //Pass speaker properties to createSpeakerSegmentWaveform to create the waveform shape
      var colour = "blue";
      if (gender === "F") {
        colour = "purple";
      }
      var speaker = createSpeakerSegmentWaveform(segmentId, startTime, endTime, speakerId, gender, colour);

      updateSpeakerSegmentsPositions(speaker);
      //updateSpeakerSegmentWaveform(speaker);
      that.speakers.push(speaker);
    };
  };
});
