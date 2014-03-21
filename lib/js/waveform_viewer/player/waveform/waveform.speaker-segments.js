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
    that.speakerNames = [];
    that.speakerLayerVisibility = false;
    that.searching = false;

    var views = [waveformView.waveformZoomView, waveformView.waveformOverview];

    // EVENTS ====================================================

    bootstrap.pubsub.on("speaker_display_changed", function() {
      if (peaks.speakerDisplay === "1") { //Each speaker shown in a unique colour
        that.speakers.forEach(function(speaker){
          speaker.zoom.waveformShape.setAttrs({
            fill:speaker.speakerColour
          });
          updateSpeakerSegmentWaveform(speaker, true);
        });
      } else if (peaks.speakerDisplay === "3") {
        that.speakers.forEach(function(speaker){
          speaker.zoom.waveformShape.setAttrs({
            fill:""
          });
          updateSpeakerSegmentWaveform(speaker, true);
        });
      }
    });

    bootstrap.pubsub.on("search_speakers_request", function (value) {
      searchSpeaker(value);
    });

    // WAVEFORM SPEAKER SEGMENTS FUNCTIONS =========================================

    /* 
    * Listens for the zoomview waveform to be changed
    */
    that.init = function () {
      bootstrap.pubsub.on("waveform_zoom_displaying", function (time_in, time_out) {
        updateSpeakerSegments();
      });
      /*bootstrap.pubsub.emit("waveform_zoom_displaying_finished", function() {
        updateSpeakerSegments();
      });*/
    };

    var searchSpeaker = function(value) {
      var numOfResults = 0;
      that.speakers.forEach(function(speaker){
        if (speaker.speakerId === value) {
          numOfResults = numOfResults + 1;
          updateSpeakerSegmentWaveform(speaker, true);
        } else {
          updateSpeakerSegmentWaveform(speaker, false);
        }
        that.searching = true;
        speaker.zoom.view.speakerLayer.draw();
      });
      if (numOfResults === 0) {
        that.searching = false;
        updateSpeakerSegments();
      }
      that.searchValue = value;
    };
    /* 
    * Updates each speaker segment when the zoomview waveform is changed.
    * For speed and smoothness of zooming only poisitions of speaker segments are updated,
    * they are not drawn until they are hovered over.
    */
    var updateSpeakerSegments = function() {
      if (that.searching === false) {
        that.speakers.forEach(function(speaker){
          updateSpeakerSegmentWaveform(speaker, true);
        });
      } else {
        searchSpeaker(that.searchValue);
      }
    };

    /* 
    * Updates a signle speaker segment (with the focus) when the zoomview waveform is changed.
    * For speed and smoothness of zooming only poisitions of speaker segments are updated,
    * they are not drawn until they are hovered over.
    */
    var updateSingleSpeakerSegments = function(time_in, time_out) {
      that.speakers.forEach(function(speaker){
        updateSpeakerSegmentWaveformTest(speaker, time_in, time_out);
      });
    };

    this.inCutMode = function() {
      for (var speaker in that.speakers) {
        var speakerSegment = that.speakers[speaker];
        var waveformShapeZoomview = speakerSegment.zoom.waveformShape;
        if (peaks.inCutMode === true) {
          waveformShapeZoomview.setListening(false);
          waveformShapeZoomview.setListening(false);
        } else {
          waveformShapeZoomview.setListening(true);
          waveformShapeZoomview.setListening(true);
        }
        waveformView.waveformZoomView.speakerLayer.draw();
      }
    }
    /* 
    * Change visibility of the speaker segment layer
    *
    * @param  {boolean} visible [Indicates if the speaker segments should be displayed or not]
    */
    this.genderLayerVisible = function(visible) {
      var that = this;

      if (visible === true) {
        waveformView.waveformZoomView.speakerLayer.show();
        waveformView.waveformZoomView.speakerLayer.draw();
      } else {
        waveformView.waveformZoomView.speakerLayer.hide();
        waveformView.waveformZoomView.speakerLayer.draw();
      }

      if (visible === false) {
        //$("#speakerSearch").attr("disabled", "disabled");
        $("#speakerSearch").hide();
        that.speakerLayerVisibility = false;
      } else {
        //$("#speakerSearch").removeAttr("disabled");
        $("#speakerSearch").show();
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
    var createSpeakerSegmentWaveform = function(segmentId, startTime, endTime, speakerId, gender, colour, genderColour) {
      var that = this;

      var speaker = {
        id: segmentId,
        startTime: startTime,
        endTime: endTime,
        speakerId: speakerId,
        gender: gender,
        speakerColour: colour,
        genderColour: genderColour
      };

      var speakerZoomGroup = new Kinetic.Group();
      var speakerOverviewGroup = new Kinetic.Group();

      var speakerGroups = [speakerZoomGroup, speakerOverviewGroup];

      var menter = function (event) {
        if (peaks.speakerDisplay === "3") {
          this.setAttrs({
            fill:genderColour
          });
        }
        if (peaks.speakerName === "2") {
          if ((this.getX() + this.getWidth() + labelLeft.getWidth() + labelLeft.children[0].getPointerWidth()) > this.parent.view.width) {
            labelRight.setAttrs({
              x: this.getX()
            });
            labelRight.show();
            labelRight.moveToTop();
          } else {
            labelLeft.setAttrs({
              x: this.getX() + this.getWidth()
            });
            labelLeft.show();
            labelLeft.moveToTop();
          }
        } else if (peaks.speakerName === "1") {
          $("#speaker-information").css({
            border:'2px solid',
            borderRadius:'5px',
            boxShadow: '1px 2px 5px #888888',
          });
          $("#speaker").text("Speaker: " + speaker.speakerId);
        }
        this.setAttrs({
          shadowColor: 'black',
          shadowBlur: 10,
          shadowOffset: {x:4,y:4},
          shadowOpacity: 0.7,
          opacity:0.6
        });
        this.parent.view.speakerLayer.draw();
        speakerShowing = speaker;
        //this.parent.view.toolTipLayer.draw();
      };

      var mleave = function (event) {
        if (peaks.speakerDisplay === "3") {
          this.setAttrs({
            fill:""
          });
        }
        if (peaks.speakerName === "2") {
          labelLeft.hide();
          labelRight.hide();
        } else if (peaks.speakerName === "1") {
          $("#speaker-information").css({
            border:'',
            borderRadius:'',
            boxShadow: ''
          });
          $("#speaker").text("");
        }
        this.setAttrs({
          opacity:0.4,
          shadowColor: '',
          shadowBlur: 0,
          shadowOffset: {x:0,y:0},
          shadowOpacity: 0,
        });
        this.parent.view.speakerLayer.draw();
        speakerShowing = undefined;
        //this.parent.view.toolTipLayer.draw();
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
            name:"overview",
            //fill: colour,
            //opacity: 0.4
          });
          speakerGroup.add(speakerGroup.waveformShape);
        } else {
          if (!view.toolTipLayer) {
            view.toolTipLayer = new Kinetic.Layer();
            view.stage.add(view.toolTipLayer);
            view.toolTipLayer.moveToTop();
          }
          speakerGroup.waveformShape = new Kinetic.Rect({
            y:3,
            x:0,
            width: 0,
            height: view.height,
            name:"zoom",
            fill: colour,
            opacity: 0.4
          });
          var labelLeft = new Kinetic.Label({
            x: 0,
            y: 28,
            opacity: 1
          });
          labelLeft.add(new Kinetic.Tag({
            fill: 'black',
            pointerDirection: 'left',
            pointerWidth: 20,
            pointerHeight: 28,
            lineJoin: 'round'
          }));
          labelLeft.add(new Kinetic.Text({
            text: speakerId,
            fontFamily: 'Aaargh',
            fontSize: 12,
            padding: 3,
            fill: 'white'
          }));
          var labelRight = new Kinetic.Label({
            x: 0,
            y: 28,
            opacity: 1
          });
          labelRight.add(new Kinetic.Tag({
            fill: 'black',
            pointerDirection: 'right',
            pointerWidth: 20,
            pointerHeight: 28,
            lineJoin: 'round'
          }));
          labelRight.add(new Kinetic.Text({
            text: speakerId,
            fontFamily: 'Aaargh',
            fontSize: 12,
            padding: 3,
            fill: 'white'
          }));
          speakerGroup.add(speakerGroup.waveformShape);
          view.speakerLayer.add(labelLeft.hide());
          view.speakerLayer.add(labelRight.hide());
          //view.toolTipLayer.add(labelLeft.hide());
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

        if (speakerGroup === speakerZoomGroup) {
          speakerGroup.waveformShape.on("mousemove", menter);
          speakerGroup.waveformShape.on("mouseleave", mleave);
          speakerGroup.waveformShape.setListening(true);
        } 

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
    var updateSpeakerSegmentWaveformTest = function (speaker, time_in, time_out) {
      // Binding with data
      waveformView.waveformOverview.data.set_segment(waveformView.waveformOverview.data.at_time(speaker.startTime), waveformView.waveformOverview.data.at_time(speaker.endTime), speaker.id);
      waveformView.waveformZoomView.data.set_segment(waveformView.waveformZoomView.data.at_time(speaker.startTime), waveformView.waveformZoomView.data.at_time(speaker.endTime), speaker.id);

      // Overview
      var overviewStartOffset = waveformView.waveformOverview.data.at_time(speaker.startTime);
      var overviewEndOffset = waveformView.waveformOverview.data.at_time(speaker.endTime);

      mixins.waveformSegmentDrawFunction(waveformView.waveformOverview.data, speaker.id, speaker.overview);

      speaker.overview.setWidth(overviewEndOffset - overviewStartOffset);

      // Zoom
      var zoomStartOffset = waveformView.waveformZoomView.data.at_time(speaker.startTime);
      var zoomEndOffset = waveformView.waveformZoomView.data.at_time(speaker.endTime);

      var frameStartOffset = waveformView.waveformZoomView.data.at_time(time_in);
      var frameEndOffset = waveformView.waveformZoomView.data.at_time(time_in) + waveformView.waveformZoomView.width;

      if (zoomStartOffset < frameStartOffset) zoomStartOffset = frameStartOffset;
      if (zoomEndOffset > frameEndOffset) zoomEndOffset = frameEndOffset;

      if ((speakerShowing !== undefined) && (speaker.id === speakerShowing.id)) {
        var startPixel = zoomStartOffset - frameStartOffset;
        var endPixel = zoomEndOffset - frameStartOffset;
        var segmentLength = zoomEndOffset - zoomStartOffset;

        speaker.zoom.show();
        /*segment.zoom.waveformShape.setDrawFunc(function(canvas) {
          mixins.waveformSegmentDrawFunction.call(this, waveformView.waveformZoomView.data, segment.id, canvas, mixins.interpolateHeight(waveformView.waveformZoomView.height));
        });*/
        mixins.waveformSegmentDrawFunctionTest(waveformView.waveformZoomView.data, speaker.id, speaker.zoom, frameStartOffset, zoomStartOffset, segmentLength);

      } else {
        speaker.zoom.hide();
      }

      speaker.zoom.view.speakerLayer.draw();
      speaker.zoom.view.speakerLayer.moveToTop();
    };
    /* 
    * Update each speaker segment drawing, positions and redraws.
    *
    * @param  {Object} speaker
    */
    var updateSpeakerSegmentWaveform = function (speaker, draw) {
      // Binding with data
      waveformView.waveformOverview.data.set_segment(waveformView.waveformOverview.data.at_time(speaker.startTime), waveformView.waveformOverview.data.at_time(speaker.endTime), speaker.id);
      waveformView.waveformZoomView.data.set_segment(waveformView.waveformZoomView.data.at_time(speaker.startTime), waveformView.waveformZoomView.data.at_time(speaker.endTime), speaker.id);

      // Overview
      var overviewStartOffset = waveformView.waveformOverview.data.at_time(speaker.startTime);
      var overviewEndOffset = waveformView.waveformOverview.data.at_time(speaker.endTime);

      mixins.waveformSegmentDrawFunction(waveformView.waveformOverview.data, speaker.id, speaker.overview);

      speaker.overview.setWidth(overviewEndOffset - overviewStartOffset);

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
        if (draw === true) {
          speaker.zoom.waveformShape.show();
        } else {
          speaker.zoom.waveformShape.hide();
        }
      } else {
        speaker.zoom.hide();
      }

      speaker.zoom.view.speakerLayer.draw();
      speaker.zoom.view.speakerLayer.moveToTop();
    };

    that.createSpeakerSegments = function() {
      if (that.speakerData.segments) {
        var segmentId;
        var segmentArray = that.speakerData.segments;
        var currentSpeakerId = segmentArray[0].speaker["@id"];
        var currentStartTime = segmentArray[0].start;
        var currentEndTime = segmentArray[0].start + segmentArray[0].duration;
        var currentGender = segmentArray[0].speaker.gender;
        var currentColour = getSegmentColor();
        for (var speakerSegment = 1; speakerSegment < segmentArray.length; speakerSegment++) {
          segmentId = "speaker" + that.speakers.length;
          //speaker properties
          if (segmentArray[speakerSegment].speaker["@id"] === currentSpeakerId) {
            var newStartTime = segmentArray[speakerSegment].start;
            var newEndTime = segmentArray[speakerSegment].start + segmentArray[speakerSegment].duration;

            if (newStartTime <= currentEndTime + 1) {
              currentEndTime = newEndTime;
            } else {
              createSpeakerSegment(segmentId, currentStartTime, currentEndTime, currentSpeakerId, currentGender, currentColour);
              currentStartTime = newStartTime;
              currentEndTime = newEndTime;
            }
          } else {
            createSpeakerSegment(segmentId, currentStartTime, currentEndTime, currentSpeakerId, currentGender, currentColour);
            currentSpeakerId = segmentArray[speakerSegment].speaker["@id"];
            currentStartTime = segmentArray[speakerSegment].start;
            currentEndTime = segmentArray[speakerSegment].start + segmentArray[speakerSegment].duration;
            currentGender = segmentArray[speakerSegment].speaker.gender;
            currentColour = getSegmentColor();
          }
          if (speakerSegment === segmentArray.length - 1) {
            createSpeakerSegment(segmentId, currentStartTime, currentEndTime, currentSpeakerId, currentGender, currentColour);
          }
        }
        for (var name in that.speakerNames) {
          if (that.speakerNames[name].charAt(0) != "S") {
            $("#speakers_list").append('<option value="' + that.speakerNames[name] + '"></option>');
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
    var createSpeakerSegment = function(segmentId, startTime, endTime, speakerId, gender, colour) {
      //Pass speaker properties to createSpeakerSegmentWaveform to create the waveform shape
      var genderColour = "blue";
      if (gender === "F") {
        genderColour = "purple";
      }
      var speaker = createSpeakerSegmentWaveform(segmentId, startTime, endTime, speakerId, gender, colour, genderColour);

      updateSpeakerSegmentWaveform(speaker, true);
      that.speakers.push(speaker);
      if (that.speakerNames.indexOf(speaker.speakerId) === -1) {
        that.speakerNames.push(speaker.speakerId);
      }

      speaker.overview.view.speakerLayer.draw();
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
    * Detect if speaker segment is visible
    */
    var isVisible = function (speaker, time_in, time_out) {
      if (((speaker.startTime >= time_in) && (speaker.startTime <= time_out)) || 
        ((speaker.endTime >= time_in) && (speaker.endTime <= time_out)) || 
        ((speaker.startTime >= time_in) && (speaker.startTime <= time_out) && (speaker.endTime >= time_in) && (speaker.endTime <= time_out))) {
        return true;
      } else {
        return false;
      }
    };
  };
});
