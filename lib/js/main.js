require.config({
  paths: {
    'm': "waveform_viewer"
  }
});

// Load jquery from global if present
if (window.$) {
  define('jquery', [], function() {
      return jQuery;
  });
} else {
  throw new Error("Peaks.js requires jQuery");
}

define([
  'm/bootstrap',
  'm/player/player',
  'm/player/waveform/waveform.core',
  'm/player/waveform/waveform.mixins',
  'templates/main',
  'm/player/player.keyboard',
  'jquery'
  ], function(bootstrap, AudioPlayer, Waveform, mixins, JST, keyboard, $){

  var buildUi = function () {
    return {
      $player: $("#waveform"),
      $zoom: $("#zoom-container"),
      $overview: $("#overview-container")
    };
  };

  var api = { // PUBLIC API
    init: function (opts) {

      if (!opts.audioElement) {
        throw new Error("Please provide an audio element.");
      } else if (!opts.container) {
        throw new Error("Please provide a container object.");
      } else if (opts.container.width < 1 || opts.container.height < 1) {
        throw new Error("Please ensure that the container has a defined width and height.");
      } else {
        api.options = $.extend({
          zoomLevels: [512, 1024, 2048, 4096, 8192, 16384, 32768], // Array of scale factors (samples per pixel) for the zoom levels (big >> small)
          keyboard: false, // Bind keyboard controls
          nudgeIncrement: 0.01, // Keyboard nudge increment in seconds (left arrow/right arrow)
          inMarkerColor: '#a0a0a0', // Colour for the in marker of segments
          outMarkerColor: '#a0a0a0', // Colour for the out marker of segments
          zoomWaveformColor: 'rgba(0, 225, 128, 1)', // Colour for the zoomed in waveform
          overviewWaveformColor: 'rgba(0,0,0,0.2)', // Colour for the overview waveform
          randomizeSegmentColor: true, // Random colour per segment (overrides segmentColor)
          height: 200, // height of the waveform canvases in pixels
          overviewHeight: 50,
          segmentColor: 'rgba(255, 161, 39, 1)' // Colour for segments on the waveform,
        }, opts);

        api.options = $.extend({
          segmentInMarker: mixins.defaultInMarker(api.options),
          segmentOutMarker: mixins.defaultOutMarker(api.options),
          segmentLabelDraw: mixins.defaultSegmentLabelDraw(api.options)
        }, api.options);

        api.currentZoomLevel = 0;
        api.timingDisplay = '2'; //Which style of time axis text to use in the initial setup
        api.speakerName = '2'; //Which style of speaker name display to use in the initial setup
        api.speakerDisplay = '1'; //Which style of speaker presentation to use in the initial setup
        api.inCutMode = false;

        $(api.options.container).html(JST.main).promise().done(function () {

          if (api.options.keyboard) keyboard.init();

          api.player = new AudioPlayer();
          api.player.init(api.options.audioElement);

          api.waveform = new Waveform();
          api.waveform.init(api.options, buildUi());

          window.peaks = api; // Attach to window object for simple external calls

          bootstrap.pubsub.on("waveformOverviewReady", function () {
            api.waveform.openZoomView(); //Create zoom view object
            //Only parse the speaker and keyword data if they have been provided by user i.e. they are not necessary
            //to use the application
            if (api.options.segmentationData) {
              api.waveform.getSpeakerData(api.options); //Create speaker segment object
            } else {
             $("#speaker_text").removeClass("active");
             $("#speaker_text").addClass("deactive");
             $("#speakers_option").attr("disabled", "disabled");
              /*$("#Genders").attr("disabled", "disabled");
              $("#genderText").css({
                "opacity" : "0.2",
                "cursor" : "not-allowed",
              });*/
            }
            if (api.options.tagsData) {
              api.waveform.getTagsData(api.options); //Create tags object
            } else {
              $("#topics_text").removeClass("active");
              $("#topics_text").addClass("deactive");
              $("#topics_option").attr("disabled", "disabled");
              /*$("#Keywords").attr("disabled", "disabled");
              $("#keywordText").css({
                "opacity" : "0.2",
                "cursor" : "not-allowed",
              });*/
            }
            if (api.options.keywordsData) {
              api.waveform.getKeywordData(api.options); //Create keyword object
            } else {
              $("#keywords_text").removeClass("active");
              $("#keywords_text").addClass("deactive");
              $("#keywords_option").attr("disabled", "disabled");
              /*$("#Keywords").attr("disabled", "disabled");
              $("#keywordText").css({
                "opacity" : "0.2",
                "cursor" : "not-allowed",
              });*/
            }
            if (api.options.segments) { // Any initial segments to be displayed?
              api.segments.addSegment(api.options.segments);
            }
          });

        });
      }
    },

    segments: {  // namepsace for segment related methods
      addSegment: function (startTime, endTime, segmentEditable, color, labelText) {
        if (typeof startTime == "number") {
          api.waveform.segments.createSegment(startTime, endTime, segmentEditable, color, labelText);
        } else if (typeof startTime == "object" && startTime.length){
          for (var i = 0; i < startTime.length; i++) {
            var segment = startTime[i];
            api.waveform.segments.createSegment(segment.startTime, segment.endTime, segment.editable, segment.color, segment.labelText);
          }
        }
      },

      // removeSegment: function (segment) {

      // },

      // clearSegments : function () { // Remove all segments

      // },

      getSegments: function () {
        return api.waveform.segments.segments;
      },
      /**
       * Triggers a setting a single editable marker for segment
       *
       * Need to pass in start time of in marker
       */
      setInMarker: function() {
        startTime = api.time.getCurrentTime();
        bootstrap.pubsub.emit("setting_in_marker", startTime);
      },
      /**
       * Triggers a setting a single editable marker for segment
       *
       * Need to pass in start time of out marker
       */
      setOutMarker: function() {
        endTime = api.time.getCurrentTime();
        bootstrap.pubsub.emit("setting_out_marker", endTime);
      },
      /**
       * Hides all segments
       *
       */
      segmentVisibility: function(visible) {
        //User can only make a cut if the segment layer is visible
        if (visible === true) {
          $("#cut").css({
            "opacity" : "1",
            "cursor" : "pointer",
          });
          $("#cut").removeAttr("disabled");
        } else {
          $("#cut").css({
            "opacity" : "0.2",
            "cursor" : "not-allowed",
          });
          $("#cut").attr("disabled", "disabled");
        }
        api.waveform.segments.segmentLayerVisible(visible);
      }, 
      /**
       * Hides all speakers
       *
       */
      genderVisibility: function(visible) {
        api.waveform.speaker_segments.genderLayerVisible(visible);
      }, 
      /**
       * Hides all tags
       *
       */
      tagVisibility: function(visible) {
        api.waveform.tags.tagLayerVisible(visible);
      },
      /**
       * Hides all keywords
       *
       */
      keywordVisibility: function(visible) {
        api.waveform.keywords.keywordLayerVisible(visible);
      },

      cut_mode: function() {
        //CSS changes when user is in cut mode and vice versa when out of cut mode;
          //Allowing the user to set in and out markers
          //Allowing user to play last segment made
          //Not allowing user to change the visibility of the speakers and segments layer
        if (api.waveform.segments.segmentLayerVisibility === true) {
          if ($("#inMarker").attr("disabled") === "disabled") {
            $("#cut").css("opacity", 0.2);
            $("#inMarker").removeAttr("disabled");
            $("#outMarker").removeAttr("disabled");
            $("#inMarker").css("opacity", 1);
            $("#outMarker").css("opacity", 1);
            $("#Genders").attr("disabled", "disabled");
            $("#genderText").css({
              "opacity" : "0.2",
              "cursor" : "not-allowed",
            });
            $("#Segments").attr("disabled", "disabled");
            $("#segmentText").css({
              "opacity" : "0.2",
              "cursor" : "not-allowed",
            });
            $("#playSegment").removeAttr("disabled");
            $("#playSegment").css("opacity", 1);
            api.inCutMode = true;
            api.segments.makeSegment(false);
          } else {
            $("#cut").css("opacity", 1);
            $("#inMarker").attr("disabled", "disabled");
            $("#outMarker").attr("disabled", "disabled");
            $("#playSegment").attr("disabled", "disabled");
            $("#inMarker").css({
              "opacity" : "0.2",
              "cursor" : "not-allowed",
            });
            $("#outMarker").css({
              "opacity" : "0.2",
              "cursor" : "not-allowed",
            });
            $("#playSegment").css({
              "opacity" : "0.2",
              "cursor" : "not-allowed",
            });
            if (api.waveform.speaker_segments) {
              $("#Genders").removeAttr("disabled");
              $("#genderText").css({
                "opacity" : "1",
                "cursor" : "pointer",
              });
            }
            $("#Segments").removeAttr("disabled");
            $("#segmentText").css({
              "opacity" : "1",
              "cursor" : "pointer",
            });
            api.inCutMode = false;
            api.segments.makeSegment(true);
          }             
        }     
      },

      makeSegment: function(selection) {
        //if selection is true then show the speaker data layer and make all segments uneditable,
        //if selection is false then hide the speaker data layer and make all segments editable.
        if ((api.waveform.speaker_segments) && (api.waveform.speaker_segments.speakerLayerVisibility === true) && (api.inCutMode === true)) {
          api.waveform.speaker_segments.inCutMode();
        } else if ((api.waveform.speaker_segments) && (api.waveform.speaker_segments.speakerLayerVisibility === true) && (api.inCutMode === false)) {
          api.waveform.speaker_segments.inCutMode();
        }
        bootstrap.pubsub.emit("segment_selection", selection);
      },

      selection: function () {
        //When user is in the cut mode, allow them to play back the last segment they made
        if (api.inCutMode === true) {
          bootstrap.pubsub.emit("play_current_segment");
        }
      }
    },

    time: {
      getCurrentTime: function () {
        return api.player.getTime();
      }
    },

    zoom: { // namepsace for zooming related methods

      /**
       * Zoom in one level
       */
      zoomIn: function () {
        api.zoom.setZoom(api.currentZoomLevel - 1);
      },

      /**
       * Zoom out one level
       */
      zoomOut: function () {
        api.zoom.setZoom(api.currentZoomLevel + 1);
      },

      /**
       * Given a particular zoom level, triggers a resampling of the data in the zoomed view
       *
       * @param {number} zoomLevelIndex
       */
      setZoom: function (zoomLevelIndex) { // Set zoom level to index of current zoom levels
        if (zoomLevelIndex >= api.options.zoomLevels.length){
          zoomLevelIndex = api.options.zoomLevels.length - 1;
        }

        if (zoomLevelIndex < 0){
          zoomLevelIndex = 0;
        }

        api.currentZoomLevel = zoomLevelIndex;
        bootstrap.pubsub.emit("waveform_zoom_level_changed", zoomLevelIndex, "buttons");
      },
      /**
       * Returns the current zoom level
       *
       * @returns {number}
       */
      getZoom: function () {
        return api.currentZoomLevel;
      },
      /**
       * Returns the back to the overview of audio
       *
       */
      overview: function () {
        api.currentZoomLevel = api.options.zoomLevels.length - 1;
        bootstrap.pubsub.emit("waveform_zoom_level_changed", api.currentZoomLevel, "keyboard");
      },
    },

    option: {
      changeTiming: function(value) {
        api.timingDisplay = value;
        bootstrap.pubsub.emit("timing_display_changed");
      },

      changeSpeakerName: function(value) {
        api.speakerName = value;
      },

      changeSpeakerDisplay: function(value) {
        api.speakerDisplay = value;
        bootstrap.pubsub.emit("speaker_display_changed");
      }
    },

    search: {
      searchSpeakers: function(value) {
        bootstrap.pubsub.emit("search_speakers_request", value);
      }
    }
  };

  return api;

});
