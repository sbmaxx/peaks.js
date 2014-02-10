/**
 * WAVEFORM.CORE.JS
 *
 * This module bootstraps all our waveform components and manages
 * initialisation as well as some component-wide events such as
 * viewport resizing.
 */
define([
  "m/bootstrap",
  "WaveformData",
  "m/player/waveform/waveform.overview",
  "m/player/waveform/waveform.zoomview",
  "m/player/waveform/waveform.segments", 
  "m/player/waveform/waveform.speaker-segments", 
  "m/player/waveform/waveform.tags",
  "m/player/waveform/waveform.keywords",
  ], function (bootstrap, WaveformData, WaveformOverview, WaveformZoomView, WaveformSegments, WaveformSpeakerSegments, WaveformTags, WaveformKeywords) {

  return function () {
    return {
      init: function (options, ui) {
        this.ui = ui; // See buildUi in main.js
        this.options = options;
        var xhr, that = this;

        // Detect if we can support standard XHR of fall back to IE XDR
        if ('withCredentials' in new XMLHttpRequest()) {
          /* supports cross-domain requests */
          xhr = new XMLHttpRequest();
        } else if(typeof XDomainRequest !== "undefined"){
          // Use IE-specific "CORS" code with XDR
          xhr = new XDomainRequest();
        }

        var fileEx = new RegExp(/\.[^.]*$/);
        var extension = that.options.dataUri.match(fileEx);

        // open an XHR request to the data soure file
        xhr.open('GET', that.options.dataUri, true);

        if (extension && (extension[0] === ".dat" || extension[0] === ".DAT" ) ) {
          // Detect if we can support ArrayBuffer for byte data or fall back to JSON
          if (typeof Uint8Array !== "undefined") {
            xhr.responseType = 'arraybuffer';
          } else {
            that.options.dataUri.replace(fileEx, ".json");
            if (console && console.info) console.info("Changing request type to .json as browser does not support ArrayBuffer");
          }
        }

        xhr.onload = function(response) {
          //xhr object, supposedly ArrayBuffer
          //XDomainRequest object (always in JSON)
          if ('XDomainRequest' in window || ('readyState' in this && (this.readyState === 4 && this.status === 200))){
            handleWaveformData(WaveformData.create(response.target));
          }
        };
        xhr.send(); // Look at it go!

        /**
         * Handle data provided by our waveform data module after parsing the XHR request
         * @param  {Object} origWaveformData Parsed ArrayBuffer or JSON response
         */
        var handleWaveformData = function (origWaveformData) {
          that.origWaveformData = origWaveformData;

          var overviewWaveformData = that.origWaveformData.resample(that.ui.$player.width());

          /*var updatedZoomLevels = options.zoomLevels;

          var current_scale = options.zoomLevels[options.zoomLevels.length - 1];

          while (current_scale <= overviewWaveformData.adapter.scale) {
            var scale_to_be_added = current_scale * 2;
            if (scale_to_be_added <= overviewWaveformData.adapter.scale) {
              updatedZoomLevels.push(scale_to_be_added);
            }
            current_scale = scale_to_be_added;
          }

          if (updatedZoomLevels[updatedZoomLevels.length - 1] !== overviewWaveformData.adapter.scale) {
            updatedZoomLevels.push(overviewWaveformData.adapter.scale);
          }

          console.log(updatedZoomLevels);*/

          //Adds the scale of the highest overview level to array of zoom levels 
          options.zoomLevels.push(overviewWaveformData.adapter.scale);

          peaks.currentZoomLevel = options.zoomLevels.length - 1;

          that.waveformOverview = new WaveformOverview(overviewWaveformData, that.ui.$overview, that.options);

          bootstrap.pubsub.emit("waveformOverviewReady");
          that.bindResize();
        };
      },

      openZoomView: function () {
        var that = this;
        $("#waveformZoomContainer").show();

        that.waveformZoomView = new WaveformZoomView(that.origWaveformData, that.ui.$zoom, that.options);

        bootstrap.pubsub.emit("waveform_zoom_start");

        that.segments = new WaveformSegments(that, that.options);
        that.segments.init();
      },

      /**
       * Deal with window resize event over both waveform views.
       */
      bindResize: function () {
        var that = this;
        $(window).on("resize", function () {
          that.ui.$overview.hide();
          that.ui.$zoom.hide();
          if (this.resizeTimeoutId) clearTimeout(this.resizeTimeoutId);
          this.resizeTimeoutId = setTimeout(function(){
            var w = that.ui.$player.width();
            var overviewWaveformData = that.origWaveformData.resample(w);
            bootstrap.pubsub.emit("resizeEndOverview", w, overviewWaveformData);
            bootstrap.pubsub.emit("window_resized", w, that.origWaveformData);
          }, 500);
        });

        bootstrap.pubsub.on("overview_resized", function () {
          that.ui.$overview.fadeIn(200);
        });

        bootstrap.pubsub.on("zoomview_resized", function () {
          that.ui.$zoom.fadeIn(200);
        });
      },

      /**
      * Get the speaker data from the source file provided
      */
      getSpeakerData: function(options) {
        this.options = options;
        var xhr, that = this;

        // Detect if we can support standard XHR of fall back to IE XDR
        if ('withCredentials' in new XMLHttpRequest()) {
          /* supports cross-domain requests */
          xhr = new XMLHttpRequest();
        } else if(typeof XDomainRequest !== "undefined"){
          // Use IE-specific "CORS" code with XDR
          xhr = new XDomainRequest();
        }

        var fileEx = new RegExp(/\.[^.]*$/);
        var extension = that.options.dataUri.match(fileEx);

        // open an XHR request to the data source file
        xhr.open('GET', that.options.segmentationData, true);

        if (extension && (extension[0] === ".json" || extension[0] === ".JSON" ) ) {
          xhr.responseType = 'json';
        } else {
          //throw error and abort
        }

        xhr.onload = function(response) {
          //xhr object, supposedly ArrayBuffer
          //XDomainRequest object (always in JSON)
          var responseTarget = response.target;
          if ('XDomainRequest' in window || ('readyState' in this && (this.readyState === 4 && this.status === 200))){
            if ("response" in responseTarget) {
              var xhrData = ("responseType" in responseTarget) ? responseTarget.response : (responseTarget.responseText || responseTarget.response);
              handleSpeakerData(JSON.parse(xhrData));
            }
          }
        };
        xhr.send(); // Look at it go!

        /**
         * Handle data provided by our HTTP request after parsing the XHR request
         * @param  {Object} origSpeakerData Parsed ArrayBuffer or JSON response
         */
        var handleSpeakerData = function (origSpeakerData) {
          that.origSpeakerData = origSpeakerData;

          that.speaker_segments = new WaveformSpeakerSegments(that, that.origSpeakerData, that.options);
          that.speaker_segments.init();
          that.speaker_segments.createSpeakerSegments();
          that.speaker_segments.genderLayerVisible(false);
        };
      },

      /**
      * Get the tag data from the source file provided
      */
      getTagsData: function(options) {
        this.options = options;
        var xhr, that = this;

        // Detect if we can support standard XHR of fall back to IE XDR
        if ('withCredentials' in new XMLHttpRequest()) {
          /* supports cross-domain requests */
          xhr = new XMLHttpRequest();
        } else if(typeof XDomainRequest !== "undefined"){
          // Use IE-specific "CORS" code with XDR
          xhr = new XDomainRequest();
        }

        var fileEx = new RegExp(/\.[^.]*$/);
        var extension = that.options.dataUri.match(fileEx);

        // open an XHR request to the data soure file
        xhr.open('GET', that.options.tagsData, true);

        if (extension && (extension[0] === ".json" || extension[0] === ".JSON" ) ) {
          xhr.responseType = 'json';
        } else {
          //throw error and abort
        }

        xhr.onload = function(response) {
          //xhr object, supposedly ArrayBuffer
          //XDomainRequest object (always in JSON)
          var responseTarget = response.target;
          if ('XDomainRequest' in window || ('readyState' in this && (this.readyState === 4 && this.status === 200))){
            if ("response" in responseTarget) {
              var xhrData = ("responseType" in responseTarget) ? responseTarget.response : (responseTarget.responseText || responseTarget.response);
              handleTagsData(JSON.parse(xhrData));
            }
          }
        };
        xhr.send(); // Look at it go!

        /**
         * Handle data provided by our HTTP request after parsing the XHR request
         * @param  {Object} origKeywordData Parsed ArrayBuffer or JSON response
         */
        var handleTagsData = function (origTagsData) {
          that.origTagsData = origTagsData;

          that.tags = new WaveformTags(that, that.origTagsData, that.options);
          that.tags.init();
          that.tags.getTagDetails();
          that.tags.tagLayerVisible(false);
        };
      },

      /**
      * Get the keyword data from the source file provided
      */
      getKeywordData: function(options) {
        this.options = options;
        var xhr, that = this;

        // Detect if we can support standard XHR of fall back to IE XDR
        if ('withCredentials' in new XMLHttpRequest()) {
          /* supports cross-domain requests */
          xhr = new XMLHttpRequest();
        } else if(typeof XDomainRequest !== "undefined"){
          // Use IE-specific "CORS" code with XDR
          xhr = new XDomainRequest();
        }

        var fileEx = new RegExp(/\.[^.]*$/);
        var extension = that.options.dataUri.match(fileEx);

        // open an XHR request to the data soure file
        xhr.open('GET', that.options.keywordsData, true);

        if (extension && (extension[0] === ".json" || extension[0] === ".JSON" ) ) {
          xhr.responseType = 'json';
        } else {
          //throw error and abort
        }

        xhr.onload = function(response) {
          //xhr object, supposedly ArrayBuffer
          //XDomainRequest object (always in JSON)
          var responseTarget = response.target;
          if ('XDomainRequest' in window || ('readyState' in this && (this.readyState === 4 && this.status === 200))){
            if ("response" in responseTarget) {
              var xhrData = ("responseType" in responseTarget) ? responseTarget.response : (responseTarget.responseText || responseTarget.response);
              handleKeywordData(JSON.parse(xhrData));
            }
          }
        };
        xhr.send(); // Look at it go!

        /**
         * Handle data provided by our HTTP request after parsing the XHR request
         * @param  {Object} origKeywordData Parsed ArrayBuffer or JSON response
         */
        var handleKeywordData = function (origKeywordData) {
          that.origKeywordData = origKeywordData;

          that.keywords = new WaveformKeywords(that, that.origKeywordData, that.options);
          that.keywords.init();
          that.keywords.getKeywordDetails();
          that.keywords.keywordLayerVisible(false);
        };
      }
    };
  };
});
