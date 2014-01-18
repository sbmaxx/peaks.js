/**
 * WAVEFORM.KEYWORDS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of the keywords
 */
define([
  "m/bootstrap",
  "m/player/waveform/waveform.mixins",
  ], function (bootstrap, mixins) {

  return function (waveformView, keywordData, options) {
    var that = this;

    that.keywords = [];
    that.keywordData = keywordData.tags;
    that.keywordLevels = [];

    that.hideKeywords = false;
    that.keywordLayerVisibility = true;

    that.confidenceMax = 1;
    that.confidenceMin = 0;

    var views = [waveformView.waveformZoomView, waveformView.waveformOverview];

    that.init = function () {
      bootstrap.pubsub.on("waveform_zoom_displaying", this.updateKeywords);
    };

    this.updateKeywords = function () {
      if (peaks.currentZoomLevel === peaks.options.zoomLevels.length - 1) {
        return;
      }
      that.keywords.forEach(function(keyword){
        updateKeywordWaveform(keyword);
      });
    };

    that.getKeywordDetails = function () {
      var currentKeywordLevel = that.confidenceMin;

      for (var i = 0; i < options.zoomLevels.length + 1; i++) {
        var keywordLevel = that.confidenceMin + (i*(that.confidenceMax-that.confidenceMin)/options.zoomLevels.length);
        that.keywordLevels.push(keywordLevel);
        currentKeywordLevel = keywordLevel;
      }

      that.keywordLevels = that.keywordLevels.reverse();

      for (var tag in that.keywordData) {
        var labelText = that.keywordData[tag].label;
        var confidenceLevel = that.keywordData[tag].score;
        var timestamps = that.keywordData[tag].timestamps;
        for (var x = 0; x < timestamps.length; x++) {
          var end = timestamps[x].end;
          var start = timestamps[x].start;
          createKeyword(labelText, confidenceLevel, start, end);
        }
      }
    };

    var createKeyword = function(labelText, confidenceLevel, startTime, endTime) {
      var keywordId = "keyword" + that.keywords.length;
      var groupId = "";
      for (var i = 0; i < that.keywordLevels.length; i++) {
        if ((confidenceLevel <= that.keywordLevels[i]) && (confidenceLevel >= that.keywordLevels[i+1])) {
          groupId = i;
        }
      }

      //create the keyword object
      var keyword = createKeywordWaveform(keywordId, groupId, labelText, confidenceLevel, startTime, endTime);

      //draw onto waveform
      updateKeywordWaveform(keyword);

      //push into the correct level
      that.keywords.push(keyword);
    };

    var createKeywordWaveform = function(keywordId, groupId, labelText, confidenceLevel, startTime, endTime) {
      var that = this;

      var keyword = {
        id: keywordId,
        group: groupId,
        startTime: startTime,
        endTime: endTime,
        labelText: labelText || "",
        confidenceLevel:confidenceLevel
      };

      var keywordZoomGroup = new Kinetic.Group();
      var keywordOverviewGroup = new Kinetic.Group();

      var keywordGroups = [keywordZoomGroup, keywordOverviewGroup];

      var mOverviewEnter = function (event) {
        this.parent.rect.setAttrs({
          x: (this.parent.getStage().getPointerPosition().x) //- this.parent.rect.getWidth()/2
        });
        this.parent.text.setAttrs({
          x: (this.parent.getStage().getPointerPosition().x) //- this.parent.text.getWidth()/2
        });
        this.parent.rect.show();
        this.parent.text.show();
        this.parent.view.keywordLayer.draw();
        this.parent.view.keywordLayer.moveToTop();
      };

      var mOverviewLeave = function (event) {
        this.parent.rect.hide();
        this.parent.text.hide();
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

        if (keywordGroup == keywordOverviewGroup) {
          keywordGroup.waveformShapeOne = new Kinetic.Line({
            points: [0,0,0,0],
            stroke: 'black',
            strokeWidth: 2,
          });
          keywordGroup.waveformShapeTwo = new Kinetic.Line({
            points: [0,0,0,0],
            stroke: 'black',
            strokeWidth: 2,
          });
          keywordGroup.text = new Kinetic.Text({
            x: 0,
            y: 15,
            text: labelText,
            fontSize: 10,
            fontFamily: 'Aaargh',
            fill: '#555',
            width: 150,
            padding: 5,
            align: 'center'
          });
          keywordGroup.rect = new Kinetic.Rect({
            x: 0,
            y: 15,
            width: 150,
            height: keywordGroup.text.getHeight(),
            fill: "#ddd",
            stroke: "black",
            strokeWidth: 2,
            cornerRadius: 10
          });
          keywordGroup.add(keywordGroup.waveformShapeOne);
          keywordGroup.add(keywordGroup.waveformShapeTwo);
          keywordGroup.add(keywordGroup.rect.hide());
          keywordGroup.add(keywordGroup.text.hide());
        } else {
          keywordGroup.text = new Kinetic.Text({
            x: 0,
            y: 25,
            text: labelText,
            fontSize: 10,
            fontFamily: 'Aaargh',
            fill: '#555',
            width: 100,
            padding: 5,
            align: 'center'
          });
          keywordGroup.waveformShape = new Kinetic.Rect({
            x: 0,
            y: 25,
            width: 100,
            height: keywordGroup.text.getHeight(),
            fill: "#ddd",
            stroke: "black",
            strokeWidth: 2,
            cornerRadius: 10,
            opacity: 0.5
          });
          keywordGroup.add(keywordGroup.waveformShape.hide());
          keywordGroup.add(keywordGroup.text.hide());
        }

        if (view == waveformView.waveformOverview) {
          keywordGroup.waveformShapeOne.on("mousemove", mOverviewEnter);
          keywordGroup.waveformShapeOne.on("mouseleave", mOverviewLeave);
          keywordGroup.waveformShapeTwo.on("mousemove", mOverviewEnter);
          keywordGroup.waveformShapeTwo.on("mouseleave", mOverviewLeave);
        }
        //} else {
          //keywordGroup.waveformShape.on("mouseover", mOverviewEnter);
          //keywordGroup.waveformShape.on("mouseleave", mOverviewLeave);
        //}

        view.keywordLayer.add(keywordGroup);
        view.keywordLayer.draw();
      }

      keyword.zoom = keywordZoomGroup;
      keyword.zoom.view = waveformView.waveformZoomView;
      keyword.overview = keywordOverviewGroup;
      keyword.overview.view = waveformView.waveformOverview;

      return keyword;
    };

    var updateKeywordWaveform = function (keyword) {
      // Binding with data
      waveformView.waveformOverview.data.set_segment(waveformView.waveformOverview.data.at_time(keyword.startTime), waveformView.waveformOverview.data.at_time(keyword.endTime), keyword.id);
      waveformView.waveformZoomView.data.set_segment(waveformView.waveformZoomView.data.at_time(keyword.startTime), waveformView.waveformZoomView.data.at_time(keyword.endTime), keyword.id);

      // Overview
      var overviewStartOffset = waveformView.waveformOverview.data.at_time(keyword.startTime);
      var overviewEndOffset = waveformView.waveformOverview.data.at_time(keyword.endTime);

      mixins.waveformOverviewKeywordDrawFunction(waveformView.waveformOverview.data, keyword.id, keyword.overview);

      keyword.overview.setWidth(overviewEndOffset - overviewStartOffset);

      keyword.overview.view.keywordLayer.draw();

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

        mixins.waveformZoomviewKeywordDrawFunction(waveformView.waveformZoomView.data, keyword.id, keyword.zoom);
      } else {
        keyword.zoom.hide();
      }

      var currentZoomLevel = peaks.currentZoomLevel;
      if (currentZoomLevel !== peaks.options.zoomLevels.length - 1) {
        if ((keyword.group <= currentZoomLevel) && (that.hideKeywords === false)) {
          keyword.zoom.text.show();
          keyword.zoom.waveformShape.show();
        } else {
          keyword.zoom.text.hide();
          keyword.zoom.waveformShape.hide();
        }
      }

      keyword.zoom.view.keywordLayer.draw();
    };

    this.keywordLayerVisible = function(visible) {
      var that = this;

      for (var keyword in that.keywords) {
        var keywordSegment = that.keywords[keyword];
        var overviewKeywordShapeOne = keywordSegment.overview.waveformShapeOne;
        var overviewKeywordShapeTwo = keywordSegment.overview.waveformShapeTwo;
        var zoomKeywordShape = keywordSegment.zoom.waveformShape;
        var zoomKeywordText = keywordSegment.zoom.text;
        overviewKeywordShapeOne.hide();
        overviewKeywordShapeTwo.hide();
        zoomKeywordShape.hide();
        zoomKeywordText.hide();
        that.hideKeywords = true;
        if (visible === true) {
          that.hideKeywords = false;
          overviewKeywordShapeOne.show();
          overviewKeywordShapeTwo.show();
          zoomKeywordShape.show();
          zoomKeywordText.show();
        } 
      }
      that.keywords.forEach(function(keyword){
        updateKeywordWaveform(keyword);
      });
      if (visible === false) {
        that.keywordLayerVisibility = false;
      } else {
        that.keywordLayerVisibility = true;
      }
    };

    // EVENTS ====================================================
    bootstrap.pubsub.on("overview_playhead_moved", function (playheadPixel) {
      if (peaks.waveform.waveformZoomView.playing === true) {
        that.keywords.forEach(function(keyword){
          var keywordStartPixel = waveformView.waveformOverview.data.at_time(keyword.startTime);
          var keywordEndPixel = waveformView.waveformOverview.data.at_time(keyword.endTime);
          if ((playheadPixel >= keywordStartPixel) && (playheadPixel <= keywordEndPixel)) {
            keyword.overview.rect.setAttrs({
              x: keywordStartPixel
            });
            keyword.overview.text.setAttrs({
              x: keywordStartPixel
            });
            keyword.overview.rect.show();
            keyword.overview.text.show();
            keyword.overview.view.keywordLayer.draw();
          } else {
            keyword.overview.rect.hide();
            keyword.overview.text.hide();
            keyword.overview.view.keywordLayer.draw();
          }
        });
      }
    });
  };
});
