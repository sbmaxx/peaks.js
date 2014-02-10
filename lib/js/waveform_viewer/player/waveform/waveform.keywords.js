/**
 * WAVEFORM.KEYWORDS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of the keywords.
 *
 * These are keywords that are only visible on the zoom view
 */
define([
  "m/bootstrap",
  "m/player/waveform/waveform.mixins",
  ], function (bootstrap, mixins) {

  return function (waveformView, keywordData, options) {
    var that = this;

    that.keywords = [];
    that.keywordData = keywordData.words;
    that.keywordLayerVisibility = false;

    var width = waveformView.waveformZoomView.width / that.keywordData.length;
    var count = that.keywordData.length;
    var views = [waveformView.waveformZoomView];

    // WAVEFORM KEYWORDS FUNCTIONS =========================================

    /* 
    * Listens for the zoomview waveform to be changed
    */
    that.init = function () {
      //bootstrap.pubsub.on("waveform_zoom_displaying", this.numOfKeywordsVisible);
      bootstrap.pubsub.on("waveform_zoom_displaying_finished", this.updateKeywords);
    };

    /* 
    * Counts number of keywords visible when zoom level changes
    *
    */
    this.numOfKeywordsVisible = function () {
      count = 0;
      that.keywords.forEach(function(keyword){
        waveformView.waveformZoomView.data.set_segment(waveformView.waveformZoomView.data.at_time(keyword.startTime), waveformView.waveformZoomView.data.at_time(keyword.endTime), keyword.id);

        if (waveformView.waveformZoomView.data.segments[keyword.id].visible) {
          count++;
        }
      });
    };

    /* 
    * Updates each keyword visible when the zoomview waveform is changed
    *
    * @return if at the overview level of zoom as the keywords do not need updating
    */
    this.updateKeywords = function () {
      that.keywords.forEach(function(keyword){
        updateKeywordWaveform(keyword);
      });
    };

    /* 
    *
    * Gets the required details from the keyword data to create a keyword object.
    */
    that.getKeywordDetails = function () {
      for (var i = 0; i < that.keywordData.length; i++) {
        var word = that.keywordData[i].word;
        var score = that.keywordData[i].score;
        var start = that.keywordData[i].start;
        var end = that.keywordData[i].end;
        createKeyword(word, score, start, end);
      }
    };

    /* 
    * Create the keyword object ensuring you give is an ID
    *
    * @param  {string, number, number, number} keyword details taken from data in JSON parsed data
    */
    var createKeyword = function(word, score, startTime, endTime) {
      var keywordId = "keyword" + that.keywords.length;

      //create the keyword object
      var keyword = createKeywordWaveform(keywordId, word, score, startTime, endTime);

      //draw onto waveform
      updateKeywordWaveform(keyword);

      //push into the correct level
      that.keywords.push(keyword);
    };

    /* 
    * Create the keyword object graphic drawings for the overview and zoomview waveform
    *
    * @param  {string, string, string, number, number, number} keyword details taken from data in JSON parsed data
    * @return {Object} keyword object
    */
    var createKeywordWaveform = function(keywordId, word, score, startTime, endTime) {
      var that = this;

      var keyword = {
        id: keywordId,
        startTime: startTime,
        endTime: endTime,
        word: word,
        score : score
      };

      var keywordZoomGroup = new Kinetic.Group();
      var keywordOverviewGroup = new Kinetic.Group();

      var keywordGroups = [keywordZoomGroup];

      var mOverviewEnter = function (event) {
          this.parent.rectangle.setAttrs ({
            visible: true
          });
          this.parent.text.setAttrs ({
            visible: true
          });
        this.parent.view.keywordLayer.draw();
      };

      var mOverviewLeave = function (event) {
        this.parent.rectangle.setAttrs ({
          visible: false
        });
        this.parent.text.setAttrs ({
          visible: false
        });
        this.parent.view.keywordLayer.draw();
      };

      for (var i = 0; i < keywordGroups.length; i++) {
        var view = views[i];
        var keywordGroup = keywordGroups[i];

        if (!view.keywordLayer) {
          view.keywordLayer = new Kinetic.Layer();
          view.stage.add(view.keywordLayer);
          view.keywordLayer.moveToTop();
        }

        if (keywordGroup == keywordZoomGroup) {
          keywordGroup.text = new Kinetic.Text({
            x: 0,
            y: 28,
            text: word,
            fontSize: 10,
            fontFamily: 'Aaargh',
            fill: 'white',
            width: 100,
            padding: 5,
            visible:false
          });
          keywordGroup.rectangle = new Kinetic.Shape({
            drawFunc: function(canvas) {
              mixins.waveformKeywordLabelDrawFunction.call(this, view.data, keyword.id, keywordGroup, canvas);
            },
            fill: "#ffff",
            stroke: "black",
            strokeWidth: 1,
            opacity: 0.4,
            lineJoin: 'round',
            visible:false
          });
          keywordGroup.hitRegion = new Kinetic.Rect({
            x: 0,
            y: 0,
            height: 240,
            fill: "#ddd",
            opacity: 0,
          });
          keywordGroup.add(keywordGroup.rectangle);
          keywordGroup.add(keywordGroup.text);
          keywordGroup.add(keywordGroup.hitRegion);
        }

        //Interactions
        keywordGroup.hitRegion.on("mouseenter", mOverviewEnter);
        keywordGroup.hitRegion.on("mouseleave", mOverviewLeave);

        view.keywordLayer.add(keywordGroup);
        view.keywordLayer.draw();
      }

      keyword.zoom = keywordZoomGroup;
      keyword.zoom.view = waveformView.waveformZoomView;

      return keyword;
    };

    /* 
    * Update each keyword positioning when the zoom level is changed.
    *
    * @param  {Object} keyword
    */
    var updateKeywordWaveform = function (keyword) {
      // Binding with data
      waveformView.waveformZoomView.data.set_segment(waveformView.waveformZoomView.data.at_time(keyword.startTime), waveformView.waveformZoomView.data.at_time(keyword.endTime), keyword.id);

      // Zoom
      var zoomStartOffset = waveformView.waveformZoomView.data.at_time(keyword.startTime);
      var zoomEndOffset = waveformView.waveformZoomView.data.at_time(keyword.endTime);

      var frameStartOffset = waveformView.waveformZoomView.frameOffset;
      var frameEndOffset = waveformView.waveformZoomView.frameOffset + waveformView.waveformZoomView.width;

      if (zoomStartOffset < frameStartOffset) zoomStartOffset = frameStartOffset;
      if (zoomEndOffset > frameEndOffset) zoomEndOffset = frameEndOffset;

      if (waveformView.waveformZoomView.data.segments[keyword.id].visible) {
        var startPixel = zoomStartOffset - frameStartOffset;
        var endPixel = zoomEndOffset - frameStartOffset;

        keyword.zoom.show();

        width = waveformView.waveformZoomView.width / count;

        mixins.waveformKeywordDrawFunction(waveformView.waveformZoomView.data, keyword.id, keyword.zoom, width);

        keyword.zoom.rectangle.setDrawFunc(function(canvas) {
          mixins.waveformKeywordLabelDrawFunction.call(this, waveformView.waveformZoomView.data, keyword.id, keyword.zoom, canvas);
        });
      } else {
        keyword.zoom.hide();
      }

      keyword.zoom.view.keywordLayer.draw();
    };

    /* 
    * Change visibility of the keyword layer
    *
    * @param  {boolean} Indicates if the keywords should be displayed or not
    */
    this.keywordLayerVisible = function(visible) {
      var that = this;

      if (visible === true) {
        waveformView.waveformZoomView.keywordLayer.show();
        waveformView.waveformZoomView.keywordLayer.draw();
      } else {
        waveformView.waveformZoomView.keywordLayer.hide();
        waveformView.waveformZoomView.keywordLayer.draw();
      }
      if (visible === false) {
        that.keywordLayerVisibility = false;
      } else {
        that.keywordLayerVisibility = true;
      }
    };

    // EVENTS ====================================================
  };
});