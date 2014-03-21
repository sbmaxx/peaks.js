/**
 * WAVEFORM.TAGS.JS
 *
 * This module handles all functionality related to the adding,
 * removing and manipulation of the tags. 
 *
 * Help user identify what the audio is about.
 */
define([
  "m/bootstrap",
  "m/player/waveform/waveform.mixins",
  ], function (bootstrap, mixins) {

  return function (waveformView, tagData, options) {
    var that = this;

    that.tags = [];
    that.tagsMultiArray = [];
    that.clusters = [];

    that.tagData = tagData.tags;
    that.tagLevels = [];

    that.hidetags = false; //needed when updating tags and using grouped heirarchy
    that.tagLayerVisibility = false;

    //needed for using heirarchy of groups to organise tags
    that.confidenceMax = 1; 
    that.confidenceMin = 0;

    var views = [waveformView.waveformZoomView, waveformView.waveformOverview];

    // WAVEFORM TAGS FUNCTIONS =========================================

    /* 
    * Listens for the zoomview waveform to be changed
    */
    that.init = function () {
      bootstrap.pubsub.on("waveform_zoom_displaying", this.updateTags);
    };

    /* 
    * Updates each tag when the zoomview waveform is changed
    *
    * @return if at the overview level of zoom as the tags do not need updating
    */
    this.updateTags = function () {
      that.clusters = [];
      createClusters(that.tagsMultiArray);
      //console.log("Final List", that.clusters);
      /*that.tags.forEach(function(tag){
        updateTagWaveform(tag);
      });*/
      if (that.clusters.length !== 0) {
        for (var cluster in that.clusters) {
          var currentCluster = that.clusters[cluster];
          currentCluster.sort(function (a, b) {
            return b.confidenceLevel - a.confidenceLevel;
          });
          for (var current in currentCluster) {
            if (current === '0') {
              updateZoomViewTagWaveform(currentCluster[0], true); //only draw tag with highest confidence level when tags overlap
            } else {
              updateZoomViewTagWaveform(currentCluster[current], false); //only draw tag with highest confidence level when tags overlap
            }
          }
        }
      } else {
        for (var tag in that.tags) {
          //draw onto waveform
          updateZoomViewTagWaveform(that.tags[tag], true);
        }
      }
    };

    /* 
    * Defines the heirarchy of tag levels that defines which tags are visible at each zoom level.
    *
    * Gets the required details from the tag data to create a tag object.
    */
    that.getTagDetails = function () {
      var currentTagLevel = that.confidenceMin;

      /*for (var i = 0; i < options.zoomLevels.length + 1; i++) {
        var tagLevel = that.confidenceMin + (i*(that.confidenceMax-that.confidenceMin)/options.zoomLevels.length);
        that.tagLevels.push(tagLevel);
        currentTagLevel = tagLevel;
      }

      that.tagLevels = that.tagLevels.reverse();*/

      for (var tag in that.tagData) {
        var labelText = that.tagData[tag].label;
        var confidenceLevel = that.tagData[tag].score;
        var timestamps = that.tagData[tag].timestamps;
        for (var x = 0; x < timestamps.length; x++) {
          var end = timestamps[x].end;
          var start = timestamps[x].start;
          createTag(labelText, confidenceLevel, start, end);
        }
      }

      //ensure the tags are sorted in order of start time
      that.tags.sort(function(tag1,tag2) {
        return tag1.startTime - tag2.startTime;
      });

      that.tagsMultiArray.sort(function(tag1,tag2) {
        return tag1[0].startTime - tag2[0].startTime;
      });

      that.updateTags();
      //console.log("Final List", that.clusters);

      for (tag in that.tags) {
        updateOverviewTagWaveform(that.tags[tag]);
      }
    };

    var calculateAverageTime = function(tagList) {
      var averageTime = 0;
      for (var tag in tagList) {
        averageTime = averageTime + tagList[tag].startTime;
      }
      averageTime = averageTime/tagList.length;
      return averageTime;
    };

    var createClusters = function(tags) {
      var closestPair = [];
      var closestPairDistance;
      var benchmarkPairDistance = 15 * waveformView.waveformZoomView.current_sample_rate / waveformView.waveformZoomView.rootData.adapter.sample_rate;
      var newClosestPair = [];
      //console.log(benchmarkPairDistance);
      for (var i = 0; i < tags.length - 1; i++) {
        var currentTag = tags[i];
        var startTimeTagOne = calculateAverageTime(currentTag);
        //for (var x = i + 1; x < tags.length - 1; x++) {
          var comparingTag = tags[i + 1];
          var startTimeTagTwo = calculateAverageTime(comparingTag);
          //console.log("startTimeTagOne", startTimeTagOne, "startTimeTagTwo", startTimeTagTwo);
          var distance = Math.abs(startTimeTagOne - startTimeTagTwo);
          //console.log(currentTag, comparingTag, distance);
          if ((distance <= benchmarkPairDistance) && ((distance < closestPairDistance) || (closestPairDistance === undefined))) {          
            closestPairDistance = distance;
            closestPair.splice(0,2,currentTag,comparingTag);
            newClosestPair = currentTag.concat(comparingTag);
            //console.log("closestPair", closestPair, distance);
          }
        //}
      }
      if (closestPair.length > 0) {
        that.clusters = [];
        for (var y = 0; y < tags.length; y++) {
          if (closestPair.indexOf(tags[y]) === -1) {
            //console.log("Pushed to new list", tags[y]);
            that.clusters.push(tags[y]);
          }
        }
        that.clusters.push(newClosestPair);
        that.clusters.sort(function(tag1, tag2) {
          var startTimeTagOne = calculateAverageTime(tag1);
          var startTimeTagTwo = calculateAverageTime(tag2);
          return startTimeTagOne - startTimeTagTwo;
        });
        //console.log("Final List", that.clusters);
        createClusters(that.clusters);
      }
    };

    /* 
    * Create the tag object ensuring you give is an ID and hierarchy group
    *
    * @param  {string, number, number, number} tag details taken from data in JSON parsed data
    */
    var createTag = function(labelText, confidenceLevel, startTime, endTime) {
      var tagId = "tag" + that.tags.length;
      var groupId = "";
      /*for (var i = 0; i < that.tagLevels.length; i++) {
        //Find the two tag levels that the confidence level of the tag is in between
        if ((confidenceLevel <= that.tagLevels[i]) && (confidenceLevel >= that.tagLevels[i+1])) {
          groupId = i;
        }
      }*/

      //create the tag object
      var tag = createTagWaveform(tagId, groupId, labelText, confidenceLevel, startTime, endTime);

      //push into the correct level
      that.tags.push(tag);
      that.tagsMultiArray.push([tag]);
    };

    /* 
    * Create the tag object graphic drawings for the overview and zoomview waveform
    *
    * @param  {string, string, string, number, number, number} tag details taken from data in JSON parsed data
    * @return {Object} tag object
    */
    var createTagWaveform = function(tagId, groupId, labelText, confidenceLevel, startTime, endTime) {
      var that = this;

      var tag = {
        id: tagId,
        group: groupId,
        startTime: startTime,
        endTime: endTime,
        labelText: labelText || "",
        confidenceLevel:confidenceLevel
      };

      var tagZoomGroup = new Kinetic.Group();
      var tagOverviewGroup = new Kinetic.Group();

      var tagGroups = [tagZoomGroup, tagOverviewGroup];

      var mOverviewEnter = function (event) {
        this.parent.rect.setAttrs({
          x: (this.parent.getStage().getPointerPosition().x) //- this.parent.rect.getWidth()/2
        });
        this.parent.text.setAttrs({
          x: (this.parent.getStage().getPointerPosition().x) //- this.parent.text.getWidth()/2
        });
        this.parent.rect.show();
        this.parent.text.show();
        this.parent.view.tagLayer.draw();
        this.parent.view.tagLayer.moveToTop();
      };

      var mOverviewLeave = function (event) {
        this.parent.rect.hide();
        this.parent.text.hide();
        this.parent.view.tagLayer.draw();
      };

      var mZoomviewEnter = function (event) {
        if ((this.getX() + this.getRadius() + labelLeft.getWidth() + labelLeft.children[0].getPointerWidth()) > this.parent.view.width) {
          labelRight.setAttrs({
            x: this.getX() - this.getRadius()/2 - 5,
            y: this.getY()
          });
          labelRight.show();
          labelRight.moveToTop();
        } else {
          labelLeft.setAttrs({
            x: this.getX() + this.getRadius()/2 + 5,
            y: this.getY()
          });
          labelLeft.show();
          labelLeft.moveToTop();
        }
        this.parent.view.tagLayer.draw();
        this.parent.view.tagLayer.moveToTop();
      };

      var mZoomviewLeave = function (event) {
        labelLeft.hide();
        labelRight.hide();
        this.parent.view.tagLayer.draw();
      };

      for (var i = 0; i < tagGroups.length; i++) {
        var view = views[i];
        var tagGroup = tagGroups[i];

        if (!view.tagLayer) {
          view.tagLayer = new Kinetic.Layer();
          view.stage.add(view.tagLayer);
          view.tagLayer.moveToTop();
        }

        /*
        * Oveview waveform graphic is a rectangle with the tag text in cased in it and a line indicating 
        * where the tag is located on the waveform.
        *
        * Zoomview waveform graphic is a rectangle with the tag text in cased in it.
        */
        if (tagGroup == tagOverviewGroup) {
          tagGroup.waveformShapeOne = new Kinetic.Line({
            points: [0,0,0,0],
            stroke: 'black',
            strokeWidth: 2,
          });
          tagGroup.waveformShapeTwo = new Kinetic.Line({
            points: [0,0,0,0],
            stroke: 'black',
            strokeWidth: 2,
          });
          tagGroup.text = new Kinetic.Text({
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
          tagGroup.rect = new Kinetic.Rect({
            x: 0,
            y: 15,
            width: 150,
            height: tagGroup.text.getHeight(),
            fill: "#ddd",
            stroke: "black",
            strokeWidth: 2,
            cornerRadius: 10
          });
          tagGroup.add(tagGroup.waveformShapeOne);
          tagGroup.add(tagGroup.waveformShapeTwo);
          tagGroup.add(tagGroup.rect.hide());
          tagGroup.add(tagGroup.text.hide());
        } else {
          tagGroup.circle = new Kinetic.Circle({
            x: 0,
            y: 30,
            radius: 5,
            fill: 'black',
            stroke: 'grey',
            strokeWidth: 2
          });
          var labelLeft = new Kinetic.Label({
            x: 0,
            y: 0,
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
            text: labelText,
            fontFamily: 'Aaargh',
            fontSize: 12,
            padding: 5,
            fill: 'white'
          }));
          var labelRight = new Kinetic.Label({
            x: 0,
            y: 0,
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
            text: labelText,
            fontFamily: 'Aaargh',
            fontSize: 12,
            padding: 5,
            fill: 'white'
          }));
          tagGroup.add(tagGroup.circle.hide());
          view.tagLayer.add(labelLeft.hide());
          view.tagLayer.add(labelRight.hide());
        }

        //Interactions for the overview waveform tags ONLY!
        if (view == waveformView.waveformOverview) {
          tagGroup.waveformShapeOne.on("mousemove", mOverviewEnter);
          tagGroup.waveformShapeOne.on("mouseleave", mOverviewLeave);
          tagGroup.waveformShapeTwo.on("mousemove", mOverviewEnter);
          tagGroup.waveformShapeTwo.on("mouseleave", mOverviewLeave);
        } else {
          tagGroup.circle.on("mousemove", mZoomviewEnter);
          tagGroup.circle.on("mouseleave", mZoomviewLeave);
        }

        view.tagLayer.add(tagGroup);
        view.tagLayer.draw();
      }

      tag.zoom = tagZoomGroup;
      tag.zoom.view = waveformView.waveformZoomView;
      tag.overview = tagOverviewGroup;
      tag.overview.view = waveformView.waveformOverview;

      return tag;
    };

    var updateOverviewTagWaveform = function (tag) {
      // Binding with data
      waveformView.waveformOverview.data.set_segment(waveformView.waveformOverview.data.at_time(tag.startTime), waveformView.waveformOverview.data.at_time(tag.endTime), tag.id);

      // Overview
      var overviewStartOffset = waveformView.waveformOverview.data.at_time(tag.startTime);
      var overviewEndOffset = waveformView.waveformOverview.data.at_time(tag.endTime);

      mixins.waveformTagDrawFunction(waveformView.waveformOverview.data, tag.id, tag.overview);

      tag.overview.setWidth(overviewEndOffset - overviewStartOffset);

      tag.overview.view.tagLayer.draw();
    };
    /* 
    * Update each tag positioning when the zoom level is changed.
    *
    * @param  {Object} tag
    */
    var updateZoomViewTagWaveform = function (tag, draw) {
      // Binding with data
      waveformView.waveformZoomView.data.set_segment(waveformView.waveformZoomView.data.at_time(tag.startTime), waveformView.waveformZoomView.data.at_time(tag.endTime), tag.id);

      // Zoom
      var zoomStartOffset = waveformView.waveformZoomView.data.at_time(tag.startTime);
      var zoomEndOffset = waveformView.waveformZoomView.data.at_time(tag.endTime);

      var frameStartOffset = waveformView.waveformZoomView.frameOffset;
      var frameEndOffset = waveformView.waveformZoomView.frameOffset + waveformView.waveformZoomView.width;

      if (zoomStartOffset < frameStartOffset) zoomStartOffset = frameStartOffset;
      if (zoomEndOffset > frameEndOffset) zoomEndOffset = frameEndOffset;

      if (waveformView.waveformZoomView.data.segments[tag.id].visible) {
        var startPixel = zoomStartOffset - frameStartOffset;
        var endPixel = zoomEndOffset - frameStartOffset;

        tag.zoom.show();

        mixins.waveformTagDrawFunction(waveformView.waveformZoomView.data, tag.id, tag.zoom);
        if (draw === true) {
          tag.zoom.circle.show();
        } else {
          tag.zoom.circle.hide();
        }
      } else {
        tag.zoom.hide();
      }

      //Only display the tags that have the same heirarchy level as the current zoom level
      /*var currentZoomLevel = peaks.currentZoomLevel;
      //if (currentZoomLevel !== peaks.options.zoomLevels.length - 1) {
      if ((tag.group <= currentZoomLevel) && (that.hidetags === false)) {
        //console.log(tag, currentZoomLevel);
        tag.zoom.text.show();
        tag.zoom.waveformShape.show();
      } else {
        tag.zoom.text.hide();
        tag.zoom.waveformShape.hide();
      }*/

      tag.zoom.view.tagLayer.draw();
    };

    /* 
    * Change visibility of the tag layer
    *
    * @param  {boolean} Indicates if the tags should be displayed or not
    */
    this.tagLayerVisible = function(visible) {
      var that = this;

      if (visible === true) {
        //that.hidetags = false;
        waveformView.waveformZoomView.tagLayer.show();
        waveformView.waveformOverview.tagLayer.show();
        waveformView.waveformZoomView.tagLayer.draw();
        waveformView.waveformOverview.tagLayer.draw();
      } else {
        waveformView.waveformZoomView.tagLayer.hide();
        waveformView.waveformOverview.tagLayer.hide();
        waveformView.waveformZoomView.tagLayer.draw();
        waveformView.waveformOverview.tagLayer.draw();
        //that.hidetags = true;
      }
      /*for (var tag in that.tags) {
        var tagSegment = that.tags[tag];
        var overviewtagShapeOne = tagSegment.overview.waveformShapeOne;
        var overviewtagShapeTwo = tagSegment.overview.waveformShapeTwo;
        overviewtagShapeOne.hide();
        overviewtagShapeTwo.hide();
        that.hidetags = true;
        if (visible === true) {
          that.hidetags = false;
          overviewtagShapeOne.show();
          overviewtagShapeTwo.show();
        } 
      }
      if (visible === true) {
        that.tags.forEach(function(tag){
          updateOverviewTagWaveform(tag);
        });
      } else {
        that.tags.forEach(function(tag){
          updateOverviewTagWaveform(tag);
          updateZoomViewTagWaveform(tag, false);
        });
      }
      //that.updateTags();*/
      if (visible === false) {
        that.tagLayerVisibility = false;
      } else {
        that.tagLayerVisibility = true;
      }
    };

    // EVENTS ====================================================

    /*
    * Show the tags on the overview waveform as they are spoken if the audio is being played
    *
    * @parem {number} current pixel index of the playhead
    */
    bootstrap.pubsub.on("overview_playhead_moved", function (playheadPixel) {
      if (peaks.waveform.waveformZoomView.playing === true) {
        that.tags.forEach(function(tag){
          var tagStartPixel = waveformView.waveformOverview.data.at_time(tag.startTime);
          var tagEndPixel = waveformView.waveformOverview.data.at_time(tag.endTime);
          if ((playheadPixel >= tagStartPixel) && (playheadPixel <= tagEndPixel)) {
            tag.overview.rect.setAttrs({
              x: tagStartPixel
            });
            tag.overview.text.setAttrs({
              x: tagStartPixel
            });
            tag.overview.rect.show();
            tag.overview.text.show();
            tag.overview.view.tagLayer.draw();
            tag.overview.view.tagLayer.moveToTop();
          } else {
            tag.overview.rect.hide();
            tag.overview.text.hide();
            tag.overview.view.tagLayer.draw();
          }
        });
      }
    });
  };
});
