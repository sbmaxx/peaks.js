/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(5),
	    __webpack_require__(1),
	    __webpack_require__(3),
	    __webpack_require__(4),
	    __webpack_require__(2)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function(EventEmitter, AudioPlayer, Waveform, mixins, keyboard) {
	    'use strict';

	    var buildUi = function(container) {
	        return {
	            'player': container.querySelector(".waveform"),
	            'zoom': container.querySelector(".waveform__container_zoom"),
	            'overview': container.querySelector(".waveform__container_overview")
	        };
	    };

	    var extend = function(to, from) {
	        for (var key in from) {
	            to[key] = from[key];
	        }

	        return to;
	    };

	    var ee = (EventEmitter.EventEmitter2 || EventEmitter);

	    function Peaks(container) {
	        ee.call(this, {
	            wildcard: true
	        });

	        this.options = {
	            /**
	             * Array of scale factors (samples per pixel) for the zoom levels (big >> small)
	             */
	            zoomLevels: [512, 1024, 2048, 4096],
	            /**
	             * Data URI where to get the waveform data.
	             *
	             * If a string, we assume that `this.dataUriDefaultFormat` is the default `xhr.responseType` value.
	             *
	             * @since 0.0.1
	             *
	             * ```js
	             * dataUri: 'url/to/data.json?waveformId=1337'
	             * ```
	             *
	             * If an object, each key is an `xhr.responseType` which will contain its associated source URI.
	             *
	             * @since 0.3.0
	             *
	             * ```js
	             * dataUri: {
	             *   arraybuffer: 'url/to/data.dat',
	             *   json: 'url/to/data.json'
	             * }
	             * ```
	             */
	            dataUri: null,
	            /**
	             * Will be used as a `xhr.responseType` if `dataUri` is a string, and not an object.
	             * Here for backward compatibility purpose only.
	             *
	             * @since 0.3.0
	             */
	            dataUriDefaultFormat: 'json',
	            /**
	             * Will report errors to that function
	             *
	             * @type {Function=}
	             * @since 0.5.0
	             */
	            logger: null,
	            /**
	             * Bind keyboard controls
	             */
	            keyboard: false,
	            /**
	             * Keyboard nudge increment in seconds (left arrow/right arrow)
	             */
	            nudgeIncrement: 0.01,
	            /**
	             * Colour for the in marker of segments
	             */
	            inMarkerColor: '#a0a0a0',
	            /**
	             * Colour for the out marker of segments
	             */
	            outMarkerColor: '#a0a0a0',
	            /**
	             * Colour for the zoomed in waveform
	             */
	            zoomWaveformColor: 'rgba(0, 225, 128, 1)',
	            /**
	             * Colour for the overview waveform
	             */
	            overviewWaveformColor: 'rgba(0,0,0,0.2)',
	            /**
	             * Random colour per segment (overrides segmentColor)
	             */
	            randomizeSegmentColor: true,
	            /**
	             * Height of the waveform canvases in pixels
	             */
	            height: 200,
	            /**
	             * Colour for segments on the waveform
	             */
	            segmentColor: 'rgba(255, 161, 39, 1)',
	            /**
	             * Colour of the play head
	             */
	            playheadColor: 'rgba(0, 0, 0, 1)',
	            /**
	             *
	             */
	            template: [
	                '<div class="waveform">',
	                '<div class="waveform__container waveform__container_overview"></div>',
	                '<div class="waveform__container waveform__container_zoom"></div>',
	                '</div>'
	            ].join(''),

	            /**
	             * Related to points
	             */
	            pointMarkerColor: '#FF0000', //Color for the point marker
	            pointDblClickHandler: null, //Handler called when point handle double clicked.
	            pointDragEndHandler: null, // Called when the point handle has finished dragging

	            /**
	             * WaveformData WebAudio Decoder Options
	             *
	             * You mostly want to play with the 'scale' option.
	             *
	             * @see https://github.com/bbcrd/waveform-data.js/blob/master/lib/builders/webaudio.js
	             */
	            waveformBuilderOptions: {
	                scale: 512,
	                scale_adjuster: 127
	            }
	        };

	        /**
	         *
	         * @type {HTMLElement}
	         */
	        this.container = container;

	        /**
	         *
	         * @type {number}
	         */
	        this.currentZoomLevel = 0;

	        /**
	         * Asynchronous errors logger.
	         *
	         * @type {Function}
	         */
	        this.logger = console.error.bind(console);
	    }

	    Peaks.init = function init(opts) {
	        opts = opts || {};

	        if (opts.audioElement) {
	            opts.mediaElement = opts.audioElement;

	            if (console && typeof console.log === 'function') {
	                console.log('[Peaks.init] `audioElement` option is deprecated. Please use `mediaElement` instead.');
	            }
	        }

	        if (!opts.mediaElement) {
	            throw new Error("[Peaks.init] Please provide an audio element.");
	        }

	        if (!(opts.mediaElement instanceof HTMLMediaElement)) {
	            throw new TypeError("[Peaks.init] The mediaElement option should be an HTMLMediaElement.");
	        }

	        if (!opts.container) {
	            throw new Error("[Peaks.init] Please provide a container object.");
	        }

	        if ((opts.container.clientWidth > 0) === false) {
	            throw new TypeError("[Peaks.init] Please ensure that the container has a width.");
	        }

	        if (opts.logger && typeof opts.logger !== 'function') {
	            throw new TypeError("[Peaks.init] The `logger` option should be a function.");
	        }

	        var instance = new Peaks(opts.container);

	        extend(instance.options, opts);
	        extend(instance.options, {
	            segmentInMarker: mixins.defaultInMarker(instance.options),
	            segmentOutMarker: mixins.defaultOutMarker(instance.options),
	            segmentLabelDraw: mixins.defaultSegmentLabelDraw(instance.options),
	            pointMarker: mixins.defaultPointMarker(instance.options)
	        });

	        /*
	         Setup the logger
	         */
	        if (opts.logger) {
	            instance.logger = opts.logger;
	        }

	        instance.on('error', instance.logger.bind(null));

	        /*
	         Setup the layout
	         */
	        if (typeof instance.options.template === 'string') {
	            instance.container.innerHTML = instance.options.template;
	        } else if (instance.options.template instanceof HTMLElement) {
	            instance.container.appendChild(instance.options.template);
	        } else {
	            throw new TypeError("Please ensure you provide an HTML string or a DOM template as `template` instance option. Provided: " + instance.options.template);
	        }

	        if (instance.options.keyboard) keyboard.init(instance);

	        instance.player = new AudioPlayer(instance);
	        instance.player.init(instance.options.mediaElement);

	        /*
	         Setup the UI components
	         */
	        instance.waveform = new Waveform(instance);
	        instance.waveform.init(buildUi(instance.container));

	        // TODO maybe to move in the player object
	        instance.seeking = false;

	        instance.on("waveformOverviewReady", function() {
	            instance.waveform.openZoomView();

	            if (instance.options.segments) { // Any initial segments to be displayed?
	                instance.segments.addSegment(instance.options.segments);
	            }

	            if (instance.options.points) { //Any initial points to be displayed?
	                instance.points.addPoint(instance.options.points);
	            }

	        });

	        return instance;
	    };

	    // Temporary workaround while https://github.com/asyncly/EventEmitter2/pull/122
	    Peaks.prototype = Object.create(ee.prototype, {
	        segments: {
	            get: function() {
	                var self = this;

	                function addSegment(startTime, endTime, editable, color, labelText) {
	                    var segments = arguments[0];

	                    if (typeof segments === "number") {
	                        segments = [{
	                            startTime: startTime,
	                            endTime: endTime,
	                            editable: editable,
	                            color: color,
	                            labelText: labelText
	                        }];
	                    }

	                    if (Array.isArray(segments)) {
	                        segments.forEach(function(segment) {
	                            self.waveform.segments.createSegment(segment.startTime, segment.endTime, segment.editable, segment.color, segment.labelText);
	                        });

	                        self.waveform.segments.render();
	                    } else {
	                        throw new TypeError("[Peaks.segments.addSegment] Unrecognized segment parameters.");
	                    }
	                }

	                return {
	                    addSegment: addSegment,
	                    add: addSegment,

	                    remove: function(segment) {
	                        var index = self.waveform.segments.remove(segment);

	                        if (index === null) {
	                            throw new RangeError('Unable to find the requested segment' + String(segment));
	                        }

	                        self.waveform.segments.updateSegments();

	                        return self.waveform.segments.segments.splice(index, 1).pop();
	                    },

	                    removeByTime: function(startTime, endTime) {
	                        endTime = (typeof endTime === 'number') ? endTime : 0;
	                        var fnFilter;

	                        if (endTime > 0) {
	                            fnFilter = function(segment) {
	                                return segment.startTime === startTime && segment.endTime === endTime;
	                            };
	                        } else {
	                            fnFilter = function(segment) {
	                                return segment.startTime === startTime;
	                            };
	                        }

	                        var indexes = self.waveform.segments.segments
	                            .filter(fnFilter)
	                            .map(function(segment, i) {
	                                self.waveform.segments.remove(segment);

	                                return i;
	                            })
	                            .sort(function(a, b) {
	                                return b - a;
	                            })
	                            .map(function(index) {
	                                self.waveform.segments.segments.splice(index, 1);

	                                return index;
	                            });

	                        self.waveform.segments.updateSegments();

	                        return indexes.length;
	                    },

	                    removeAll: function() {
	                        self.waveform.segments.removeAll();
	                    },

	                    getSegments: function() {
	                        return self.waveform.segments.segments;
	                    }
	                };
	            }
	        },
	        /**
	         * Points API
	         */
	        points: {
	            get: function() {
	                var self = this;
	                return {
	                    /**
	                     *
	                     * @param timeStamp
	                     * @param editable
	                     * @param color
	                     * @param labelText
	                     */
	                    add: function(timestamp, editable, color, labelText) {
	                        var points = arguments[0];

	                        if (typeof points === "number") {
	                            points = [{
	                                timestamp: timestamp,
	                                editable: editable,
	                                color: color,
	                                labelText: labelText
	                            }];
	                        }

	                        if (Array.isArray(points)) {
	                            points.forEach(self.waveform.points.createPoint.bind(self.waveform.points));
	                            self.waveform.points.render();
	                        } else {
	                            throw new TypeError("[Peaks.points.addPoint] Unrecognized point parameters.");
	                        }
	                    },
	                    /**
	                     *
	                     * @returns {*|WaveformOverview.playheadLine.points|WaveformZoomView.zoomPlayheadLine.points|points|o.points|n.createUi.points}
	                     */
	                    getPoints: function() {
	                        return self.waveform.points.points;
	                    },
	                    /**
	                     *
	                     * @param id
	                     */
	                    removeByTime: function(timestamp) {
	                        var indexes = self.waveform.points.points
	                            .filter(function(point) {
	                                return point.timestamp === timestamp;
	                            })
	                            .map(function(point, i) {
	                                self.waveform.points.remove(point);

	                                return i;
	                            })
	                            .sort(function(a, b) {
	                                return b - a;
	                            })
	                            .map(function(index) {
	                                self.waveform.points.points.splice(index, 1);

	                                return index;
	                            });

	                        self.waveform.points.render();

	                        return indexes.length;
	                    },

	                    /**
	                     * Remove all points
	                     *
	                     * @api
	                     * @since 0.3.2
	                     */
	                    removeAll: function removeAll() {
	                        self.waveform.points.removeAll();
	                    }
	                };
	            }
	        },
	        /**
	         * Time API
	         */
	        time: {
	            get: function() {
	                var self = this;

	                return {
	                    /**
	                     * Seeks the media player to that exat time.
	                     * Infers the playhead position to that same time.
	                     *
	                     * ```js
	                     * var p = Peaks.init(…);
	                     * p.time.setCurrentTime(20.5);
	                     * ```
	                     *
	                     * @param {Number} time
	                     */
	                    setCurrentTime: function setCurrentTime(time) {
	                        return self.player.seekBySeconds(time);
	                    },
	                    /**
	                     * Returns the actual time of the media element, in seconds.
	                     *
	                     * ```js
	                     * var p = Peaks.init(…);
	                     * p.time.getCurrentTime();     // -> 0
	                     * ```
	                     *
	                     * @returns {Number}
	                     */

	                    getCurrentTime: function() {
	                        return self.player.getTime();
	                    }
	                };
	            }
	        },
	        /**
	         * Zoom API
	         */
	        zoom: {
	            get: function() {
	                var self = this;
	                return {

	                    /**
	                     * Zoom in one level
	                     */
	                    zoomIn: function() {
	                        self.zoom.setZoom(self.currentZoomLevel - 1);
	                    },

	                    /**
	                     * Zoom out one level
	                     */
	                    zoomOut: function() {
	                        self.zoom.setZoom(self.currentZoomLevel + 1);
	                    },

	                    /**
	                     * Given a particular zoom level, triggers a resampling of the data in the zoomed view
	                     *
	                     * @param {number} zoomLevelIndex
	                     */
	                    setZoom: function(zoomLevelIndex) { // Set zoom level to index of current zoom levels
	                        if (zoomLevelIndex >= self.options.zoomLevels.length) {
	                            zoomLevelIndex = self.options.zoomLevels.length - 1;
	                        }

	                        if (zoomLevelIndex < 0) {
	                            zoomLevelIndex = 0;
	                        }

	                        var previousZoomLevel = self.currentZoomLevel;

	                        self.currentZoomLevel = zoomLevelIndex;
	                        self.emit("zoom.update", self.options.zoomLevels[zoomLevelIndex], self.options.zoomLevels[previousZoomLevel]);
	                    },

	                    /**
	                     * Returns the current zoom level
	                     *
	                     * @returns {number}
	                     */
	                    getZoom: function() {
	                        return self.currentZoomLevel;
	                    },

	                    /**
	                     * Sets the zoom level to an overview level
	                     *
	                     * @since 0.3
	                     */
	                    overview: function zoomToOverview() {
	                        self.emit("zoom.update", self.waveform.waveformOverview.data.adapter.scale, self.options.zoomLevels[self.currentZoomLevel]);
	                    },

	                    /**
	                     * Sets the zoom level to an overview level
	                     *
	                     * @since 0.3
	                     */
	                    reset: function resetOverview() {
	                        self.emit("zoom.update", self.options.zoomLevels[self.currentZoomLevel], self.waveform.waveformOverview.data.adapter.scale);
	                    }
	                };
	            }
	        }
	    });

	    window.Peaks = Peaks;

	    return Peaks;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * Player API
	 *
	 * Functionality layer for interfacing with the html5 audio API.
	 *
	 * player.init - takes a player object and sets up the player
	 *
	 * player.play - starts the audio playback and updates internal variables
	 *
	 * player.stop - stops playback
	 *
	 * player.seek - seek to a certain percentage
	 *
	 * player.timeUpdate - assignable function that is called on player update during playback (normalised)
	 *
	 * player.getPercentage - get the percentage playthrough
	 *
	 * player.getTime - get a nicely formatted string representing the current timecode
	 *
	 * player.getDuration - get a nice formatted time representing the clip duration
	 *
	 * player.getTimeFromPercentage - get the time in track of a percentage playthrough without setting
	 *
	 * player.setVolume
	 */

	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(4)], __WEBPACK_AMD_DEFINE_RESULT__ = function(mixins) {
	    'use strict';

	    var radio = function(peaks) {

	        function timeFromPercentage(time, percentage) {
	            return time * (percentage / 100);
	        }

	        return {
	            init: function(mediaElement) {
	                var that = this;

	                this.mediaElement = mediaElement;
	                this.duration = this.mediaElement.duration;

	                if (this.mediaElement.readyState === 4) {
	                    peaks.emit("player_load", that);
	                }

	                this.mediaElement.addEventListener("timeupdate", function() {
	                    peaks.emit("player_time_update", that.getTime());
	                });

	                this.mediaElement.addEventListener("play", function() {
	                    peaks.emit("player_play", that.getTime());
	                });

	                this.mediaElement.addEventListener("pause", function() {
	                    peaks.emit("player_pause", that.getTime());
	                });

	                this.mediaElement.addEventListener("seeked", function() {
	                    peaks.emit("player_seek", that.getTime());
	                });
	            },

	            setSource: function(source) {
	                this.mediaElement.setAttribute('src', source);
	            },

	            getSource: function() {
	                return this.mediaElement.src;
	            },

	            play: function() {
	                this.mediaElement.play();
	                peaks.emit("radio_play", this.getTime());
	            },

	            pause: function() {
	                this.mediaElement.pause();
	                peaks.emit("radio_pause", this.getTime());
	            },

	            getTime: function() {
	                return this.mediaElement.currentTime;
	            },

	            getTimeFromPercentage: function(p) {
	                return mixins.niceTime(this.duration * p / 100, false);
	            },

	            getSecsFromPercentage: function(p) {
	                return Math.floor(this.duration * p / 100);
	            },

	            getDuration: function() {
	                return this.mediaElement.duration;
	            },

	            getPercentage: function() {
	                return this.getPercentageFromSeconds(this.mediaElement.currentTime);
	            },

	            getPercentageFromSeconds: function(s) {
	                var percentage = (s / this.duration) * 100;
	                return Math.round(percentage * 100) / 100; // 2DP
	            },

	            seek: function(percentage) {
	                this.mediaElement.currentTime = timeFromPercentage(this.duration, percentage);
	            },

	            seekBySeconds: function(seconds) {
	                this.mediaElement.currentTime = seconds;
	            }
	        };
	    };

	    return radio;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function() {
	    'use strict';

	    var SPACE = 32,
	        TAB = 9,
	        LEFT_ARROW = 37,
	        RIGHT_ARROW = 39;

	    function handleKeyEventGenerator(peaksInstance) {
	        /**
	         * Arrow keys only triggered on keydown, not keypress
	         */
	        return function handleKeyEvent(event) {
	            var c = event.keyCode;
	            var t = event.type;

	            if (['OBJECT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION'].indexOf(event.target.nodeName) === -1) {

	                if ([SPACE, TAB, LEFT_ARROW, RIGHT_ARROW].indexOf(event.type) > -1) {
	                    event.preventDefault();
	                }

	                if (t === "keydown" || t === "keypress") {

	                    switch (c) {
	                        case SPACE:
	                            peaksInstance.emit("kybrd_space");
	                            break;

	                        case TAB:
	                            peaksInstance.emit("kybrd_tab");
	                            break;
	                    }
	                } else if (t === "keyup") {

	                    switch (c) {
	                        case LEFT_ARROW:
	                            if (event.shiftKey) peaksInstance.emit("kybrd_shift_left");
	                            else peaksInstance.emit("kybrd_left");
	                            break;

	                        case RIGHT_ARROW:
	                            if (peaksInstance.shiftKey) peaksInstance.emit("kybrd_shift_right");
	                            else peaksInstance.emit("kybrd_right");
	                            break;
	                    }
	                }
	            }
	        };
	    }

	    return {
	        init: function(peaks) {
	            document.addEventListener("keydown", handleKeyEventGenerator(peaks));
	            document.addEventListener("keypress", handleKeyEventGenerator(peaks));
	            document.addEventListener("keyup", handleKeyEventGenerator(peaks));
	        }
	    };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * WAVEFORM.CORE.JS
	 *
	 * This module bootstraps all our waveform components and manages
	 * initialisation as well as some component-wide events such as
	 * viewport resizing.
	 */
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(10),
	    __webpack_require__(6),
	    __webpack_require__(7),
	    __webpack_require__(8),
	    __webpack_require__(9)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function(WaveformData, WaveformOverview, WaveformZoomView, WaveformSegments, WaveformPoints) {

	    'use strict';

	    var isXhr2 = ('withCredentials' in new XMLHttpRequest());

	    return function(peaks) {
	        return {
	            init: function(ui) {
	                this.ui = ui; // See buildUi in main.js
	                var that = this;

	                /**
	                 * Handle data provided by our waveform data module after parsing the XHR request
	                 * @param  {Object} origWaveformData Parsed ArrayBuffer or JSON response
	                 */
	                that.getRemoteData(peaks.options);
	            },

	            getRemoteData: function(options) {
	                var that = this;
	                var xhr = new XMLHttpRequest();
	                var uri = null;
	                var requestType = null;
	                var builder = null;

	                // Backward compatibility
	                if (options.dataUri) {
	                    if (typeof options.dataUri === 'string') {
	                        var dataUri = {};

	                        dataUri[options.dataUriDefaultFormat || 'json'] = options.dataUri;
	                        options.dataUri = dataUri;
	                    }

	                    if (typeof options.dataUri === 'object') {
	                        ['ArrayBuffer', 'JSON'].some(function(connector) {
	                            if (window[connector]) {
	                                requestType = connector.toLowerCase();
	                                uri = options.dataUri[requestType];

	                                return Boolean(uri);
	                            }
	                        });
	                    }
	                }

	                // WebAudio Builder
	                if (!options.dataUri && WaveformData.builders.webaudio.getAudioContext()) {
	                    requestType = 'arraybuffer';
	                    uri = options.mediaElement.currentSrc || options.mediaElement.src;
	                    builder = 'webaudio';
	                }

	                if (!uri) {
	                    throw new Error("Unable to determine a compatible dataUri format for this browser.");
	                }

	                // open an XHR request to the data source file
	                xhr.open('GET', uri, true);

	                if (isXhr2) {
	                    try {
	                        xhr.responseType = requestType;
	                    }
	                    // some browsers like Safari 6 do handle XHR2 but not the json response type
	                    // doing only a try/catch fails in IE9
	                    catch (e) {}
	                }

	                xhr.onload = function(response) {
	                    if (this.readyState === 4) {
	                        if (this.status === 200) {
	                            if (builder) {
	                                WaveformData.builders[builder](response.target.response, options.waveformBuilderOptions, that.handleRemoteData.bind(that, null));
	                            } else {
	                                that.handleRemoteData(null, response.target, xhr);
	                            }
	                        } else {
	                            that.handleRemoteData(new Error('Unable to fetch remote data. HTTP Status ' + this.status));
	                        }
	                    }
	                };

	                xhr.send();
	            },

	            /**
	             *
	             * @param err {Error}
	             * @param remoteData {WaveformData|ProgressEvent}
	             * @param xhr {XMLHttpRequest}
	             */
	            handleRemoteData: function(err, remoteData, xhr) {
	                if (err) {
	                    return peaks.emit('error', err);
	                }

	                this.origWaveformData = null;

	                try {
	                    this.origWaveformData = remoteData instanceof WaveformData ? remoteData : WaveformData.create(remoteData);
	                    var overviewWaveformData = this.origWaveformData.resample(this.ui.player.clientWidth);
	                    this.waveformOverview = new WaveformOverview(overviewWaveformData, this.ui.overview, peaks);
	                } catch (e) {
	                    return peaks.emit('error', e);
	                }


	                peaks.emit("waveformOverviewReady", this.waveformOverview);
	                this.bindResize();
	            },

	            openZoomView: function() {
	                var that = this;

	                that.waveformZoomView = new WaveformZoomView(that.origWaveformData, that.ui.zoom, peaks);

	                that.segments = new WaveformSegments(peaks);
	                that.segments.init();

	                that.points = new WaveformPoints(peaks);
	                that.points.init();

	                peaks.emit('waveformZoomReady', that.waveformZoomView);
	            },

	            /**
	             * Deal with window resize event over both waveform views.
	             */
	            bindResize: function() {
	                // var that = this;
	                //
	                // window.addEventListener("resize", function() {
	                //     that.ui.overview.hidden = true;
	                //     that.ui.zoom.hidden = true;
	                //
	                //     if (that.resizeTimeoutId) clearTimeout(that.resizeTimeoutId);
	                //     that.resizeTimeoutId = setTimeout(function() {
	                //         var w = that.ui.player.clientWidth;
	                //         var overviewWaveformData = that.origWaveformData.resample(w);
	                //         peaks.emit("resizeEndOverview", w, overviewWaveformData);
	                //         peaks.emit("window_resized", w, that.origWaveformData);
	                //     }, 500);
	                // });
	                //
	                // peaks.on("overview_resized", function() {
	                //     that.ui.overview.removeAttribute('hidden');
	                // });
	                //
	                // peaks.on("zoomview_resized", function() {
	                //     that.ui.zoom.removeAttribute('hidden');
	                // });
	                //
	                // peaks.on("user_seek.*", function(time) {
	                //     peaks.player.seekBySeconds(time);
	                // });
	                //
	                // peaks.on("user_scrub.*", function(time) {
	                //     peaks.player.seekBySeconds(time);
	                // });
	            }
	        };
	    };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * WAVEFORM.MIXINS.JS
	 *
	 * Common functions used in multiple modules are
	 * collected here for DRY purposes.
	 */
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(11)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Kinetic) {
	    'use strict';

	    // Private methods

	    /**
	     * Create a Left or Right side handle group in Kinetic based on given options.
	     * @param  {int}      height    Height of handle group container (canvas)
	     * @param  {string}   color     Colour hex value for handle and line marker
	     * @param  {Boolean}  inMarker  Is this marker the inMarker (LHS) or outMarker (RHS)
	     * @return {Function}
	     */
	    var createHandle = function(height, color, inMarker) {

	        /**
	         * @param  {Boolean}  draggable If true, marker is draggable
	         * @param  {Object}   segment   Parent segment object with in and out times
	         * @param  {Object}   parent    Parent context
	         * @param  {Function} onDrag    Callback after drag completed
	         * @return {Kinetic Object}     Kinetic group object of handle marker elements
	         */
	        return function(draggable, segment, parent, onDrag) {
	            var handleHeight = 20;
	            var handleWidth = handleHeight / 2;
	            var handleY = (height / 2) - 10.5;
	            var handleX = inMarker ? -handleWidth + 0.5 : 0.5;

	            var group = new Kinetic.Group({
	                draggable: draggable,
	                dragBoundFunc: function(pos) {
	                    var limit;

	                    if (inMarker) {
	                        limit = segment.outMarker.getX() - segment.outMarker.getWidth();
	                        if (pos.x > limit) pos.x = limit;
	                    } else {
	                        limit = segment.inMarker.getX() + segment.inMarker.getWidth();
	                        if (pos.x < limit) pos.x = limit;
	                    }

	                    return {
	                        x: pos.x,
	                        y: this.getAbsolutePosition().y
	                    };
	                }
	            }).on("dragmove", function(event) {
	                onDrag(segment, parent);
	            });

	            var xPosition = inMarker ? -24 : 24;

	            var text = new Kinetic.Text({
	                x: xPosition,
	                y: (height / 2) - 5,
	                text: "",
	                fontSize: 10,
	                fontFamily: 'sans-serif',
	                fill: "#000",
	                textAlign: "center"
	            });
	            text.hide();
	            group.label = text;

	            var handle = new Kinetic.Rect({
	                width: handleWidth,
	                height: handleHeight,
	                fill: color,
	                stroke: color,
	                strokeWidth: 1,
	                x: handleX,
	                y: handleY
	            });

	            /*
	            Vertical Line
	             */
	            var line = new Kinetic.Line({
	                points: [0.5, 0, 0.5, height],
	                strokeWidth: 1,
	                stroke: color,
	                x: 0,
	                y: 0
	            });

	            /*
	            Events
	             */
	            handle.on("mouseover", function(event) {
	                if (inMarker) text.setX(xPosition - text.getWidth());
	                text.show();
	                segment.view.segmentLayer.draw();
	            });
	            handle.on("mouseout", function(event) {
	                text.hide();
	                segment.view.segmentLayer.draw();
	            });

	            group.add(text);
	            group.add(line);
	            group.add(handle);

	            return group;
	        };
	    };

	    /**
	     * Create a point handle group in Kinetic based on given options.
	     * @param  {int}      height    Height of handle group container (canvas)
	     * @param  {string}   color     Colour hex value for handle and line marker
	     * @return {Function}
	     */
	    function createPointHandle(height, color) {
	        /**
	         * @param  {Boolean}  draggable If true, marker is draggable
	         * @param  {Object}   point     Parent point object with in times
	         * @param  {Object}   parent    Parent context
	         * @param  {Function} onDrag    Callback after drag completed
	         * @return {Kinetic Object}     Kinetic group object of handle marker elements
	         */
	        return function(draggable, point, parent, onDrag, onDblClick, onDragEnd) {
	            var handleTop = (height / 2) - 10.5;
	            var handleWidth = 10;
	            var handleHeight = 20;
	            var handleX = 0.5; //Place in the middle of the marker

	            var group = new Kinetic.Group({
	                draggable: draggable,
	                dragBoundFunc: function(pos) {

	                    return {
	                        x: pos.x, //No constraint hoziontally
	                        y: this.getAbsolutePosition().y //Constrained vertical line
	                    };
	                }
	            }).on("dragmove", function(event) {
	                onDrag(point, parent);
	            });

	            if (onDblClick) {
	                group.on('dblclick', function(event) {
	                    onDblClick(parent);
	                });
	            }

	            if (onDragEnd) {
	                group.on('dragend', function(event) {
	                    onDragEnd(parent);
	                });
	            }

	            //Place text to the left of the mark
	            var xPosition = -handleWidth;

	            var text = new Kinetic.Text({
	                x: xPosition,
	                y: (height / 2) - 5,
	                text: "",
	                fontSize: 10,
	                fontFamily: 'sans-serif',
	                fill: "#000",
	                textAlign: "center"
	            });
	            text.hide();
	            group.label = text;

	            /*
	            Handle
	             */
	            var handle = new Kinetic.Rect({
	                width: handleWidth,
	                height: handleHeight,
	                fill: color,
	                x: handleX,
	                y: handleTop
	            });

	            /*
	            Line
	             */
	            var line = new Kinetic.Line({
	                points: [0, 0, 0, height],
	                stroke: color,
	                strokeWidth: 1,
	                x: handleX,
	                y: 0
	            });

	            /*
	            Events
	             */
	            handle.on("mouseover", function(event) {
	                text.show();
	                text.setX(xPosition - text.getWidth()); //Position text to the left of the mark
	                point.view.pointLayer.draw();
	            });
	            handle.on("mouseout", function(event) {
	                text.hide();
	                point.view.pointLayer.draw();
	            });

	            group.add(handle);
	            group.add(line);
	            group.add(text);

	            return group;

	        };
	    }

	    /**
	     * Draw a waveform on a canvas context
	     * @param  {Kinetic.Context}  ctx   Canvas Context to draw on
	     * @param  {Array}    min           Min values for waveform
	     * @param  {Array}    max           Max values for waveform
	     * @param  {Int}      offset_start  Where to start drawing
	     * @param  {Int}      offset_length How much to draw
	     * @param  {Function} y             Calculate height (see fn interpolateHeight)
	     */
	    function drawWaveform(ctx, min, max, offset_start, offset_length, y) {
	        ctx.beginPath();

	        min.forEach(function(val, x) {
	            ctx.lineTo(offset_start + x + 0.5, y(val) + 0.5);
	        });

	        max.reverse().forEach(function(val, x) {
	            ctx.lineTo(offset_start + (offset_length - x) + 0.5, y(val) + 0.5);
	        });

	        ctx.closePath();
	    }

	    /**
	     * Returns a height interpolator function
	     *
	     * @param {Number} total_height
	     * @returns {interpolateHeight}
	     */
	    function interpolateHeightGenerator(total_height) {
	        var amplitude = 256;
	        return function interpolateHeight(size) {
	            return total_height - ((size + 128) * total_height) / amplitude;
	        };
	    }

	    // Public API
	    return {

	        interpolateHeight: interpolateHeightGenerator,

	        drawWaveform: drawWaveform,

	        /**
	         *
	         * @this {Kinetic.Shape}
	         * @param {WaveformOverview} view
	         * @param {Kinetic.Context} context
	         */
	        waveformDrawFunction: function(view, context) {
	            var waveform = view.intermediateData || view.data;
	            var y = interpolateHeightGenerator(view.height);
	            var offset_length = waveform.offset_length;

	            drawWaveform(context, waveform.min, waveform.max, 0, offset_length, y);
	            context.fillStrokeShape(this);
	        },

	        waveformOverviewMarkerDrawFunction: function(xIndex, viewGroup, view) {
	            viewGroup.waveformShape.setPoints([xIndex, 0, xIndex, view.height]);
	        },

	        /**
	         * Format a time nicely
	         * @param  {int}      time            Time in seconds to be formatted
	         * @param  {Boolean}  dropHundredths  Don't display hundredths of a second if true
	         * @return {String}   Formatted time string
	         */
	        niceTime: function(time, dropHundredths) {
	            var hundredths, seconds, minutes, hours, result = [];

	            hundredths = Math.floor((time % 1) * 100);
	            seconds = Math.floor(time);
	            minutes = Math.floor(seconds / 60);
	            hours = Math.floor(minutes / 60);

	            if (hours > 0) result.push(hours); // Hours
	            result.push(minutes % 60); // Mins
	            result.push(seconds % 60); // Seconds

	            for (var i = 0; i < result.length; i++) {
	                var x = result[i];
	                if (x < 10) {
	                    result[i] = "0" + x;
	                } else {
	                    result[i] = x;
	                }
	            }

	            result = result.join(":");

	            if (!dropHundredths) {
	                if (hundredths < 10) {
	                    hundredths = "0" + hundredths;
	                }

	                result += "." + hundredths; // Hundredths of a second
	            }

	            return result;
	        },

	        /**
	         * Return a function that on execution creates and returns a new
	         * IN handle object
	         * @param  {Object}   options Root Peaks.js options containing config info for handle
	         * @return {Function} Provides Kinetic handle group on execution
	         */
	        defaultInMarker: function(options) {
	            return createHandle(options.height, options.outMarkerColor, true);
	        },

	        /**
	         * Return a function that on execution creates and returns a new
	         * OUT handle object
	         * @param  {Object}   options Root Peaks.js options containing config info for handle
	         * @return {Function} Provides Kinetic handle group on execution
	         */
	        defaultOutMarker: function(options) {
	            return createHandle(options.height, options.outMarkerColor, false);
	        },

	        defaultPointMarker: function(options) {
	            return createPointHandle(options.height, options.pointMarkerColor);
	        },

	        defaultSegmentLabelDraw: function(options) {
	            return function(segment, parent) {
	                return new Kinetic.Text({
	                    x: 12,
	                    y: 12,
	                    text: parent.labelText,
	                    fontSize: 12,
	                    fontFamily: 'Arial, sans-serif',
	                    fill: "#000",
	                    textAlign: "center"
	                });
	            };
	        }
	    };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/*!
	 * EventEmitter2
	 * https://github.com/hij1nx/EventEmitter2
	 *
	 * Copyright (c) 2013 hij1nx
	 * Licensed under the MIT license.
	 */
	;!function(undefined) {

	  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
	    return Object.prototype.toString.call(obj) === "[object Array]";
	  };
	  var defaultMaxListeners = 10;

	  function init() {
	    this._events = {};
	    if (this._conf) {
	      configure.call(this, this._conf);
	    }
	  }

	  function configure(conf) {
	    if (conf) {

	      this._conf = conf;

	      conf.delimiter && (this.delimiter = conf.delimiter);
	      conf.maxListeners && (this._events.maxListeners = conf.maxListeners);
	      conf.wildcard && (this.wildcard = conf.wildcard);
	      conf.newListener && (this.newListener = conf.newListener);

	      if (this.wildcard) {
	        this.listenerTree = {};
	      }
	    }
	  }

	  function EventEmitter(conf) {
	    this._events = {};
	    this.newListener = false;
	    configure.call(this, conf);
	  }

	  //
	  // Attention, function return type now is array, always !
	  // It has zero elements if no any matches found and one or more
	  // elements (leafs) if there are matches
	  //
	  function searchListenerTree(handlers, type, tree, i) {
	    if (!tree) {
	      return [];
	    }
	    var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
	        typeLength = type.length, currentType = type[i], nextType = type[i+1];
	    if (i === typeLength && tree._listeners) {
	      //
	      // If at the end of the event(s) list and the tree has listeners
	      // invoke those listeners.
	      //
	      if (typeof tree._listeners === 'function') {
	        handlers && handlers.push(tree._listeners);
	        return [tree];
	      } else {
	        for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
	          handlers && handlers.push(tree._listeners[leaf]);
	        }
	        return [tree];
	      }
	    }

	    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
	      //
	      // If the event emitted is '*' at this part
	      // or there is a concrete match at this patch
	      //
	      if (currentType === '*') {
	        for (branch in tree) {
	          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
	            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
	          }
	        }
	        return listeners;
	      } else if(currentType === '**') {
	        endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
	        if(endReached && tree._listeners) {
	          // The next element has a _listeners, add it to the handlers.
	          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
	        }

	        for (branch in tree) {
	          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
	            if(branch === '*' || branch === '**') {
	              if(tree[branch]._listeners && !endReached) {
	                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
	              }
	              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
	            } else if(branch === nextType) {
	              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
	            } else {
	              // No match on this one, shift into the tree but not in the type array.
	              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
	            }
	          }
	        }
	        return listeners;
	      }

	      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
	    }

	    xTree = tree['*'];
	    if (xTree) {
	      //
	      // If the listener tree will allow any match for this part,
	      // then recursively explore all branches of the tree
	      //
	      searchListenerTree(handlers, type, xTree, i+1);
	    }

	    xxTree = tree['**'];
	    if(xxTree) {
	      if(i < typeLength) {
	        if(xxTree._listeners) {
	          // If we have a listener on a '**', it will catch all, so add its handler.
	          searchListenerTree(handlers, type, xxTree, typeLength);
	        }

	        // Build arrays of matching next branches and others.
	        for(branch in xxTree) {
	          if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
	            if(branch === nextType) {
	              // We know the next element will match, so jump twice.
	              searchListenerTree(handlers, type, xxTree[branch], i+2);
	            } else if(branch === currentType) {
	              // Current node matches, move into the tree.
	              searchListenerTree(handlers, type, xxTree[branch], i+1);
	            } else {
	              isolatedBranch = {};
	              isolatedBranch[branch] = xxTree[branch];
	              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
	            }
	          }
	        }
	      } else if(xxTree._listeners) {
	        // We have reached the end and still on a '**'
	        searchListenerTree(handlers, type, xxTree, typeLength);
	      } else if(xxTree['*'] && xxTree['*']._listeners) {
	        searchListenerTree(handlers, type, xxTree['*'], typeLength);
	      }
	    }

	    return listeners;
	  }

	  function growListenerTree(type, listener) {

	    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

	    //
	    // Looks for two consecutive '**', if so, don't add the event at all.
	    //
	    for(var i = 0, len = type.length; i+1 < len; i++) {
	      if(type[i] === '**' && type[i+1] === '**') {
	        return;
	      }
	    }

	    var tree = this.listenerTree;
	    var name = type.shift();

	    while (name) {

	      if (!tree[name]) {
	        tree[name] = {};
	      }

	      tree = tree[name];

	      if (type.length === 0) {

	        if (!tree._listeners) {
	          tree._listeners = listener;
	        }
	        else if(typeof tree._listeners === 'function') {
	          tree._listeners = [tree._listeners, listener];
	        }
	        else if (isArray(tree._listeners)) {

	          tree._listeners.push(listener);

	          if (!tree._listeners.warned) {

	            var m = defaultMaxListeners;

	            if (typeof this._events.maxListeners !== 'undefined') {
	              m = this._events.maxListeners;
	            }

	            if (m > 0 && tree._listeners.length > m) {

	              tree._listeners.warned = true;
	              console.error('(node) warning: possible EventEmitter memory ' +
	                            'leak detected. %d listeners added. ' +
	                            'Use emitter.setMaxListeners() to increase limit.',
	                            tree._listeners.length);
	              console.trace();
	            }
	          }
	        }
	        return true;
	      }
	      name = type.shift();
	    }
	    return true;
	  }

	  // By default EventEmitters will print a warning if more than
	  // 10 listeners are added to it. This is a useful default which
	  // helps finding memory leaks.
	  //
	  // Obviously not all Emitters should be limited to 10. This function allows
	  // that to be increased. Set to zero for unlimited.

	  EventEmitter.prototype.delimiter = '.';

	  EventEmitter.prototype.setMaxListeners = function(n) {
	    this._events || init.call(this);
	    this._events.maxListeners = n;
	    if (!this._conf) this._conf = {};
	    this._conf.maxListeners = n;
	  };

	  EventEmitter.prototype.event = '';

	  EventEmitter.prototype.once = function(event, fn) {
	    this.many(event, 1, fn);
	    return this;
	  };

	  EventEmitter.prototype.many = function(event, ttl, fn) {
	    var self = this;

	    if (typeof fn !== 'function') {
	      throw new Error('many only accepts instances of Function');
	    }

	    function listener() {
	      if (--ttl === 0) {
	        self.off(event, listener);
	      }
	      fn.apply(this, arguments);
	    }

	    listener._origin = fn;

	    this.on(event, listener);

	    return self;
	  };

	  EventEmitter.prototype.emit = function() {

	    this._events || init.call(this);

	    var type = arguments[0];

	    if (type === 'newListener' && !this.newListener) {
	      if (!this._events.newListener) { return false; }
	    }

	    // Loop through the *_all* functions and invoke them.
	    if (this._all) {
	      var l = arguments.length;
	      var args = new Array(l - 1);
	      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
	      for (i = 0, l = this._all.length; i < l; i++) {
	        this.event = type;
	        this._all[i].apply(this, args);
	      }
	    }

	    // If there is no 'error' event listener then throw.
	    if (type === 'error') {

	      if (!this._all &&
	        !this._events.error &&
	        !(this.wildcard && this.listenerTree.error)) {

	        if (arguments[1] instanceof Error) {
	          throw arguments[1]; // Unhandled 'error' event
	        } else {
	          throw new Error("Uncaught, unspecified 'error' event.");
	        }
	        return false;
	      }
	    }

	    var handler;

	    if(this.wildcard) {
	      handler = [];
	      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
	      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
	    }
	    else {
	      handler = this._events[type];
	    }

	    if (typeof handler === 'function') {
	      this.event = type;
	      if (arguments.length === 1) {
	        handler.call(this);
	      }
	      else if (arguments.length > 1)
	        switch (arguments.length) {
	          case 2:
	            handler.call(this, arguments[1]);
	            break;
	          case 3:
	            handler.call(this, arguments[1], arguments[2]);
	            break;
	          // slower
	          default:
	            var l = arguments.length;
	            var args = new Array(l - 1);
	            for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
	            handler.apply(this, args);
	        }
	      return true;
	    }
	    else if (handler) {
	      var l = arguments.length;
	      var args = new Array(l - 1);
	      for (var i = 1; i < l; i++) args[i - 1] = arguments[i];

	      var listeners = handler.slice();
	      for (var i = 0, l = listeners.length; i < l; i++) {
	        this.event = type;
	        listeners[i].apply(this, args);
	      }
	      return (listeners.length > 0) || !!this._all;
	    }
	    else {
	      return !!this._all;
	    }

	  };

	  EventEmitter.prototype.on = function(type, listener) {

	    if (typeof type === 'function') {
	      this.onAny(type);
	      return this;
	    }

	    if (typeof listener !== 'function') {
	      throw new Error('on only accepts instances of Function');
	    }
	    this._events || init.call(this);

	    // To avoid recursion in the case that type == "newListeners"! Before
	    // adding it to the listeners, first emit "newListeners".
	    this.emit('newListener', type, listener);

	    if(this.wildcard) {
	      growListenerTree.call(this, type, listener);
	      return this;
	    }

	    if (!this._events[type]) {
	      // Optimize the case of one listener. Don't need the extra array object.
	      this._events[type] = listener;
	    }
	    else if(typeof this._events[type] === 'function') {
	      // Adding the second element, need to change to array.
	      this._events[type] = [this._events[type], listener];
	    }
	    else if (isArray(this._events[type])) {
	      // If we've already got an array, just append.
	      this._events[type].push(listener);

	      // Check for listener leak
	      if (!this._events[type].warned) {

	        var m = defaultMaxListeners;

	        if (typeof this._events.maxListeners !== 'undefined') {
	          m = this._events.maxListeners;
	        }

	        if (m > 0 && this._events[type].length > m) {

	          this._events[type].warned = true;
	          console.error('(node) warning: possible EventEmitter memory ' +
	                        'leak detected. %d listeners added. ' +
	                        'Use emitter.setMaxListeners() to increase limit.',
	                        this._events[type].length);
	          console.trace();
	        }
	      }
	    }
	    return this;
	  };

	  EventEmitter.prototype.onAny = function(fn) {

	    if (typeof fn !== 'function') {
	      throw new Error('onAny only accepts instances of Function');
	    }

	    if(!this._all) {
	      this._all = [];
	    }

	    // Add the function to the event listener collection.
	    this._all.push(fn);
	    return this;
	  };

	  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	  EventEmitter.prototype.off = function(type, listener) {
	    if (typeof listener !== 'function') {
	      throw new Error('removeListener only takes instances of Function');
	    }

	    var handlers,leafs=[];

	    if(this.wildcard) {
	      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
	      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
	    }
	    else {
	      // does not use listeners(), so no side effect of creating _events[type]
	      if (!this._events[type]) return this;
	      handlers = this._events[type];
	      leafs.push({_listeners:handlers});
	    }

	    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
	      var leaf = leafs[iLeaf];
	      handlers = leaf._listeners;
	      if (isArray(handlers)) {

	        var position = -1;

	        for (var i = 0, length = handlers.length; i < length; i++) {
	          if (handlers[i] === listener ||
	            (handlers[i].listener && handlers[i].listener === listener) ||
	            (handlers[i]._origin && handlers[i]._origin === listener)) {
	            position = i;
	            break;
	          }
	        }

	        if (position < 0) {
	          continue;
	        }

	        if(this.wildcard) {
	          leaf._listeners.splice(position, 1);
	        }
	        else {
	          this._events[type].splice(position, 1);
	        }

	        if (handlers.length === 0) {
	          if(this.wildcard) {
	            delete leaf._listeners;
	          }
	          else {
	            delete this._events[type];
	          }
	        }
	        return this;
	      }
	      else if (handlers === listener ||
	        (handlers.listener && handlers.listener === listener) ||
	        (handlers._origin && handlers._origin === listener)) {
	        if(this.wildcard) {
	          delete leaf._listeners;
	        }
	        else {
	          delete this._events[type];
	        }
	      }
	    }

	    return this;
	  };

	  EventEmitter.prototype.offAny = function(fn) {
	    var i = 0, l = 0, fns;
	    if (fn && this._all && this._all.length > 0) {
	      fns = this._all;
	      for(i = 0, l = fns.length; i < l; i++) {
	        if(fn === fns[i]) {
	          fns.splice(i, 1);
	          return this;
	        }
	      }
	    } else {
	      this._all = [];
	    }
	    return this;
	  };

	  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

	  EventEmitter.prototype.removeAllListeners = function(type) {
	    if (arguments.length === 0) {
	      !this._events || init.call(this);
	      return this;
	    }

	    if(this.wildcard) {
	      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
	      var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

	      for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
	        var leaf = leafs[iLeaf];
	        leaf._listeners = null;
	      }
	    }
	    else {
	      if (!this._events[type]) return this;
	      this._events[type] = null;
	    }
	    return this;
	  };

	  EventEmitter.prototype.listeners = function(type) {
	    if(this.wildcard) {
	      var handlers = [];
	      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
	      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
	      return handlers;
	    }

	    this._events || init.call(this);

	    if (!this._events[type]) this._events[type] = [];
	    if (!isArray(this._events[type])) {
	      this._events[type] = [this._events[type]];
	    }
	    return this._events[type];
	  };

	  EventEmitter.prototype.listenersAny = function() {

	    if(this._all) {
	      return this._all;
	    }
	    else {
	      return [];
	    }

	  };

	  if (true) {
	     // AMD. Register as an anonymous module.
	    !(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	      return EventEmitter;
	    }.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	  } else if (typeof exports === 'object') {
	    // CommonJS
	    exports.EventEmitter2 = EventEmitter;
	  }
	  else {
	    // Browser global.
	    window.EventEmitter2 = EventEmitter;
	  }
	}();


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * WAVEFORM.OVERVIEW.JS
	 *
	 * This module handles all functionality related to the overview
	 * timeline canvas and initialises its own instance of the axis
	 * object.
	 *
	 */
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(12),
	    __webpack_require__(4),
	    __webpack_require__(11)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function(WaveformAxis, mixins, Kinetic) {
	    'use strict';

	    function WaveformOverview(waveformData, container, peaks) {
	        var that = this;

	        that.peaks = peaks;
	        that.options = peaks.options;
	        that.data = waveformData;
	        that.width = container.clientWidth;
	        that.height = container.clientHeight || that.options.height;
	        that.frameOffset = 0;

	        that.stage = new Kinetic.Stage({
	            container: container,
	            width: that.width,
	            height: that.height
	        });

	        that.waveformLayer = new Kinetic.Layer();

	        that.background = new Kinetic.Rect({
	            x: 0,
	            y: 0,
	            width: that.width,
	            height: that.height
	        });

	        that.waveformLayer.add(that.background);

	        that.createWaveform();
	        that.createRefWaveform();
	        that.createUi();

	        that.stage.add(that.waveformLayer);

	        // INTERACTION ===============================================
	        var cancelSeeking = function() {
	            that.stage.off("mousemove mouseup");
	            peaks.seeking = false;
	        };

	        that.stage.on("mousedown", function(event) {
	            if (event.target &&
	                !event.target.attrs.draggable &&
	                !event.target.parent.attrs.draggable) {
	                if (event.type == "mousedown") {
	                    peaks.seeking = true;

	                    peaks.emit("user_seek.overview", that.data.time(event.evt.layerX), event.evt.layerX);

	                    that.stage.on("mousemove", function(event) {
	                        peaks.emit("user_scrub.overview", that.data.time(event.evt.layerX), event.evt.layerX);
	                    });

	                    that.stage.on("mouseup", cancelSeeking);
	                } else {
	                    cancelSeeking();
	                }
	            }
	        });

	        // EVENTS ====================================================

	        function trackPlayheadPosition(time, frame) {
	            if (!peaks.seaking) {
	                that.playheadPixel = that.data.at_time(time);
	                that.updateUi(that.playheadPixel);
	            }
	        }

	        peaks.on("player_time_update", trackPlayheadPosition);
	        peaks.on("user_seek.*", trackPlayheadPosition);
	        peaks.on("user_scrub.*", trackPlayheadPosition);

	        peaks.on("waveform_zoom_displaying", function(start, end) {
	            that.updateRefWaveform(start, end);
	        });

	        peaks.on("resizeEndOverview", function(width, newWaveformData) {
	            that.width = width;
	            that.data = newWaveformData;
	            that.stage.setWidth(that.width);
	            //that.updateWaveform();
	            peaks.emit("overview_resized");
	        });
	    }

	    WaveformOverview.prototype.createWaveform = function() {
	        var that = this;
	        this.waveformShape = new Kinetic.Shape({
	            fill: that.options.overviewWaveformColor,
	            strokeWidth: 0
	        });

	        this.waveformShape.setDrawFunc(mixins.waveformDrawFunction.bind(this.waveformShape, that));

	        this.waveformLayer.add(this.waveformShape);
	        this.stage.add(this.waveformLayer);
	    };

	    //Green Reference Waveform to inform users where they are in overview waveform based on current zoom level
	    WaveformOverview.prototype.createRefWaveform = function() {
	        var that = this;

	        this.refLayer = new Kinetic.Layer();

	        /*this.refWaveformShape = new Kinetic.Shape({
	          drawFunc: function(canvas) {
	            mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
	          },
	          fill: that.options.zoomWaveformColor,
	          strokeWidth: 0
	        });*/

	        this.refWaveformRect = new Kinetic.Rect({
	            x: 0,
	            y: 11,
	            width: 0,
	            stroke: "grey",
	            strokeWidth: 1,
	            height: this.height - (11 * 2),
	            fill: 'grey',
	            opacity: 0.3,
	            cornerRadius: 2
	        });

	        this.refLayer.add(this.refWaveformRect);
	        this.stage.add(this.refLayer);
	    };

	    WaveformOverview.prototype.createUi = function() {
	        var that = this;

	        this.playheadLine = new Kinetic.Line({
	            points: [0.5, 0, 0.5, that.height],
	            stroke: that.options.playheadColor,
	            strokeWidth: 1,
	            x: 0
	        });

	        that.uiLayer = new Kinetic.Layer({
	            index: 100
	        });
	        that.axis = new WaveformAxis(that);

	        this.uiLayer.add(this.playheadLine);
	        this.stage.add(this.uiLayer);
	    };

	    /*WaveformOverview.prototype.updateWaveform = function () {
	      var that = this;
	      that.waveformShape.setDrawFunc(function(canvas) {
	        mixins.waveformDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
	      });
	      that.waveformLayer.draw();
	    };

	    WaveformOverview.prototype.updateRefWaveform = function (time_in, time_out) {
	      var that = this;

	      var offset_in = that.data.at_time(time_in);
	      var offset_out = that.data.at_time(time_out);

	      that.refWaveformShape.setDrawFunc(function(canvas) {
	        that.data.set_segment(offset_in, offset_out, "zoom");

	        mixins.waveformOffsetDrawFunction.call(this, that.data, canvas, mixins.interpolateHeight(that.height));
	      });

	      that.refWaveformShape.setWidth(that.data.at_time(time_out) - that.data.at_time(time_in));
	      that.refLayer.draw();
	    };*/

	    WaveformOverview.prototype.updateRefWaveform = function(time_in, time_out) {
	        var that = this;

	        var offset_in = that.data.at_time(time_in);
	        var offset_out = that.data.at_time(time_out);

	        that.data.set_segment(offset_in, offset_out, "zoom");

	        that.refWaveformRect.setAttrs({
	            x: that.data.segments.zoom.offset_start - that.data.offset_start,
	            width: that.data.at_time(time_out) - that.data.at_time(time_in)
	        });

	        that.refLayer.draw();
	    };

	    WaveformOverview.prototype.updateUi = function(pixel) {
	        var that = this;

	        that.playheadLine.setAttr("x", pixel);
	        that.uiLayer.draw();
	    };

	    return WaveformOverview;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * WAVEFORM.ZOOMVIEW.JS
	 *
	 * This module handles all functionality related to the zoomed in
	 * waveform view canvas and initialises its own instance of the axis
	 * object.
	 *
	 */
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(12),
	    __webpack_require__(4),
	    __webpack_require__(13),
	    __webpack_require__(11)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function(WaveformAxis, mixins, ZoomAnimation, Kinetic) {
	    'use strict';

	    function WaveformZoomView(waveformData, container, peaks) {
	        var that = this;

	        that.cur_scale = 0;

	        that.peaks = peaks;
	        that.options = peaks.options;
	        that.rootData = waveformData;

	        that.playing = false;

	        that.intermediateData = null;
	        that.data = that.rootData.resample({
	            scale: that.options.zoomLevels[peaks.zoom.getZoom()]
	        });
	        that.playheadPixel = that.data.at_time(that.options.mediaElement.currentTime);
	        that.pixelLength = that.data.adapter.length;
	        that.frameOffset = 0; // the pixel offset of the current frame being displayed

	        that.width = container.clientWidth;
	        that.height = container.clientHeight || that.options.height;

	        that.data.offset(that.frameOffset, that.frameOffset + that.width);

	        that.stage = new Kinetic.Stage({
	            container: container,
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

	        that.zoomWaveformLayer.add(that.background);

	        that.axis = new WaveformAxis(that);

	        that.createZoomWaveform();
	        that.createUi();

	        // INTERACTION ===============================================

	        that.stage.on("mousedown", function(event) {
	            if (event.target &&
	                !event.target.attrs.draggable &&
	                !event.target.parent.attrs.draggable) {
	                if (event.type === "mousedown") {
	                    var x = event.evt.layerX,
	                        dX, p;
	                    peaks.seeking = true;

	                    // enable drag if necessary
	                    that.stage.on("mousemove", function(event) {
	                        peaks.seeking = false;

	                        dX = event.evt.layerX > x ? x - event.evt.layerX : (x - event.evt.layerX) * 1;
	                        x = event.evt.layerX;
	                        p = that.frameOffset + dX;
	                        p = p < 0 ? 0 : p > (that.pixelLength - that.width) ? (that.pixelLength - that.width) : p;

	                        that.updateZoomWaveform(p);
	                    });

	                    that.stage.on("mouseup", function() {
	                        if (peaks.seeking) {
	                            // Set playhead position only on click release, when not dragging
	                            that.peaks.emit("user_seek.zoomview", that.data.time(that.frameOffset + x), that.frameOffset + x);
	                        }

	                        that.stage.off("mousemove mouseup");
	                        peaks.seeking = false;
	                    });
	                }
	            }
	        });

	        // EVENTS ====================================================

	        var userSeekHandler = function userSeekHandler(options, time) {
	            options = options || {
	                withOffset: true
	            };
	            var frameIndex = that.data.at_time(time);

	            that.seekFrame(frameIndex, options.withOffset ? Math.round(that.width / 2) : 0);

	            if (that.playing) {
	                that.playFrom(time, frameIndex);
	            }
	        };

	        that.peaks.on("player_time_update", function(time) {
	            if (!peaks.seeking) {
	                that.seekFrame(that.data.at_time(time));
	            }
	        });

	        that.peaks.on("player_seek", userSeekHandler.bind(null, {
	            withOffset: true
	        }));
	        that.peaks.on("user_seek.*", userSeekHandler.bind(null, {
	            withOffset: true
	        }));
	        that.peaks.on("user_scrub.*", userSeekHandler.bind(null, {
	            withOffset: false
	        }));

	        that.peaks.on("player_play", function(time) {
	            that.playing = true;
	            that.playFrom(time, that.data.at_time(time));
	        });

	        that.peaks.on("player_pause", function(time) {
	            that.playing = false;

	            if (that.playheadLineAnimation) {
	                that.playheadLineAnimation.stop();
	            }

	            that.syncPlayhead(that.data.at_time(time));
	        });

	        that.peaks.on("zoom.update", function(current_scale, previous_scale) {
	            if (that.playing) {
	                return;
	            }

	            if (current_scale !== previous_scale) {
	                that.data = that.rootData.resample({
	                    scale: current_scale
	                });

	                var animation = ZoomAnimation.init(current_scale, previous_scale, that);
	                animation.start();
	            }
	        });

	        that.peaks.on("window_resized", function(width, newWaveformData) {
	            that.width = width;
	            that.data = newWaveformData;
	            that.stage.setWidth(that.width);
	            that.updateZoomWaveform(that.frameOffset);
	            that.peaks.emit("zoomview_resized");
	        });

	        // KEYBOARD EVENTS =========================================
	        var nudgeFrame = function nudgeFrame(step) {
	            var time = that.options.mediaElement.currentTime;

	            time += (that.options.nudgeIncrement * step);
	            that.seekFrame(that.data.at_time(time));
	        };

	        that.peaks.on("kybrd_left", nudgeFrame.bind(that, -1));
	        that.peaks.on("kybrd_right", nudgeFrame.bind(that, 1));
	        that.peaks.on("kybrd_shift_left", nudgeFrame.bind(that, -10));
	        that.peaks.on("kybrd_shift_right", nudgeFrame.bind(that, 10));
	    }

	    // WAVEFORM ZOOMVIEW FUNCTIONS =========================================

	    WaveformZoomView.prototype.createZoomWaveform = function() {
	        var that = this;
	        that.zoomWaveformShape = new Kinetic.Shape({
	            fill: that.options.zoomWaveformColor,
	            strokeWidth: 0
	        });

	        that.zoomWaveformShape.setDrawFunc(mixins.waveformDrawFunction.bind(that.zoomWaveformShape, that));

	        that.zoomWaveformLayer.add(that.zoomWaveformShape);
	        that.stage.add(that.zoomWaveformLayer);
	        that.peaks.emit("waveform_zoom_displaying", 0 * that.data.seconds_per_pixel, that.width * that.data.seconds_per_pixel);
	    };

	    WaveformZoomView.prototype.createUi = function() {
	        var that = this;

	        that.zoomPlayheadLine = new Kinetic.Line({
	            points: [0.5, 0, 0.5, that.height],
	            stroke: that.options.playheadColor,
	            strokeWidth: 1
	        });

	        that.zoomPlayheadText = new Kinetic.Text({
	            x: 2,
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

	        that.zoomPlayheadGroup.moveToTop();
	    };

	    WaveformZoomView.prototype.updateZoomWaveform = function(pixelOffset) {
	        var that = this;

	        that.frameOffset = pixelOffset;
	        that.pixelLength = that.data.adapter.length;
	        that.data.offset(pixelOffset, pixelOffset + that.width);

	        var display = (that.playheadPixel >= pixelOffset) && (that.playheadPixel <= pixelOffset + that.width); //i.e. playhead is within the zoom frame width

	        if (display) {
	            var remPixels = that.playheadPixel - pixelOffset;

	            that.zoomPlayheadGroup.show().setAttr("x", remPixels);
	            that.zoomPlayheadText.setText(mixins.niceTime(that.data.time(that.playheadPixel), false));
	        } else {
	            that.zoomPlayheadGroup.hide();
	        }

	        that.uiLayer.draw();
	        that.zoomWaveformLayer.draw();

	        // if (that.snipWaveformShape) that.updateSnipWaveform(that.currentSnipStartTime, that.currentSnipEndTime);

	        that.peaks.emit("waveform_zoom_displaying", pixelOffset * that.data.seconds_per_pixel, (pixelOffset + that.width) * that.data.seconds_per_pixel);
	    };

	    // UI functions ==============================

	    /**
	     * Create a playhead animation in sync with the audio playback.
	     *
	     * @param {Number} time Position in time where the playhead starts
	     * @param {Integer} startPosition Position in frame index where the playhead starts
	     */
	    WaveformZoomView.prototype.playFrom = function(time, startPosition) {
	        var that = this;

	        if (that.playheadLineAnimation) {
	            that.playheadLineAnimation.stop();
	        }

	        var frameSeconds = 0;
	        var pixelsPerSecond = that.data.pixels_per_second;

	        that.playheadLineAnimation = new Kinetic.Animation(function(frame) {
	            var time = frame.time;

	            var seconds = time / 1000;
	            var positionInFrame = Math.round(startPosition - that.frameOffset + (pixelsPerSecond * (seconds - frameSeconds)));

	            that.syncPlayhead(that.frameOffset + positionInFrame);
	        }, that.uiLayer);

	        that.playheadLineAnimation.start();
	    };

	    WaveformZoomView.prototype.newFrame = function(frameOffset) {
	        var nextOffset = frameOffset + this.width;

	        if (nextOffset < this.data.adapter.length) {
	            this.frameOffset = nextOffset;
	            this.updateZoomWaveform(nextOffset);

	            return true;
	        }

	        return false;
	    };

	    WaveformZoomView.prototype.syncPlayhead = function(pixelIndex) {
	        var that = this;
	        var display = (pixelIndex >= that.frameOffset) && (pixelIndex <= that.frameOffset + that.width);

	        that.playheadPixel = pixelIndex;

	        if (display) {
	            var remPixels = that.playheadPixel - that.frameOffset; //places playhead at centre of zoom frame i.e. remPixels = 500
	            that.zoomPlayheadGroup.show().setAttr("x", remPixels);
	            that.zoomPlayheadText.setText(mixins.niceTime(that.data.time(that.playheadPixel), false));
	        } else {
	            that.zoomPlayheadGroup.hide();
	        }

	        that.uiLayer.draw();
	    };

	    WaveformZoomView.prototype.seekFrame = function(pixelIndex, offset) {
	        var that = this;
	        var upperLimit = that.data.adapter.length - that.width;
	        var direction = pixelIndex < that.data.offset_start ? 'backwards' : 'onwards';

	        if (!that.data.in_offset(pixelIndex)) {
	            that.frameOffset = pixelIndex - Math.round(that.width / 2);
	            if (that.frameOffset <= 0) {
	                that.frameOffset = 0;
	            } else if (that.frameOffset + that.width >= that.data.adapter.length) {
	                that.frameOffset = upperLimit;
	            }
	        }

	        that.syncPlayhead(pixelIndex);
	        that.updateZoomWaveform(that.frameOffset);
	    };

	    return WaveformZoomView;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * WAVEFORM.SEGMENTS.JS
	 *
	 * This module handles all functionality related to the adding,
	 * removing and manipulation of segments
	 */
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(11),
	    __webpack_require__(4),
	    __webpack_require__(14)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function(Kinetic, mixins, SegmentShape) {
	    'use strict';

	    return function(peaks) {
	        var self = this;

	        self.segments = [];
	        self.views = [peaks.waveform.waveformZoomView, peaks.waveform.waveformOverview].map(function(view) {
	            if (!view.segmentLayer) {
	                view.segmentLayer = new Kinetic.Layer();
	                view.stage.add(view.segmentLayer);
	                view.segmentLayer.moveToTop();
	            }

	            return view;
	        });

	        var createSegmentWaveform = function(segmentId, startTime, endTime, editable, color, labelText) {
	            var segment = {
	                id: segmentId,
	                startTime: startTime,
	                endTime: endTime,
	                labelText: labelText || "",
	                color: color || getSegmentColor(),
	                editable: editable
	            };

	            var segmentZoomGroup = new Kinetic.Group();
	            var segmentOverviewGroup = new Kinetic.Group();

	            var segmentGroups = [segmentZoomGroup, segmentOverviewGroup];

	            var menter = function(event) {
	                this.parent.label.show();
	                this.parent.view.segmentLayer.draw();
	            };

	            var mleave = function(event) {
	                this.parent.label.hide();
	                this.parent.view.segmentLayer.draw();
	            };

	            segmentGroups.forEach(function(segmentGroup, i) {
	                var view = self.views[i];

	                segmentGroup.waveformShape = SegmentShape.createShape(segment, view);

	                segmentGroup.waveformShape.on("mouseenter", menter);
	                segmentGroup.waveformShape.on("mouseleave", mleave);

	                segmentGroup.add(segmentGroup.waveformShape);

	                segmentGroup.label = new peaks.options.segmentLabelDraw(segmentGroup, segment);
	                segmentGroup.add(segmentGroup.label.hide());

	                if (editable) {
	                    var draggable = true;

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

	            return segment;
	        };

	        var updateSegmentWaveform = function(segment) {
	            // Binding with data
	            peaks.waveform.waveformOverview.data.set_segment(peaks.waveform.waveformOverview.data.at_time(segment.startTime), peaks.waveform.waveformOverview.data.at_time(segment.endTime), segment.id);
	            peaks.waveform.waveformZoomView.data.set_segment(peaks.waveform.waveformZoomView.data.at_time(segment.startTime), peaks.waveform.waveformZoomView.data.at_time(segment.endTime), segment.id);

	            // Overview
	            var overviewStartOffset = peaks.waveform.waveformOverview.data.at_time(segment.startTime);
	            var overviewEndOffset = peaks.waveform.waveformOverview.data.at_time(segment.endTime);

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

	            SegmentShape.update.call(segment.overview.waveformShape, peaks.waveform.waveformOverview, segment.id);
	            segment.overview.view.segmentLayer.draw();

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

	                if (segment.editable) {
	                    if (segment.zoom.inMarker) segment.zoom.inMarker.show().setX(startPixel - segment.zoom.inMarker.getWidth());
	                    if (segment.zoom.outMarker) segment.zoom.outMarker.show().setX(endPixel);

	                    // Change Text
	                    segment.zoom.inMarker.label.setText(mixins.niceTime(segment.startTime, false));
	                    segment.zoom.outMarker.label.setText(mixins.niceTime(segment.endTime, false));
	                }

	                SegmentShape.update.call(segment.zoom.waveformShape, peaks.waveform.waveformZoomView, segment.id);

	                segment.zoom.view.segmentLayer.draw();

	            } else {
	                segment.zoom.hide();
	            }
	        };

	        var segmentHandleDrag = function(thisSeg, segment) {
	            if (thisSeg.inMarker.getX() > 0) {
	                var inOffset = thisSeg.view.frameOffset + thisSeg.inMarker.getX() + thisSeg.inMarker.getWidth();
	                segment.startTime = thisSeg.view.data.time(inOffset);
	            }

	            if (thisSeg.outMarker.getX() < thisSeg.view.width) {
	                var outOffset = thisSeg.view.frameOffset + thisSeg.outMarker.getX();
	                segment.endTime = thisSeg.view.data.time(outOffset);
	            }

	            updateSegmentWaveform(segment);
	        };

	        var getSegmentColor = function() {
	            var c;
	            if (peaks.options.randomizeSegmentColor) {
	                var g = function() {
	                    return Math.floor(Math.random() * 255);
	                };
	                c = 'rgba(' + g() + ', ' + g() + ', ' + g() + ', 1)';
	            } else {
	                c = peaks.options.segmentColor;
	            }
	            return c;
	        };

	        this.init = function() {
	            peaks.on("waveform_zoom_displaying", this.updateSegments.bind(this));

	            peaks.emit("segments.ready");
	        };

	        /**
	         * Update the segment positioning accordingly to each view zoom level and so on.
	         *
	         * Also performs the rendering.
	         *
	         * @api
	         */
	        this.updateSegments = function() {
	            this.segments.forEach(updateSegmentWaveform);
	            this.render();
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
	        this.createSegment = function(startTime, endTime, editable, color, labelText) {
	            var segmentId = "segment" + self.segments.length;

	            if ((startTime >= 0) === false) {
	                throw new TypeError("[waveform.segments.createSegment] startTime should be a positive value");
	            }

	            if ((endTime > 0) === false) {
	                throw new TypeError("[waveform.segments.createSegment] endTime should be a positive value");
	            }

	            if ((endTime > startTime) === false) {
	                throw new RangeError("[waveform.segments.createSegment] endTime should be higher than startTime");
	            }

	            var segment = createSegmentWaveform(segmentId, startTime, endTime, editable, color, labelText);

	            updateSegmentWaveform(segment);
	            self.segments.push(segment);

	            return segment;
	        };

	        this.remove = function removeSegment(segment) {
	            var index = null;

	            this.segments.some(function(s, i) {
	                if (s === segment) {
	                    index = i;
	                    return true;
	                }
	            });

	            if (typeof index === 'number') {
	                segment = this.segments[index];

	                segment.overview.destroy();
	                segment.zoom.destroy();
	            }

	            return index;
	        };

	        this.removeAll = function removeAllSegments() {
	            this.views.forEach(function(view) {
	                view.segmentLayer.removeChildren();
	            });

	            this.segments = [];

	            this.render();
	        };

	        /**
	         * Performs the rendering of the segments on screen
	         *
	         * @api
	         * @see https://github.com/bbcrd/peaks.js/pull/5
	         * @since 0.0.2
	         */
	        this.render = function renderSegments() {
	            this.views.forEach(function(view) {
	                view.segmentLayer.draw();
	            });
	        };
	    };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * WAVEFORM.POINTS.JS
	 *
	 * This module handles all functionality related to the adding,
	 * removing and manipulation of points. A point in a segment of zero length
	 */
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(4),
	    __webpack_require__(11)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function(mixins, Kinetic) {

	    return function(peaks) {
	        var self = this;
	        var waveformView = peaks.waveform;

	        self.points = [];

	        self.views = [waveformView.waveformZoomView, waveformView.waveformOverview].map(function(view) {
	            if (!view.pointLayer) {
	                view.pointLayer = new Kinetic.Layer();
	                view.stage.add(view.pointLayer);
	                view.pointLayer.moveToTop();
	            }

	            return view;
	        });

	        function constructPoint(point) {
	            var pointZoomGroup = new Kinetic.Group();
	            var pointOverviewGroup = new Kinetic.Group();
	            var pointGroups = [pointZoomGroup, pointOverviewGroup];

	            point.editable = Boolean(point.editable);

	            pointGroups.forEach(function(pointGroup, i) {
	                var view = self.views[i];

	                if (point.editable) {
	                    pointGroup.marker = new peaks.options.pointMarker(true, pointGroup, point, pointHandleDrag, peaks.options.pointDblClickHandler, peaks.options.pointDragEndHandler);
	                    pointGroup.add(pointGroup.marker);
	                }

	                view.pointLayer.add(pointGroup);
	            });

	            point.zoom = pointZoomGroup;
	            point.zoom.view = waveformView.waveformZoomView;
	            point.overview = pointOverviewGroup;
	            point.overview.view = waveformView.waveformOverview;

	            return point;
	        }

	        function updatePoint(point) {
	            // Binding with data
	            waveformView.waveformOverview.data.set_point(waveformView.waveformOverview.data.at_time(point.timestamp), point.id);
	            waveformView.waveformZoomView.data.set_point(waveformView.waveformZoomView.data.at_time(point.timestamp), point.id);

	            // Overview
	            var overviewtimestampOffset = waveformView.waveformOverview.data.at_time(point.timestamp);

	            if (point.editable) {
	                if (point.overview.marker) point.overview.marker.show().setX(overviewtimestampOffset - point.overview.marker.getWidth());

	                // Change Text
	                point.overview.marker.label.setText(mixins.niceTime(point.timestamp, false));
	            }

	            // Zoom
	            var zoomtimestampOffset = waveformView.waveformZoomView.data.at_time(point.timestamp);
	            var frameStartOffset = waveformView.waveformZoomView.frameOffset;

	            if (zoomtimestampOffset < frameStartOffset) {
	                zoomStartOffset = frameStartOffset;
	            }

	            if (waveformView.waveformZoomView.data.points[point.id].visible) {
	                var startPixel = zoomtimestampOffset - frameStartOffset;

	                point.zoom.show();

	                if (point.editable) {
	                    if (point.zoom.marker) point.zoom.marker.show().setX(startPixel - point.zoom.marker.getWidth());

	                    // Change Text
	                    point.zoom.marker.label.setText(mixins.niceTime(point.timestamp, false));
	                }
	            } else {
	                point.zoom.hide();
	            }
	        }

	        function pointHandleDrag(thisPoint, point) {
	            if (thisPoint.marker.getX() > 0) {
	                var inOffset = thisPoint.view.frameOffset + thisPoint.marker.getX() + thisPoint.marker.getWidth();
	                point.timestamp = thisPoint.view.data.time(inOffset);
	            }

	            updatePoint(point);
	            self.render();
	        }

	        this.init = function() {
	            peaks.on("waveform_zoom_displaying", self.updatePoints.bind(self));
	            peaks.emit("points.ready");
	        };

	        this.updatePoints = function() {
	            self.points.forEach(updatePoint);
	            self.render();
	        };

	        this.createPoint = function(point) {

	            if ((point.timestamp >= 0) === false) {
	                throw new RangeError("[waveform.points.createPoint] timestamp should be a >=0 value");
	            }

	            point.id = "point" + self.points.length;

	            point = constructPoint(point);
	            updatePoint(point);
	            self.points.push(point);
	        };

	        this.remove = function removePoint(point) {
	            var index = null;

	            this.points.some(function(p, i) {
	                if (p === point) {
	                    index = i;
	                    return true;
	                }
	            });

	            if (typeof index === 'number') {
	                point.overview.destroy();
	                point.zoom.destroy();
	            }

	            return index;
	        };

	        this.removeAll = function removeAllPoints() {
	            this.views.forEach(function(view) {
	                view.pointLayer.removeChildren();
	            });

	            this.points = [];

	            this.render();
	        };

	        /**
	         * Performs the rendering of the segments on screen
	         *
	         * @api
	         * @since 0.3.0
	         */
	        this.render = function renderPoints() {
	            self.views.forEach(function(view) {
	                view.pointLayer.draw();
	            });
	        };
	    };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var WaveformData = __webpack_require__(17);
	WaveformData.adapters = __webpack_require__(19);

	WaveformData.builders = {
	  webaudio: __webpack_require__(18)
	};

	module.exports = WaveformData;

/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {
	/*
	 * KineticJS JavaScript Framework v5.1.1
	 * http://www.kineticjs.com/
	 * Copyright 2013, Eric Rowell
	 * Licensed under the MIT or GPL Version 2 licenses.
	 * Date: 2014-10-03
	 *
	 * Copyright (C) 2011 - 2013 by Eric Rowell
	 *
	 * Permission is hereby granted, free of charge, to any person obtaining a copy
	 * of this software and associated documentation files (the "Software"), to deal
	 * in the Software without restriction, including without limitation the rights
	 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 * copies of the Software, and to permit persons to whom the Software is
	 * furnished to do so, subject to the following conditions:
	 *
	 * The above copyright notice and this permission notice shall be included in
	 * all copies or substantial portions of the Software.
	 *
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 * THE SOFTWARE.
	 */
	/**
	 * @namespace Kinetic
	 */
	/*jshint -W079, -W020*/
	var Kinetic = {};
	(function(root) {
	    var PI_OVER_180 = Math.PI / 180;

	    Kinetic = {
	        // public
	        version: '5.1.1',

	        // private
	        stages: [],
	        idCounter: 0,
	        ids: {},
	        names: {},
	        shapes: {},
	        listenClickTap: false,
	        inDblClickWindow: false,

	        // configurations
	        enableTrace: false,
	        traceArrMax: 100,
	        dblClickWindow: 400,
	        /**
	         * Global pixel ratio configuration. KineticJS automatically detect pixel ratio of current device.
	         * But you may override such property, if you want to use your value.
	         * @property pixelRatio
	         * @default undefined
	         * @memberof Kinetic
	         * @example
	         * Kinetic.pixelRatio = 1;
	         */
	        pixelRatio: undefined,
	        /**
	         * Drag distance property. If you start to drag a node you may want to wait until pointer is moved to some distance from start point,
	         * only then start dragging.
	         * @property dragDistance
	         * @default 0
	         * @memberof Kinetic
	         * @example
	         * Kinetic.dragDistance = 10;
	         */
	        dragDistance : 0,
	        /**
	         * Use degree values for angle properties. You may set this property to false if you want to use radiant values.
	         * @property angleDeg
	         * @default true
	         * @memberof Kinetic
	         * @example
	         * node.rotation(45); // 45 degrees
	         * Kinetic.angleDeg = false;
	         * node.rotation(Math.PI / 2); // PI/2 radian
	         */
	        angleDeg: true,
	         /**
	         * Show different warnings about errors or wrong API usage
	         * @property showWarnings
	         * @default true
	         * @memberof Kinetic
	         * @example
	         * Kinetic.showWarnings = false;
	         */
	        showWarnings : true,



	        /**
	         * @namespace Filters
	         * @memberof Kinetic
	         */
	        Filters: {},

	        /**
	         * Node constructor. Nodes are entities that can be transformed, layered,
	         * and have bound events. The stage, layers, groups, and shapes all extend Node.
	         * @constructor
	         * @memberof Kinetic
	         * @abstract
	         * @param {Object} config
	         * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	         */
	        Node: function(config) {
	            this._init(config);
	        },

	        /**
	         * Shape constructor.  Shapes are primitive objects such as rectangles,
	         *  circles, text, lines, etc.
	         * @constructor
	         * @memberof Kinetic
	         * @augments Kinetic.Node
	         * @param {Object} config
	         * @param {String} [config.fill] fill color
	     * @param {Integer} [config.fillRed] set fill red component
	     * @param {Integer} [config.fillGreen] set fill green component
	     * @param {Integer} [config.fillBlue] set fill blue component
	     * @param {Integer} [config.fillAlpha] set fill alpha component
	     * @param {Image} [config.fillPatternImage] fill pattern image
	     * @param {Number} [config.fillPatternX]
	     * @param {Number} [config.fillPatternY]
	     * @param {Object} [config.fillPatternOffset] object with x and y component
	     * @param {Number} [config.fillPatternOffsetX] 
	     * @param {Number} [config.fillPatternOffsetY] 
	     * @param {Object} [config.fillPatternScale] object with x and y component
	     * @param {Number} [config.fillPatternScaleX]
	     * @param {Number} [config.fillPatternScaleY]
	     * @param {Number} [config.fillPatternRotation]
	     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
	     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientStartPointX]
	     * @param {Number} [config.fillLinearGradientStartPointY]
	     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientEndPointX]
	     * @param {Number} [config.fillLinearGradientEndPointY]
	     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
	     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientStartPointX]
	     * @param {Number} [config.fillRadialGradientStartPointY]
	     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientEndPointX] 
	     * @param {Number} [config.fillRadialGradientEndPointY] 
	     * @param {Number} [config.fillRadialGradientStartRadius]
	     * @param {Number} [config.fillRadialGradientEndRadius]
	     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
	     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
	     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
	     * @param {String} [config.stroke] stroke color
	     * @param {Integer} [config.strokeRed] set stroke red component
	     * @param {Integer} [config.strokeGreen] set stroke green component
	     * @param {Integer} [config.strokeBlue] set stroke blue component
	     * @param {Integer} [config.strokeAlpha] set stroke alpha component
	     * @param {Number} [config.strokeWidth] stroke width
	     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
	     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
	     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
	     *  is miter
	     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
	     *  is butt
	     * @param {String} [config.shadowColor]
	     * @param {Integer} [config.shadowRed] set shadow color red component
	     * @param {Integer} [config.shadowGreen] set shadow color green component
	     * @param {Integer} [config.shadowBlue] set shadow color blue component
	     * @param {Integer} [config.shadowAlpha] set shadow color alpha component
	     * @param {Number} [config.shadowBlur]
	     * @param {Object} [config.shadowOffset] object with x and y component
	     * @param {Number} [config.shadowOffsetX]
	     * @param {Number} [config.shadowOffsetY]
	     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
	     *  between 0 and 1
	     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
	     * @param {Array} [config.dash]
	     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
	         * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	         * @example
	         * var customShape = new Kinetic.Shape({
	         *   x: 5,
	         *   y: 10,
	         *   fill: 'red',
	         *   // a Kinetic.Canvas renderer is passed into the drawFunc function
	         *   drawFunc: function(context) {
	         *     context.beginPath();
	         *     context.moveTo(200, 50);
	         *     context.lineTo(420, 80);
	         *     context.quadraticCurveTo(300, 100, 260, 170);
	         *     context.closePath();
	         *     context.fillStrokeShape(this);
	         *   }
	         *});
	         */
	        Shape: function(config) {
	            this.__init(config);
	        },

	        /**
	         * Container constructor.&nbsp; Containers are used to contain nodes or other containers
	         * @constructor
	         * @memberof Kinetic
	         * @augments Kinetic.Node
	         * @abstract
	         * @param {Object} config
	         * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	         * * @param {Object} [config.clip] set clip
	     * @param {Number} [config.clipX] set clip x
	     * @param {Number} [config.clipY] set clip y
	     * @param {Number} [config.clipWidth] set clip width
	     * @param {Number} [config.clipHeight] set clip height

	         */
	        Container: function(config) {
	            this.__init(config);
	        },

	        /**
	         * Stage constructor.  A stage is used to contain multiple layers
	         * @constructor
	         * @memberof Kinetic
	         * @augments Kinetic.Container
	         * @param {Object} config
	         * @param {String|Element} config.container Container id or DOM element
	         * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	         * @example
	         * var stage = new Kinetic.Stage({
	         *   width: 500,
	         *   height: 800,
	         *   container: 'containerId'
	         * });
	         */
	        Stage: function(config) {
	            this.___init(config);
	        },

	        /**
	         * BaseLayer constructor. 
	         * @constructor
	         * @memberof Kinetic
	         * @augments Kinetic.Container
	         * @param {Object} config
	         * @param {Boolean} [config.clearBeforeDraw] set this property to false if you don't want
	         * to clear the canvas before each layer draw.  The default value is true.
	         * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	         * * @param {Object} [config.clip] set clip
	     * @param {Number} [config.clipX] set clip x
	     * @param {Number} [config.clipY] set clip y
	     * @param {Number} [config.clipWidth] set clip width
	     * @param {Number} [config.clipHeight] set clip height

	         * @example
	         * var layer = new Kinetic.Layer();
	         */
	        BaseLayer: function(config) {
	            this.___init(config);
	        },

	        /**
	         * Layer constructor.  Layers are tied to their own canvas element and are used
	         * to contain groups or shapes.
	         * @constructor
	         * @memberof Kinetic
	         * @augments Kinetic.BaseLayer
	         * @param {Object} config
	         * @param {Boolean} [config.clearBeforeDraw] set this property to false if you don't want
	         * to clear the canvas before each layer draw.  The default value is true.
	         * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	         * * @param {Object} [config.clip] set clip
	     * @param {Number} [config.clipX] set clip x
	     * @param {Number} [config.clipY] set clip y
	     * @param {Number} [config.clipWidth] set clip width
	     * @param {Number} [config.clipHeight] set clip height

	         * @example
	         * var layer = new Kinetic.Layer();
	         */
	        Layer: function(config) {
	            this.____init(config);
	        },

	        /**
	         * FastLayer constructor. Layers are tied to their own canvas element and are used
	         * to contain shapes only.  If you don't need node nesting, mouse and touch interactions,
	         * or event pub/sub, you should use FastLayer instead of Layer to create your layers.
	         * It renders about 2x faster than normal layers.
	         * @constructor
	         * @memberof Kinetic
	         * @augments Kinetic.BaseLayer
	         * @param {Object} config
	         * @param {Boolean} [config.clearBeforeDraw] set this property to false if you don't want
	         * to clear the canvas before each layer draw.  The default value is true.
	         * @param {Boolean} [config.visible]
	         * @param {String} [config.id] unique id
	         * @param {String} [config.name] non-unique name
	         * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	         * * @param {Object} [config.clip] set clip
	     * @param {Number} [config.clipX] set clip x
	     * @param {Number} [config.clipY] set clip y
	     * @param {Number} [config.clipWidth] set clip width
	     * @param {Number} [config.clipHeight] set clip height

	         * @example
	         * var layer = new Kinetic.FastLayer();
	         */
	        FastLayer: function(config) {
	            this.____init(config);
	        },

	        /**
	         * Group constructor.  Groups are used to contain shapes or other groups.
	         * @constructor
	         * @memberof Kinetic
	         * @augments Kinetic.Container
	         * @param {Object} config
	         * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	         * * @param {Object} [config.clip] set clip
	     * @param {Number} [config.clipX] set clip x
	     * @param {Number} [config.clipY] set clip y
	     * @param {Number} [config.clipWidth] set clip width
	     * @param {Number} [config.clipHeight] set clip height

	         * @example
	         * var group = new Kinetic.Group();
	         */
	        Group: function(config) {
	            this.___init(config);
	        },

	        /**
	         * returns whether or not drag and drop is currently active
	         * @method
	         * @memberof Kinetic
	         */
	        isDragging: function() {
	            var dd = Kinetic.DD;

	            // if DD is not included with the build, then
	            // drag and drop is not even possible
	            if (dd) {
	                return dd.isDragging;
	            } else {
	                return false;
	            }
	        },
	        /**
	        * returns whether or not a drag and drop operation is ready, but may
	        *  not necessarily have started
	        * @method
	        * @memberof Kinetic
	        */
	        isDragReady: function() {
	            var dd = Kinetic.DD;

	            // if DD is not included with the build, then
	            // drag and drop is not even possible
	            if (dd) {
	                return !!dd.node;
	            } else {
	                return false;
	            }
	        },
	        _addId: function(node, id) {
	            if(id !== undefined) {
	                this.ids[id] = node;
	            }
	        },
	        _removeId: function(id) {
	            if(id !== undefined) {
	                delete this.ids[id];
	            }
	        },
	        _addName: function(node, name) {
	            if(name !== undefined) {
	                var names = name.split(/\W+/g);
	                for(var n = 0; n < names.length; n++) {
	                    if (names[n]) {
	                        if(this.names[names[n]] === undefined) {
	                            this.names[names[n]] = [];
	                        }
	                        this.names[names[n]].push(node);
	                    }
	                }
	            }
	        },
	        _removeName: function(name, _id) {
	            if(name !== undefined) {
	                var nodes = this.names[name];
	                if(nodes !== undefined) {
	                    for(var n = 0; n < nodes.length; n++) {
	                        var no = nodes[n];
	                        if(no._id === _id) {
	                            nodes.splice(n, 1);
	                        }
	                    }
	                    if(nodes.length === 0) {
	                        delete this.names[name];
	                    }
	                }
	            }
	        },
	        getAngle: function(angle) {
	            return this.angleDeg ? angle * PI_OVER_180 : angle;
	        },
	        _parseUA: function(userAgent) {
	            var ua = userAgent.toLowerCase(),
	                // jQuery UA regex
	                match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
	                /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
	                /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
	                /(msie) ([\w.]+)/.exec( ua ) ||
	                ua.indexOf('compatible') < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
	                [],

	                // adding mobile flag as well
	                mobile = !!(userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile/i)),
	                ieMobile = !!(userAgent.match(/IEMobile/i));
	                
	            return {
	                browser: match[ 1 ] || '',
	                version: match[ 2 ] || '0',

	                // adding mobile flab
	                mobile: mobile,
	                ieMobile: ieMobile  // If this is true (i.e., WP8), then Kinetic touch events are executed instead of equivalent Kinetic mouse events
	            };
	        },
	        // user agent  
	        UA: undefined
	    };

	    Kinetic.UA = Kinetic._parseUA((root.navigator && root.navigator.userAgent) || '');
	    
	})(this);

	// Uses Node, AMD or browser globals to create a module.

	// If you want something that will work in other stricter CommonJS environments,
	// or if you need to create a circular dependency, see commonJsStrict.js

	// Defines a module "returnExports" that depends another module called "b".
	// Note that the name of the module is implied by the file name. It is best
	// if the file name and the exported global have matching names.

	// If the 'b' module also uses this type of boilerplate, then
	// in the browser, it will create a global .b that is used below.

	// If you do not want to support the browser global path, then you
	// can remove the `root` use and the passing `this` as the first arg to
	// the top function.

	// if the module has no dependencies, the above pattern can be simplified to
	( function(root, factory) {
	    if( true) {
	        var KineticJS = factory();
	        // runtime-check for browserify
	        if(global.window === global) {
	            Kinetic.document = global.document;
	            Kinetic.window = global;
	        } else {
	            // Node. Does not work with strict CommonJS, but
	            // only CommonJS-like enviroments that support module.exports,
	            // like Node.
	            var Canvas = __webpack_require__(15);
	            var jsdom = __webpack_require__(16).jsdom;

	            Kinetic.document = jsdom('<!DOCTYPE html><html><head></head><body></body></html>');
	            Kinetic.window = Kinetic.document.createWindow();
	            Kinetic.window.Image = Canvas.Image;
	            Kinetic._nodeCanvas = Canvas;
	        }

	        Kinetic.root = root;
	        module.exports = KineticJS;
	        return;
	    }
	    else if( typeof define === 'function' && define.amd) {
	        // AMD. Register as an anonymous module.
	        define(factory);
	    }
	    Kinetic.document = document;
	    Kinetic.window = window;
	    Kinetic.root = root;

	}(this, function() {

	    // Just return a value to define the module export.
	    // This example returns an object, but the module
	    // can return a function as the exported value.
	    return Kinetic;
	}));
	;(function() {
	    /**
	     * Collection constructor.  Collection extends
	     *  Array.  This class is used in conjunction with {@link Kinetic.Container#get}
	     * @constructor
	     * @memberof Kinetic
	     */
	    Kinetic.Collection = function() {
	        var args = [].slice.call(arguments), length = args.length, i = 0;

	        this.length = length;
	        for(; i < length; i++) {
	            this[i] = args[i];
	        }
	        return this;
	    };
	    Kinetic.Collection.prototype = [];
	    /**
	     * iterate through node array and run a function for each node.
	     *  The node and index is passed into the function
	     * @method
	     * @memberof Kinetic.Collection.prototype
	     * @param {Function} func
	     * @example
	     * // get all nodes with name foo inside layer, and set x to 10 for each
	     * layer.get('.foo').each(function(shape, n) {
	     *   shape.setX(10);
	     * });
	     */
	    Kinetic.Collection.prototype.each = function(func) {
	        for(var n = 0; n < this.length; n++) {
	            func(this[n], n);
	        }
	    };
	    /**
	     * convert collection into an array
	     * @method
	     * @memberof Kinetic.Collection.prototype
	     */
	    Kinetic.Collection.prototype.toArray = function() {
	        var arr = [],
	            len = this.length,
	            n;

	        for(n = 0; n < len; n++) {
	            arr.push(this[n]);
	        }
	        return arr;
	    };
	    /**
	     * convert array into a collection
	     * @method
	     * @memberof Kinetic.Collection
	     * @param {Array} arr
	     */
	    Kinetic.Collection.toCollection = function(arr) {
	        var collection = new Kinetic.Collection(),
	            len = arr.length,
	            n;

	        for(n = 0; n < len; n++) {
	            collection.push(arr[n]);
	        }
	        return collection;
	    };

	    // map one method by it's name
	    Kinetic.Collection._mapMethod = function(methodName) {
	        Kinetic.Collection.prototype[methodName] = function() {
	            var len = this.length,
	                i;

	            var args = [].slice.call(arguments);
	            for(i = 0; i < len; i++) {
	                this[i][methodName].apply(this[i], args);
	            }

	            return this;
	        };
	    };

	    Kinetic.Collection.mapMethods = function(constructor) {
	        var prot = constructor.prototype;
	        for(var methodName in prot) {
	            Kinetic.Collection._mapMethod(methodName);
	        }
	    };

	    /*
	    * Last updated November 2011
	    * By Simon Sarris
	    * www.simonsarris.com
	    * sarris@acm.org
	    *
	    * Free to use and distribute at will
	    * So long as you are nice to people, etc
	    */

	    /*
	    * The usage of this class was inspired by some of the work done by a forked
	    * project, KineticJS-Ext by Wappworks, which is based on Simon's Transform
	    * class.  Modified by Eric Rowell
	    */

	    /**
	     * Transform constructor
	     * @constructor
	     * @param {Array} [m] Optional six-element matrix
	     * @memberof Kinetic
	     */
	    Kinetic.Transform = function(m) {
	        this.m = (m && m.slice()) || [1, 0, 0, 1, 0, 0];
	    };

	    Kinetic.Transform.prototype = {
	        /**
	         * Copy Kinetic.Transform object
	         * @method
	         * @memberof Kinetic.Transform.prototype
	         * @returns {Kinetic.Transform}
	         */
	        copy: function() {
	            return new Kinetic.Transform(this.m);
	        },
	        /**
	         * Transform point
	         * @method
	         * @memberof Kinetic.Transform.prototype
	         * @param {Object} point 2D point(x, y)
	         * @returns {Object} 2D point(x, y)
	         */
	        point: function(point) {
	            var m = this.m;
	            return {
	                x: m[0] * point.x + m[2] * point.y + m[4],
	                y: m[1] * point.x + m[3] * point.y + m[5]
	            };
	        },
	        /**
	         * Apply translation
	         * @method
	         * @memberof Kinetic.Transform.prototype
	         * @param {Number} x
	         * @param {Number} y
	         * @returns {Kinetic.Transform}
	         */
	        translate: function(x, y) {
	            this.m[4] += this.m[0] * x + this.m[2] * y;
	            this.m[5] += this.m[1] * x + this.m[3] * y;
	            return this;
	        },
	        /**
	         * Apply scale
	         * @method
	         * @memberof Kinetic.Transform.prototype
	         * @param {Number} sx
	         * @param {Number} sy
	         * @returns {Kinetic.Transform}
	         */
	        scale: function(sx, sy) {
	            this.m[0] *= sx;
	            this.m[1] *= sx;
	            this.m[2] *= sy;
	            this.m[3] *= sy;
	            return this;
	        },
	        /**
	         * Apply rotation
	         * @method
	         * @memberof Kinetic.Transform.prototype
	         * @param {Number} rad  Angle in radians
	         * @returns {Kinetic.Transform}
	         */
	        rotate: function(rad) {
	            var c = Math.cos(rad);
	            var s = Math.sin(rad);
	            var m11 = this.m[0] * c + this.m[2] * s;
	            var m12 = this.m[1] * c + this.m[3] * s;
	            var m21 = this.m[0] * -s + this.m[2] * c;
	            var m22 = this.m[1] * -s + this.m[3] * c;
	            this.m[0] = m11;
	            this.m[1] = m12;
	            this.m[2] = m21;
	            this.m[3] = m22;
	            return this;
	        },
	        /**
	         * Returns the translation
	         * @method
	         * @memberof Kinetic.Transform.prototype
	         * @returns {Object} 2D point(x, y)
	         */
	        getTranslation: function() {
	            return {
	                x: this.m[4],
	                y: this.m[5]
	            };
	        },
	        /**
	         * Apply skew
	         * @method
	         * @memberof Kinetic.Transform.prototype
	         * @param {Number} sx
	         * @param {Number} sy
	         * @returns {Kinetic.Transform}
	         */
	        skew: function(sx, sy) {
	            var m11 = this.m[0] + this.m[2] * sy;
	            var m12 = this.m[1] + this.m[3] * sy;
	            var m21 = this.m[2] + this.m[0] * sx;
	            var m22 = this.m[3] + this.m[1] * sx;
	            this.m[0] = m11;
	            this.m[1] = m12;
	            this.m[2] = m21;
	            this.m[3] = m22;
	            return this;
	         },
	        /**
	         * Transform multiplication
	         * @method
	         * @memberof Kinetic.Transform.prototype
	         * @param {Kinetic.Transform} matrix
	         * @returns {Kinetic.Transform}
	         */
	        multiply: function(matrix) {
	            var m11 = this.m[0] * matrix.m[0] + this.m[2] * matrix.m[1];
	            var m12 = this.m[1] * matrix.m[0] + this.m[3] * matrix.m[1];

	            var m21 = this.m[0] * matrix.m[2] + this.m[2] * matrix.m[3];
	            var m22 = this.m[1] * matrix.m[2] + this.m[3] * matrix.m[3];

	            var dx = this.m[0] * matrix.m[4] + this.m[2] * matrix.m[5] + this.m[4];
	            var dy = this.m[1] * matrix.m[4] + this.m[3] * matrix.m[5] + this.m[5];

	            this.m[0] = m11;
	            this.m[1] = m12;
	            this.m[2] = m21;
	            this.m[3] = m22;
	            this.m[4] = dx;
	            this.m[5] = dy;
	            return this;
	        },
	        /**
	         * Invert the matrix
	         * @method
	         * @memberof Kinetic.Transform.prototype
	         * @returns {Kinetic.Transform}
	         */
	        invert: function() {
	            var d = 1 / (this.m[0] * this.m[3] - this.m[1] * this.m[2]);
	            var m0 = this.m[3] * d;
	            var m1 = -this.m[1] * d;
	            var m2 = -this.m[2] * d;
	            var m3 = this.m[0] * d;
	            var m4 = d * (this.m[2] * this.m[5] - this.m[3] * this.m[4]);
	            var m5 = d * (this.m[1] * this.m[4] - this.m[0] * this.m[5]);
	            this.m[0] = m0;
	            this.m[1] = m1;
	            this.m[2] = m2;
	            this.m[3] = m3;
	            this.m[4] = m4;
	            this.m[5] = m5;
	            return this;
	        },
	        /**
	         * return matrix
	         * @method
	         * @memberof Kinetic.Transform.prototype
	         */
	        getMatrix: function() {
	            return this.m;
	        },
	        /**
	         * set to absolute position via translation
	         * @method
	         * @memberof Kinetic.Transform.prototype
	         * @returns {Kinetic.Transform}
	         * @author ericdrowell
	         */
	        setAbsolutePosition: function(x, y) {
	            var m0 = this.m[0],
	                m1 = this.m[1],
	                m2 = this.m[2],
	                m3 = this.m[3],
	                m4 = this.m[4],
	                m5 = this.m[5],
	                yt = ((m0 * (y - m5)) - (m1 * (x - m4))) / ((m0 * m3) - (m1 * m2)),
	                xt = (x - m4 - (m2 * yt)) / m0;

	            return this.translate(xt, yt);
	        }
	    };

	    // CONSTANTS
	    var CONTEXT_2D = '2d',
	        OBJECT_ARRAY = '[object Array]',
	        OBJECT_NUMBER = '[object Number]',
	        OBJECT_STRING = '[object String]',
	        PI_OVER_DEG180 = Math.PI / 180,
	        DEG180_OVER_PI = 180 / Math.PI,
	        HASH = '#',
	        EMPTY_STRING = '',
	        ZERO = '0',
	        KINETIC_WARNING = 'Kinetic warning: ',
	        KINETIC_ERROR = 'Kinetic error: ',
	        RGB_PAREN = 'rgb(',
	        COLORS = {
	            aqua: [0,255,255],
	            lime: [0,255,0],
	            silver: [192,192,192],
	            black: [0,0,0],
	            maroon: [128,0,0],
	            teal: [0,128,128],
	            blue: [0,0,255],
	            navy: [0,0,128],
	            white: [255,255,255],
	            fuchsia: [255,0,255],
	            olive:[128,128,0],
	            yellow: [255,255,0],
	            orange: [255,165,0],
	            gray: [128,128,128],
	            purple: [128,0,128],
	            green: [0,128,0],
	            red: [255,0,0],
	            pink: [255,192,203],
	            cyan: [0,255,255],
	            transparent: [255,255,255,0]
	        },

	        RGB_REGEX = /rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)/;

	    /**
	     * @namespace Util
	     * @memberof Kinetic
	     */
	    Kinetic.Util = {
	        /*
	         * cherry-picked utilities from underscore.js
	         */
	        _isElement: function(obj) {
	            return !!(obj && obj.nodeType == 1);
	        },
	        _isFunction: function(obj) {
	            return !!(obj && obj.constructor && obj.call && obj.apply);
	        },
	        _isObject: function(obj) {
	            return (!!obj && obj.constructor == Object);
	        },
	        _isArray: function(obj) {
	            return Object.prototype.toString.call(obj) == OBJECT_ARRAY;
	        },
	        _isNumber: function(obj) {
	            return Object.prototype.toString.call(obj) == OBJECT_NUMBER;
	        },
	        _isString: function(obj) {
	            return Object.prototype.toString.call(obj) == OBJECT_STRING;
	        },
	        // Returns a function, that, when invoked, will only be triggered at most once
	        // during a given window of time. Normally, the throttled function will run
	        // as much as it can, without ever going more than once per `wait` duration;
	        // but if you'd like to disable the execution on the leading edge, pass
	        // `{leading: false}`. To disable execution on the trailing edge, ditto.
	        _throttle: function(func, wait, opts) {
	            var context, args, result;
	            var timeout = null;
	            var previous = 0;
	            var options = opts || {};
	            var later = function() {
	                previous = options.leading === false ? 0 : new Date().getTime();
	                timeout = null;
	                result = func.apply(context, args);
	                context = args = null;
	            };
	            return function() {
	                var now = new Date().getTime();
	                if (!previous && options.leading === false) {
	                    previous = now;
	                }
	                var remaining = wait - (now - previous);
	                context = this;
	                args = arguments;
	                if (remaining <= 0) {
	                  clearTimeout(timeout);
	                  timeout = null;
	                  previous = now;
	                  result = func.apply(context, args);
	                  context = args = null;
	                } else if (!timeout && options.trailing !== false) {
	                  timeout = setTimeout(later, remaining);
	                }
	                return result;
	            };
	        },
	        /*
	         * other utils
	         */
	        _hasMethods: function(obj) {
	            var names = [],
	                key;

	            for(key in obj) {
	                if(this._isFunction(obj[key])) {
	                    names.push(key);
	                }
	            }
	            return names.length > 0;
	        },
	        createCanvasElement: function() {
	            var canvas = Kinetic.document.createElement('canvas');
	            // on some environments canvas.style is readonly
	            try {
	                canvas.style = canvas.style || {};
	            } catch (e) {
	            }
	            return canvas;
	        },
	        isBrowser: function() {
	            return (typeof exports !==  'object');
	        },
	        _isInDocument: function(el) {
	            while(el = el.parentNode) {
	                if(el == Kinetic.document) {
	                    return true;
	                }
	            }
	            return false;
	        },
	        _simplifyArray: function(arr) {
	            var retArr = [],
	                len = arr.length,
	                util = Kinetic.Util,
	                n, val;

	            for (n=0; n<len; n++) {
	                val = arr[n];
	                if (util._isNumber(val)) {
	                    val = Math.round(val * 1000) / 1000;
	                }
	                else if (!util._isString(val)) {
	                    val = val.toString();
	                }

	                retArr.push(val);
	            }

	            return retArr;
	        },
	        /*
	         * arg can be an image object or image data
	         */
	        _getImage: function(arg, callback) {
	            var imageObj, canvas;

	            // if arg is null or undefined
	            if(!arg) {
	                callback(null);
	            }

	            // if arg is already an image object
	            else if(this._isElement(arg)) {
	                callback(arg);
	            }

	            // if arg is a string, then it's a data url
	            else if(this._isString(arg)) {
	                imageObj = new Kinetic.window.Image();
	                imageObj.onload = function() {
	                    callback(imageObj);
	                };
	                imageObj.src = arg;
	            }

	            //if arg is an object that contains the data property, it's an image object
	            else if(arg.data) {
	                canvas = Kinetic.Util.createCanvasElement();
	                canvas.width = arg.width;
	                canvas.height = arg.height;
	                var _context = canvas.getContext(CONTEXT_2D);
	                _context.putImageData(arg, 0, 0);
	                this._getImage(canvas.toDataURL(), callback);
	            }
	            else {
	                callback(null);
	            }
	        },
	        _getRGBAString: function(obj) {
	            var red = obj.red || 0,
	                green = obj.green || 0,
	                blue = obj.blue || 0,
	                alpha = obj.alpha || 1;

	            return [
	                'rgba(',
	                red,
	                ',',
	                green,
	                ',',
	                blue,
	                ',',
	                alpha,
	                ')'
	            ].join(EMPTY_STRING);
	        },
	        _rgbToHex: function(r, g, b) {
	            return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	        },
	        _hexToRgb: function(hex) {
	            hex = hex.replace(HASH, EMPTY_STRING);
	            var bigint = parseInt(hex, 16);
	            return {
	                r: (bigint >> 16) & 255,
	                g: (bigint >> 8) & 255,
	                b: bigint & 255
	            };
	        },
	        /**
	         * return random hex color
	         * @method
	         * @memberof Kinetic.Util.prototype
	         */
	        getRandomColor: function() {
	            var randColor = (Math.random() * 0xFFFFFF << 0).toString(16);
	            while (randColor.length < 6) {
	                randColor = ZERO + randColor;
	            }
	            return HASH + randColor;
	        },
	        /**
	         * return value with default fallback
	         * @method
	         * @memberof Kinetic.Util.prototype
	         */
	        get: function(val, def) {
	            if (val === undefined) {
	                return def;
	            }
	            else {
	                return val;
	            }
	        },
	        /**
	         * get RGB components of a color
	         * @method
	         * @memberof Kinetic.Util.prototype
	         * @param {String} color
	         * @example
	         * // each of the following examples return {r:0, g:0, b:255}
	         * var rgb = Kinetic.Util.getRGB('blue');
	         * var rgb = Kinetic.Util.getRGB('#0000ff');
	         * var rgb = Kinetic.Util.getRGB('rgb(0,0,255)');
	         */
	        getRGB: function(color) {
	            var rgb;
	            // color string
	            if (color in COLORS) {
	                rgb = COLORS[color];
	                return {
	                    r: rgb[0],
	                    g: rgb[1],
	                    b: rgb[2]
	                };
	            }
	            // hex
	            else if (color[0] === HASH) {
	                return this._hexToRgb(color.substring(1));
	            }
	            // rgb string
	            else if (color.substr(0, 4) === RGB_PAREN) {
	                rgb = RGB_REGEX.exec(color.replace(/ /g,''));
	                return {
	                    r: parseInt(rgb[1], 10),
	                    g: parseInt(rgb[2], 10),
	                    b: parseInt(rgb[3], 10)
	                };
	            }
	            // default
	            else {
	                return {
	                    r: 0,
	                    g: 0,
	                    b: 0
	                };
	            }
	        },
	        // o1 takes precedence over o2
	        _merge: function(o1, o2) {
	            var retObj = this._clone(o2);
	            for(var key in o1) {
	                if(this._isObject(o1[key])) {
	                    retObj[key] = this._merge(o1[key], retObj[key]);
	                }
	                else {
	                    retObj[key] = o1[key];
	                }
	            }
	            return retObj;
	        },
	        cloneObject: function(obj) {
	            var retObj = {};
	            for(var key in obj) {
	                if(this._isObject(obj[key])) {
	                    retObj[key] = this.cloneObject(obj[key]);
	                }
	                else if (this._isArray(obj[key])) {
	                    retObj[key] = this.cloneArray(obj[key]);
	                } else {
	                    retObj[key] = obj[key];
	                }
	            }
	            return retObj;
	        },
	        cloneArray: function(arr) {
	            return arr.slice(0);
	        },
	        _degToRad: function(deg) {
	            return deg * PI_OVER_DEG180;
	        },
	        _radToDeg: function(rad) {
	            return rad * DEG180_OVER_PI;
	        },
	        _capitalize: function(str) {
	            return str.charAt(0).toUpperCase() + str.slice(1);
	        },
	        error: function(str) {
	            throw new Error(KINETIC_ERROR + str);
	        },
	        warn: function(str) {
	            /*
	             * IE9 on Windows7 64bit will throw a JS error
	             * if we don't use window.console in the conditional
	             */
	            if(Kinetic.root.console && console.warn && Kinetic.showWarnings) {
	                console.warn(KINETIC_WARNING + str);
	            }
	        },
	        extend: function(c1, c2) {
	            for(var key in c2.prototype) {
	                if(!( key in c1.prototype)) {
	                    c1.prototype[key] = c2.prototype[key];
	                }
	            }
	        },
	        /**
	         * adds methods to a constructor prototype
	         * @method
	         * @memberof Kinetic.Util.prototype
	         * @param {Function} constructor
	         * @param {Object} methods
	         */
	        addMethods: function(constructor, methods) {
	            var key;

	            for (key in methods) {
	                constructor.prototype[key] = methods[key];
	            }
	        },
	        _getControlPoints: function(x0, y0, x1, y1, x2, y2, t) {
	            var d01 = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)),
	                d12 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
	                fa = t * d01 / (d01 + d12),
	                fb = t * d12 / (d01 + d12),
	                p1x = x1 - fa * (x2 - x0),
	                p1y = y1 - fa * (y2 - y0),
	                p2x = x1 + fb * (x2 - x0),
	                p2y = y1 + fb * (y2 - y0);

	            return [p1x ,p1y, p2x, p2y];
	        },
	        _expandPoints: function(p, tension) {
	            var len = p.length,
	                allPoints = [],
	                n, cp;

	            for (n=2; n<len-2; n+=2) {
	                cp = Kinetic.Util._getControlPoints(p[n-2], p[n-1], p[n], p[n+1], p[n+2], p[n+3], tension);
	                allPoints.push(cp[0]);
	                allPoints.push(cp[1]);
	                allPoints.push(p[n]);
	                allPoints.push(p[n+1]);
	                allPoints.push(cp[2]);
	                allPoints.push(cp[3]);
	            }

	            return allPoints;
	        },
	        _removeLastLetter: function(str) {
	            return str.substring(0, str.length - 1);
	        }
	    };
	})();
	;(function() {
	    // calculate pixel ratio
	    var canvas = Kinetic.Util.createCanvasElement(),
	        context = canvas.getContext('2d'),
	        // if using a mobile device, calculate the pixel ratio.  Otherwise, just use
	        // 1.  For desktop browsers, if the user has zoom enabled, it affects the pixel ratio
	        // and causes artifacts on the canvas.  As of 02/26/2014, there doesn't seem to be a way
	        // to reliably calculate the browser zoom for modern browsers, which is why we just set
	        // the pixel ratio to 1 for desktops
	        _pixelRatio = (function() {
	            var devicePixelRatio = window.devicePixelRatio || 1,
	            backingStoreRatio = context.webkitBackingStorePixelRatio
	                || context.mozBackingStorePixelRatio
	                || context.msBackingStorePixelRatio
	                || context.oBackingStorePixelRatio
	                || context.backingStorePixelRatio
	                || 1;
	            return devicePixelRatio / backingStoreRatio;
	        })();

	    /**
	     * Canvas Renderer constructor
	     * @constructor
	     * @abstract
	     * @memberof Kinetic
	     * @param {Object} config
	     * @param {Number} config.width
	     * @param {Number} config.height
	     * @param {Number} config.pixelRatio KineticJS automatically handles pixel ratio adjustments in order to render crisp drawings
	     *  on all devices. Most desktops, low end tablets, and low end phones, have device pixel ratios
	     *  of 1.  Some high end tablets and phones, like iPhones and iPads (not the mini) have a device pixel ratio 
	     *  of 2.  Some Macbook Pros, and iMacs also have a device pixel ratio of 2.  Some high end Android devices have pixel 
	     *  ratios of 2 or 3.  Some browsers like Firefox allow you to configure the pixel ratio of the viewport.  Unless otherwise
	     *  specified, the pixel ratio will be defaulted to the actual device pixel ratio.  You can override the device pixel
	     *  ratio for special situations, or, if you don't want the pixel ratio to be taken into account, you can set it to 1.
	     */
	    Kinetic.Canvas = function(config) {
	        this.init(config);
	    };

	    Kinetic.Canvas.prototype = {
	        init: function(config) {
	            var conf = config || {};

	            var pixelRatio = conf.pixelRatio || Kinetic.pixelRatio || _pixelRatio;

	            this.pixelRatio = pixelRatio;
	            this._canvas = Kinetic.Util.createCanvasElement();

	            // set inline styles
	            this._canvas.style.padding = 0;
	            this._canvas.style.margin = 0;
	            this._canvas.style.border = 0;
	            this._canvas.style.background = 'transparent';
	            this._canvas.style.position = 'absolute';
	            this._canvas.style.top = 0;
	            this._canvas.style.left = 0;
	        },
	        /**
	         * get canvas context
	         * @method
	         * @memberof Kinetic.Canvas.prototype
	         * @returns {CanvasContext} context
	         */
	        getContext: function() {
	            return this.context;
	        },
	        /**
	         * get pixel ratio
	         * @method
	         * @memberof Kinetic.Canvas.prototype
	         * @returns {Number} pixel ratio
	         */
	        getPixelRatio: function() {
	            return this.pixelRatio;
	        },
	        /**
	         * get pixel ratio
	         * @method
	         * @memberof Kinetic.Canvas.prototype
	         * @param {Number} pixelRatio KineticJS automatically handles pixel ratio adustments in order to render crisp drawings 
	         *  on all devices. Most desktops, low end tablets, and low end phones, have device pixel ratios
	         *  of 1.  Some high end tablets and phones, like iPhones and iPads (not the mini) have a device pixel ratio 
	         *  of 2.  Some Macbook Pros, and iMacs also have a device pixel ratio of 2.  Some high end Android devices have pixel 
	         *  ratios of 2 or 3.  Some browsers like Firefox allow you to configure the pixel ratio of the viewport.  Unless otherwise
	         *  specificed, the pixel ratio will be defaulted to the actual device pixel ratio.  You can override the device pixel
	         *  ratio for special situations, or, if you don't want the pixel ratio to be taken into account, you can set it to 1.
	         */
	        setPixelRatio: function(pixelRatio) {
	            this.pixelRatio = pixelRatio;
	            this.setSize(this.getWidth(), this.getHeight());
	        },
	        /**
	         * set width
	         * @method
	         * @memberof Kinetic.Canvas.prototype
	         * @param {Number} width
	         */
	        setWidth: function(width) {
	            // take into account pixel ratio
	            this.width = this._canvas.width = width * this.pixelRatio;
	            this._canvas.style.width = width + 'px';
	        },
	        /**
	         * set height
	         * @method
	         * @memberof Kinetic.Canvas.prototype
	         * @param {Number} height
	         */
	        setHeight: function(height) {
	            // take into account pixel ratio
	            this.height = this._canvas.height = height * this.pixelRatio;
	            this._canvas.style.height = height + 'px';
	        },
	        /**
	         * get width
	         * @method
	         * @memberof Kinetic.Canvas.prototype
	         * @returns {Number} width
	         */
	        getWidth: function() {
	            return this.width;
	        },
	        /**
	         * get height
	         * @method
	         * @memberof Kinetic.Canvas.prototype
	         * @returns {Number} height
	         */
	        getHeight: function() {
	            return this.height;
	        },
	        /**
	         * set size
	         * @method
	         * @memberof Kinetic.Canvas.prototype
	         * @param {Number} width
	         * @param {Number} height
	         */
	        setSize: function(width, height) {
	            this.setWidth(width);
	            this.setHeight(height);
	        },
	        /**
	         * to data url
	         * @method
	         * @memberof Kinetic.Canvas.prototype
	         * @param {String} mimeType
	         * @param {Number} quality between 0 and 1 for jpg mime types
	         * @returns {String} data url string
	         */
	        toDataURL: function(mimeType, quality) {
	            try {
	                // If this call fails (due to browser bug, like in Firefox 3.6),
	                // then revert to previous no-parameter image/png behavior
	                return this._canvas.toDataURL(mimeType, quality);
	            }
	            catch(e) {
	                try {
	                    return this._canvas.toDataURL();
	                }
	                catch(err) {
	                    Kinetic.Util.warn('Unable to get data URL. ' + err.message);
	                    return '';
	                }
	            }
	        }
	    };

	    Kinetic.SceneCanvas = function(config) {
	        var conf = config || {};
	        var width = conf.width || 0,
	            height = conf.height || 0;

	        Kinetic.Canvas.call(this, conf);
	        this.context = new Kinetic.SceneContext(this);
	        this.setSize(width, height);
	    };

	    Kinetic.SceneCanvas.prototype = {
	        setWidth: function(width) {
	            var pixelRatio = this.pixelRatio,
	                _context = this.getContext()._context;

	            Kinetic.Canvas.prototype.setWidth.call(this, width);
	            _context.scale(pixelRatio, pixelRatio);
	        },
	        setHeight: function(height) {
	            var pixelRatio = this.pixelRatio,
	                _context = this.getContext()._context;

	            Kinetic.Canvas.prototype.setHeight.call(this, height);
	            _context.scale(pixelRatio, pixelRatio);
	        }
	    };
	    Kinetic.Util.extend(Kinetic.SceneCanvas, Kinetic.Canvas);

	    Kinetic.HitCanvas = function(config) {
	        var conf = config || {};
	        var width = conf.width || 0,
	            height = conf.height || 0;
	            
	        Kinetic.Canvas.call(this, conf);
	        this.context = new Kinetic.HitContext(this);
	        this.setSize(width, height);
	        this.hitCanvas = true;
	    };
	    Kinetic.Util.extend(Kinetic.HitCanvas, Kinetic.Canvas);

	})();
	;(function() {
	    var COMMA = ',',
	        OPEN_PAREN = '(',
	        CLOSE_PAREN = ')',
	        OPEN_PAREN_BRACKET = '([',
	        CLOSE_BRACKET_PAREN = '])',
	        SEMICOLON = ';',
	        DOUBLE_PAREN = '()',
	        // EMPTY_STRING = '',
	        EQUALS = '=',
	        // SET = 'set',
	        CONTEXT_METHODS = [
	            'arc',
	            'arcTo',
	            'beginPath',
	            'bezierCurveTo',
	            'clearRect',
	            'clip',
	            'closePath',
	            'createLinearGradient',
	            'createPattern',
	            'createRadialGradient',
	            'drawImage',
	            'fill',
	            'fillText',
	            'getImageData',
	            'createImageData',
	            'lineTo',
	            'moveTo',
	            'putImageData',
	            'quadraticCurveTo',
	            'rect',
	            'restore',
	            'rotate',
	            'save',
	            'scale',
	            'setLineDash',
	            'setTransform',
	            'stroke',
	            'strokeText',
	            'transform',
	            'translate'
	        ];

	    /**
	     * Canvas Context constructor
	     * @constructor
	     * @abstract
	     * @memberof Kinetic
	     */
	    Kinetic.Context = function(canvas) {
	        this.init(canvas);
	    };

	    Kinetic.Context.prototype = {
	        init: function(canvas) {
	            this.canvas = canvas;
	            this._context = canvas._canvas.getContext('2d');

	            if (Kinetic.enableTrace) {
	                this.traceArr = [];
	                this._enableTrace();
	            }
	        },
	        /**
	         * fill shape
	         * @method
	         * @memberof Kinetic.Context.prototype
	         * @param {Kinetic.Shape} shape
	         */
	        fillShape: function(shape) {
	            if(shape.getFillEnabled()) {
	                this._fill(shape);
	            }
	        },
	        /**
	         * stroke shape
	         * @method
	         * @memberof Kinetic.Context.prototype
	         * @param {Kinetic.Shape} shape
	         */
	        strokeShape: function(shape) {
	            if(shape.getStrokeEnabled()) {
	                this._stroke(shape);
	            }
	        },
	        /**
	         * fill then stroke
	         * @method
	         * @memberof Kinetic.Context.prototype
	         * @param {Kinetic.Shape} shape
	         */
	        fillStrokeShape: function(shape) {
	            var fillEnabled = shape.getFillEnabled();
	            if(fillEnabled) {
	                this._fill(shape);
	            }
	            if(shape.getStrokeEnabled()) {
	                this._stroke(shape);
	            }
	        },
	        /**
	         * get context trace if trace is enabled
	         * @method
	         * @memberof Kinetic.Context.prototype
	         * @param {Boolean} relaxed if false, return strict context trace, which includes method names, method parameters
	         *  properties, and property values.  If true, return relaxed context trace, which only returns method names and
	         *  properites.
	         * @returns {String}
	         */
	        getTrace: function(relaxed) {
	            var traceArr = this.traceArr,
	                len = traceArr.length,
	                str = '',
	                n, trace, method, args;

	            for (n=0; n<len; n++) {
	                trace = traceArr[n];
	                method = trace.method;

	                // methods
	                if (method) {
	                    args = trace.args;
	                    str += method;
	                    if (relaxed) {
	                        str += DOUBLE_PAREN;
	                    }
	                    else {
	                        if (Kinetic.Util._isArray(args[0])) {
	                            str += OPEN_PAREN_BRACKET + args.join(COMMA) + CLOSE_BRACKET_PAREN;
	                        }
	                        else {
	                            str += OPEN_PAREN + args.join(COMMA) + CLOSE_PAREN;
	                        }
	                    }
	                }
	                // properties
	                else {
	                    str += trace.property;
	                    if (!relaxed) {
	                        str += EQUALS + trace.val;
	                    }
	                }

	                str += SEMICOLON;
	            }

	            return str;
	        },
	        /**
	         * clear trace if trace is enabled
	         * @method
	         * @memberof Kinetic.Context.prototype
	         */
	        clearTrace: function() {
	            this.traceArr = [];
	        },
	        _trace: function(str) {
	            var traceArr = this.traceArr,
	                len;
	 
	            traceArr.push(str);
	            len = traceArr.length;

	            if (len >= Kinetic.traceArrMax) {
	                traceArr.shift();
	            }
	        },
	        /**
	         * reset canvas context transform
	         * @method
	         * @memberof Kinetic.Context.prototype
	         */
	        reset: function() {
	            var pixelRatio = this.getCanvas().getPixelRatio();
	            this.setTransform(1 * pixelRatio, 0, 0, 1 * pixelRatio, 0, 0);
	        },
	        /**
	         * get canvas
	         * @method
	         * @memberof Kinetic.Context.prototype
	         * @returns {Kinetic.Canvas}
	         */
	        getCanvas: function() {
	            return this.canvas;
	        },
	        /**
	         * clear canvas
	         * @method
	         * @memberof Kinetic.Context.prototype
	         * @param {Object} [bounds]
	         * @param {Number} [bounds.x]
	         * @param {Number} [bounds.y]
	         * @param {Number} [bounds.width]
	         * @param {Number} [bounds.height]
	         */
	        clear: function(bounds) {
	            var canvas = this.getCanvas();
	            
	            if (bounds) {
	                this.clearRect(bounds.x || 0, bounds.y || 0, bounds.width || 0, bounds.height || 0);
	            }
	            else {
	                this.clearRect(0, 0, canvas.getWidth(), canvas.getHeight());
	            }
	        },
	        _applyLineCap: function(shape) {
	            var lineCap = shape.getLineCap();
	            if(lineCap) {
	                this.setAttr('lineCap', lineCap);
	            }
	        },
	        _applyOpacity: function(shape) {
	            var absOpacity = shape.getAbsoluteOpacity();
	            if(absOpacity !== 1) {
	                this.setAttr('globalAlpha', absOpacity);
	            }
	        },
	        _applyLineJoin: function(shape) {
	            var lineJoin = shape.getLineJoin();
	            if(lineJoin) {
	                this.setAttr('lineJoin', lineJoin);
	            }
	        },
	        setAttr: function(attr, val) {
	            this._context[attr] = val;
	        },

	        // context pass through methods
	        arc: function() {
	            var a = arguments;
	            this._context.arc(a[0], a[1], a[2], a[3], a[4], a[5]);
	        },
	        beginPath: function() {
	            this._context.beginPath();
	        },
	        bezierCurveTo: function() {
	            var a = arguments;
	            this._context.bezierCurveTo(a[0], a[1], a[2], a[3], a[4], a[5]);
	        },
	        clearRect: function() {
	            var a = arguments;
	            this._context.clearRect(a[0], a[1], a[2], a[3]);
	        },
	        clip: function() {
	            this._context.clip();
	        },
	        closePath: function() {
	            this._context.closePath();
	        },
	        createImageData: function() {
	            var a = arguments;
	            if(a.length === 2) {
	                return this._context.createImageData(a[0], a[1]);
	            }
	            else if(a.length === 1) {
	                return this._context.createImageData(a[0]);
	            }
	        },
	        createLinearGradient: function() {
	            var a = arguments;
	            return this._context.createLinearGradient(a[0], a[1], a[2], a[3]);
	        },
	        createPattern: function() {
	            var a = arguments;
	            return this._context.createPattern(a[0], a[1]);
	        },
	        createRadialGradient: function() {
	            var a = arguments;
	            return this._context.createRadialGradient(a[0], a[1], a[2], a[3], a[4], a[5]);
	        },
	        drawImage: function() {
	            var a = arguments,
	                _context = this._context;

	            if(a.length === 3) {
	                _context.drawImage(a[0], a[1], a[2]);
	            }
	            else if(a.length === 5) {
	                _context.drawImage(a[0], a[1], a[2], a[3], a[4]);
	            }
	            else if(a.length === 9) {
	                _context.drawImage(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]);
	            }
	        },
	        fill: function() {
	            this._context.fill();
	        },
	        fillText: function() {
	            var a = arguments;
	            this._context.fillText(a[0], a[1], a[2]);
	        },
	        getImageData: function() {
	            var a = arguments;
	            return this._context.getImageData(a[0], a[1], a[2], a[3]);
	        },
	        lineTo: function() {
	            var a = arguments;
	            this._context.lineTo(a[0], a[1]);
	        },
	        moveTo: function() {
	            var a = arguments;
	            this._context.moveTo(a[0], a[1]);
	        },
	        rect: function() {
	            var a = arguments;
	            this._context.rect(a[0], a[1], a[2], a[3]);
	        },
	        putImageData: function() {
	            var a = arguments;
	            this._context.putImageData(a[0], a[1], a[2]);
	        },
	        quadraticCurveTo: function() {
	            var a = arguments;
	            this._context.quadraticCurveTo(a[0], a[1], a[2], a[3]);
	        },
	        restore: function() {
	            this._context.restore();
	        },
	        rotate: function() {
	            var a = arguments;
	            this._context.rotate(a[0]);
	        },
	        save: function() {
	            this._context.save();
	        },
	        scale: function() {
	            var a = arguments;
	            this._context.scale(a[0], a[1]);
	        },
	        setLineDash: function() {
	            var a = arguments,
	                _context = this._context;

	            // works for Chrome and IE11
	            if(this._context.setLineDash) {
	                _context.setLineDash(a[0]);
	            }
	            // verified that this works in firefox
	            else if('mozDash' in _context) {
	                _context.mozDash = a[0];
	            }
	            // does not currently work for Safari
	            else if('webkitLineDash' in _context) {
	                _context.webkitLineDash = a[0];
	            }

	            // no support for IE9 and IE10
	        },
	        setTransform: function() {
	            var a = arguments;
	            this._context.setTransform(a[0], a[1], a[2], a[3], a[4], a[5]);
	        },
	        stroke: function() {
	            this._context.stroke();
	        },
	        strokeText: function() {
	            var a = arguments;
	            this._context.strokeText(a[0], a[1], a[2]);
	        },
	        transform: function() {
	            var a = arguments;
	            this._context.transform(a[0], a[1], a[2], a[3], a[4], a[5]);
	        },
	        translate: function() {
	            var a = arguments;
	            this._context.translate(a[0], a[1]);
	        },
	        _enableTrace: function() {
	            var that = this,
	                len = CONTEXT_METHODS.length,
	                _simplifyArray = Kinetic.Util._simplifyArray,
	                origSetter = this.setAttr,
	                n, args;

	            // to prevent creating scope function at each loop
	            var func = function(methodName) {
	                    var origMethod = that[methodName],
	                        ret;

	                    that[methodName] = function() {
	                        args = _simplifyArray(Array.prototype.slice.call(arguments, 0));
	                        ret = origMethod.apply(that, arguments);
	           
	                        that._trace({
	                            method: methodName,
	                            args: args
	                        });
	                 
	                        return ret;
	                    };
	            };
	            // methods
	            for (n=0; n<len; n++) {
	                func(CONTEXT_METHODS[n]);
	            }

	            // attrs
	            that.setAttr = function() {
	                origSetter.apply(that, arguments);
	                that._trace({
	                    property: arguments[0],
	                    val: arguments[1]
	                });
	            };
	        }
	    };

	    Kinetic.SceneContext = function(canvas) {
	        Kinetic.Context.call(this, canvas);
	    };

	    Kinetic.SceneContext.prototype = {
	        _fillColor: function(shape) {
	            var fill = shape.fill()
	                || Kinetic.Util._getRGBAString({
	                    red: shape.fillRed(),
	                    green: shape.fillGreen(),
	                    blue: shape.fillBlue(),
	                    alpha: shape.fillAlpha()
	                });

	            this.setAttr('fillStyle', fill);
	            shape._fillFunc(this);
	        },
	        _fillPattern: function(shape) {
	            var fillPatternImage = shape.getFillPatternImage(),
	                fillPatternX = shape.getFillPatternX(),
	                fillPatternY = shape.getFillPatternY(),
	                fillPatternScale = shape.getFillPatternScale(),
	                fillPatternRotation = Kinetic.getAngle(shape.getFillPatternRotation()),
	                fillPatternOffset = shape.getFillPatternOffset(),
	                fillPatternRepeat = shape.getFillPatternRepeat();

	            if(fillPatternX || fillPatternY) {
	                this.translate(fillPatternX || 0, fillPatternY || 0);
	            }
	            if(fillPatternRotation) {
	                this.rotate(fillPatternRotation);
	            }
	            if(fillPatternScale) {
	                this.scale(fillPatternScale.x, fillPatternScale.y);
	            }
	            if(fillPatternOffset) {
	                this.translate(-1 * fillPatternOffset.x, -1 * fillPatternOffset.y);
	            }

	            this.setAttr('fillStyle', this.createPattern(fillPatternImage, fillPatternRepeat || 'repeat'));
	            this.fill();
	        },
	        _fillLinearGradient: function(shape) {
	            var start = shape.getFillLinearGradientStartPoint(),
	                end = shape.getFillLinearGradientEndPoint(),
	                colorStops = shape.getFillLinearGradientColorStops(),
	                grd = this.createLinearGradient(start.x, start.y, end.x, end.y);

	            if (colorStops) {
	                // build color stops
	                for(var n = 0; n < colorStops.length; n += 2) {
	                    grd.addColorStop(colorStops[n], colorStops[n + 1]);
	                }
	                this.setAttr('fillStyle', grd);
	                this.fill();
	            }
	        },
	        _fillRadialGradient: function(shape) {
	            var start = shape.getFillRadialGradientStartPoint(),
	                end = shape.getFillRadialGradientEndPoint(),
	                startRadius = shape.getFillRadialGradientStartRadius(),
	                endRadius = shape.getFillRadialGradientEndRadius(),
	                colorStops = shape.getFillRadialGradientColorStops(),
	                grd = this.createRadialGradient(start.x, start.y, startRadius, end.x, end.y, endRadius);
	           
	            // build color stops
	            for(var n = 0; n < colorStops.length; n += 2) {
	                grd.addColorStop(colorStops[n], colorStops[n + 1]);
	            }
	            this.setAttr('fillStyle', grd);
	            this.fill();
	        },
	        _fill: function(shape) {
	            var hasColor = shape.fill() || shape.fillRed() || shape.fillGreen() || shape.fillBlue(),
	                hasPattern = shape.getFillPatternImage(),
	                hasLinearGradient = shape.getFillLinearGradientColorStops(),
	                hasRadialGradient = shape.getFillRadialGradientColorStops(),
	                fillPriority = shape.getFillPriority();

	            // priority fills
	            if(hasColor && fillPriority === 'color') {
	                this._fillColor(shape);
	            }
	            else if(hasPattern && fillPriority === 'pattern') {
	                this._fillPattern(shape);
	            }
	            else if(hasLinearGradient && fillPriority === 'linear-gradient') {
	                this._fillLinearGradient(shape);
	            }
	            else if(hasRadialGradient && fillPriority === 'radial-gradient') {
	                this._fillRadialGradient(shape);
	            }
	            // now just try and fill with whatever is available
	            else if(hasColor) {
	                this._fillColor(shape);
	            }
	            else if(hasPattern) {
	                this._fillPattern(shape);
	            }
	            else if(hasLinearGradient) {
	                this._fillLinearGradient(shape);
	            }
	            else if(hasRadialGradient) {
	                this._fillRadialGradient(shape);
	            }
	        },
	        _stroke: function(shape) {
	            var dash = shape.dash(),
	                strokeScaleEnabled = shape.getStrokeScaleEnabled();

	            if(shape.hasStroke()) {
	                if (!strokeScaleEnabled) {
	                    this.save();
	                    this.setTransform(1, 0, 0, 1, 0, 0);
	                }

	                this._applyLineCap(shape);
	                if(dash && shape.dashEnabled()) {
	                    this.setLineDash(dash);
	                }

	                this.setAttr('lineWidth', shape.strokeWidth());
	                this.setAttr('strokeStyle', shape.stroke()
	                    || Kinetic.Util._getRGBAString({
	                        red: shape.strokeRed(),
	                        green: shape.strokeGreen(),
	                        blue: shape.strokeBlue(),
	                        alpha: shape.strokeAlpha()
	                    }));

	                shape._strokeFunc(this);
	                
	                if (!strokeScaleEnabled) {
	                    this.restore();
	                }
	            }
	        },
	        _applyShadow: function(shape) {
	            var util = Kinetic.Util,
	                absOpacity = shape.getAbsoluteOpacity(),
	                color = util.get(shape.getShadowColor(), 'black'),
	                blur = util.get(shape.getShadowBlur(), 5),
	                shadowOpacity = util.get(shape.getShadowOpacity(), 1),
	                offset = util.get(shape.getShadowOffset(), {
	                    x: 0,
	                    y: 0
	                });

	            if(shadowOpacity) {
	                this.setAttr('globalAlpha', shadowOpacity * absOpacity);
	            }

	            this.setAttr('shadowColor', color);
	            this.setAttr('shadowBlur', blur);
	            this.setAttr('shadowOffsetX', offset.x);
	            this.setAttr('shadowOffsetY', offset.y);
	        
	        }
	    };
	    Kinetic.Util.extend(Kinetic.SceneContext, Kinetic.Context);

	    Kinetic.HitContext = function(canvas) {
	        Kinetic.Context.call(this, canvas);
	    };

	    Kinetic.HitContext.prototype = {
	        _fill: function(shape) {
	            this.save();
	            this.setAttr('fillStyle', shape.colorKey);
	            shape._fillFuncHit(this);
	            this.restore();
	        },
	        _stroke: function(shape) {
	            if(shape.hasStroke()) {
	                this._applyLineCap(shape);
	                this.setAttr('lineWidth', shape.strokeWidth());
	                this.setAttr('strokeStyle', shape.colorKey);
	                shape._strokeFuncHit(this);
	            }
	        }
	    };
	    Kinetic.Util.extend(Kinetic.HitContext, Kinetic.Context);
	})();
	;/*jshint unused:false */
	(function() {
	    // CONSTANTS
	    var GET = 'get',
	        RGB = 'RGB',
	        SET = 'set';

	    Kinetic.Factory = {
	        addGetterSetter: function(constructor, attr, def, validator, after) {
	            this.addGetter(constructor, attr, def);
	            this.addSetter(constructor, attr, validator, after);
	            this.addOverloadedGetterSetter(constructor, attr);
	        },
	        addGetter: function(constructor, attr, def) {
	            var method = GET + Kinetic.Util._capitalize(attr);

	            constructor.prototype[method] = function() {
	                var val = this.attrs[attr];
	                return val === undefined ? def : val;
	            };
	        },
	        addSetter: function(constructor, attr, validator, after) {
	            var method = SET + Kinetic.Util._capitalize(attr);

	            constructor.prototype[method] = function(val) {
	                if (validator) {
	                    val = validator.call(this, val);
	                }

	                this._setAttr(attr, val);

	                if (after) {
	                    after.call(this);
	                }

	                return this;
	            };
	        },
	        addComponentsGetterSetter: function(constructor, attr, components, validator, after) {
	            var len = components.length,
	                capitalize = Kinetic.Util._capitalize,
	                getter = GET + capitalize(attr),
	                setter = SET + capitalize(attr),
	                n, component;

	            // getter
	            constructor.prototype[getter] = function() {
	                var ret = {};

	                for (n=0; n<len; n++) {
	                    component = components[n];
	                    ret[component] = this.getAttr(attr + capitalize(component));
	                }

	                return ret;
	            };

	            // setter
	            constructor.prototype[setter] = function(val) {
	                var oldVal = this.attrs[attr],
	                    key;

	                if (validator) {
	                    val = validator.call(this, val);
	                }

	                for (key in val) {
	                    this._setAttr(attr + capitalize(key), val[key]);
	                }

	                this._fireChangeEvent(attr, oldVal, val);
	                
	                if (after) {
	                    after.call(this);
	                }

	                return this;
	            };

	            this.addOverloadedGetterSetter(constructor, attr);
	        },
	        addOverloadedGetterSetter: function(constructor, attr) {
	            var capitalizedAttr = Kinetic.Util._capitalize(attr),
	                setter = SET + capitalizedAttr,
	                getter = GET + capitalizedAttr;

	            constructor.prototype[attr] = function() {
	                // setting
	                if (arguments.length) {
	                    this[setter](arguments[0]);
	                    return this;
	                }
	                // getting
	                else {
	                    return this[getter]();
	                }
	            };
	        },
	        backCompat: function(constructor, methods) {
	            var key;

	            for (key in methods) {
	                constructor.prototype[key] = constructor.prototype[methods[key]];
	            }
	        },
	        afterSetFilter: function() {
	            this._filterUpToDate = false;
	        }
	    };

	    Kinetic.Validators = {
	        /**
	         * @return {number}
	         */
	        RGBComponent: function(val) {
	            if (val > 255) {
	                return 255;
	            } else if (val < 0) {
	                return 0;
	            } else {
	                return Math.round(val);
	            }
	        },
	        alphaComponent: function(val) {
	            if (val > 1) {
	                return 1;
	            }
	            // chrome does not honor alpha values of 0
	            else if (val < 0.0001) {
	                return 0.0001;
	            }
	            else {
	                return val;
	            }
	        }
	    };
	})();;(function() {
	    // CONSTANTS
	    var ABSOLUTE_OPACITY = 'absoluteOpacity',
	        ABSOLUTE_TRANSFORM = 'absoluteTransform',
	        CHANGE = 'Change',
	        CHILDREN = 'children',
	        DOT = '.',
	        EMPTY_STRING = '',
	        GET = 'get',
	        ID = 'id',
	        KINETIC = 'kinetic',
	        LISTENING = 'listening',
	        MOUSEENTER = 'mouseenter',
	        MOUSELEAVE = 'mouseleave',
	        NAME = 'name',
	        SET = 'set',
	        SHAPE = 'Shape',
	        SPACE = ' ',
	        STAGE = 'stage',
	        TRANSFORM = 'transform',
	        UPPER_STAGE = 'Stage',
	        VISIBLE = 'visible',
	        CLONE_BLACK_LIST = ['id'],

	        TRANSFORM_CHANGE_STR = [
	            'xChange.kinetic',
	            'yChange.kinetic',
	            'scaleXChange.kinetic',
	            'scaleYChange.kinetic',
	            'skewXChange.kinetic',
	            'skewYChange.kinetic',
	            'rotationChange.kinetic',
	            'offsetXChange.kinetic',
	            'offsetYChange.kinetic',
	            'transformsEnabledChange.kinetic'
	        ].join(SPACE);


	    Kinetic.Util.addMethods(Kinetic.Node, {
	        _init: function(config) {
	            var that = this;
	            this._id = Kinetic.idCounter++;
	            this.eventListeners = {};
	            this.attrs = {};
	            this._cache = {};
	            this._filterUpToDate = false;
	            this.setAttrs(config);

	            // event bindings for cache handling
	            this.on(TRANSFORM_CHANGE_STR, function() {
	                this._clearCache(TRANSFORM);
	                that._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
	            });
	            this.on('visibleChange.kinetic', function() {
	                that._clearSelfAndDescendantCache(VISIBLE);
	            });
	            this.on('listeningChange.kinetic', function() {
	                that._clearSelfAndDescendantCache(LISTENING);
	            });
	            this.on('opacityChange.kinetic', function() {
	                that._clearSelfAndDescendantCache(ABSOLUTE_OPACITY);
	            });
	        },
	        _clearCache: function(attr){
	            if (attr) {
	                delete this._cache[attr];
	            }
	            else {
	                this._cache = {};
	            }
	        },
	        _getCache: function(attr, privateGetter){
	            var cache = this._cache[attr];

	            // if not cached, we need to set it using the private getter method.
	            if (cache === undefined) {
	                this._cache[attr] = privateGetter.call(this);
	            }

	            return this._cache[attr];
	        },
	        /*
	         * when the logic for a cached result depends on ancestor propagation, use this
	         * method to clear self and children cache
	         */
	        _clearSelfAndDescendantCache: function(attr) {
	            this._clearCache(attr);

	            if (this.children) {
	                this.getChildren().each(function(node) {
	                    node._clearSelfAndDescendantCache(attr);
	                });
	            }
	        },
	        /**
	        * clear cached canvas
	        * @method
	        * @memberof Kinetic.Node.prototype
	        * @returns {Kinetic.Node}
	        * @example
	        * node.clearCache();
	        */
	        clearCache: function() {
	            delete this._cache.canvas;
	            this._filterUpToDate = false;
	            return this;
	        },
	        /**
	        * cache node to improve drawing performance, apply filters, or create more accurate
	        *  hit regions
	        * @method
	        * @memberof Kinetic.Node.prototype
	        * @param {Object} config
	        * @param {Number} [config.x]
	        * @param {Number} [config.y]
	        * @param {Number} [config.width]
	        * @param {Number} [config.height]
	        * @param {Boolean} [config.drawBorder] when set to true, a red border will be drawn around the cached
	        *  region for debugging purposes
	        * @returns {Kinetic.Node}
	        * @example
	        * // cache a shape with the x,y position of the bounding box at the center and
	        * // the width and height of the bounding box equal to the width and height of
	        * // the shape obtained from shape.width() and shape.height()
	        * image.cache();
	        *
	        * // cache a node and define the bounding box position and size
	        * node.cache({
	        *   x: -30,
	        *   y: -30,
	        *   width: 100,
	        *   height: 200
	        * });
	        *
	        * // cache a node and draw a red border around the bounding box
	        * // for debugging purposes
	        * node.cache({
	        *   x: -30,
	        *   y: -30,
	        *   width: 100,
	        *   height: 200,
	        *   drawBorder: true
	        * });
	        */
	        cache: function(config) {
	            var conf = config || {},
	                x = conf.x || 0,
	                y = conf.y || 0,
	                width = conf.width || this.width(),
	                height = conf.height || this.height(),
	                drawBorder = conf.drawBorder || false;

	            if (width === 0 || height === 0) {
	                Kinetic.Util.warn('Width or height of caching configuration equals 0. Cache is ignored.');
	                return;
	            }
	            var cachedSceneCanvas = new Kinetic.SceneCanvas({
	                    pixelRatio: 1,
	                    width: width,
	                    height: height
	                }),
	                cachedFilterCanvas = new Kinetic.SceneCanvas({
	                    pixelRatio: 1,
	                    width: width,
	                    height: height
	                }),
	                cachedHitCanvas = new Kinetic.HitCanvas({
	                    width: width,
	                    height: height
	                }),
	                sceneContext = cachedSceneCanvas.getContext(),
	                hitContext = cachedHitCanvas.getContext();

	            cachedHitCanvas.isCache = true;

	            this.clearCache();
	   
	            sceneContext.save();
	            hitContext.save();

	            // this will draw a red border around the cached box for
	            // debugging purposes
	            if (drawBorder) {
	                sceneContext.save();
	                sceneContext.beginPath();
	                sceneContext.rect(0, 0, width, height);
	                sceneContext.closePath();
	                sceneContext.setAttr('strokeStyle', 'red');
	                sceneContext.setAttr('lineWidth', 5);
	                sceneContext.stroke();
	                sceneContext.restore();
	            }

	            sceneContext.translate(x * -1, y * -1);
	            hitContext.translate(x * -1, y * -1);

	            // don't need to translate canvas if shape is not added to layer
	            if (this.nodeType === 'Shape') {
	                sceneContext.translate(this.x() * -1, this.y() * -1);
	                hitContext.translate(this.x() * -1, this.y() * -1);
	            }

	            this.drawScene(cachedSceneCanvas, this);
	            this.drawHit(cachedHitCanvas, this);

	            sceneContext.restore();
	            hitContext.restore();

	            this._cache.canvas = {
	                scene: cachedSceneCanvas,
	                filter: cachedFilterCanvas,
	                hit: cachedHitCanvas
	            };

	            return this;
	        },
	        _drawCachedSceneCanvas: function(context) {
	            context.save();
	            this.getLayer()._applyTransform(this, context);
	            context._applyOpacity(this);
	            context.drawImage(this._getCachedSceneCanvas()._canvas, 0, 0);
	            context.restore();
	        },
	        _getCachedSceneCanvas: function() {
	            var filters = this.filters(),
	                cachedCanvas = this._cache.canvas,
	                sceneCanvas = cachedCanvas.scene,
	                filterCanvas = cachedCanvas.filter,
	                filterContext = filterCanvas.getContext(),
	                len, imageData, n, filter;

	            if (filters) {
	                if (!this._filterUpToDate) {
	                    try {
	                        len = filters.length;
	                        filterContext.clear();
	                        // copy cached canvas onto filter context
	                        filterContext.drawImage(sceneCanvas._canvas, 0, 0);
	                        imageData = filterContext.getImageData(0, 0, filterCanvas.getWidth(), filterCanvas.getHeight());

	                        // apply filters to filter context
	                        for (n=0; n<len; n++) {
	                            filter = filters[n];
	                            filter.call(this, imageData);
	                            filterContext.putImageData(imageData, 0, 0);
	                        }
	                    }
	                    catch(e) {
	                        Kinetic.Util.warn('Unable to apply filter. ' + e.message);
	                    }

	                    this._filterUpToDate = true;
	                }

	                return filterCanvas;
	            }
	            else {
	                return sceneCanvas;
	            }
	        },
	        _drawCachedHitCanvas: function(context) {
	            var cachedCanvas = this._cache.canvas,
	                hitCanvas = cachedCanvas.hit;

	            context.save();
	            this.getLayer()._applyTransform(this, context);
	            context.drawImage(hitCanvas._canvas, 0, 0);
	            context.restore();
	        },
	        /**
	         * bind events to the node. KineticJS supports mouseover, mousemove,
	         *  mouseout, mouseenter, mouseleave, mousedown, mouseup, mousewheel, click, dblclick, touchstart, touchmove,
	         *  touchend, tap, dbltap, dragstart, dragmove, and dragend events. The Kinetic Stage supports
	         *  contentMouseover, contentMousemove, contentMouseout, contentMousedown, contentMouseup,
	         *  contentClick, contentDblclick, contentTouchstart, contentTouchmove, contentTouchend, contentTap,
	         *  and contentDblTap.  Pass in a string of events delimmited by a space to bind multiple events at once
	         *  such as 'mousedown mouseup mousemove'. Include a namespace to bind an
	         *  event by name such as 'click.foobar'.
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @param {String} evtStr e.g. 'click', 'mousedown touchstart', 'mousedown.foo touchstart.foo'
	         * @param {Function} handler The handler function is passed an event object
	         * @returns {Kinetic.Node}
	         * @example
	         * // add click listener
	         * node.on('click', function() {
	         *   console.log('you clicked me!');
	         * });
	         *
	         * // get the target node
	         * node.on('click', function(evt) {
	         *   console.log(evt.target);
	         * });
	         *
	         * // stop event propagation
	         * node.on('click', function(evt) {
	         *   evt.cancelBubble = true;
	         * });
	         *
	         * // bind multiple listeners
	         * node.on('click touchstart', function() {
	         *   console.log('you clicked/touched me!');
	         * });
	         *
	         * // namespace listener
	         * node.on('click.foo', function() {
	         *   console.log('you clicked/touched me!');
	         * });
	         *
	         * // get the event type
	         * node.on('click tap', function(evt) {
	         *   var eventType = evt.type;
	         * });
	         *
	         * // get native event object
	         * node.on('click tap', function(evt) {
	         *   var nativeEvent = evt.evt;
	         * });
	         *
	         * // for change events, get the old and new val
	         * node.on('xChange', function(evt) {
	         *   var oldVal = evt.oldVal;
	         *   var newVal = evt.newVal;
	         * });
	         */
	        on: function(evtStr, handler) {
	            var events = evtStr.split(SPACE),
	                len = events.length,
	                n, event, parts, baseEvent, name;

	             /*
	             * loop through types and attach event listeners to
	             * each one.  eg. 'click mouseover.namespace mouseout'
	             * will create three event bindings
	             */
	            for(n = 0; n < len; n++) {
	                event = events[n];
	                parts = event.split(DOT);
	                baseEvent = parts[0];
	                name = parts[1] || EMPTY_STRING;

	                // create events array if it doesn't exist
	                if(!this.eventListeners[baseEvent]) {
	                    this.eventListeners[baseEvent] = [];
	                }

	                this.eventListeners[baseEvent].push({
	                    name: name,
	                    handler: handler
	                });

	                // NOTE: this flag is set to true when any event handler is added, even non
	                // mouse or touch gesture events.  This improves performance for most
	                // cases where users aren't using events, but is still very light weight.  
	                // To ensure perfect accuracy, devs can explicitly set listening to false.
	                /*
	                if (name !== KINETIC) {
	                    this._listeningEnabled = true;
	                    this._clearSelfAndAncestorCache(LISTENING_ENABLED);
	                }
	                */
	            }

	            return this;
	        },
	        /**
	         * remove event bindings from the node. Pass in a string of
	         *  event types delimmited by a space to remove multiple event
	         *  bindings at once such as 'mousedown mouseup mousemove'.
	         *  include a namespace to remove an event binding by name
	         *  such as 'click.foobar'. If you only give a name like '.foobar',
	         *  all events in that namespace will be removed.
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @param {String} evtStr e.g. 'click', 'mousedown touchstart', '.foobar'
	         * @returns {Kinetic.Node}
	         * @example
	         * // remove listener
	         * node.off('click');
	         *
	         * // remove multiple listeners
	         * node.off('click touchstart');
	         *
	         * // remove listener by name
	         * node.off('click.foo');
	         */
	        off: function(evtStr) {
	            var events = (evtStr || '').split(SPACE),
	                len = events.length,
	                n, t, event, parts, baseEvent, name;

	            if (!evtStr) {
	                // remove all events
	                for(t in this.eventListeners) {
	                    this._off(t);
	                }
	            }
	            for(n = 0; n < len; n++) {
	                event = events[n];
	                parts = event.split(DOT);
	                baseEvent = parts[0];
	                name = parts[1];

	                if(baseEvent) {
	                    if(this.eventListeners[baseEvent]) {
	                        this._off(baseEvent, name);
	                    }
	                }
	                else {
	                    for(t in this.eventListeners) {
	                        this._off(t, name);
	                    }
	                }
	            }
	            return this;
	        },
	        // some event aliases for third party integration like HammerJS
	        dispatchEvent: function(evt) {
	            var e = {
	              target: this,
	              type: evt.type,
	              evt: evt
	            };
	            this.fire(evt.type, e);
	        },
	        addEventListener: function(type, handler) {
	            // we have to pass native event to handler
	            this.on(type, function(evt){
	                handler.call(this, evt.evt);
	            });
	        },
	        removeEventListener : function(type) {
	            this.off(type);
	        },
	        /**
	         * remove self from parent, but don't destroy
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Kinetic.Node}
	         * @example
	         * node.remove();
	         */
	        remove: function() {
	            var parent = this.getParent();

	            if(parent && parent.children) {
	                parent.children.splice(this.index, 1);
	                parent._setChildrenIndices();
	                delete this.parent;
	            }

	            // every cached attr that is calculated via node tree
	            // traversal must be cleared when removing a node
	            this._clearSelfAndDescendantCache(STAGE);
	            this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
	            this._clearSelfAndDescendantCache(VISIBLE);
	            this._clearSelfAndDescendantCache(LISTENING);
	            this._clearSelfAndDescendantCache(ABSOLUTE_OPACITY);

	            return this;
	        },
	        /**
	         * remove and destroy self
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @example
	         * node.destroy();
	         */
	        destroy: function() {
	            // remove from ids and names hashes
	            Kinetic._removeId(this.getId());
	            Kinetic._removeName(this.getName(), this._id);

	            this.remove();
	        },
	        /**
	         * get attr
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @param {String} attr
	         * @returns {Integer|String|Object|Array}
	         * @example
	         * var x = node.getAttr('x');
	         */
	        getAttr: function(attr) {
	            var method = GET + Kinetic.Util._capitalize(attr);
	            if(Kinetic.Util._isFunction(this[method])) {
	                return this[method]();
	            }
	            // otherwise get directly
	            else {
	                return this.attrs[attr];
	            }
	        },
	        /**
	        * get ancestors
	        * @method
	        * @memberof Kinetic.Node.prototype
	        * @returns {Kinetic.Collection}
	        * @example
	        * shape.getAncestors().each(function(node) {
	        *   console.log(node.getId());
	        * })
	        */
	        getAncestors: function() {
	            var parent = this.getParent(),
	                ancestors = new Kinetic.Collection();

	            while (parent) {
	                ancestors.push(parent);
	                parent = parent.getParent();
	            }

	            return ancestors;
	        },
	        /**
	         * get attrs object literal
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Object}
	         */
	        getAttrs: function() {
	            return this.attrs || {};
	        },
	        /**
	         * set multiple attrs at once using an object literal
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @param {Object} config object containing key value pairs
	         * @returns {Kinetic.Node}
	         * @example
	         * node.setAttrs({
	         *   x: 5,
	         *   fill: 'red'
	         * });
	         */
	        setAttrs: function(config) {
	            var key, method;

	            if(config) {
	                for(key in config) {
	                    if (key === CHILDREN) {

	                    }
	                    else {
	                        method = SET + Kinetic.Util._capitalize(key);
	                        // use setter if available
	                        if(Kinetic.Util._isFunction(this[method])) {
	                            this[method](config[key]);
	                        }
	                        // otherwise set directly
	                        else {
	                            this._setAttr(key, config[key]);
	                        }
	                    }
	                }
	            }
	            return this;
	        },
	        /**
	         * determine if node is listening for events by taking into account ancestors.
	         *
	         * Parent    | Self      | isListening
	         * listening | listening | 
	         * ----------+-----------+------------
	         * T         | T         | T 
	         * T         | F         | F
	         * F         | T         | T 
	         * F         | F         | F
	         * ----------+-----------+------------
	         * T         | I         | T
	         * F         | I         | F
	         * I         | I         | T
	         *
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Boolean}
	         */
	        isListening: function() {
	            return this._getCache(LISTENING, this._isListening);
	        },
	        _isListening: function() {
	            var listening = this.getListening(),
	                parent = this.getParent();

	            // the following conditions are a simplification of the truth table above.
	            // please modify carefully
	            if (listening === 'inherit') {
	                if (parent) {
	                    return parent.isListening();
	                }
	                else {
	                    return true;
	                }
	            }
	            else {
	                return listening;
	            }
	        },
	        /**
	         * determine if node is visible by taking into account ancestors.
	         *
	         * Parent    | Self      | isVisible
	         * visible   | visible   | 
	         * ----------+-----------+------------
	         * T         | T         | T 
	         * T         | F         | F
	         * F         | T         | T 
	         * F         | F         | F
	         * ----------+-----------+------------
	         * T         | I         | T
	         * F         | I         | F
	         * I         | I         | T

	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Boolean}
	         */
	        isVisible: function() {
	            return this._getCache(VISIBLE, this._isVisible);
	        },
	        _isVisible: function() {
	            var visible = this.getVisible(),
	                parent = this.getParent();

	            // the following conditions are a simplification of the truth table above.
	            // please modify carefully
	            if (visible === 'inherit') {
	                if (parent) {
	                    return parent.isVisible();
	                }
	                else {
	                    return true;
	                }
	            }
	            else {
	                return visible;
	            }
	        },
	        /**
	         * determine if listening is enabled by taking into account descendants.  If self or any children
	         * have _isListeningEnabled set to true, then self also has listening enabled.
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Boolean}
	         */
	        shouldDrawHit: function(canvas) {
	            var layer = this.getLayer();
	            return  (canvas && canvas.isCache) || (layer && layer.hitGraphEnabled())
	                && this.isListening() && this.isVisible() && !Kinetic.isDragging();
	        },
	        /**
	         * show node
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Kinetic.Node}
	         */
	        show: function() {
	            this.setVisible(true);
	            return this;
	        },
	        /**
	         * hide node.  Hidden nodes are no longer detectable
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Kinetic.Node}
	         */
	        hide: function() {
	            this.setVisible(false);
	            return this;
	        },
	        /**
	         * get zIndex relative to the node's siblings who share the same parent
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Integer}
	         */
	        getZIndex: function() {
	            return this.index || 0;
	        },
	        /**
	         * get absolute z-index which takes into account sibling
	         *  and ancestor indices
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Integer}
	         */
	        getAbsoluteZIndex: function() {
	            var depth = this.getDepth(),
	                that = this,
	                index = 0,
	                nodes, len, n, child;

	            function addChildren(children) {
	                nodes = [];
	                len = children.length;
	                for(n = 0; n < len; n++) {
	                    child = children[n];
	                    index++;

	                    if(child.nodeType !== SHAPE) {
	                        nodes = nodes.concat(child.getChildren().toArray());
	                    }

	                    if(child._id === that._id) {
	                        n = len;
	                    }
	                }

	                if(nodes.length > 0 && nodes[0].getDepth() <= depth) {
	                    addChildren(nodes);
	                }
	            }
	            if(that.nodeType !== UPPER_STAGE) {
	                addChildren(that.getStage().getChildren());
	            }

	            return index;
	        },
	        /**
	         * get node depth in node tree.  Returns an integer.
	         *  e.g. Stage depth will always be 0.  Layers will always be 1.  Groups and Shapes will always
	         *  be >= 2
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Integer}
	         */
	        getDepth: function() {
	            var depth = 0,
	                parent = this.parent;

	            while(parent) {
	                depth++;
	                parent = parent.parent;
	            }
	            return depth;
	        },
	        setPosition: function(pos) {
	            this.setX(pos.x);
	            this.setY(pos.y);
	            return this;
	        },
	        getPosition: function() {
	            return {
	                x: this.getX(),
	                y: this.getY()
	            };
	        },
	        /**
	         * get absolute position relative to the top left corner of the stage container div
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Object}
	         */
	        getAbsolutePosition: function() {
	            var absoluteMatrix = this.getAbsoluteTransform().getMatrix(),
	                absoluteTransform = new Kinetic.Transform(),
	                offset = this.offset();

	            // clone the matrix array
	            absoluteTransform.m = absoluteMatrix.slice();
	            absoluteTransform.translate(offset.x, offset.y);

	            return absoluteTransform.getTranslation();
	        },
	        /**
	         * set absolute position
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @param {Object} pos
	         * @param {Number} pos.x
	         * @param {Number} pos.y
	         * @returns {Kinetic.Node}
	         */
	        setAbsolutePosition: function(pos) {
	            var origTrans = this._clearTransform(),
	                it;

	            // don't clear translation
	            this.attrs.x = origTrans.x;
	            this.attrs.y = origTrans.y;
	            delete origTrans.x;
	            delete origTrans.y;

	            // unravel transform
	            it = this.getAbsoluteTransform();

	            it.invert();
	            it.translate(pos.x, pos.y);
	            pos = {
	                x: this.attrs.x + it.getTranslation().x,
	                y: this.attrs.y + it.getTranslation().y
	            };

	            this.setPosition({x:pos.x, y:pos.y});
	            this._setTransform(origTrans);

	            return this;
	        },
	        _setTransform: function(trans) {
	            var key;

	            for(key in trans) {
	                this.attrs[key] = trans[key];
	            }

	            this._clearCache(TRANSFORM);
	            this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);
	        },
	        _clearTransform: function() {
	            var trans = {
	                x: this.getX(),
	                y: this.getY(),
	                rotation: this.getRotation(),
	                scaleX: this.getScaleX(),
	                scaleY: this.getScaleY(),
	                offsetX: this.getOffsetX(),
	                offsetY: this.getOffsetY(),
	                skewX: this.getSkewX(),
	                skewY: this.getSkewY()
	            };

	            this.attrs.x = 0;
	            this.attrs.y = 0;
	            this.attrs.rotation = 0;
	            this.attrs.scaleX = 1;
	            this.attrs.scaleY = 1;
	            this.attrs.offsetX = 0;
	            this.attrs.offsetY = 0;
	            this.attrs.skewX = 0;
	            this.attrs.skewY = 0;

	            this._clearCache(TRANSFORM);
	            this._clearSelfAndDescendantCache(ABSOLUTE_TRANSFORM);

	            // return original transform
	            return trans;
	        },
	        /**
	         * move node by an amount relative to its current position
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @param {Object} change
	         * @param {Number} change.x
	         * @param {Number} change.y
	         * @returns {Kinetic.Node}
	         * @example
	         * // move node in x direction by 1px and y direction by 2px
	         * node.move({
	         *   x: 1,
	         *   y: 2)
	         * });
	         */
	        move: function(change) {
	            var changeX = change.x,
	                changeY = change.y,
	                x = this.getX(),
	                y = this.getY();

	            if(changeX !== undefined) {
	                x += changeX;
	            }

	            if(changeY !== undefined) {
	                y += changeY;
	            }

	            this.setPosition({x:x, y:y});
	            return this;
	        },
	        _eachAncestorReverse: function(func, top) {
	            var family = [],
	                parent = this.getParent(),
	                len, n;

	            // if top node is defined, and this node is top node,
	            // there's no need to build a family tree.  just execute
	            // func with this because it will be the only node
	            if (top && top._id === this._id) {
	                func(this);
	                return true;
	            }

	            family.unshift(this);

	            while(parent && (!top || parent._id !== top._id)) {
	                family.unshift(parent);
	                parent = parent.parent;
	            }

	            len = family.length;
	            for(n = 0; n < len; n++) {
	                func(family[n]);
	            }
	        },
	        /**
	         * rotate node by an amount in degrees relative to its current rotation
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @param {Number} theta
	         * @returns {Kinetic.Node}
	         */
	        rotate: function(theta) {
	            this.setRotation(this.getRotation() + theta);
	            return this;
	        },
	        /**
	         * move node to the top of its siblings
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Boolean}
	         */
	        moveToTop: function() {
	            if (!this.parent) {
	                Kinetic.Util.warn('Node has no parent. moveToTop function is ignored.');
	                return;
	            }
	            var index = this.index;
	            this.parent.children.splice(index, 1);
	            this.parent.children.push(this);
	            this.parent._setChildrenIndices();
	            return true;
	        },
	        /**
	         * move node up
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Boolean}
	         */
	        moveUp: function() {
	            if (!this.parent) {
	                Kinetic.Util.warn('Node has no parent. moveUp function is ignored.');
	                return;
	            }
	            var index = this.index,
	                len = this.parent.getChildren().length;
	            if(index < len - 1) {
	                this.parent.children.splice(index, 1);
	                this.parent.children.splice(index + 1, 0, this);
	                this.parent._setChildrenIndices();
	                return true;
	            }
	            return false;
	        },
	        /**
	         * move node down
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Boolean}
	         */
	        moveDown: function() {
	            if (!this.parent) {
	                Kinetic.Util.warn('Node has no parent. moveDown function is ignored.');
	                return;
	            }
	            var index = this.index;
	            if(index > 0) {
	                this.parent.children.splice(index, 1);
	                this.parent.children.splice(index - 1, 0, this);
	                this.parent._setChildrenIndices();
	                return true;
	            }
	            return false;
	        },
	        /**
	         * move node to the bottom of its siblings
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Boolean}
	         */
	        moveToBottom: function() {
	            if (!this.parent) {
	                Kinetic.Util.warn('Node has no parent. moveToBottom function is ignored.');
	                return;
	            }
	            var index = this.index;
	            if(index > 0) {
	                this.parent.children.splice(index, 1);
	                this.parent.children.unshift(this);
	                this.parent._setChildrenIndices();
	                return true;
	            }
	            return false;
	        },
	        /**
	         * set zIndex relative to siblings
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @param {Integer} zIndex
	         * @returns {Kinetic.Node}
	         */
	        setZIndex: function(zIndex) {
	            if (!this.parent) {
	                Kinetic.Util.warn('Node has no parent. zIndex parameter is ignored.');
	                return;
	            }
	            var index = this.index;
	            this.parent.children.splice(index, 1);
	            this.parent.children.splice(zIndex, 0, this);
	            this.parent._setChildrenIndices();
	            return this;
	        },
	        /**
	         * get absolute opacity
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Number}
	         */
	        getAbsoluteOpacity: function() {
	            return this._getCache(ABSOLUTE_OPACITY, this._getAbsoluteOpacity);
	        },
	        _getAbsoluteOpacity: function() {
	            var absOpacity = this.getOpacity();
	            if(this.getParent()) {
	                absOpacity *= this.getParent().getAbsoluteOpacity();
	            }
	            return absOpacity;
	        },
	        /**
	         * move node to another container
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @param {Container} newContainer
	         * @returns {Kinetic.Node}
	         * @example
	         * // move node from current layer into layer2
	         * node.moveTo(layer2);
	         */
	        moveTo: function(newContainer) {
	            // do nothing if new container is already parent
	            if (this.getParent() !== newContainer) {
	                this.remove();
	                newContainer.add(this);
	            }
	            return this;
	        },
	        /**
	         * convert Node into an object for serialization.  Returns an object.
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Object}
	         */
	        toObject: function() {
	            var type = Kinetic.Util,
	                obj = {},
	                attrs = this.getAttrs(),
	                key, val, getter, defaultValue;

	            obj.attrs = {};

	            // serialize only attributes that are not function, image, DOM, or objects with methods
	            for(key in attrs) {
	                val = attrs[key];
	                if (!type._isFunction(val) && !type._isElement(val) && !(type._isObject(val) && type._hasMethods(val))) {
	                    getter = this[key];
	                    // remove attr value so that we can extract the default value from the getter
	                    delete attrs[key];
	                    defaultValue = getter ? getter.call(this) : null;
	                    // restore attr value
	                    attrs[key] = val;
	                    if (defaultValue !== val) {
	                        obj.attrs[key] = val;
	                    }
	                }
	            }

	            obj.className = this.getClassName();
	            return obj;
	        },
	        /**
	         * convert Node into a JSON string.  Returns a JSON string.
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {String}}
	         */
	        toJSON: function() {
	            return JSON.stringify(this.toObject());
	        },
	        /**
	         * get parent container
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Kinetic.Node}
	         */
	        getParent: function() {
	            return this.parent;
	        },
	        /**
	         * get layer ancestor
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Kinetic.Layer}
	         */
	        getLayer: function() {
	            var parent = this.getParent();
	            return parent ? parent.getLayer() : null;
	        },
	        /**
	         * get stage ancestor
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Kinetic.Stage}
	         */
	        getStage: function() {
	            return this._getCache(STAGE, this._getStage);
	        },
	        _getStage: function() {
	            var parent = this.getParent();
	            if(parent) {
	                return parent.getStage();
	            }
	            else {
	                return undefined;
	            }
	        },
	        /**
	         * fire event
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @param {String} eventType event type.  can be a regular event, like click, mouseover, or mouseout, or it can be a custom event, like myCustomEvent
	         * @param {Event} [evt] event object
	         * @param {Boolean} [bubble] setting the value to false, or leaving it undefined, will result in the event
	         *  not bubbling.  Setting the value to true will result in the event bubbling.
	         * @returns {Kinetic.Node}
	         * @example
	         * // manually fire click event
	         * node.fire('click');
	         *
	         * // fire custom event
	         * node.fire('foo');
	         *
	         * // fire custom event with custom event object
	         * node.fire('foo', {
	         *   bar: 10
	         * });
	         *
	         * // fire click event that bubbles
	         * node.fire('click', null, true);
	         */
	        fire: function(eventType, evt, bubble) {
	            // bubble
	            if (bubble) {
	                this._fireAndBubble(eventType, evt || {});
	            }
	            // no bubble
	            else {
	                this._fire(eventType, evt || {});
	            }
	            return this;
	        },
	        /**
	         * get absolute transform of the node which takes into
	         *  account its ancestor transforms
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Kinetic.Transform}
	         */
	        getAbsoluteTransform: function(top) {
	            // if using an argument, we can't cache the result.
	            if (top) {
	                return this._getAbsoluteTransform(top);
	            }
	            // if no argument, we can cache the result
	            else {
	                return this._getCache(ABSOLUTE_TRANSFORM, this._getAbsoluteTransform);
	            }
	        },
	        _getAbsoluteTransform: function(top) {
	            var at = new Kinetic.Transform(),
	                transformsEnabled, trans;

	            // start with stage and traverse downwards to self
	            this._eachAncestorReverse(function(node) {
	                transformsEnabled = node.transformsEnabled();
	                trans = node.getTransform();

	                if (transformsEnabled === 'all') {
	                    at.multiply(trans);
	                }
	                else if (transformsEnabled === 'position') {
	                    at.translate(node.x(), node.y());
	                }
	            }, top);
	            return at;
	        },
	        /**
	         * get transform of the node
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Kinetic.Transform}
	         */
	        getTransform: function() {
	            return this._getCache(TRANSFORM, this._getTransform);
	        },
	        _getTransform: function() {
	            var m = new Kinetic.Transform(),
	                x = this.getX(),
	                y = this.getY(),
	                rotation = Kinetic.getAngle(this.getRotation()),
	                scaleX = this.getScaleX(),
	                scaleY = this.getScaleY(),
	                skewX = this.getSkewX(),
	                skewY = this.getSkewY(),
	                offsetX = this.getOffsetX(),
	                offsetY = this.getOffsetY();

	            if(x !== 0 || y !== 0) {
	                m.translate(x, y);
	            }
	            if(rotation !== 0) {
	                m.rotate(rotation);
	            }
	            if(skewX !== 0 || skewY !== 0) {
	                m.skew(skewX, skewY);
	            }
	            if(scaleX !== 1 || scaleY !== 1) {
	                m.scale(scaleX, scaleY);
	            }
	            if(offsetX !== 0 || offsetY !== 0) {
	                m.translate(-1 * offsetX, -1 * offsetY);
	            }

	            return m;
	        },
	        /**
	         * clone node.  Returns a new Node instance with identical attributes.  You can also override
	         *  the node properties with an object literal, enabling you to use an existing node as a template
	         *  for another node
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @param {Object} obj override attrs
	         * @returns {Kinetic.Node}
	         * @example
	         * // simple clone
	         * var clone = node.clone();
	         *
	         * // clone a node and override the x position
	         * var clone = rect.clone({
	         *   x: 5
	         * });
	         */
	        clone: function(obj) {
	            // instantiate new node
	            var className = this.getClassName(),
	                attrs = Kinetic.Util.cloneObject(this.attrs),
	                key, allListeners, len, n, listener;
	            // filter black attrs
	            for (var i in CLONE_BLACK_LIST) {
	                var blockAttr = CLONE_BLACK_LIST[i];
	                delete attrs[blockAttr];
	            }
	            // apply attr overrides
	            for (key in obj) {
	                attrs[key] = obj[key];
	            }

	            var node = new Kinetic[className](attrs);
	            // copy over listeners
	            for(key in this.eventListeners) {
	                allListeners = this.eventListeners[key];
	                len = allListeners.length;
	                for(n = 0; n < len; n++) {
	                    listener = allListeners[n];
	                    /*
	                     * don't include kinetic namespaced listeners because
	                     *  these are generated by the constructors
	                     */
	                    if(listener.name.indexOf(KINETIC) < 0) {
	                        // if listeners array doesn't exist, then create it
	                        if(!node.eventListeners[key]) {
	                            node.eventListeners[key] = [];
	                        }
	                        node.eventListeners[key].push(listener);
	                    }
	                }
	            }
	            return node;
	        },
	        /**
	         * Creates a composite data URL. If MIME type is not
	         * specified, then "image/png" will result. For "image/jpeg", specify a quality
	         * level as quality (range 0.0 - 1.0)
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @param {Object} config
	         * @param {String} [config.mimeType] can be "image/png" or "image/jpeg".
	         *  "image/png" is the default
	         * @param {Number} [config.x] x position of canvas section
	         * @param {Number} [config.y] y position of canvas section
	         * @param {Number} [config.width] width of canvas section
	         * @param {Number} [config.height] height of canvas section
	         * @param {Number} [config.quality] jpeg quality.  If using an "image/jpeg" mimeType,
	         *  you can specify the quality from 0 to 1, where 0 is very poor quality and 1
	         *  is very high quality
	         * @returns {String}
	         */
	        toDataURL: function(config) {
	            config = config || {};

	            var mimeType = config.mimeType || null,
	                quality = config.quality || null,
	                stage = this.getStage(),
	                x = config.x || 0,
	                y = config.y || 0,
	                canvas = new Kinetic.SceneCanvas({
	                    width: config.width || this.getWidth() || (stage ? stage.getWidth() : 0),
	                    height: config.height || this.getHeight() || (stage ? stage.getHeight() : 0),
	                    pixelRatio: 1
	                }),
	                context = canvas.getContext();

	            context.save();

	            if(x || y) {
	                context.translate(-1 * x, -1 * y);
	            }

	            this.drawScene(canvas);
	            context.restore();

	            return canvas.toDataURL(mimeType, quality);
	        },
	        /**
	         * converts node into an image.  Since the toImage
	         *  method is asynchronous, a callback is required.  toImage is most commonly used
	         *  to cache complex drawings as an image so that they don't have to constantly be redrawn
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @param {Object} config
	         * @param {Function} config.callback function executed when the composite has completed
	         * @param {String} [config.mimeType] can be "image/png" or "image/jpeg".
	         *  "image/png" is the default
	         * @param {Number} [config.x] x position of canvas section
	         * @param {Number} [config.y] y position of canvas section
	         * @param {Number} [config.width] width of canvas section
	         * @param {Number} [config.height] height of canvas section
	         * @param {Number} [config.quality] jpeg quality.  If using an "image/jpeg" mimeType,
	         *  you can specify the quality from 0 to 1, where 0 is very poor quality and 1
	         *  is very high quality
	         * @example
	         * var image = node.toImage({
	         *   callback: function(img) {
	         *     // do stuff with img
	         *   }
	         * });
	         */
	        toImage: function(config) {
	            Kinetic.Util._getImage(this.toDataURL(config), function(img) {
	                config.callback(img);
	            });
	        },
	        setSize: function(size) {
	            this.setWidth(size.width);
	            this.setHeight(size.height);
	            return this;
	        },
	        getSize: function() {
	            return {
	                width: this.getWidth(),
	                height: this.getHeight()
	            };
	        },
	        getWidth: function() {
	            return this.attrs.width || 0;
	        },
	        getHeight: function() {
	            return this.attrs.height || 0;
	        },
	        /**
	         * get class name, which may return Stage, Layer, Group, or shape class names like Rect, Circle, Text, etc.
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {String}
	         */
	        getClassName: function() {
	            return this.className || this.nodeType;
	        },
	        /**
	         * get the node type, which may return Stage, Layer, Group, or Node
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {String}
	         */
	        getType: function() {
	            return this.nodeType;
	        },
	        getDragDistance: function() {
	            // compare with undefined because we need to track 0 value
	            if (this.attrs.dragDistance !== undefined) {
	                return this.attrs.dragDistance;
	            } else if (this.parent) {
	                return this.parent.getDragDistance();
	            } else {
	                return Kinetic.dragDistance;
	            }
	        },
	        _get: function(selector) {
	            return this.className === selector || this.nodeType === selector ? [this] : [];
	        },
	        _off: function(type, name) {
	            var evtListeners = this.eventListeners[type],
	                i, evtName;

	            for(i = 0; i < evtListeners.length; i++) {
	                evtName = evtListeners[i].name;
	                // the following two conditions must be true in order to remove a handler:
	                // 1) the current event name cannot be kinetic unless the event name is kinetic
	                //    this enables developers to force remove a kinetic specific listener for whatever reason
	                // 2) an event name is not specified, or if one is specified, it matches the current event name
	                if((evtName !== 'kinetic' || name === 'kinetic') && (!name || evtName === name)) {
	                    evtListeners.splice(i, 1);
	                    if(evtListeners.length === 0) {
	                        delete this.eventListeners[type];
	                        break;
	                    }
	                    i--;
	                }
	            }
	        },
	        _fireChangeEvent: function(attr, oldVal, newVal) {
	            this._fire(attr + CHANGE, {
	                oldVal: oldVal,
	                newVal: newVal
	            });
	        },
	        setId: function(id) {
	            var oldId = this.getId();

	            Kinetic._removeId(oldId);
	            Kinetic._addId(this, id);
	            this._setAttr(ID, id);
	            return this;
	        },
	        setName: function(name) {
	            var oldName = this.getName();

	            Kinetic._removeName(oldName, this._id);
	            Kinetic._addName(this, name);
	            this._setAttr(NAME, name);
	            return this;
	        },
	        /**
	         * set attr
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @param {String} attr
	         * @param {*} val
	         * @returns {Kinetic.Node}
	         * @example
	         * node.setAttr('x', 5);
	         */
	        setAttr: function(attr, val) {
	            var method = SET + Kinetic.Util._capitalize(attr),
	                func = this[method];

	            if(Kinetic.Util._isFunction(func)) {
	                func.call(this, val);
	            }
	            // otherwise set directly
	            else {
	                this._setAttr(attr, val);
	            }
	            return this;
	        },
	        _setAttr: function(key, val) {
	            var oldVal;
	            if(val !== undefined) {
	                oldVal = this.attrs[key];
	                this.attrs[key] = val;
	                this._fireChangeEvent(key, oldVal, val);
	            }
	        },
	        _setComponentAttr: function(key, component, val) {
	            var oldVal;
	            if(val !== undefined) {
	                oldVal = this.attrs[key];

	                if (!oldVal) {
	                    // set value to default value using getAttr
	                    this.attrs[key] = this.getAttr(key);
	                }
	                
	                this.attrs[key][component] = val;
	                this._fireChangeEvent(key, oldVal, val);
	            }
	        },
	        _fireAndBubble: function(eventType, evt, compareShape) {
	            var okayToRun = true;

	            if(evt && this.nodeType === SHAPE) {
	                evt.target = this;
	            }

	            if(eventType === MOUSEENTER && compareShape && (this._id === compareShape._id || (this.isAncestorOf && this.isAncestorOf(compareShape)))) {
	                okayToRun = false;
	            }
	            else if(eventType === MOUSELEAVE && compareShape && (this._id === compareShape._id || (this.isAncestorOf && this.isAncestorOf(compareShape)))) {
	                okayToRun = false;
	            }
	            if(okayToRun) {
	                this._fire(eventType, evt);

	                // simulate event bubbling
	                var stopBubble = (eventType === MOUSEENTER || eventType === MOUSELEAVE) && ((compareShape && compareShape.isAncestorOf && compareShape.isAncestorOf(this)) || !!(compareShape && compareShape.isAncestorOf));
	                if(evt && !evt.cancelBubble && this.parent && this.parent.isListening() && (!stopBubble)) {
	                    if(compareShape && compareShape.parent) {
	                        this._fireAndBubble.call(this.parent, eventType, evt, compareShape.parent);
	                    }
	                    else {
	                        this._fireAndBubble.call(this.parent, eventType, evt);
	                    }
	                }
	            }
	        },
	        _fire: function(eventType, evt) {
	            var events = this.eventListeners[eventType],
	                i;

	            evt.type = eventType;

	            if (events) {
	                for(i = 0; i < events.length; i++) {
	                    events[i].handler.call(this, evt);
	                }
	            }
	        },
	        /**
	         * draw both scene and hit graphs.  If the node being drawn is the stage, all of the layers will be cleared and redrawn
	         * @method
	         * @memberof Kinetic.Node.prototype
	         * @returns {Kinetic.Node}
	         */
	        draw: function() {
	            this.drawScene();
	            this.drawHit();
	            return this;
	        }
	    });

	    /**
	     * create node with JSON string.  De-serializtion does not generate custom
	     *  shape drawing functions, images, or event handlers (this would make the
	     *  serialized object huge).  If your app uses custom shapes, images, and
	     *  event handlers (it probably does), then you need to select the appropriate
	     *  shapes after loading the stage and set these properties via on(), setDrawFunc(),
	     *  and setImage() methods
	     * @method
	     * @memberof Kinetic.Node
	     * @param {String} json
	     * @param {Element} [container] optional container dom element used only if you're
	     *  creating a stage node
	     */
	    Kinetic.Node.create = function(json, container) {
	        return this._createNode(JSON.parse(json), container);
	    };
	    Kinetic.Node._createNode = function(obj, container) {
	        var className = Kinetic.Node.prototype.getClassName.call(obj),
	            children = obj.children,
	            no, len, n;

	        // if container was passed in, add it to attrs
	        if(container) {
	            obj.attrs.container = container;
	        }

	        no = new Kinetic[className](obj.attrs);
	        if(children) {
	            len = children.length;
	            for(n = 0; n < len; n++) {
	                no.add(this._createNode(children[n]));
	            }
	        }

	        return no;
	    };


	    // =========================== add getters setters ===========================

	    Kinetic.Factory.addOverloadedGetterSetter(Kinetic.Node, 'position');
	    /**
	     * get/set node position relative to parent
	     * @name position
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {Object} pos
	     * @param {Number} pos.x
	     * @param {Number} pos.y
	     * @returns {Object}
	     * @example
	     * // get position
	     * var position = node.position();
	     *
	     * // set position
	     * node.position({
	     *   x: 5
	     *   y: 10
	     * });
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'x', 0);

	    /**
	     * get/set x position
	     * @name x
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {Number} x
	     * @returns {Object}
	     * @example
	     * // get x
	     * var x = node.x();
	     *
	     * // set x
	     * node.x(5);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'y', 0);

	    /**
	     * get/set y position
	     * @name y
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {Number} y
	     * @returns {Integer}
	     * @example
	     * // get y
	     * var y = node.y();
	     *
	     * // set y
	     * node.y(5);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'opacity', 1);

	    /**
	     * get/set opacity.  Opacity values range from 0 to 1.
	     *  A node with an opacity of 0 is fully transparent, and a node
	     *  with an opacity of 1 is fully opaque
	     * @name opacity
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {Object} opacity
	     * @returns {Number}
	     * @example
	     * // get opacity
	     * var opacity = node.opacity();
	     *
	     * // set opacity
	     * node.opacity(0.5);
	     */

	    Kinetic.Factory.addGetter(Kinetic.Node, 'name');
	    Kinetic.Factory.addOverloadedGetterSetter(Kinetic.Node, 'name');

	    /**
	     * get/set name
	     * @name name
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {String} name
	     * @returns {String}
	     * @example
	     * // get name
	     * var name = node.name();
	     *
	     * // set name
	     * node.name('foo');
	     *
	     * // also node may have multiple names (as css classes)
	     * node.name('foo bar');
	     */

	    Kinetic.Factory.addGetter(Kinetic.Node, 'id');
	    Kinetic.Factory.addOverloadedGetterSetter(Kinetic.Node, 'id');

	    /**
	     * get/set id
	     * @name id
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {String} id
	     * @returns {String}
	     * @example
	     * // get id
	     * var name = node.id();
	     *
	     * // set id
	     * node.id('foo');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'rotation', 0);

	    /**
	     * get/set rotation in degrees
	     * @name rotation
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {Number} rotation
	     * @returns {Number}
	     * @example
	     * // get rotation in degrees
	     * var rotation = node.rotation();
	     *
	     * // set rotation in degrees
	     * node.rotation(45);
	     */

	    Kinetic.Factory.addComponentsGetterSetter(Kinetic.Node, 'scale', ['x', 'y']);

	    /**
	     * get/set scale
	     * @name scale
	     * @param {Object} scale
	     * @param {Number} scale.x
	     * @param {Number} scale.y
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @returns {Object}
	     * @example
	     * // get scale
	     * var scale = node.scale();
	     *
	     * // set scale 
	     * shape.scale({
	     *   x: 2
	     *   y: 3
	     * });
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'scaleX', 1);

	    /**
	     * get/set scale x
	     * @name scaleX
	     * @param {Number} x
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @returns {Number}
	     * @example
	     * // get scale x
	     * var scaleX = node.scaleX();
	     *
	     * // set scale x
	     * node.scaleX(2);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'scaleY', 1);

	    /**
	     * get/set scale y
	     * @name scaleY
	     * @param {Number} y
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @returns {Number}
	     * @example
	     * // get scale y
	     * var scaleY = node.scaleY();
	     *
	     * // set scale y
	     * node.scaleY(2);
	     */

	    Kinetic.Factory.addComponentsGetterSetter(Kinetic.Node, 'skew', ['x', 'y']);

	    /**
	     * get/set skew
	     * @name skew
	     * @param {Object} skew
	     * @param {Number} skew.x
	     * @param {Number} skew.y
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @returns {Object}
	     * @example
	     * // get skew
	     * var skew = node.skew();
	     *
	     * // set skew 
	     * node.skew({
	     *   x: 20
	     *   y: 10
	     * });
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'skewX', 0);

	    /**
	     * get/set skew x
	     * @name skewX
	     * @param {Number} x
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @returns {Number}
	     * @example
	     * // get skew x
	     * var skewX = node.skewX();
	     *
	     * // set skew x
	     * node.skewX(3);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'skewY', 0);

	    /**
	     * get/set skew y
	     * @name skewY
	     * @param {Number} y
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @returns {Number}
	     * @example
	     * // get skew y
	     * var skewY = node.skewY();
	     *
	     * // set skew y
	     * node.skewY(3);
	     */

	    Kinetic.Factory.addComponentsGetterSetter(Kinetic.Node, 'offset', ['x', 'y']);

	    /**
	     * get/set offset.  Offsets the default position and rotation point
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {Object} offset
	     * @param {Number} offset.x
	     * @param {Number} offset.y
	     * @returns {Object}
	     * @example
	     * // get offset
	     * var offset = node.offset();
	     *
	     * // set offset
	     * node.offset({
	     *   x: 20
	     *   y: 10
	     * });
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'offsetX', 0);

	    /**
	     * get/set offset x
	     * @name offsetX
	     * @memberof Kinetic.Node.prototype
	     * @param {Number} x
	     * @returns {Number}
	     * @example
	     * // get offset x
	     * var offsetX = node.offsetX();
	     *
	     * // set offset x
	     * node.offsetX(3);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'offsetY', 0);

	    /**
	     * get/set drag distance
	     * @name dragDistance
	     * @memberof Kinetic.Node.prototype
	     * @param {Number} distance
	     * @returns {Number}
	     * @example
	     * // get drag distance
	     * var dragDistance = node.dragDistance();
	     *
	     * // set distance
	     * // node starts dragging only if pointer moved more then 3 pixels
	     * node.dragDistance(3);
	     * // or set globally
	     * Kinetic.dragDistance = 3;
	     */

	    Kinetic.Factory.addSetter(Kinetic.Node, 'dragDistance');
	    Kinetic.Factory.addOverloadedGetterSetter(Kinetic.Node, 'dragDistance');

	    /**
	     * get/set offset y
	     * @name offsetY
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {Number} y
	     * @returns {Number}
	     * @example
	     * // get offset y
	     * var offsetY = node.offsetY();
	     *
	     * // set offset y
	     * node.offsetY(3);
	     */

	    Kinetic.Factory.addSetter(Kinetic.Node, 'width', 0);
	    Kinetic.Factory.addOverloadedGetterSetter(Kinetic.Node, 'width');
	    /**
	     * get/set width
	     * @name width
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {Number} width
	     * @returns {Number}
	     * @example
	     * // get width
	     * var width = node.width();
	     *
	     * // set width
	     * node.width(100);
	     */

	    Kinetic.Factory.addSetter(Kinetic.Node, 'height', 0);
	    Kinetic.Factory.addOverloadedGetterSetter(Kinetic.Node, 'height');
	    /**
	     * get/set height
	     * @name height
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {Number} height
	     * @returns {Number}
	     * @example
	     * // get height
	     * var height = node.height();
	     *
	     * // set height
	     * node.height(100);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'listening', 'inherit');
	    /**
	     * get/set listenig attr.  If you need to determine if a node is listening or not
	     *   by taking into account its parents, use the isListening() method  
	     * @name listening
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {Boolean|String} listening Can be "inherit", true, or false.  The default is "inherit".
	     * @returns {Boolean|String}
	     * @example
	     * // get listening attr
	     * var listening = node.listening();
	     *
	     * // stop listening for events
	     * node.listening(false);
	     *
	     * // listen for events
	     * node.listening(true);
	     *
	     * // listen to events according to the parent
	     * node.listening('inherit');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'filters', undefined, function(val) {this._filterUpToDate = false;return val;});
	    /**
	     * get/set filters.  Filters are applied to cached canvases
	     * @name filters
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {Array} filters array of filters
	     * @returns {Array}
	     * @example
	     * // get filters
	     * var filters = node.filters();
	     *
	     * // set a single filter
	     * node.cache();
	     * node.filters([Kinetic.Filters.Blur]);
	     *
	     * // set multiple filters
	     * node.cache();
	     * node.filters([
	     *   Kinetic.Filters.Blur,
	     *   Kinetic.Filters.Sepia,
	     *   Kinetic.Filters.Invert
	     * ]);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'visible', 'inherit');
	    /**
	     * get/set visible attr.  Can be "inherit", true, or false.  The default is "inherit".
	     *   If you need to determine if a node is visible or not
	     *   by taking into account its parents, use the isVisible() method  
	     * @name visible
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {Boolean|String} visible
	     * @returns {Boolean|String}
	     * @example
	     * // get visible attr
	     * var visible = node.visible();
	     *
	     * // make invisible
	     * node.visible(false);
	     *
	     * // make visible
	     * node.visible(true);
	     *
	     * // make visible according to the parent
	     * node.visible('inherit');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'transformsEnabled', 'all');

	    /**
	     * get/set transforms that are enabled.  Can be "all", "none", or "position".  The default
	     *  is "all"
	     * @name transformsEnabled
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {String} enabled
	     * @returns {String}
	     * @example
	     * // enable position transform only to improve draw performance
	     * node.transformsEnabled('position');
	     *
	     * // enable all transforms
	     * node.transformsEnabled('all');
	     */



	    /**
	     * get/set node size
	     * @name size
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {Object} size
	     * @param {Number} size.width
	     * @param {Number} size.height
	     * @returns {Object}
	     * @example
	     * // get node size
	     * var size = node.size();
	     * var x = size.x;
	     * var y = size.y;
	     *
	     * // set size
	     * node.size({
	     *   width: 100,
	     *   height: 200
	     * });
	     */
	    Kinetic.Factory.addOverloadedGetterSetter(Kinetic.Node, 'size');

	    Kinetic.Factory.backCompat(Kinetic.Node, {
	        rotateDeg: 'rotate',
	        setRotationDeg: 'setRotation',
	        getRotationDeg: 'getRotation'
	    });

	    Kinetic.Collection.mapMethods(Kinetic.Node);
	})();
	;(function() {
	    /**
	    * Grayscale Filter
	    * @function
	    * @memberof Kinetic.Filters
	    * @param {Object} imageData
	    * @example
	    * node.cache();
	    * node.filters([Kinetic.Filters.Grayscale]);
	    */
	    Kinetic.Filters.Grayscale = function(imageData) {
	        var data = imageData.data,
	            len = data.length,
	            i, brightness;

	        for(i = 0; i < len; i += 4) {
	            brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
	            // red
	            data[i] = brightness;
	            // green
	            data[i + 1] = brightness;
	            // blue
	            data[i + 2] = brightness;
	        }
	    };
	})();
	;(function() {
	    /**
	     * Brighten Filter.  
	     * @function
	     * @memberof Kinetic.Filters
	     * @param {Object} imageData
	     * @example
	     * node.cache();
	     * node.filters([Kinetic.Filters.Brighten]);
	     * node.brightness(0.8);
	     */
	    Kinetic.Filters.Brighten = function(imageData) {
	        var brightness = this.brightness() * 255,
	            data = imageData.data,
	            len = data.length,
	            i;

	        for(i = 0; i < len; i += 4) {
	            // red
	            data[i] += brightness;
	            // green
	            data[i + 1] += brightness;
	            // blue
	            data[i + 2] += brightness;
	        }
	    };

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'brightness', 0, null, Kinetic.Factory.afterSetFilter);
	    /**
	    * get/set filter brightness.  The brightness is a number between -1 and 1.&nbsp; Positive values 
	    *  brighten the pixels and negative values darken them. Use with {@link Kinetic.Filters.Brighten} filter.
	    * @name brightness
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Number} brightness value between -1 and 1
	    * @returns {Number}
	    */

	})();
	;(function() {
	    /**
	    * Invert Filter
	    * @function
	    * @memberof Kinetic.Filters
	    * @param {Object} imageData
	    * @example
	    * node.cache();
	    * node.filters([Kinetic.Filters.Invert]);
	    */
	    Kinetic.Filters.Invert = function(imageData) {
	        var data = imageData.data,
	            len = data.length,
	            i;

	        for(i = 0; i < len; i += 4) {
	            // red
	            data[i] = 255 - data[i];
	            // green
	            data[i + 1] = 255 - data[i + 1];
	            // blue
	            data[i + 2] = 255 - data[i + 2];
	        }
	    };
	})();;/*
	 the Gauss filter
	 master repo: https://github.com/pavelpower/kineticjsGaussFilter/
	*/
	(function() {
	    /*

	     StackBlur - a fast almost Gaussian Blur For Canvas

	     Version:   0.5
	     Author:    Mario Klingemann
	     Contact:   mario@quasimondo.com
	     Website:   http://www.quasimondo.com/StackBlurForCanvas
	     Twitter:   @quasimondo

	     In case you find this class useful - especially in commercial projects -
	     I am not totally unhappy for a small donation to my PayPal account
	     mario@quasimondo.de

	     Or support me on flattr:
	     https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript

	     Copyright (c) 2010 Mario Klingemann

	     Permission is hereby granted, free of charge, to any person
	     obtaining a copy of this software and associated documentation
	     files (the "Software"), to deal in the Software without
	     restriction, including without limitation the rights to use,
	     copy, modify, merge, publish, distribute, sublicense, and/or sell
	     copies of the Software, and to permit persons to whom the
	     Software is furnished to do so, subject to the following
	     conditions:

	     The above copyright notice and this permission notice shall be
	     included in all copies or substantial portions of the Software.

	     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	     EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
	     OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
	     NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
	     HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
	     WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	     FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
	     OTHER DEALINGS IN THE SOFTWARE.
	     */

	    function BlurStack() {
	        this.r = 0;
	        this.g = 0;
	        this.b = 0;
	        this.a = 0;
	        this.next = null;
	    }

	    var mul_table = [
	        512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,
	        454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,
	        482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,
	        437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,
	        497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,
	        320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,
	        446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,
	        329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,
	        505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,
	        399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,
	        324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,
	        268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,
	        451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,
	        385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,
	        332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,
	        289,287,285,282,280,278,275,273,271,269,267,265,263,261,259
	    ];

	    var shg_table = [
	        9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17,
	        17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19,
	        19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
	        20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
	        21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
	        21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22,
	        22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
	        22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23,
	        23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
	        23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
	        23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
	        23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
	        24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
	        24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
	        24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
	        24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24
	    ];

	    function filterGaussBlurRGBA( imageData, radius) {

	        var pixels = imageData.data,
	            width = imageData.width,
	            height = imageData.height;

	        var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum, a_sum,
	            r_out_sum, g_out_sum, b_out_sum, a_out_sum,
	            r_in_sum, g_in_sum, b_in_sum, a_in_sum,
	            pr, pg, pb, pa, rbs;

	        var div = radius + radius + 1,
	            widthMinus1  = width - 1,
	            heightMinus1 = height - 1,
	            radiusPlus1  = radius + 1,
	            sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) / 2,
	            stackStart = new BlurStack(),
	            stackEnd = null,
	            stack = stackStart,
	            stackIn = null,
	            stackOut = null,
	            mul_sum = mul_table[radius],
	            shg_sum = shg_table[radius];

	        for ( i = 1; i < div; i++ ) {
	            stack = stack.next = new BlurStack();
	            if ( i == radiusPlus1 ){
	                stackEnd = stack;
	            }
	        }

	        stack.next = stackStart;

	        yw = yi = 0;

	        for ( y = 0; y < height; y++ )
	        {
	            r_in_sum = g_in_sum = b_in_sum = a_in_sum = r_sum = g_sum = b_sum = a_sum = 0;

	            r_out_sum = radiusPlus1 * ( pr = pixels[yi] );
	            g_out_sum = radiusPlus1 * ( pg = pixels[yi+1] );
	            b_out_sum = radiusPlus1 * ( pb = pixels[yi+2] );
	            a_out_sum = radiusPlus1 * ( pa = pixels[yi+3] );

	            r_sum += sumFactor * pr;
	            g_sum += sumFactor * pg;
	            b_sum += sumFactor * pb;
	            a_sum += sumFactor * pa;

	            stack = stackStart;

	            for( i = 0; i < radiusPlus1; i++ )
	            {
	                stack.r = pr;
	                stack.g = pg;
	                stack.b = pb;
	                stack.a = pa;
	                stack = stack.next;
	            }

	            for( i = 1; i < radiusPlus1; i++ )
	            {
	                p = yi + (( widthMinus1 < i ? widthMinus1 : i ) << 2 );
	                r_sum += ( stack.r = ( pr = pixels[p])) * ( rbs = radiusPlus1 - i );
	                g_sum += ( stack.g = ( pg = pixels[p+1])) * rbs;
	                b_sum += ( stack.b = ( pb = pixels[p+2])) * rbs;
	                a_sum += ( stack.a = ( pa = pixels[p+3])) * rbs;

	                r_in_sum += pr;
	                g_in_sum += pg;
	                b_in_sum += pb;
	                a_in_sum += pa;

	                stack = stack.next;
	            }


	            stackIn = stackStart;
	            stackOut = stackEnd;
	            for ( x = 0; x < width; x++ )
	            {
	                pixels[yi+3] = pa = (a_sum * mul_sum) >> shg_sum;
	                if ( pa !== 0 )
	                {
	                    pa = 255 / pa;
	                    pixels[yi]   = ((r_sum * mul_sum) >> shg_sum) * pa;
	                    pixels[yi+1] = ((g_sum * mul_sum) >> shg_sum) * pa;
	                    pixels[yi+2] = ((b_sum * mul_sum) >> shg_sum) * pa;
	                } else {
	                    pixels[yi] = pixels[yi+1] = pixels[yi+2] = 0;
	                }

	                r_sum -= r_out_sum;
	                g_sum -= g_out_sum;
	                b_sum -= b_out_sum;
	                a_sum -= a_out_sum;

	                r_out_sum -= stackIn.r;
	                g_out_sum -= stackIn.g;
	                b_out_sum -= stackIn.b;
	                a_out_sum -= stackIn.a;

	                p =  ( yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) ) << 2;

	                r_in_sum += ( stackIn.r = pixels[p]);
	                g_in_sum += ( stackIn.g = pixels[p+1]);
	                b_in_sum += ( stackIn.b = pixels[p+2]);
	                a_in_sum += ( stackIn.a = pixels[p+3]);

	                r_sum += r_in_sum;
	                g_sum += g_in_sum;
	                b_sum += b_in_sum;
	                a_sum += a_in_sum;

	                stackIn = stackIn.next;

	                r_out_sum += ( pr = stackOut.r );
	                g_out_sum += ( pg = stackOut.g );
	                b_out_sum += ( pb = stackOut.b );
	                a_out_sum += ( pa = stackOut.a );

	                r_in_sum -= pr;
	                g_in_sum -= pg;
	                b_in_sum -= pb;
	                a_in_sum -= pa;

	                stackOut = stackOut.next;

	                yi += 4;
	            }
	            yw += width;
	        }


	        for ( x = 0; x < width; x++ )
	        {
	            g_in_sum = b_in_sum = a_in_sum = r_in_sum = g_sum = b_sum = a_sum = r_sum = 0;

	            yi = x << 2;
	            r_out_sum = radiusPlus1 * ( pr = pixels[yi]);
	            g_out_sum = radiusPlus1 * ( pg = pixels[yi+1]);
	            b_out_sum = radiusPlus1 * ( pb = pixels[yi+2]);
	            a_out_sum = radiusPlus1 * ( pa = pixels[yi+3]);

	            r_sum += sumFactor * pr;
	            g_sum += sumFactor * pg;
	            b_sum += sumFactor * pb;
	            a_sum += sumFactor * pa;

	            stack = stackStart;

	            for( i = 0; i < radiusPlus1; i++ )
	            {
	                stack.r = pr;
	                stack.g = pg;
	                stack.b = pb;
	                stack.a = pa;
	                stack = stack.next;
	            }

	            yp = width;

	            for( i = 1; i <= radius; i++ )
	            {
	                yi = ( yp + x ) << 2;

	                r_sum += ( stack.r = ( pr = pixels[yi])) * ( rbs = radiusPlus1 - i );
	                g_sum += ( stack.g = ( pg = pixels[yi+1])) * rbs;
	                b_sum += ( stack.b = ( pb = pixels[yi+2])) * rbs;
	                a_sum += ( stack.a = ( pa = pixels[yi+3])) * rbs;

	                r_in_sum += pr;
	                g_in_sum += pg;
	                b_in_sum += pb;
	                a_in_sum += pa;

	                stack = stack.next;

	                if( i < heightMinus1 )
	                {
	                    yp += width;
	                }
	            }

	            yi = x;
	            stackIn = stackStart;
	            stackOut = stackEnd;
	            for ( y = 0; y < height; y++ )
	            {
	                p = yi << 2;
	                pixels[p+3] = pa = (a_sum * mul_sum) >> shg_sum;
	                if ( pa > 0 )
	                {
	                    pa = 255 / pa;
	                    pixels[p]   = ((r_sum * mul_sum) >> shg_sum ) * pa;
	                    pixels[p+1] = ((g_sum * mul_sum) >> shg_sum ) * pa;
	                    pixels[p+2] = ((b_sum * mul_sum) >> shg_sum ) * pa;
	                } else {
	                    pixels[p] = pixels[p+1] = pixels[p+2] = 0;
	                }

	                r_sum -= r_out_sum;
	                g_sum -= g_out_sum;
	                b_sum -= b_out_sum;
	                a_sum -= a_out_sum;

	                r_out_sum -= stackIn.r;
	                g_out_sum -= stackIn.g;
	                b_out_sum -= stackIn.b;
	                a_out_sum -= stackIn.a;

	                p = ( x + (( ( p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1 ) * width )) << 2;

	                r_sum += ( r_in_sum += ( stackIn.r = pixels[p]));
	                g_sum += ( g_in_sum += ( stackIn.g = pixels[p+1]));
	                b_sum += ( b_in_sum += ( stackIn.b = pixels[p+2]));
	                a_sum += ( a_in_sum += ( stackIn.a = pixels[p+3]));

	                stackIn = stackIn.next;

	                r_out_sum += ( pr = stackOut.r );
	                g_out_sum += ( pg = stackOut.g );
	                b_out_sum += ( pb = stackOut.b );
	                a_out_sum += ( pa = stackOut.a );

	                r_in_sum -= pr;
	                g_in_sum -= pg;
	                b_in_sum -= pb;
	                a_in_sum -= pa;

	                stackOut = stackOut.next;

	                yi += width;
	            }
	        }
	    }

	    /**
	     * Blur Filter
	     * @function
	     * @name Blur
	     * @memberof Kinetic.Filters
	     * @param {Object} imageData
	     * @example
	     * node.cache();
	     * node.filters([Kinetic.Filters.Blur]);
	     * node.blurRadius(10);
	     */
	    Kinetic.Filters.Blur = function Blur(imageData) {
	        var radius = Math.round(this.blurRadius());

	        if (radius > 0) {
	            filterGaussBlurRGBA(imageData, radius);
	        }
	    };

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'blurRadius', 0, null, Kinetic.Factory.afterSetFilter);

	    /**
	    * get/set blur radius. Use with {@link Kinetic.Filters.Blur} filter
	    * @name blurRadius
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Integer} radius
	    * @returns {Integer}
	    */
	})();;(function() {

		function pixelAt(idata, x, y) {
			var idx = (y * idata.width + x) * 4;
			var d = [];
			d.push(idata.data[idx++], idata.data[idx++], idata.data[idx++], idata.data[idx++]);
			return d;
		}

		function rgbDistance(p1, p2) {
			return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2) + Math.pow(p1[2] - p2[2], 2));
		}

		function rgbMean(pTab) {
			var m = [0, 0, 0];

			for (var i = 0; i < pTab.length; i++) {
				m[0] += pTab[i][0];
				m[1] += pTab[i][1];
				m[2] += pTab[i][2];
			}

			m[0] /= pTab.length;
			m[1] /= pTab.length;
			m[2] /= pTab.length;

			return m;
		}

		function backgroundMask(idata, threshold) {
			var rgbv_no = pixelAt(idata, 0, 0);
			var rgbv_ne = pixelAt(idata, idata.width - 1, 0);
			var rgbv_so = pixelAt(idata, 0, idata.height - 1);
			var rgbv_se = pixelAt(idata, idata.width - 1, idata.height - 1);


			var thres = threshold || 10;
			if (rgbDistance(rgbv_no, rgbv_ne) < thres && rgbDistance(rgbv_ne, rgbv_se) < thres && rgbDistance(rgbv_se, rgbv_so) < thres && rgbDistance(rgbv_so, rgbv_no) < thres) {

				// Mean color
				var mean = rgbMean([rgbv_ne, rgbv_no, rgbv_se, rgbv_so]);

				// Mask based on color distance
				var mask = [];
				for (var i = 0; i < idata.width * idata.height; i++) {
					var d = rgbDistance(mean, [idata.data[i * 4], idata.data[i * 4 + 1], idata.data[i * 4 + 2]]);
					mask[i] = (d < thres) ? 0 : 255;
				}

				return mask;
			}
		}

		function applyMask(idata, mask) {
			for (var i = 0; i < idata.width * idata.height; i++) {
				idata.data[4 * i + 3] = mask[i];
			}
		}

		function erodeMask(mask, sw, sh) {

			var weights = [1, 1, 1, 1, 0, 1, 1, 1, 1];
			var side = Math.round(Math.sqrt(weights.length));
			var halfSide = Math.floor(side / 2);

			var maskResult = [];
			for (var y = 0; y < sh; y++) {
				for (var x = 0; x < sw; x++) {

					var so = y * sw + x;
					var a = 0;
					for (var cy = 0; cy < side; cy++) {
						for (var cx = 0; cx < side; cx++) {
							var scy = y + cy - halfSide;
							var scx = x + cx - halfSide;

							if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {

								var srcOff = scy * sw + scx;
								var wt = weights[cy * side + cx];

								a += mask[srcOff] * wt;
							}
						}
					}

					maskResult[so] = (a === 255 * 8) ? 255 : 0;
				}
			}

			return maskResult;
		}

		function dilateMask(mask, sw, sh) {

			var weights = [1, 1, 1, 1, 1, 1, 1, 1, 1];
			var side = Math.round(Math.sqrt(weights.length));
			var halfSide = Math.floor(side / 2);

			var maskResult = [];
			for (var y = 0; y < sh; y++) {
				for (var x = 0; x < sw; x++) {

					var so = y * sw + x;
					var a = 0;
					for (var cy = 0; cy < side; cy++) {
						for (var cx = 0; cx < side; cx++) {
							var scy = y + cy - halfSide;
							var scx = x + cx - halfSide;

							if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {

								var srcOff = scy * sw + scx;
								var wt = weights[cy * side + cx];

								a += mask[srcOff] * wt;
							}
						}
					}

					maskResult[so] = (a >= 255 * 4) ? 255 : 0;
				}
			}

			return maskResult;
		}

		function smoothEdgeMask(mask, sw, sh) {

			var weights = [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9];
			var side = Math.round(Math.sqrt(weights.length));
			var halfSide = Math.floor(side / 2);

			var maskResult = [];
			for (var y = 0; y < sh; y++) {
				for (var x = 0; x < sw; x++) {

					var so = y * sw + x;
					var a = 0;
					for (var cy = 0; cy < side; cy++) {
						for (var cx = 0; cx < side; cx++) {
							var scy = y + cy - halfSide;
							var scx = x + cx - halfSide;

							if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {

								var srcOff = scy * sw + scx;
								var wt = weights[cy * side + cx];

								a += mask[srcOff] * wt;
							}
						}
					}

					maskResult[so] = a;
				}
			}

			return maskResult;
		}
		
		/**
		 * Mask Filter
		 * @function
		 * @name Mask
		 * @memberof Kinetic.Filters
		 * @param {Object} imageData
		 * @example
	     * node.cache();
	     * node.filters([Kinetic.Filters.Mask]);
	     * node.threshold(0.1);
		 */
		Kinetic.Filters.Mask = function(imageData) {
			// Detect pixels close to the background color
			var threshold = this.threshold(),
	        mask = backgroundMask(imageData, threshold);
			if (mask) {
				// Erode
				mask = erodeMask(mask, imageData.width, imageData.height);

				// Dilate
				mask = dilateMask(mask, imageData.width, imageData.height);

				// Gradient
				mask = smoothEdgeMask(mask, imageData.width, imageData.height);

				// Apply mask
				applyMask(imageData, mask);
				
				// todo : Update hit region function according to mask
			}

			return imageData;
		};

		Kinetic.Factory.addGetterSetter(Kinetic.Node, 'threshold', 0, null, Kinetic.Factory.afterSetFilter);
	})();
	;(function () {
	    /**
	     * RGB Filter
	     * @function
	     * @name RGB
	     * @memberof Kinetic.Filters
	     * @param {Object} imageData
	     * @author ippo615
	     * @example
	     * node.cache();
	     * node.filters([Kinetic.Filters.RGB]);
	     * node.blue(120);
	     * node.green(200);
	     */
	    Kinetic.Filters.RGB = function (imageData) {
	        var data = imageData.data,
	            nPixels = data.length,
	            red = this.red(),
	            green = this.green(),
	            blue = this.blue(),
	            i, brightness;

	        for (i = 0; i < nPixels; i += 4) {
	            brightness = (0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2])/255;
	            data[i    ] = brightness*red; // r
	            data[i + 1] = brightness*green; // g
	            data[i + 2] = brightness*blue; // b
	            data[i + 3] = data[i + 3]; // alpha
	        }
	    };

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'red', 0, function(val) {
	        this._filterUpToDate = false;
	        if (val > 255) {
	            return 255;
	        }
	        else if (val < 0) {
	            return 0;
	        }
	        else {
	            return Math.round(val);
	        }
	    });
	    /**
	    * get/set filter red value. Use with {@link Kinetic.Filters.RGB} filter.
	    * @name red
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Integer} red value between 0 and 255
	    * @returns {Integer}
	    */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'green', 0, function(val) {
	        this._filterUpToDate = false;
	        if (val > 255) {
	            return 255;
	        }
	        else if (val < 0) {
	            return 0;
	        }
	        else {
	            return Math.round(val);
	        }
	    });
	    /**
	    * get/set filter green value. Use with {@link Kinetic.Filters.RGB} filter.
	    * @name green
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Integer} green value between 0 and 255
	    * @returns {Integer}
	    */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'blue', 0, Kinetic.Validators.RGBComponent, Kinetic.Factory.afterSetFilter);
	    /**
	    * get/set filter blue value. Use with {@link Kinetic.Filters.RGB} filter.
	    * @name blue
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Integer} blue value between 0 and 255
	    * @returns {Integer}
	    */
	})();
	;(function () {

	    /**
	    * HSV Filter. Adjusts the hue, saturation and value
	    * @function
	    * @name HSV
	    * @memberof Kinetic.Filters
	    * @param {Object} imageData
	    * @author ippo615
	    * @example
	    * image.filters([Kinetic.Filters.HSV]);
	    * image.value(200);
	    */

	    Kinetic.Filters.HSV = function (imageData) {
	        var data = imageData.data,
	            nPixels = data.length,
	            v = Math.pow(2,this.value()),
	            s = Math.pow(2,this.saturation()),
	            h = Math.abs((this.hue()) + 360) % 360,
	            i;

	        // Basis for the technique used:
	        // http://beesbuzz.biz/code/hsv_color_transforms.php
	        // V is the value multiplier (1 for none, 2 for double, 0.5 for half)
	        // S is the saturation multiplier (1 for none, 2 for double, 0.5 for half)
	        // H is the hue shift in degrees (0 to 360)
	        // vsu = V*S*cos(H*PI/180);
	        // vsw = V*S*sin(H*PI/180);
	        //[ .299V+.701vsu+.168vsw    .587V-.587vsu+.330vsw    .114V-.114vsu-.497vsw ] [R]
	        //[ .299V-.299vsu-.328vsw    .587V+.413vsu+.035vsw    .114V-.114vsu+.292vsw ]*[G]
	        //[ .299V-.300vsu+1.25vsw    .587V-.588vsu-1.05vsw    .114V+.886vsu-.203vsw ] [B]

	        // Precompute the values in the matrix:
	        var vsu = v*s*Math.cos(h*Math.PI/180),
	            vsw = v*s*Math.sin(h*Math.PI/180);
	        // (result spot)(source spot)
	        var rr = 0.299*v+0.701*vsu+0.167*vsw,
	            rg = 0.587*v-0.587*vsu+0.330*vsw,
	            rb = 0.114*v-0.114*vsu-0.497*vsw;
	        var gr = 0.299*v-0.299*vsu-0.328*vsw,
	            gg = 0.587*v+0.413*vsu+0.035*vsw,
	            gb = 0.114*v-0.114*vsu+0.293*vsw;
	        var br = 0.299*v-0.300*vsu+1.250*vsw,
	            bg = 0.587*v-0.586*vsu-1.050*vsw,
	            bb = 0.114*v+0.886*vsu-0.200*vsw;

	        var r,g,b,a;

	        for (i = 0; i < nPixels; i += 4) {
	            r = data[i+0];
	            g = data[i+1];
	            b = data[i+2];
	            a = data[i+3];

	            data[i+0] = rr*r + rg*g + rb*b;
	            data[i+1] = gr*r + gg*g + gb*b;
	            data[i+2] = br*r + bg*g + bb*b;
	            data[i+3] = a; // alpha
	        }

	    };

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'hue', 0, null, Kinetic.Factory.afterSetFilter);
	    /**
	    * get/set hsv hue in degrees. Use with {@link Kinetic.Filters.HSV} or {@link Kinetic.Filters.HSL} filter.
	    * @name hue
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Number} hue value between 0 and 359
	    * @returns {Number}
	    */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'saturation', 0, null, Kinetic.Factory.afterSetFilter);
	    /**
	    * get/set hsv saturation. Use with {@link Kinetic.Filters.HSV} or {@link Kinetic.Filters.HSL} filter.
	    * @name saturation
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Number} saturation 0 is no change, -1.0 halves the saturation, 1.0 doubles, etc..
	    * @returns {Number}
	    */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'value', 0, null, Kinetic.Factory.afterSetFilter);
	    /**
	    * get/set hsv value. Use with {@link Kinetic.Filters.HSV} filter.
	    * @name value
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Number} value 0 is no change, -1.0 halves the value, 1.0 doubles, etc..
	    * @returns {Number}
	    */

	})();
	;(function () {

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'hue', 0, null, Kinetic.Factory.afterSetFilter);
	    /**
	    * get/set hsv hue in degrees. Use with {@link Kinetic.Filters.HSV} or {@link Kinetic.Filters.HSL} filter.
	    * @name hue
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Number} hue value between 0 and 359
	    * @returns {Number}
	    */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'saturation', 0, null, Kinetic.Factory.afterSetFilter);
	    /**
	    * get/set hsv saturation. Use with {@link Kinetic.Filters.HSV} or {@link Kinetic.Filters.HSL} filter.
	    * @name saturation
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Number} saturation 0 is no change, -1.0 halves the saturation, 1.0 doubles, etc..
	    * @returns {Number}
	    */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'luminance', 0, null, Kinetic.Factory.afterSetFilter);
	    /**
	    * get/set hsl luminance. Use with {@link Kinetic.Filters.HSL} filter.
	    * @name value
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Number} value 0 is no change, -1.0 halves the value, 1.0 doubles, etc..
	    * @returns {Number}
	    */

	    /**
	    * HSL Filter. Adjusts the hue, saturation and luminance (or lightness)
	    * @function
	    * @memberof Kinetic.Filters
	    * @param {Object} imageData
	    * @author ippo615
	    * @example
	    * image.filters([Kinetic.Filters.HSL]);
	    * image.luminance(200);
	    */

	    Kinetic.Filters.HSL = function (imageData) {
	        var data = imageData.data,
	            nPixels = data.length,
	            v = 1,
	            s = Math.pow(2,this.saturation()),
	            h = Math.abs((this.hue()) + 360) % 360,
	            l = this.luminance()*127,
	            i;

	        // Basis for the technique used:
	        // http://beesbuzz.biz/code/hsv_color_transforms.php
	        // V is the value multiplier (1 for none, 2 for double, 0.5 for half)
	        // S is the saturation multiplier (1 for none, 2 for double, 0.5 for half)
	        // H is the hue shift in degrees (0 to 360)
	        // vsu = V*S*cos(H*PI/180);
	        // vsw = V*S*sin(H*PI/180);
	        //[ .299V+.701vsu+.168vsw    .587V-.587vsu+.330vsw    .114V-.114vsu-.497vsw ] [R]
	        //[ .299V-.299vsu-.328vsw    .587V+.413vsu+.035vsw    .114V-.114vsu+.292vsw ]*[G]
	        //[ .299V-.300vsu+1.25vsw    .587V-.588vsu-1.05vsw    .114V+.886vsu-.203vsw ] [B]

	        // Precompute the values in the matrix:
	        var vsu = v*s*Math.cos(h*Math.PI/180),
	            vsw = v*s*Math.sin(h*Math.PI/180);
	        // (result spot)(source spot)
	        var rr = 0.299*v+0.701*vsu+0.167*vsw,
	            rg = 0.587*v-0.587*vsu+0.330*vsw,
	            rb = 0.114*v-0.114*vsu-0.497*vsw;
	        var gr = 0.299*v-0.299*vsu-0.328*vsw,
	            gg = 0.587*v+0.413*vsu+0.035*vsw,
	            gb = 0.114*v-0.114*vsu+0.293*vsw;
	        var br = 0.299*v-0.300*vsu+1.250*vsw,
	            bg = 0.587*v-0.586*vsu-1.050*vsw,
	            bb = 0.114*v+0.886*vsu-0.200*vsw;

	        var r,g,b,a;

	        for (i = 0; i < nPixels; i += 4) {
	            r = data[i+0];
	            g = data[i+1];
	            b = data[i+2];
	            a = data[i+3];

	            data[i+0] = rr*r + rg*g + rb*b + l;
	            data[i+1] = gr*r + gg*g + gb*b + l;
	            data[i+2] = br*r + bg*g + bb*b + l;
	            data[i+3] = a; // alpha
	        }
	    };
	})();
	;(function () {
	    /**
	     * Emboss Filter.
	     * Pixastic Lib - Emboss filter - v0.1.0
	     * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
	     * License: [http://www.pixastic.com/lib/license.txt]
	     * @function
	     * @memberof Kinetic.Filters
	     * @param {Object} imageData
	     * @example
	     * node.cache();
	     * node.filters([Kinetic.Filters.Emboss]);
	     * node.embossStrength(0.8);
	     * node.embossWhiteLevel(0.3);
	     * node.embossDirection('right');
	     * node.embossBlend(true);
	     */
	    Kinetic.Filters.Emboss = function (imageData) {

	        // pixastic strength is between 0 and 10.  I want it between 0 and 1
	        // pixastic greyLevel is between 0 and 255.  I want it between 0 and 1.  Also,
	        // a max value of greyLevel yields a white emboss, and the min value yields a black
	        // emboss.  Therefore, I changed greyLevel to whiteLevel
	        var strength = this.embossStrength() * 10,
	            greyLevel = this.embossWhiteLevel() * 255,
	            direction = this.embossDirection(),
	            blend = this.embossBlend(),
	            dirY = 0,
	            dirX = 0,
	            data = imageData.data,
	            w = imageData.width,
	            h = imageData.height,
	            w4 = w*4,
	            y = h;

	        switch (direction) {
	            case 'top-left':
	                dirY = -1;
	                dirX = -1;
	                break;
	            case 'top':
	                dirY = -1;
	                dirX = 0;
	                break;
	            case 'top-right':
	                dirY = -1;
	                dirX = 1;
	                break;
	            case 'right':
	                dirY = 0;
	                dirX = 1;
	                break;
	            case 'bottom-right':
	                dirY = 1;
	                dirX = 1;
	                break;
	            case 'bottom':
	                dirY = 1;
	                dirX = 0;
	                break;
	            case 'bottom-left':
	                dirY = 1;
	                dirX = -1;
	                break;
	            case 'left':
	                dirY = 0;
	                dirX = -1;
	                break;
	        }

	        do {
	            var offsetY = (y-1)*w4;

	            var otherY = dirY;
	            if (y + otherY < 1){
	                otherY = 0;
	            }
	            if (y + otherY > h) {
	                otherY = 0;
	            }

	            var offsetYOther = (y-1+otherY)*w*4;

	            var x = w;
	            do {
	                var offset = offsetY + (x-1)*4;

	                var otherX = dirX;
	                if (x + otherX < 1){
	                    otherX = 0;
	                }
	                if (x + otherX > w) {
	                    otherX = 0;
	                }

	                var offsetOther = offsetYOther + (x-1+otherX)*4;

	                var dR = data[offset] - data[offsetOther];
	                var dG = data[offset+1] - data[offsetOther+1];
	                var dB = data[offset+2] - data[offsetOther+2];

	                var dif = dR;
	                var absDif = dif > 0 ? dif : -dif;

	                var absG = dG > 0 ? dG : -dG;
	                var absB = dB > 0 ? dB : -dB;

	                if (absG > absDif) {
	                    dif = dG;
	                }
	                if (absB > absDif) {
	                    dif = dB;
	                }

	                dif *= strength;

	                if (blend) {
	                    var r = data[offset] + dif;
	                    var g = data[offset+1] + dif;
	                    var b = data[offset+2] + dif;

	                    data[offset] = (r > 255) ? 255 : (r < 0 ? 0 : r);
	                    data[offset+1] = (g > 255) ? 255 : (g < 0 ? 0 : g);
	                    data[offset+2] = (b > 255) ? 255 : (b < 0 ? 0 : b);
	                } else {
	                    var grey = greyLevel - dif;
	                    if (grey < 0) {
	                        grey = 0;
	                    } else if (grey > 255) {
	                        grey = 255;
	                    }

	                    data[offset] = data[offset+1] = data[offset+2] = grey;
	                }

	            } while (--x);
	        } while (--y);
	    };

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'embossStrength', 0.5, null, Kinetic.Factory.afterSetFilter);
	    /**
	    * get/set emboss strength. Use with {@link Kinetic.Filters.Emboss} filter.
	    * @name embossStrength
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Number} level between 0 and 1.  Default is 0.5
	    * @returns {Number}
	    */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'embossWhiteLevel', 0.5, null, Kinetic.Factory.afterSetFilter);
	    /**
	    * get/set emboss white level. Use with {@link Kinetic.Filters.Emboss} filter.
	    * @name embossWhiteLevel
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Number} embossWhiteLevel between 0 and 1.  Default is 0.5
	    * @returns {Number}
	    */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'embossDirection', 'top-left', null, Kinetic.Factory.afterSetFilter);
	    /**
	    * get/set emboss direction. Use with {@link Kinetic.Filters.Emboss} filter.
	    * @name embossDirection
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {String} embossDirection can be top-left, top, top-right, right, bottom-right, bottom, bottom-left or left
	    *   The default is top-left
	    * @returns {String}
	    */

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'embossBlend', false, null, Kinetic.Factory.afterSetFilter);
	    /**
	    * get/set emboss blend. Use with {@link Kinetic.Filters.Emboss} filter.
	    * @name embossBlend
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Boolean} embossBlend
	    * @returns {Boolean}
	    */
	})();


	;(function () {
	    function remap(fromValue, fromMin, fromMax, toMin, toMax) {
	        // Compute the range of the data
	        var fromRange = fromMax - fromMin,
	          toRange = toMax - toMin,
	          toValue;

	        // If either range is 0, then the value can only be mapped to 1 value
	        if (fromRange === 0) {
	            return toMin + toRange / 2;
	        }
	        if (toRange === 0) {
	            return toMin;
	        }

	        // (1) untranslate, (2) unscale, (3) rescale, (4) retranslate
	        toValue = (fromValue - fromMin) / fromRange;
	        toValue = (toRange * toValue) + toMin;

	        return toValue;
	    }


	    /**
	    * Enhance Filter. Adjusts the colors so that they span the widest
	    *  possible range (ie 0-255). Performs w*h pixel reads and w*h pixel
	    *  writes.
	    * @function
	    * @name Enhance
	    * @memberof Kinetic.Filters
	    * @param {Object} imageData
	    * @author ippo615
	    * @example
	    * node.cache();
	    * node.filters([Kinetic.Filters.Enhance]);
	    * node.enhance(0.4);
	    */
	    Kinetic.Filters.Enhance = function (imageData) {
	        var data = imageData.data,
	            nSubPixels = data.length,
	            rMin = data[0], rMax = rMin, r,
	            gMin = data[1], gMax = gMin, g,
	            bMin = data[2], bMax = bMin, b,
	            i;

	        // If we are not enhancing anything - don't do any computation
	        var enhanceAmount = this.enhance();
	        if( enhanceAmount === 0 ){ return; }

	        // 1st Pass - find the min and max for each channel:
	        for (i = 0; i < nSubPixels; i += 4) {
	            r = data[i + 0];
	            if (r < rMin) { rMin = r; }
	            else if (r > rMax) { rMax = r; }
	            g = data[i + 1];
	            if (g < gMin) { gMin = g; } else
	            if (g > gMax) { gMax = g; }
	            b = data[i + 2];
	            if (b < bMin) { bMin = b; } else
	            if (b > bMax) { bMax = b; }
	            //a = data[i + 3];
	            //if (a < aMin) { aMin = a; } else
	            //if (a > aMax) { aMax = a; }
	        }

	        // If there is only 1 level - don't remap
	        if( rMax === rMin ){ rMax = 255; rMin = 0; }
	        if( gMax === gMin ){ gMax = 255; gMin = 0; }
	        if( bMax === bMin ){ bMax = 255; bMin = 0; }

	        var rMid, rGoalMax,rGoalMin,
	            gMid, gGoalMax,gGoalMin,
	            bMid, bGoalMax,bGoalMin;

	        // If the enhancement is positive - stretch the histogram 
	        if ( enhanceAmount > 0 ){
	            rGoalMax = rMax + enhanceAmount*(255-rMax);
	            rGoalMin = rMin - enhanceAmount*(rMin-0);
	            gGoalMax = gMax + enhanceAmount*(255-gMax);
	            gGoalMin = gMin - enhanceAmount*(gMin-0);
	            bGoalMax = bMax + enhanceAmount*(255-bMax);
	            bGoalMin = bMin - enhanceAmount*(bMin-0);
	        // If the enhancement is negative - compress the histogram
	        } else {
	            rMid = (rMax + rMin)*0.5;
	            rGoalMax = rMax + enhanceAmount*(rMax-rMid);
	            rGoalMin = rMin + enhanceAmount*(rMin-rMid);
	            gMid = (gMax + gMin)*0.5;
	            gGoalMax = gMax + enhanceAmount*(gMax-gMid);
	            gGoalMin = gMin + enhanceAmount*(gMin-gMid);
	            bMid = (bMax + bMin)*0.5;
	            bGoalMax = bMax + enhanceAmount*(bMax-bMid);
	            bGoalMin = bMin + enhanceAmount*(bMin-bMid);
	        }

	        // Pass 2 - remap everything, except the alpha
	        for (i = 0; i < nSubPixels; i += 4) {
	            data[i + 0] = remap(data[i + 0], rMin, rMax, rGoalMin, rGoalMax);
	            data[i + 1] = remap(data[i + 1], gMin, gMax, gGoalMin, gGoalMax);
	            data[i + 2] = remap(data[i + 2], bMin, bMax, bGoalMin, bGoalMax);
	            //data[i + 3] = remap(data[i + 3], aMin, aMax, aGoalMin, aGoalMax);
	        }
	    };

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'enhance', 0, null, Kinetic.Factory.afterSetFilter);

	    /**
	    * get/set enhance. Use with {@link Kinetic.Filters.Enhance} filter.
	    * @name enhance
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Float} amount
	    * @returns {Float}
	    */
	})();
	;(function () {

	    /**
	     * Posterize Filter. Adjusts the channels so that there are no more
	     *  than n different values for that channel. This is also applied
	     *  to the alpha channel.
	     * @function
	     * @name Posterize
	     * @author ippo615
	     * @memberof Kinetic.Filters
	     * @param {Object} imageData
	     * @example
	     * node.cache();
	     * node.filters([Kinetic.Filters.Posterize]);
	     * node.levels(0.8);
	     */

	    Kinetic.Filters.Posterize = function (imageData) {
	        // level must be between 1 and 255
	        var levels = Math.round(this.levels() * 254) + 1,
	            data = imageData.data,
	            len = data.length,
	            scale = (255 / levels),
	            i;

	        for (i = 0; i < len; i += 1) {
	            data[i] = Math.floor(data[i] / scale) * scale;
	        }
	    };

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'levels', 0.5, null, Kinetic.Factory.afterSetFilter);

	    /**
	    * get/set levels.  Must be a number between 0 and 1.  Use with {@link Kinetic.Filters.Posterize} filter.
	    * @name levels
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Number} level between 0 and 1
	    * @returns {Number}
	    */
	})();;(function () {

	    /**
	     * Noise Filter. Randomly adds or substracts to the color channels
	     * @function
	     * @name Noise
	     * @memberof Kinetic.Filters
	     * @param {Object} imageData
	     * @author ippo615
	     * @example
	     * node.cache();
	     * node.filters([Kinetic.Filters.Noise]);
	     * node.noise(0.8);
	     */
	    Kinetic.Filters.Noise = function (imageData) {
	        var amount = this.noise() * 255,
	            data = imageData.data,
	            nPixels = data.length,
	            half = amount / 2,
	            i;

	        for (i = 0; i < nPixels; i += 4) {
	            data[i + 0] += half - 2 * half * Math.random();
	            data[i + 1] += half - 2 * half * Math.random();
	            data[i + 2] += half - 2 * half * Math.random();
	        }
	    };

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'noise', 0.2, null, Kinetic.Factory.afterSetFilter);

	    /**
	    * get/set noise amount.  Must be a value between 0 and 1. Use with {@link Kinetic.Filters.Noise} filter.
	    * @name noise
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Number} noise
	    * @returns {Number}
	    */
	})();
	;(function () {

	    /**
	     * Pixelate Filter. Averages groups of pixels and redraws
	     *  them as larger pixels
	     * @function
	     * @name Pixelate
	     * @memberof Kinetic.Filters
	     * @param {Object} imageData
	     * @author ippo615
	     * @example
	     * node.cache();
	     * node.filters([Kinetic.Filters.Pixelate]);
	     * node.pixelSize(10);
	     */

	    Kinetic.Filters.Pixelate = function (imageData) {

	        var pixelSize = Math.ceil(this.pixelSize()),
	            width = imageData.width,
	            height = imageData.height,
	            x, y, i,
	            //pixelsPerBin = pixelSize * pixelSize,
	            red, green, blue, alpha,
	            nBinsX = Math.ceil(width / pixelSize),
	            nBinsY = Math.ceil(height / pixelSize),
	            xBinStart, xBinEnd, yBinStart, yBinEnd,
	            xBin, yBin, pixelsInBin;
	        imageData = imageData.data;

	        for (xBin = 0; xBin < nBinsX; xBin += 1) {
	            for (yBin = 0; yBin < nBinsY; yBin += 1) {
	        
	                // Initialize the color accumlators to 0
	                red = 0;
	                green = 0;
	                blue = 0;
	                alpha = 0;

	                // Determine which pixels are included in this bin
	                xBinStart = xBin * pixelSize;
	                xBinEnd = xBinStart + pixelSize;
	                yBinStart = yBin * pixelSize;
	                yBinEnd = yBinStart + pixelSize;

	                // Add all of the pixels to this bin!
	                pixelsInBin = 0;
	                for (x = xBinStart; x < xBinEnd; x += 1) {
	                    if( x >= width ){ continue; }
	                    for (y = yBinStart; y < yBinEnd; y += 1) {
	                        if( y >= height ){ continue; }
	                        i = (width * y + x) * 4;
	                        red += imageData[i + 0];
	                        green += imageData[i + 1];
	                        blue += imageData[i + 2];
	                        alpha += imageData[i + 3];
	                        pixelsInBin += 1;
	                    }
	                }

	                // Make sure the channels are between 0-255
	                red = red / pixelsInBin;
	                green = green / pixelsInBin;
	                blue = blue / pixelsInBin;

	                // Draw this bin
	                for (x = xBinStart; x < xBinEnd; x += 1) {
	                    if( x >= width ){ continue; }
	                    for (y = yBinStart; y < yBinEnd; y += 1) {
	                        if( y >= height ){ continue; }
	                        i = (width * y + x) * 4;
	                        imageData[i + 0] = red;
	                        imageData[i + 1] = green;
	                        imageData[i + 2] = blue;
	                        imageData[i + 3] = alpha;
	                    }
	                }
	            }
	        }
	      
	    };

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'pixelSize', 8, null, Kinetic.Factory.afterSetFilter);

	    /**
	    * get/set pixel size. Use with {@link Kinetic.Filters.Pixelate} filter.
	    * @name pixelSize
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Integer} pixelSize
	    * @returns {Integer}
	    */
	})();;(function () {

	    /**
	     * Threshold Filter. Pushes any value above the mid point to 
	     *  the max and any value below the mid point to the min.
	     *  This affects the alpha channel.
	     * @function
	     * @name Threshold
	     * @memberof Kinetic.Filters
	     * @param {Object} imageData
	     * @author ippo615
	     * @example
	     * node.cache();
	     * node.filters([Kinetic.Filters.Threshold]);
	     * node.threshold(0.1);
	     */

	    Kinetic.Filters.Threshold = function (imageData) {
	        var level = this.threshold() * 255,
	            data = imageData.data,
	            len = data.length,
	            i;

	        for (i = 0; i < len; i += 1) {
	            data[i] = data[i] < level ? 0 : 255;
	        }
	    };

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'threshold', 0.5, null, Kinetic.Factory.afterSetFilter);

	    /**
	    * get/set threshold.  Must be a value between 0 and 1. Use with {@link Kinetic.Filters.Threshold} or {@link Kinetic.Filters.Mask} filter.
	    * @name threshold
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Number} threshold
	    * @returns {Number}
	    */
	})();;(function() {
	    /**
	     * Sepia Filter
	     * Based on: Pixastic Lib - Sepia filter - v0.1.0
	     * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
	     * @function
	     * @name Sepia
	     * @memberof Kinetic.Filters
	     * @param {Object} imageData
	     * @author Jacob Seidelin <jseidelin@nihilogic.dk>
	     * @license MPL v1.1 [http://www.pixastic.com/lib/license.txt]
	     * @example
	     * node.cache();
	     * node.filters([Kinetic.Filters.Sepia]);
	     */
	    Kinetic.Filters.Sepia = function (imageData) {
	        var data = imageData.data,
	            w = imageData.width,
	            y = imageData.height,
	            w4 = w*4,
	            offsetY, x, offset, or, og, ob, r, g, b;
	        
	        do {
	            offsetY = (y-1)*w4;
	            x = w;
	            do {
	                offset = offsetY + (x-1)*4;
	                
	                or = data[offset];
	                og = data[offset+1];
	                ob = data[offset+2];

	                r = or * 0.393 + og * 0.769 + ob * 0.189;
	                g = or * 0.349 + og * 0.686 + ob * 0.168;
	                b = or * 0.272 + og * 0.534 + ob * 0.131;

	                data[offset] = r > 255 ? 255 : r;
	                data[offset+1] = g > 255 ? 255 : g;
	                data[offset+2] = b > 255 ? 255 : b;
	                data[offset+3] = data[offset+3];
	            } while (--x);
	        } while (--y);
	    };
	})();
	;(function () {
	    /**
	     * Solarize Filter
	     * Pixastic Lib - Solarize filter - v0.1.0
	     * Copyright (c) 2008 Jacob Seidelin, jseidelin@nihilogic.dk, http://blog.nihilogic.dk/
	     * License: [http://www.pixastic.com/lib/license.txt]
	     * @function
	     * @name Solarize
	     * @memberof Kinetic.Filters
	     * @param {Object} imageData
	     * @example
	     * node.cache();
	     * node.filters([Kinetic.Filters.Solarize]);
	     */
	    Kinetic.Filters.Solarize = function (imageData) {
	        var data = imageData.data,
	            w = imageData.width,
	            h = imageData.height,
	            w4 = w*4,
	            y = h;

	        do {
	            var offsetY = (y-1)*w4;
	            var x = w;
	            do {
	                var offset = offsetY + (x-1)*4;
	                var r = data[offset];
	                var g = data[offset+1];
	                var b = data[offset+2];

	                if (r > 127) {
	                    r = 255 - r;
	                }
	                if (g > 127) {
	                    g = 255 - g;
	                }
	                if (b > 127) {
	                    b = 255 - b;
	                }

	                data[offset] = r;
	                data[offset+1] = g;
	                data[offset+2] = b;
	            } while (--x);
	        } while (--y);
	    };
	})();


	;/*jshint newcap:false */
	(function () {

	  /*
	   * ToPolar Filter. Converts image data to polar coordinates. Performs 
	   *  w*h*4 pixel reads and w*h pixel writes. The r axis is placed along
	   *  what would be the y axis and the theta axis along the x axis.
	   * @function
	   * @author ippo615
	   * @memberof Kinetic.Filters
	   * @param {ImageData} src, the source image data (what will be transformed)
	   * @param {ImageData} dst, the destination image data (where it will be saved)
	   * @param {Object} opt
	   * @param {Number} [opt.polarCenterX] horizontal location for the center of the circle,
	   *  default is in the middle
	   * @param {Number} [opt.polarCenterY] vertical location for the center of the circle,
	   *  default is in the middle
	   */

	    var ToPolar = function(src,dst,opt){

	        var srcPixels = src.data,
	            dstPixels = dst.data,
	            xSize = src.width,
	            ySize = src.height,
	            xMid = opt.polarCenterX || xSize/2,
	            yMid = opt.polarCenterY || ySize/2,
	            i, x, y, r=0,g=0,b=0,a=0;

	        // Find the largest radius
	        var rad, rMax = Math.sqrt( xMid*xMid + yMid*yMid );
	        x = xSize - xMid;
	        y = ySize - yMid;
	        rad = Math.sqrt( x*x + y*y );
	        rMax = (rad > rMax)?rad:rMax;

	        // We'll be uisng y as the radius, and x as the angle (theta=t)
	        var rSize = ySize,
	            tSize = xSize,
	            radius, theta;

	        // We want to cover all angles (0-360) and we need to convert to
	        // radians (*PI/180)
	        var conversion = 360/tSize*Math.PI/180, sin, cos;

	        // var x1, x2, x1i, x2i, y1, y2, y1i, y2i, scale;

	        for( theta=0; theta<tSize; theta+=1 ){
	            sin = Math.sin(theta*conversion);
	            cos = Math.cos(theta*conversion);
	            for( radius=0; radius<rSize; radius+=1 ){
	                x = Math.floor(xMid+rMax*radius/rSize*cos);
	                y = Math.floor(yMid+rMax*radius/rSize*sin);
	                i = (y*xSize + x)*4;
	                r = srcPixels[i+0];
	                g = srcPixels[i+1];
	                b = srcPixels[i+2];
	                a = srcPixels[i+3];

	                // Store it
	                //i = (theta * xSize + radius) * 4;
	                i = (theta + radius*xSize) * 4;
	                dstPixels[i+0] = r;
	                dstPixels[i+1] = g;
	                dstPixels[i+2] = b;
	                dstPixels[i+3] = a;

	            }
	        }
	    };

	    /*
	     * FromPolar Filter. Converts image data from polar coordinates back to rectangular.
	     *  Performs w*h*4 pixel reads and w*h pixel writes.
	     * @function
	     * @author ippo615
	     * @memberof Kinetic.Filters
	     * @param {ImageData} src, the source image data (what will be transformed)
	     * @param {ImageData} dst, the destination image data (where it will be saved)
	     * @param {Object} opt
	     * @param {Number} [opt.polarCenterX] horizontal location for the center of the circle,
	     *  default is in the middle
	     * @param {Number} [opt.polarCenterY] vertical location for the center of the circle,
	     *  default is in the middle
	     * @param {Number} [opt.polarRotation] amount to rotate the image counterclockwis,
	     *  0 is no rotation, 360 degrees is a full rotation
	     */

	    var FromPolar = function(src,dst,opt){

	        var srcPixels = src.data,
	            dstPixels = dst.data,
	            xSize = src.width,
	            ySize = src.height,
	            xMid = opt.polarCenterX || xSize/2,
	            yMid = opt.polarCenterY || ySize/2,
	            i, x, y, dx, dy, r=0,g=0,b=0,a=0;


	        // Find the largest radius
	        var rad, rMax = Math.sqrt( xMid*xMid + yMid*yMid );
	        x = xSize - xMid;
	        y = ySize - yMid;
	        rad = Math.sqrt( x*x + y*y );
	        rMax = (rad > rMax)?rad:rMax;

	        // We'll be uisng x as the radius, and y as the angle (theta=t)
	        var rSize = ySize,
	        tSize = xSize,
	        radius, theta,
	        phaseShift = opt.polarRotation || 0;

	        // We need to convert to degrees and we need to make sure
	        // it's between (0-360)
	        // var conversion = tSize/360*180/Math.PI;
	        //var conversion = tSize/360*180/Math.PI;

	        var x1, y1;

	        for( x=0; x<xSize; x+=1 ){
	            for( y=0; y<ySize; y+=1 ){
	                dx = x - xMid;
	                dy = y - yMid;
	                radius = Math.sqrt(dx*dx + dy*dy)*rSize/rMax;
	                theta = (Math.atan2(dy,dx)*180/Math.PI + 360 + phaseShift)%360;
	                theta = theta*tSize/360;
	                x1 = Math.floor(theta);
	                y1 = Math.floor(radius);
	                i = (y1*xSize + x1)*4;
	                r = srcPixels[i+0];
	                g = srcPixels[i+1];
	                b = srcPixels[i+2];
	                a = srcPixels[i+3];

	                // Store it
	                i = (y*xSize + x)*4;
	                dstPixels[i+0] = r;
	                dstPixels[i+1] = g;
	                dstPixels[i+2] = b;
	                dstPixels[i+3] = a;
	            }
	        }

	    };

	    //Kinetic.Filters.ToPolar = Kinetic.Util._FilterWrapDoubleBuffer(ToPolar);
	    //Kinetic.Filters.FromPolar = Kinetic.Util._FilterWrapDoubleBuffer(FromPolar);

	    // create a temporary canvas for working - shared between multiple calls
	    var tempCanvas = Kinetic.Util.createCanvasElement();

	    /*
	     * Kaleidoscope Filter. 
	     * @function
	     * @name Kaleidoscope
	     * @author ippo615
	     * @memberof Kinetic.Filters
	     * @example
	     * node.cache();
	     * node.filters([Kinetic.Filters.Kaleidoscope]);
	     * node.kaleidoscopePower(3);
	     * node.kaleidoscopeAngle(45);
	     */
	    Kinetic.Filters.Kaleidoscope = function(imageData){
	        var xSize = imageData.width,
	            ySize = imageData.height;

	        var x,y,xoff,i, r,g,b,a, srcPos, dstPos;
	        var power = Math.round( this.kaleidoscopePower() );
	        var angle = Math.round( this.kaleidoscopeAngle() );
	        var offset = Math.floor(xSize*(angle%360)/360);

	        if( power < 1 ){return;}

	        // Work with our shared buffer canvas
	        tempCanvas.width = xSize;
	        tempCanvas.height = ySize;
	        var scratchData = tempCanvas.getContext('2d').getImageData(0,0,xSize,ySize);

	        // Convert thhe original to polar coordinates
	        ToPolar( imageData, scratchData, {
	            polarCenterX:xSize/2,
	            polarCenterY:ySize/2
	        });

	        // Determine how big each section will be, if it's too small 
	        // make it bigger
	        var minSectionSize = xSize / Math.pow(2,power);
	        while( minSectionSize <= 8){
	            minSectionSize = minSectionSize*2;
	            power -= 1;
	        }
	        minSectionSize = Math.ceil(minSectionSize);
	        var sectionSize = minSectionSize;

	        // Copy the offset region to 0
	        // Depending on the size of filter and location of the offset we may need
	        // to copy the section backwards to prevent it from rewriting itself
	        var xStart = 0,
	          xEnd = sectionSize,
	          xDelta = 1;
	        if( offset+minSectionSize > xSize ){
	            xStart = sectionSize;
	            xEnd = 0;
	            xDelta = -1;
	        }
	        for( y=0; y<ySize; y+=1 ){
	            for( x=xStart; x !== xEnd; x+=xDelta ){
	                xoff = Math.round(x+offset)%xSize;
	                srcPos = (xSize*y+xoff)*4;
	                r = scratchData.data[srcPos+0];
	                g = scratchData.data[srcPos+1];
	                b = scratchData.data[srcPos+2];
	                a = scratchData.data[srcPos+3];
	                dstPos = (xSize*y+x)*4;
	                scratchData.data[dstPos+0] = r;
	                scratchData.data[dstPos+1] = g;
	                scratchData.data[dstPos+2] = b;
	                scratchData.data[dstPos+3] = a;
	            }
	        }

	        // Perform the actual effect
	        for( y=0; y<ySize; y+=1 ){
	            sectionSize = Math.floor( minSectionSize );
	            for( i=0; i<power; i+=1 ){
	                for( x=0; x<sectionSize+1; x+=1 ){
	                    srcPos = (xSize*y+x)*4;
	                    r = scratchData.data[srcPos+0];
	                    g = scratchData.data[srcPos+1];
	                    b = scratchData.data[srcPos+2];
	                    a = scratchData.data[srcPos+3];
	                    dstPos = (xSize*y+sectionSize*2-x-1)*4;
	                    scratchData.data[dstPos+0] = r;
	                    scratchData.data[dstPos+1] = g;
	                    scratchData.data[dstPos+2] = b;
	                    scratchData.data[dstPos+3] = a;
	                }
	                sectionSize *= 2;
	            }
	        }

	        // Convert back from polar coordinates
	        FromPolar(scratchData,imageData,{polarRotation:0});
	    };

	    /**
	    * get/set kaleidoscope power. Use with {@link Kinetic.Filters.Kaleidoscope} filter.
	    * @name kaleidoscopePower
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Integer} power of kaleidoscope
	    * @returns {Integer}
	    */
	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'kaleidoscopePower', 2, null, Kinetic.Factory.afterSetFilter);

	    /**
	    * get/set kaleidoscope angle. Use with {@link Kinetic.Filters.Kaleidoscope} filter.
	    * @name kaleidoscopeAngle
	    * @method
	    * @memberof Kinetic.Node.prototype
	    * @param {Integer} degrees
	    * @returns {Integer}
	    */
	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'kaleidoscopeAngle', 0, null, Kinetic.Factory.afterSetFilter);

	})();
	;(function() {
	    var BATCH_DRAW_STOP_TIME_DIFF = 500;

	    var now =(function() {
	        if (Kinetic.root.performance && Kinetic.root.performance.now) {
	            return function() {
	                return Kinetic.root.performance.now();
	            };
	        }
	        else {
	            return function() {
	                return new Date().getTime();
	            };
	        }
	    })();

	    var RAF = (function() {
	        return Kinetic.root.requestAnimationFrame
	            || Kinetic.root.webkitRequestAnimationFrame
	            || Kinetic.root.mozRequestAnimationFrame
	            || Kinetic.root.oRequestAnimationFrame
	            || Kinetic.root.msRequestAnimationFrame
	            || FRAF;
	    })();

	    function FRAF(callback) {
	        setTimeout(callback, 1000 / 60);
	    }

	    function requestAnimFrame() {
	        return RAF.apply(Kinetic.root, arguments);
	    }
	    
	    /**
	     * Animation constructor.  A stage is used to contain multiple layers and handle
	     * @constructor
	     * @memberof Kinetic
	     * @param {Function} func function executed on each animation frame.  The function is passed a frame object, which contains
	     *  timeDiff, lastTime, time, and frameRate properties.  The timeDiff property is the number of milliseconds that have passed
	     *  since the last animation frame.  The lastTime property is time in milliseconds that elapsed from the moment the animation started
	     *  to the last animation frame.  The time property is the time in milliseconds that ellapsed from the moment the animation started
	     *  to the current animation frame.  The frameRate property is the current frame rate in frames / second. Return false from function,
	     *  if you don't need to redraw layer/layers on some frames.
	     * @param {Kinetic.Layer|Array} [layers] layer(s) to be redrawn on each animation frame. Can be a layer, an array of layers, or null.
	     *  Not specifying a node will result in no redraw.
	     * @example
	     * // move a node to the right at 50 pixels / second
	     * var velocity = 50;
	     *
	     * var anim = new Kinetic.Animation(function(frame) {
	     *   var dist = velocity * (frame.timeDiff / 1000);
	     *   node.move(dist, 0);
	     * }, layer);
	     *
	     * anim.start();
	     */
	    Kinetic.Animation = function(func, layers) {
	        var Anim = Kinetic.Animation;
	        this.func = func;
	        this.setLayers(layers);
	        this.id = Anim.animIdCounter++;
	        this.frame = {
	            time: 0,
	            timeDiff: 0,
	            lastTime: now()
	        };
	    };
	    /*
	     * Animation methods
	     */
	    Kinetic.Animation.prototype = {
	        /**
	         * set layers to be redrawn on each animation frame
	         * @method
	         * @memberof Kinetic.Animation.prototype
	         * @param {Kinetic.Layer|Array} [layers] layer(s) to be redrawn.&nbsp; Can be a layer, an array of layers, or null.  Not specifying a node will result in no redraw.
	         */
	        setLayers: function(layers) {
	            var lays = [];
	            // if passing in no layers
	            if (!layers) {
	                lays = [];
	            }
	            // if passing in an array of Layers
	            // NOTE: layers could be an array or Kinetic.Collection.  for simplicity, I'm just inspecting
	            // the length property to check for both cases
	            else if (layers.length > 0) {
	                lays = layers;
	            }
	            // if passing in a Layer
	            else {
	                lays = [layers];
	            }

	            this.layers = lays;
	        },
	        /**
	         * get layers
	         * @method
	         * @memberof Kinetic.Animation.prototype
	         */
	        getLayers: function() {
	            return this.layers;
	        },
	        /**
	         * add layer.  Returns true if the layer was added, and false if it was not
	         * @method
	         * @memberof Kinetic.Animation.prototype
	         * @param {Kinetic.Layer} layer
	         */
	        addLayer: function(layer) {
	            var layers = this.layers,
	                len, n;

	            if (layers) {
	                len = layers.length;

	                // don't add the layer if it already exists
	                for (n = 0; n < len; n++) {
	                    if (layers[n]._id === layer._id) {
	                        return false;
	                    }
	                }
	            }
	            else {
	                this.layers = [];
	            }

	            this.layers.push(layer);
	            return true;
	        },
	        /**
	         * determine if animation is running or not.  returns true or false
	         * @method
	         * @memberof Kinetic.Animation.prototype
	         */
	        isRunning: function() {
	            var a = Kinetic.Animation,
	                animations = a.animations,
	                len = animations.length,
	                n;

	            for(n = 0; n < len; n++) {
	                if(animations[n].id === this.id) {
	                    return true;
	                }
	            }
	            return false;
	        },
	        /**
	         * start animation
	         * @method
	         * @memberof Kinetic.Animation.prototype
	         */
	        start: function() {
	            var Anim = Kinetic.Animation;
	            this.stop();
	            this.frame.timeDiff = 0;
	            this.frame.lastTime = now();
	            Anim._addAnimation(this);
	        },
	        /**
	         * stop animation
	         * @method
	         * @memberof Kinetic.Animation.prototype
	         */
	        stop: function() {
	            Kinetic.Animation._removeAnimation(this);
	        },
	        _updateFrameObject: function(time) {
	            this.frame.timeDiff = time - this.frame.lastTime;
	            this.frame.lastTime = time;
	            this.frame.time += this.frame.timeDiff;
	            this.frame.frameRate = 1000 / this.frame.timeDiff;
	        }
	    };
	    Kinetic.Animation.animations = [];
	    Kinetic.Animation.animIdCounter = 0;
	    Kinetic.Animation.animRunning = false;

	    Kinetic.Animation._addAnimation = function(anim) {
	        this.animations.push(anim);
	        this._handleAnimation();
	    };
	    Kinetic.Animation._removeAnimation = function(anim) {
	        var id = anim.id,
	            animations = this.animations,
	            len = animations.length,
	            n;

	        for(n = 0; n < len; n++) {
	            if(animations[n].id === id) {
	                this.animations.splice(n, 1);
	                break;
	            }
	        }
	    };

	    Kinetic.Animation._runFrames = function() {
	        var layerHash = {},
	            animations = this.animations,
	            anim, layers, func, n, i, layersLen, layer, key, needRedraw;
	        /*
	         * loop through all animations and execute animation
	         *  function.  if the animation object has specified node,
	         *  we can add the node to the nodes hash to eliminate
	         *  drawing the same node multiple times.  The node property
	         *  can be the stage itself or a layer
	         */
	        /*
	         * WARNING: don't cache animations.length because it could change while
	         * the for loop is running, causing a JS error
	         */

	        for(n = 0; n < animations.length; n++) {
	            anim = animations[n];
	            layers = anim.layers;
	            func = anim.func;


	            anim._updateFrameObject(now());
	            layersLen = layers.length;

	            // if animation object has a function, execute it
	            if (func) {
	                // allow anim bypassing drawing
	                needRedraw = (func.call(anim, anim.frame) !== false);
	            } else {
	                needRedraw = true;
	            }
	            if (needRedraw) {
	                for (i = 0; i < layersLen; i++) {
	                    layer = layers[i];

	                    if (layer._id !== undefined) {
	                        layerHash[layer._id] = layer;
	                    }
	                }
	            }
	        }

	        for (key in layerHash) {
	            layerHash[key].draw();
	        }
	    };
	    Kinetic.Animation._animationLoop = function() {
	        var Anim = Kinetic.Animation;

	        if(Anim.animations.length) {
	            requestAnimFrame(Anim._animationLoop);
	            Anim._runFrames();
	        }
	        else {
	            Anim.animRunning = false;
	        }
	    };
	    Kinetic.Animation._handleAnimation = function() {
	        var that = this;
	        if(!this.animRunning) {
	            this.animRunning = true;
	            that._animationLoop();
	        }
	    };

	    var moveTo = Kinetic.Node.prototype.moveTo;
	    Kinetic.Node.prototype.moveTo = function(container) {
	        moveTo.call(this, container);
	    };

	    /**
	     * batch draw
	     * @method
	     * @memberof Kinetic.Base.prototype
	     */
	    Kinetic.BaseLayer.prototype.batchDraw = function() {
	        var that = this,
	            Anim = Kinetic.Animation;

	        if (!this.batchAnim) {
	            this.batchAnim = new Anim(function() {
	                if (that.lastBatchDrawTime && now() - that.lastBatchDrawTime > BATCH_DRAW_STOP_TIME_DIFF) {
	                    that.batchAnim.stop();
	                }
	            }, this);
	        }

	        this.lastBatchDrawTime = now();

	        if (!this.batchAnim.isRunning()) {
	            this.draw();
	            this.batchAnim.start();
	        }
	    };

	    /**
	     * batch draw
	     * @method
	     * @memberof Kinetic.Stage.prototype
	     */
	    Kinetic.Stage.prototype.batchDraw = function() {
	        this.getChildren().each(function(layer) {
	            layer.batchDraw();
	        });
	    };
	})(this);
	;(function() {
	    var blacklist = {
	        node: 1,
	        duration: 1,
	        easing: 1,
	        onFinish: 1,
	        yoyo: 1
	    },

	    PAUSED = 1,
	    PLAYING = 2,
	    REVERSING = 3,

	    idCounter = 0;

	    /**
	     * Tween constructor.  Tweens enable you to animate a node between the current state and a new state.
	     *  You can play, pause, reverse, seek, reset, and finish tweens.  By default, tweens are animated using
	     *  a linear easing.  For more tweening options, check out {@link Kinetic.Easings}
	     * @constructor
	     * @memberof Kinetic
	     * @example
	     * // instantiate new tween which fully rotates a node in 1 second
	     * var tween = new Kinetic.Tween({
	     *   node: node,
	     *   rotationDeg: 360,
	     *   duration: 1,
	     *   easing: Kinetic.Easings.EaseInOut
	     * });
	     *
	     * // play tween
	     * tween.play();
	     *
	     * // pause tween
	     * tween.pause();
	     */
	    Kinetic.Tween = function(config) {
	        var that = this,
	            node = config.node,
	            nodeId = node._id,
	            duration,
	            easing = config.easing || Kinetic.Easings.Linear,
	            yoyo = !!config.yoyo,
	            key;

	        if (typeof config.duration === 'undefined') {
	            duration = 1;
	        } else if (config.duration === 0) {  // zero is bad value for duration
	            duration = 0.001;
	        } else {
	            duration = config.duration;
	        }
	        this.node = node;
	        this._id = idCounter++;

	        this.anim = new Kinetic.Animation(function() {
	            that.tween.onEnterFrame();
	        }, node.getLayer() || ((node instanceof Kinetic.Stage) ? node.getLayers() : null));

	        this.tween = new Tween(key, function(i) {
	            that._tweenFunc(i);
	        }, easing, 0, 1, duration * 1000, yoyo);

	        this._addListeners();

	        // init attrs map
	        if (!Kinetic.Tween.attrs[nodeId]) {
	            Kinetic.Tween.attrs[nodeId] = {};
	        }
	        if (!Kinetic.Tween.attrs[nodeId][this._id]) {
	            Kinetic.Tween.attrs[nodeId][this._id] = {};
	        }
	        // init tweens map
	        if (!Kinetic.Tween.tweens[nodeId]) {
	            Kinetic.Tween.tweens[nodeId] = {};
	        }

	        for (key in config) {
	            if (blacklist[key] === undefined) {
	                this._addAttr(key, config[key]);
	            }
	        }

	        this.reset();

	        // callbacks
	        this.onFinish = config.onFinish;
	        this.onReset = config.onReset;
	    };

	    // start/diff object = attrs.nodeId.tweenId.attr
	    Kinetic.Tween.attrs = {};
	    // tweenId = tweens.nodeId.attr
	    Kinetic.Tween.tweens = {};

	    Kinetic.Tween.prototype = {
	        _addAttr: function(key, end) {
	            var node = this.node,
	                nodeId = node._id,
	                start, diff, tweenId, n, len;

	            // remove conflict from tween map if it exists
	            tweenId = Kinetic.Tween.tweens[nodeId][key];

	            if (tweenId) {
	                delete Kinetic.Tween.attrs[nodeId][tweenId][key];
	            }

	            // add to tween map
	            start = node.getAttr(key);

	            if (Kinetic.Util._isArray(end)) {
	                diff = [];
	                len = end.length;
	                for (n=0; n<len; n++) {
	                    diff.push(end[n] - start[n]);
	                }

	            }
	            else {
	                diff = end - start;
	            }

	            Kinetic.Tween.attrs[nodeId][this._id][key] = {
	                start: start,
	                diff: diff
	            };
	            Kinetic.Tween.tweens[nodeId][key] = this._id;
	        },
	        _tweenFunc: function(i) {
	            var node = this.node,
	                attrs = Kinetic.Tween.attrs[node._id][this._id],
	                key, attr, start, diff, newVal, n, len;

	            for (key in attrs) {
	                attr = attrs[key];
	                start = attr.start;
	                diff = attr.diff;

	                if (Kinetic.Util._isArray(start)) {
	                    newVal = [];
	                    len = start.length;
	                    for (n=0; n<len; n++) {
	                        newVal.push(start[n] + (diff[n] * i));
	                    }
	                }
	                else {
	                    newVal = start + (diff * i);
	                }

	                node.setAttr(key, newVal);
	            }
	        },
	        _addListeners: function() {
	            var that = this;

	            // start listeners
	            this.tween.onPlay = function() {
	                that.anim.start();
	            };
	            this.tween.onReverse = function() {
	                that.anim.start();
	            };

	            // stop listeners
	            this.tween.onPause = function() {
	                that.anim.stop();
	            };
	            this.tween.onFinish = function() {
	                if (that.onFinish) {
	                    that.onFinish();
	                }
	            };
	            this.tween.onReset = function() {
	                if (that.onReset) {
	                    that.onReset();
	                }
	            };
	        },
	        /**
	         * play
	         * @method
	         * @memberof Kinetic.Tween.prototype
	         * @returns {Tween}
	         */
	        play: function() {
	            this.tween.play();
	            return this;
	        },
	        /**
	         * reverse
	         * @method
	         * @memberof Kinetic.Tween.prototype
	         * @returns {Tween}
	         */
	        reverse: function() {
	            this.tween.reverse();
	            return this;
	        },
	        /**
	         * reset
	         * @method
	         * @memberof Kinetic.Tween.prototype
	         * @returns {Tween}
	         */
	        reset: function() {
	            this.tween.reset();
	            return this;
	        },
	        /**
	         * seek
	         * @method
	         * @memberof Kinetic.Tween.prototype
	         * @param {Integer} t time in seconds between 0 and the duration
	         * @returns {Tween}
	         */
	        seek: function(t) {
	            this.tween.seek(t * 1000);
	            return this;
	        },
	        /**
	         * pause
	         * @method
	         * @memberof Kinetic.Tween.prototype
	         * @returns {Tween}
	         */
	        pause: function() {
	            this.tween.pause();
	            return this;
	        },
	        /**
	         * finish
	         * @method
	         * @memberof Kinetic.Tween.prototype
	         * @returns {Tween}
	         */
	        finish: function() {
	            this.tween.finish();
	            return this;
	        },
	        /**
	         * destroy
	         * @method
	         * @memberof Kinetic.Tween.prototype
	         */
	        destroy: function() {
	            var nodeId = this.node._id,
	                thisId = this._id,
	                attrs = Kinetic.Tween.tweens[nodeId],
	                key;

	            this.pause();

	            for (key in attrs) {
	                delete Kinetic.Tween.tweens[nodeId][key];
	            }

	            delete Kinetic.Tween.attrs[nodeId][thisId];
	        }
	    };

	    var Tween = function(prop, propFunc, func, begin, finish, duration, yoyo) {
	        this.prop = prop;
	        this.propFunc = propFunc;
	        this.begin = begin;
	        this._pos = begin;
	        this.duration = duration;
	        this._change = 0;
	        this.prevPos = 0;
	        this.yoyo = yoyo;
	        this._time = 0;
	        this._position = 0;
	        this._startTime = 0;
	        this._finish = 0;
	        this.func = func;
	        this._change = finish - this.begin;
	        this.pause();
	    };
	    /*
	     * Tween methods
	     */
	    Tween.prototype = {
	        fire: function(str) {
	            var handler = this[str];
	            if (handler) {
	                handler();
	            }
	        },
	        setTime: function(t) {
	            if(t > this.duration) {
	                if(this.yoyo) {
	                    this._time = this.duration;
	                    this.reverse();
	                }
	                else {
	                    this.finish();
	                }
	            }
	            else if(t < 0) {
	                if(this.yoyo) {
	                    this._time = 0;
	                    this.play();
	                }
	                else {
	                    this.reset();
	                }
	            }
	            else {
	                this._time = t;
	                this.update();
	            }
	        },
	        getTime: function() {
	            return this._time;
	        },
	        setPosition: function(p) {
	            this.prevPos = this._pos;
	            this.propFunc(p);
	            this._pos = p;
	        },
	        getPosition: function(t) {
	            if(t === undefined) {
	                t = this._time;
	            }
	            return this.func(t, this.begin, this._change, this.duration);
	        },
	        play: function() {
	            this.state = PLAYING;
	            this._startTime = this.getTimer() - this._time;
	            this.onEnterFrame();
	            this.fire('onPlay');
	        },
	        reverse: function() {
	            this.state = REVERSING;
	            this._time = this.duration - this._time;
	            this._startTime = this.getTimer() - this._time;
	            this.onEnterFrame();
	            this.fire('onReverse');
	        },
	        seek: function(t) {
	            this.pause();
	            this._time = t;
	            this.update();
	            this.fire('onSeek');
	        },
	        reset: function() {
	            this.pause();
	            this._time = 0;
	            this.update();
	            this.fire('onReset');
	        },
	        finish: function() {
	            this.pause();
	            this._time = this.duration;
	            this.update();
	            this.fire('onFinish');
	        },
	        update: function() {
	            this.setPosition(this.getPosition(this._time));
	        },
	        onEnterFrame: function() {
	            var t = this.getTimer() - this._startTime;
	            if(this.state === PLAYING) {
	                this.setTime(t);
	            }
	            else if (this.state === REVERSING) {
	                this.setTime(this.duration - t);
	            }
	        },
	        pause: function() {
	            this.state = PAUSED;
	            this.fire('onPause');
	        },
	        getTimer: function() {
	            return new Date().getTime();
	        }
	    };

	    /*
	    * These eases were ported from an Adobe Flash tweening library to JavaScript
	    * by Xaric
	    */

	    /**
	     * @namespace Easings
	     * @memberof Kinetic
	     */
	    Kinetic.Easings = {
	        /**
	        * back ease in
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'BackEaseIn': function(t, b, c, d) {
	            var s = 1.70158;
	            return c * (t /= d) * t * ((s + 1) * t - s) + b;
	        },
	        /**
	        * back ease out
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'BackEaseOut': function(t, b, c, d) {
	            var s = 1.70158;
	            return c * (( t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
	        },
	        /**
	        * back ease in out
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'BackEaseInOut': function(t, b, c, d) {
	            var s = 1.70158;
	            if((t /= d / 2) < 1) {
	                return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
	            }
	            return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
	        },
	        /**
	        * elastic ease in
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'ElasticEaseIn': function(t, b, c, d, a, p) {
	            // added s = 0
	            var s = 0;
	            if(t === 0) {
	                return b;
	            }
	            if((t /= d) == 1) {
	                return b + c;
	            }
	            if(!p) {
	                p = d * 0.3;
	            }
	            if(!a || a < Math.abs(c)) {
	                a = c;
	                s = p / 4;
	            }
	            else {
	                s = p / (2 * Math.PI) * Math.asin(c / a);
	            }
	            return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
	        },
	        /**
	        * elastic ease out
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'ElasticEaseOut': function(t, b, c, d, a, p) {
	            // added s = 0
	            var s = 0;
	            if(t === 0) {
	                return b;
	            }
	            if((t /= d) == 1) {
	                return b + c;
	            }
	            if(!p) {
	                p = d * 0.3;
	            }
	            if(!a || a < Math.abs(c)) {
	                a = c;
	                s = p / 4;
	            }
	            else {
	                s = p / (2 * Math.PI) * Math.asin(c / a);
	            }
	            return (a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
	        },
	        /**
	        * elastic ease in out
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'ElasticEaseInOut': function(t, b, c, d, a, p) {
	            // added s = 0
	            var s = 0;
	            if(t === 0) {
	                return b;
	            }
	            if((t /= d / 2) == 2) {
	                return b + c;
	            }
	            if(!p) {
	                p = d * (0.3 * 1.5);
	            }
	            if(!a || a < Math.abs(c)) {
	                a = c;
	                s = p / 4;
	            }
	            else {
	                s = p / (2 * Math.PI) * Math.asin(c / a);
	            }
	            if(t < 1) {
	                return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
	            }
	            return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * 0.5 + c + b;
	        },
	        /**
	        * bounce ease out
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'BounceEaseOut': function(t, b, c, d) {
	            if((t /= d) < (1 / 2.75)) {
	                return c * (7.5625 * t * t) + b;
	            }
	            else if(t < (2 / 2.75)) {
	                return c * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75) + b;
	            }
	            else if(t < (2.5 / 2.75)) {
	                return c * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375) + b;
	            }
	            else {
	                return c * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375) + b;
	            }
	        },
	        /**
	        * bounce ease in
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'BounceEaseIn': function(t, b, c, d) {
	            return c - Kinetic.Easings.BounceEaseOut(d - t, 0, c, d) + b;
	        },
	        /**
	        * bounce ease in out
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'BounceEaseInOut': function(t, b, c, d) {
	            if(t < d / 2) {
	                return Kinetic.Easings.BounceEaseIn(t * 2, 0, c, d) * 0.5 + b;
	            }
	            else {
	                return Kinetic.Easings.BounceEaseOut(t * 2 - d, 0, c, d) * 0.5 + c * 0.5 + b;
	            }
	        },
	        /**
	        * ease in
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'EaseIn': function(t, b, c, d) {
	            return c * (t /= d) * t + b;
	        },
	        /**
	        * ease out
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'EaseOut': function(t, b, c, d) {
	            return -c * (t /= d) * (t - 2) + b;
	        },
	        /**
	        * ease in out
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'EaseInOut': function(t, b, c, d) {
	            if((t /= d / 2) < 1) {
	                return c / 2 * t * t + b;
	            }
	            return -c / 2 * ((--t) * (t - 2) - 1) + b;
	        },
	        /**
	        * strong ease in
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'StrongEaseIn': function(t, b, c, d) {
	            return c * (t /= d) * t * t * t * t + b;
	        },
	        /**
	        * strong ease out
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'StrongEaseOut': function(t, b, c, d) {
	            return c * (( t = t / d - 1) * t * t * t * t + 1) + b;
	        },
	        /**
	        * strong ease in out
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'StrongEaseInOut': function(t, b, c, d) {
	            if((t /= d / 2) < 1) {
	                return c / 2 * t * t * t * t * t + b;
	            }
	            return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
	        },
	        /**
	        * linear
	        * @function
	        * @memberof Kinetic.Easings
	        */
	        'Linear': function(t, b, c, d) {
	            return c * t / d + b;
	        }
	    };
	})();
	;(function() {
	    Kinetic.DD = {
	        // properties
	        anim: new Kinetic.Animation(function() {
	            var b = this.dirty;
	            this.dirty = false;
	            return b;
	        }),
	        isDragging: false,
	        justDragged: false,
	        offset: {
	            x: 0,
	            y: 0
	        },
	        node: null,

	        // methods
	        _drag: function(evt) {
	            var dd = Kinetic.DD,
	                node = dd.node;

	            if(node) {
	               if(!dd.isDragging) {
	                    var pos = node.getStage().getPointerPosition();
	                    var dragDistance = node.dragDistance();
	                    var distance = Math.max(
	                        Math.abs(pos.x - dd.startPointerPos.x),
	                        Math.abs(pos.y - dd.startPointerPos.y)
	                    );
	                    if (distance < dragDistance) {
	                        return;
	                    }
	                }

	                node._setDragPosition(evt);
	                if(!dd.isDragging) {
	                    dd.isDragging = true;
	                    node.fire('dragstart', {
	                        type : 'dragstart',
	                        target : node,
	                        evt : evt
	                    }, true);
	                }

	                // execute ondragmove if defined
	                node.fire('dragmove', {
	                    type : 'dragmove',
	                    target : node,
	                    evt : evt
	                }, true);
	            }
	        },
	        _endDragBefore: function(evt) {
	            var dd = Kinetic.DD,
	                node = dd.node,
	                nodeType, layer;

	            if(node) {
	                nodeType = node.nodeType;
	                layer = node.getLayer();
	                dd.anim.stop();

	                // only fire dragend event if the drag and drop
	                // operation actually started.
	                if(dd.isDragging) {
	                    dd.isDragging = false;
	                    dd.justDragged = true;
	                    Kinetic.listenClickTap = false;

	                    if (evt) {
	                        evt.dragEndNode = node;
	                    }
	                }

	                delete dd.node;

	                (layer || node).draw();
	            }
	        },
	        _endDragAfter: function(evt) {
	            evt = evt || {};

	            var dragEndNode = evt.dragEndNode;

	            if (evt && dragEndNode) {
	                dragEndNode.fire('dragend', {
	                    type : 'dragend',
	                    target : dragEndNode,
	                    evt : evt
	                }, true);
	            }
	        }
	    };

	    // Node extenders

	    /**
	     * initiate drag and drop
	     * @method
	     * @memberof Kinetic.Node.prototype
	     */
	    Kinetic.Node.prototype.startDrag = function() {
	        var dd = Kinetic.DD,
	            stage = this.getStage(),
	            layer = this.getLayer(),
	            pos = stage.getPointerPosition(),
	            ap = this.getAbsolutePosition();

	        if(pos) {
	            if (dd.node) {
	                dd.node.stopDrag();
	            }

	            dd.node = this;
	            dd.startPointerPos = pos;
	            dd.offset.x = pos.x - ap.x;
	            dd.offset.y = pos.y - ap.y;
	            dd.anim.setLayers(layer || this.getLayers());
	            dd.anim.start();

	            this._setDragPosition();
	        }
	    };

	    Kinetic.Node.prototype._setDragPosition = function(evt) {
	        var dd = Kinetic.DD,
	            pos = this.getStage().getPointerPosition(),
	            dbf = this.getDragBoundFunc();
	        if (!pos) {
	            return;
	        }
	        var newNodePos = {
	            x: pos.x - dd.offset.x,
	            y: pos.y - dd.offset.y
	        };

	        if(dbf !== undefined) {
	            newNodePos = dbf.call(this, newNodePos, evt);
	        }
	        this.setAbsolutePosition(newNodePos);

	        if (!this._lastPos || this._lastPos.x !== newNodePos.x ||
	            this._lastPos.y !== newNodePos.y) {
	            dd.anim.dirty = true;
	        }

	        this._lastPos = newNodePos;
	    };

	    /**
	     * stop drag and drop
	     * @method
	     * @memberof Kinetic.Node.prototype
	     */
	    Kinetic.Node.prototype.stopDrag = function() {
	        var dd = Kinetic.DD,
	            evt = {};
	        dd._endDragBefore(evt);
	        dd._endDragAfter(evt);
	    };

	    Kinetic.Node.prototype.setDraggable = function(draggable) {
	        this._setAttr('draggable', draggable);
	        this._dragChange();
	    };

	    var origDestroy = Kinetic.Node.prototype.destroy;

	    Kinetic.Node.prototype.destroy = function() {
	        var dd = Kinetic.DD;

	        // stop DD
	        if(dd.node && dd.node._id === this._id) {

	            this.stopDrag();
	        }

	        origDestroy.call(this);
	    };

	    /**
	     * determine if node is currently in drag and drop mode
	     * @method
	     * @memberof Kinetic.Node.prototype
	     */
	    Kinetic.Node.prototype.isDragging = function() {
	        var dd = Kinetic.DD;
	        return !!(dd.node && dd.node._id === this._id && dd.isDragging);
	    };

	    Kinetic.Node.prototype._listenDrag = function() {
	        var that = this;

	        this._dragCleanup();

	        if (this.getClassName() === 'Stage') {
	            this.on('contentMousedown.kinetic contentTouchstart.kinetic', function(evt) {
	                if(!Kinetic.DD.node) {
	                    that.startDrag(evt);
	                }
	            });
	        }
	        else {
	            this.on('mousedown.kinetic touchstart.kinetic', function(evt) {
	                // ignore right and middle buttons
	                if (evt.evt.button === 1 || evt.evt.button === 2) {
	                    return;
	                }
	                if(!Kinetic.DD.node) {
	                    that.startDrag(evt);
	                }
	            });
	        }

	        // listening is required for drag and drop
	        /*
	        this._listeningEnabled = true;
	        this._clearSelfAndAncestorCache('listeningEnabled');
	        */
	    };

	    Kinetic.Node.prototype._dragChange = function() {
	        if(this.attrs.draggable) {
	            this._listenDrag();
	        }
	        else {
	            // remove event listeners
	            this._dragCleanup();

	            /*
	             * force drag and drop to end
	             * if this node is currently in
	             * drag and drop mode
	             */
	            var stage = this.getStage();
	            var dd = Kinetic.DD;
	            if(stage && dd.node && dd.node._id === this._id) {
	                dd.node.stopDrag();
	            }
	        }
	    };

	    Kinetic.Node.prototype._dragCleanup = function() {
	        if (this.getClassName() === 'Stage') {
	            this.off('contentMousedown.kinetic');
	            this.off('contentTouchstart.kinetic');
	        } else {
	            this.off('mousedown.kinetic');
	            this.off('touchstart.kinetic');
	        }
	    };

	    Kinetic.Factory.addGetterSetter(Kinetic.Node, 'dragBoundFunc');

	    /**
	     * get/set drag bound function.  This is used to override the default
	     *  drag and drop position
	     * @name dragBoundFunc
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {Function} dragBoundFunc
	     * @returns {Function}
	     * @example
	     * // get drag bound function
	     * var dragBoundFunc = node.dragBoundFunc();
	     *
	     * // create vertical drag and drop
	     * node.dragBoundFunc(function(){
	     *   return {
	     *     x: this.getAbsolutePosition().x,
	     *     y: pos.y
	     *   };
	     * });
	     */

	    Kinetic.Factory.addGetter(Kinetic.Node, 'draggable', false);
	    Kinetic.Factory.addOverloadedGetterSetter(Kinetic.Node, 'draggable');

	     /**
	     * get/set draggable flag
	     * @name draggable
	     * @method
	     * @memberof Kinetic.Node.prototype
	     * @param {Boolean} draggable
	     * @returns {Boolean}
	     * @example
	     * // get draggable flag
	     * var draggable = node.draggable();
	     *
	     * // enable drag and drop
	     * node.draggable(true);
	     *
	     * // disable drag and drop
	     * node.draggable(false);
	     */

	    var html = Kinetic.document.documentElement;
	    html.addEventListener('mouseup', Kinetic.DD._endDragBefore, true);
	    html.addEventListener('touchend', Kinetic.DD._endDragBefore, true);

	    html.addEventListener('mouseup', Kinetic.DD._endDragAfter, false);
	    html.addEventListener('touchend', Kinetic.DD._endDragAfter, false);

	})();
	;(function() {
	    Kinetic.Util.addMethods(Kinetic.Container, {
	        __init: function(config) {
	            this.children = new Kinetic.Collection();
	            Kinetic.Node.call(this, config);
	        },
	        /**
	         * returns a {@link Kinetic.Collection} of direct descendant nodes
	         * @method
	         * @memberof Kinetic.Container.prototype
	         * @param {Function} [filterFunc] filter function
	         * @returns {Kinetic.Collection}
	         * @example
	         * // get all children
	         * var children = layer.getChildren();
	         *
	         * // get only circles
	         * var circles = layer.getChildren(function(node){
	         *    return node.getClassName() === 'Circle';
	         * });
	         */
	        getChildren: function(filterFunc) {
	            if (!filterFunc) {
	                return this.children;
	            } else {
	                var results = new Kinetic.Collection();
	                this.children.each(function(child){
	                    if (filterFunc(child)) {
	                        results.push(child);
	                    }
	                });
	                return results;
	            }
	        },
	        /**
	         * determine if node has children
	         * @method
	         * @memberof Kinetic.Container.prototype
	         * @returns {Boolean}
	         */
	        hasChildren: function() {
	            return this.getChildren().length > 0;
	        },
	        /**
	         * remove all children
	         * @method
	         * @memberof Kinetic.Container.prototype
	         */
	        removeChildren: function() {
	            var children = Kinetic.Collection.toCollection(this.children);
	            var child;
	            for (var i = 0; i < children.length; i++) {
	                child = children[i];
	                // reset parent to prevent many _setChildrenIndices calls
	                delete child.parent;
	                child.index = 0;
	                if (child.hasChildren()) {
	                    child.removeChildren();
	                }
	                child.remove();
	            }
	            children = null;
	            this.children = new Kinetic.Collection();
	            return this;
	        },
	        /**
	         * destroy all children
	         * @method
	         * @memberof Kinetic.Container.prototype
	         */
	        destroyChildren: function() {
	           var children = Kinetic.Collection.toCollection(this.children);
	            var child;
	            for (var i = 0; i < children.length; i++) {
	                child = children[i];
	                // reset parent to prevent many _setChildrenIndices calls
	                delete child.parent;
	                child.index = 0;
	                child.destroy();
	            }
	            children = null;
	            this.children = new Kinetic.Collection();
	            return this;
	        },
	        /**
	         * Add node or nodes to container.
	         * @method
	         * @memberof Kinetic.Container.prototype
	         * @param {...Kinetic.Node} child
	         * @returns {Container}
	         * @example
	         * layer.add(shape1, shape2, shape3);
	         */
	        add: function(child) {
	            if (arguments.length > 1) {
	                for (var i = 0; i < arguments.length; i++) {
	                    this.add(arguments[i]);
	                }
	                return this;
	            }
	            if (child.getParent()) {
	                child.moveTo(this);
	                return this;
	            }
	            var children = this.children;
	            this._validateAdd(child);
	            child.index = children.length;
	            child.parent = this;
	            children.push(child);
	            this._fire('add', {
	                child: child
	            });

	            // chainable
	            return this;
	        },
	        destroy: function() {
	            // destroy children
	            if (this.hasChildren()) {
	                this.destroyChildren();
	            }
	            // then destroy self
	            Kinetic.Node.prototype.destroy.call(this);
	        },
	        /**
	         * return a {@link Kinetic.Collection} of nodes that match the selector.  Use '#' for id selections
	         * and '.' for name selections.  You can also select by type or class name. Pass multiple selectors
	         * separated by a space.
	         * @method
	         * @memberof Kinetic.Container.prototype
	         * @param {String} selector
	         * @returns {Collection}
	         * @example
	         * // select node with id foo
	         * var node = stage.find('#foo');
	         *
	         * // select nodes with name bar inside layer
	         * var nodes = layer.find('.bar');
	         *
	         * // select all groups inside layer
	         * var nodes = layer.find('Group');
	         *
	         * // select all rectangles inside layer
	         * var nodes = layer.find('Rect');
	         *
	         * // select node with an id of foo or a name of bar inside layer
	         * var nodes = layer.find('#foo, .bar');
	         */
	        find: function(selector) {
	            var retArr = [],
	                selectorArr = selector.replace(/ /g, '').split(','),
	                len = selectorArr.length,
	                n, i, sel, arr, node, children, clen;

	            for (n = 0; n < len; n++) {
	                sel = selectorArr[n];

	                // id selector
	                if(sel.charAt(0) === '#') {
	                    node = this._getNodeById(sel.slice(1));
	                    if(node) {
	                        retArr.push(node);
	                    }
	                }
	                // name selector
	                else if(sel.charAt(0) === '.') {
	                    arr = this._getNodesByName(sel.slice(1));
	                    retArr = retArr.concat(arr);
	                }
	                // unrecognized selector, pass to children
	                else {
	                    children = this.getChildren();
	                    clen = children.length;
	                    for(i = 0; i < clen; i++) {
	                        retArr = retArr.concat(children[i]._get(sel));
	                    }
	                }
	            }

	            return Kinetic.Collection.toCollection(retArr);
	        },
	        _getNodeById: function(key) {
	            var node = Kinetic.ids[key];

	            if(node !== undefined && this.isAncestorOf(node)) {
	                return node;
	            }
	            return null;
	        },
	        _getNodesByName: function(key) {
	            var arr = Kinetic.names[key] || [];
	            return this._getDescendants(arr);
	        },
	        _get: function(selector) {
	            var retArr = Kinetic.Node.prototype._get.call(this, selector);
	            var children = this.getChildren();
	            var len = children.length;
	            for(var n = 0; n < len; n++) {
	                retArr = retArr.concat(children[n]._get(selector));
	            }
	            return retArr;
	        },
	        // extenders
	        toObject: function() {
	            var obj = Kinetic.Node.prototype.toObject.call(this);

	            obj.children = [];

	            var children = this.getChildren();
	            var len = children.length;
	            for(var n = 0; n < len; n++) {
	                var child = children[n];
	                obj.children.push(child.toObject());
	            }

	            return obj;
	        },
	        _getDescendants: function(arr) {
	            var retArr = [];
	            var len = arr.length;
	            for(var n = 0; n < len; n++) {
	                var node = arr[n];
	                if(this.isAncestorOf(node)) {
	                    retArr.push(node);
	                }
	            }

	            return retArr;
	        },
	        /**
	         * determine if node is an ancestor
	         * of descendant
	         * @method
	         * @memberof Kinetic.Container.prototype
	         * @param {Kinetic.Node} node
	         */
	        isAncestorOf: function(node) {
	            var parent = node.getParent();
	            while(parent) {
	                if(parent._id === this._id) {
	                    return true;
	                }
	                parent = parent.getParent();
	            }

	            return false;
	        },
	        clone: function(obj) {
	            // call super method
	            var node = Kinetic.Node.prototype.clone.call(this, obj);

	            this.getChildren().each(function(no) {
	                node.add(no.clone());
	            });
	            return node;
	        },
	        /**
	         * get all shapes that intersect a point.  Note: because this method must clear a temporary
	         * canvas and redraw every shape inside the container, it should only be used for special sitations
	         * because it performs very poorly.  Please use the {@link Kinetic.Stage#getIntersection} method if at all possible
	         * because it performs much better
	         * @method
	         * @memberof Kinetic.Container.prototype
	         * @param {Object} pos
	         * @param {Number} pos.x
	         * @param {Number} pos.y
	         * @returns {Array} array of shapes
	         */
	        getAllIntersections: function(pos) {
	            var arr = [];

	            this.find('Shape').each(function(shape) {
	                if(shape.isVisible() && shape.intersects(pos)) {
	                    arr.push(shape);
	                }
	            });

	            return arr;
	        },
	        _setChildrenIndices: function() {
	            this.children.each(function(child, n) {
	                child.index = n;
	            });
	        },
	        drawScene: function(can, top) {
	            var layer = this.getLayer(),
	                canvas = can || (layer && layer.getCanvas()),
	                context = canvas && canvas.getContext(),
	                cachedCanvas = this._cache.canvas,
	                cachedSceneCanvas = cachedCanvas && cachedCanvas.scene;

	            if (this.isVisible()) {
	                if (cachedSceneCanvas) {
	                    this._drawCachedSceneCanvas(context);
	                }
	                else {
	                    this._drawChildren(canvas, 'drawScene', top);
	                }
	            }
	            return this;
	        },
	        drawHit: function(can, top) {
	            var layer = this.getLayer(),
	                canvas = can || (layer && layer.hitCanvas),
	                context = canvas && canvas.getContext(),
	                cachedCanvas = this._cache.canvas,
	                cachedHitCanvas = cachedCanvas && cachedCanvas.hit;

	            if (this.shouldDrawHit(canvas)) {
	                if (layer) {
	                    layer.clearHitCache();
	                }
	                if (cachedHitCanvas) {
	                    this._drawCachedHitCanvas(context);
	                }
	                else {
	                    this._drawChildren(canvas, 'drawHit', top);
	                }
	            }
	            return this;
	        },
	        _drawChildren: function(canvas, drawMethod, top) {
	            var layer = this.getLayer(),
	                context = canvas && canvas.getContext(),
	                clipWidth = this.getClipWidth(),
	                clipHeight = this.getClipHeight(),
	                hasClip = clipWidth && clipHeight,
	                clipX, clipY;

	            if (hasClip && layer) {
	                clipX = this.getClipX();
	                clipY = this.getClipY();

	                context.save();
	                layer._applyTransform(this, context);
	                context.beginPath();
	                context.rect(clipX, clipY, clipWidth, clipHeight);
	                context.clip();
	                context.reset();
	            }

	            this.children.each(function(child) {
	                child[drawMethod](canvas, top);
	            });

	            if (hasClip) {
	                context.restore();
	            }
	        },
	        shouldDrawHit: function(canvas) {
	            var layer = this.getLayer();
	            return  (canvas && canvas.isCache) || (layer && layer.hitGraphEnabled())
	                && this.isVisible() && !Kinetic.isDragging();
	        }
	    });

	    Kinetic.Util.extend(Kinetic.Container, Kinetic.Node);
	    // deprecated methods
	    Kinetic.Container.prototype.get = Kinetic.Container.prototype.find;

	    // add getters setters
	    Kinetic.Factory.addComponentsGetterSetter(Kinetic.Container, 'clip', ['x', 'y', 'width', 'height']);
	    /**
	     * get/set clip
	     * @method
	     * @name clip
	     * @memberof Kinetic.Container.prototype
	     * @param {Object} clip
	     * @param {Number} clip.x
	     * @param {Number} clip.y
	     * @param {Number} clip.width
	     * @param {Number} clip.height
	     * @returns {Object}
	     * @example
	     * // get clip
	     * var clip = container.clip();
	     *
	     * // set clip
	     * container.setClip({
	     *   x: 20,
	     *   y: 20,
	     *   width: 20,
	     *   height: 20
	     * });
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Container, 'clipX');
	    /**
	     * get/set clip x
	     * @name clipX
	     * @method
	     * @memberof Kinetic.Container.prototype
	     * @param {Number} x
	     * @returns {Number}
	     * @example
	     * // get clip x
	     * var clipX = container.clipX();
	     *
	     * // set clip x
	     * container.clipX(10);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Container, 'clipY');
	    /**
	     * get/set clip y
	     * @name clipY
	     * @method
	     * @memberof Kinetic.Container.prototype
	     * @param {Number} y
	     * @returns {Number}
	     * @example
	     * // get clip y
	     * var clipY = container.clipY();
	     *
	     * // set clip y
	     * container.clipY(10);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Container, 'clipWidth');
	    /**
	     * get/set clip width
	     * @name clipWidth
	     * @method
	     * @memberof Kinetic.Container.prototype
	     * @param {Number} width
	     * @returns {Number}
	     * @example
	     * // get clip width
	     * var clipWidth = container.clipWidth();
	     *
	     * // set clip width
	     * container.clipWidth(100);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Container, 'clipHeight');
	    /**
	     * get/set clip height
	     * @name clipHeight
	     * @method
	     * @memberof Kinetic.Container.prototype
	     * @param {Number} height
	     * @returns {Number}
	     * @example
	     * // get clip height
	     * var clipHeight = container.clipHeight();
	     *
	     * // set clip height
	     * container.clipHeight(100);
	     */

	    Kinetic.Collection.mapMethods(Kinetic.Container);
	})();
	;(function() {
	    var HAS_SHADOW = 'hasShadow';

	    function _fillFunc(context) {
	        context.fill();
	    }
	    function _strokeFunc(context) {
	        context.stroke();
	    }
	    function _fillFuncHit(context) {
	        context.fill();
	    }
	    function _strokeFuncHit(context) {
	        context.stroke();
	    }

	    function _clearHasShadowCache() {
	        this._clearCache(HAS_SHADOW);
	    }

	    Kinetic.Util.addMethods(Kinetic.Shape, {
	        __init: function(config) {
	            this.nodeType = 'Shape';
	            this._fillFunc = _fillFunc;
	            this._strokeFunc = _strokeFunc;
	            this._fillFuncHit = _fillFuncHit;
	            this._strokeFuncHit = _strokeFuncHit;

	            // set colorKey
	            var shapes = Kinetic.shapes;
	            var key;

	            while(true) {
	                key = Kinetic.Util.getRandomColor();
	                if(key && !( key in shapes)) {
	                    break;
	                }
	            }

	            this.colorKey = key;
	            shapes[key] = this;

	            // call super constructor
	            Kinetic.Node.call(this, config);

	            this.on('shadowColorChange.kinetic shadowBlurChange.kinetic shadowOffsetChange.kinetic shadowOpacityChange.kinetic shadowEnabledChange.kinetic', _clearHasShadowCache);
	        },
	        hasChildren: function() {
	            return false;
	        },
	        getChildren: function() {
	            return [];
	        },
	        /**
	         * get canvas context tied to the layer
	         * @method
	         * @memberof Kinetic.Shape.prototype
	         * @returns {Kinetic.Context}
	         */
	        getContext: function() {
	            return this.getLayer().getContext();
	        },
	        /**
	         * get canvas renderer tied to the layer.  Note that this returns a canvas renderer, not a canvas element
	         * @method
	         * @memberof Kinetic.Shape.prototype
	         * @returns {Kinetic.Canvas}
	         */
	        getCanvas: function() {
	            return this.getLayer().getCanvas();
	        },
	        /**
	         * returns whether or not a shadow will be rendered
	         * @method
	         * @memberof Kinetic.Shape.prototype
	         * @returns {Boolean}
	         */
	        hasShadow: function() {
	            return this._getCache(HAS_SHADOW, this._hasShadow);
	        },
	        _hasShadow: function() {
	            return this.getShadowEnabled() && (this.getShadowOpacity() !== 0 && !!(this.getShadowColor() || this.getShadowBlur() || this.getShadowOffsetX() || this.getShadowOffsetY()));
	        },
	        /**
	         * returns whether or not the shape will be filled
	         * @method
	         * @memberof Kinetic.Shape.prototype
	         * @returns {Boolean}
	         */
	        hasFill: function() {
	            return !!(this.getFill() || this.getFillPatternImage() || this.getFillLinearGradientColorStops() || this.getFillRadialGradientColorStops());
	        },
	        /**
	         * returns whether or not the shape will be stroked
	         * @method
	         * @memberof Kinetic.Shape.prototype
	         * @returns {Boolean}
	         */
	        hasStroke: function() {
	            return !!(this.stroke() || this.strokeRed() || this.strokeGreen() || this.strokeBlue());
	        },
	        /**
	         * determines if point is in the shape, regardless if other shapes are on top of it.  Note: because
	         *  this method clears a temporary canvas and then redraws the shape, it performs very poorly if executed many times
	         *  consecutively.  Please use the {@link Kinetic.Stage#getIntersection} method if at all possible
	         *  because it performs much better
	         * @method
	         * @memberof Kinetic.Shape.prototype
	         * @param {Object} point 
	         * @param {Number} point.x
	         * @param {Number} point.y
	         * @returns {Boolean}
	         */
	        intersects: function(point) {
	            var stage = this.getStage(),
	                bufferHitCanvas = stage.bufferHitCanvas,
	                p;

	            bufferHitCanvas.getContext().clear();
	            this.drawScene(bufferHitCanvas);
	            p = bufferHitCanvas.context.getImageData(Math.round(point.x), Math.round(point.y), 1, 1).data;
	            return p[3] > 0;
	        },
	        // extends Node.prototype.destroy 
	        destroy: function() {
	            Kinetic.Node.prototype.destroy.call(this);
	            delete Kinetic.shapes[this.colorKey];
	        },
	        _useBufferCanvas: function() {
	            return (this.hasShadow() || this.getAbsoluteOpacity() !== 1) && this.hasFill() && this.hasStroke() && this.getStage();
	        },
	        drawScene: function(can, top) {
	            var layer = this.getLayer(),
	                canvas = can || layer.getCanvas(),
	                context = canvas.getContext(),
	                cachedCanvas = this._cache.canvas,
	                drawFunc = this.sceneFunc(),
	                hasShadow = this.hasShadow(),
	                stage, bufferCanvas, bufferContext;

	            if(this.isVisible()) {
	                if (cachedCanvas) {
	                    this._drawCachedSceneCanvas(context);
	                }
	                else if (drawFunc) {
	                    context.save();
	                    // if buffer canvas is needed
	                    if (this._useBufferCanvas()) {
	                        stage = this.getStage();
	                        bufferCanvas = stage.bufferCanvas;
	                        bufferContext = bufferCanvas.getContext();
	                        bufferContext.clear();
	                        bufferContext.save();
	                        bufferContext._applyLineJoin(this);
	                        // layer might be undefined if we are using cache before adding to layer
	                        if (layer) {
	                            layer._applyTransform(this, bufferContext, top);
	                        } else {
	                            var m = this.getAbsoluteTransform(top).getMatrix();
	                            context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
	                        }
	                     
	                        drawFunc.call(this, bufferContext);
	                        bufferContext.restore();

	                        if (hasShadow && !canvas.hitCanvas) {
	                            context.save();
	                            context._applyShadow(this);
	                            context.drawImage(bufferCanvas._canvas, 0, 0);
	                            context.restore();
	                        }

	                        context._applyOpacity(this);
	                        context.drawImage(bufferCanvas._canvas, 0, 0);
	                    }
	                    // if buffer canvas is not needed
	                    else {
	                        context._applyLineJoin(this);
	                        // layer might be undefined if we are using cache before adding to layer
	                        if (layer) {
	                            layer._applyTransform(this, context, top);
	                        } else {
	                            var o = this.getAbsoluteTransform(top).getMatrix();
	                            context.transform(o[0], o[1], o[2], o[3], o[4], o[5]);
	                        }
	               
	                        if (hasShadow && !canvas.hitCanvas) {
	                            context.save();
	                            context._applyShadow(this);
	                            drawFunc.call(this, context);
	                            context.restore();
	                        }

	                        context._applyOpacity(this);
	                        drawFunc.call(this, context);
	                    }
	                    context.restore();
	                }
	            }

	            return this;
	        },
	        drawHit: function(can, top) {
	            var layer = this.getLayer(),
	                canvas = can || layer.hitCanvas,
	                context = canvas.getContext(),
	                drawFunc = this.hitFunc() || this.sceneFunc(),
	                cachedCanvas = this._cache.canvas,
	                cachedHitCanvas = cachedCanvas && cachedCanvas.hit;

	            if(this.shouldDrawHit(canvas)) {
	                if (layer) {
	                    layer.clearHitCache();
	                }
	                if (cachedHitCanvas) {
	                    this._drawCachedHitCanvas(context);
	                }
	                else if (drawFunc) {
	                    context.save();
	                    context._applyLineJoin(this);
	                    if (layer) {
	                        layer._applyTransform(this, context, top);
	                    } else {
	                        var m = this.getAbsoluteTransform(top).getMatrix();
	                        context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
	                    }
	                   
	                    drawFunc.call(this, context);
	                    context.restore();
	                }
	                
	            }

	            return this;
	        },
	        /**
	        * draw hit graph using the cached scene canvas
	        * @method
	        * @memberof Kinetic.Shape.prototype
	        * @param {Integer} alphaThreshold alpha channel threshold that determines whether or not
	        *  a pixel should be drawn onto the hit graph.  Must be a value between 0 and 255.  
	        *  The default is 0
	        * @returns {Kinetic.Shape}
	        * @example
	        * shape.cache();
	        * shape.drawHitFromCache();
	        */
	        drawHitFromCache: function(alphaThreshold) {
	            var threshold = alphaThreshold || 0,
	                cachedCanvas = this._cache.canvas,
	                sceneCanvas = this._getCachedSceneCanvas(),
	                sceneContext = sceneCanvas.getContext(),
	                hitCanvas = cachedCanvas.hit,
	                hitContext = hitCanvas.getContext(),
	                width = sceneCanvas.getWidth(),
	                height = sceneCanvas.getHeight(),
	                sceneImageData, sceneData, hitImageData, hitData, len, rgbColorKey, i, alpha;

	            hitContext.clear();

	            try {
	                sceneImageData = sceneContext.getImageData(0, 0, width, height);
	                sceneData = sceneImageData.data;
	                hitImageData = hitContext.getImageData(0, 0, width, height);
	                hitData = hitImageData.data;
	                len = sceneData.length;
	                rgbColorKey = Kinetic.Util._hexToRgb(this.colorKey);

	                // replace non transparent pixels with color key
	                for(i = 0; i < len; i += 4) {
	                    alpha = sceneData[i + 3];
	                    if (alpha > threshold) {
	                        hitData[i] = rgbColorKey.r;
	                        hitData[i + 1] = rgbColorKey.g;
	                        hitData[i + 2] = rgbColorKey.b;
	                        hitData[i + 3] = 255;
	                    }
	                }

	                hitContext.putImageData(hitImageData, 0, 0);
	            }
	            catch(e) {
	                Kinetic.Util.warn('Unable to draw hit graph from cached scene canvas. ' + e.message);
	            }

	            return this;
	        }
	    });
	    Kinetic.Util.extend(Kinetic.Shape, Kinetic.Node);

	    // add getters and setters
	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'stroke');

	    /**
	     * get/set stroke color
	     * @name stroke
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {String} color
	     * @returns {String}
	     * @example
	     * // get stroke color
	     * var stroke = shape.stroke();
	     *
	     * // set stroke color with color string
	     * shape.stroke('green');
	     *
	     * // set stroke color with hex
	     * shape.stroke('#00ff00');
	     *
	     * // set stroke color with rgb
	     * shape.stroke('rgb(0,255,0)');
	     *
	     * // set stroke color with rgba and make it 50% opaque
	     * shape.stroke('rgba(0,255,0,0.5');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'strokeRed', 0, Kinetic.Validators.RGBComponent);

	    /**
	     * get/set stroke red component
	     * @name strokeRed
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Integer} red
	     * @returns {Integer}
	     * @example
	     * // get stroke red component
	     * var strokeRed = shape.strokeRed();
	     *
	     * // set stroke red component
	     * shape.strokeRed(0);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'strokeGreen', 0, Kinetic.Validators.RGBComponent);

	    /**
	     * get/set stroke green component
	     * @name strokeGreen
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Integer} green
	     * @returns {Integer}
	     * @example
	     * // get stroke green component
	     * var strokeGreen = shape.strokeGreen();
	     *
	     * // set stroke green component
	     * shape.strokeGreen(255);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'strokeBlue', 0, Kinetic.Validators.RGBComponent);

	    /**
	     * get/set stroke blue component
	     * @name strokeBlue
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Integer} blue
	     * @returns {Integer}
	     * @example
	     * // get stroke blue component
	     * var strokeBlue = shape.strokeBlue();
	     *
	     * // set stroke blue component
	     * shape.strokeBlue(0);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'strokeAlpha', 1, Kinetic.Validators.alphaComponent);

	    /**
	     * get/set stroke alpha component.  Alpha is a real number between 0 and 1.  The default
	     *  is 1.
	     * @name strokeAlpha
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} alpha
	     * @returns {Number}
	     * @example
	     * // get stroke alpha component
	     * var strokeAlpha = shape.strokeAlpha();
	     *
	     * // set stroke alpha component
	     * shape.strokeAlpha(0.5);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'strokeWidth', 2);

	    /**
	     * get/set stroke width
	     * @name strokeWidth
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} strokeWidth
	     * @returns {Number}
	     * @example
	     * // get stroke width
	     * var strokeWidth = shape.strokeWidth();
	     *
	     * // set stroke width
	     * shape.strokeWidth();
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'lineJoin');

	    /**
	     * get/set line join.  Can be miter, round, or bevel.  The
	     *  default is miter
	     * @name lineJoin
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {String} lineJoin
	     * @returns {String}
	     * @example
	     * // get line join
	     * var lineJoin = shape.lineJoin();
	     *
	     * // set line join
	     * shape.lineJoin('round');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'lineCap');

	    /**
	     * get/set line cap.  Can be butt, round, or square
	     * @name lineCap
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {String} lineCap
	     * @returns {String}
	     * @example
	     * // get line cap
	     * var lineCap = shape.lineCap();
	     *
	     * // set line cap
	     * shape.lineCap('round');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'sceneFunc');

	    /**
	     * get/set scene draw function
	     * @name sceneFunc
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Function} drawFunc drawing function
	     * @returns {Function}
	     * @example
	     * // get scene draw function
	     * var sceneFunc = shape.sceneFunc();
	     *
	     * // set scene draw function
	     * shape.sceneFunc(function(context) {
	     *   context.beginPath();
	     *   context.rect(0, 0, this.width(), this.height());
	     *   context.closePath();
	     *   context.fillStrokeShape(this);
	     * });
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'hitFunc');

	    /**
	     * get/set hit draw function
	     * @name hitFunc
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Function} drawFunc drawing function
	     * @returns {Function}
	     * @example
	     * // get hit draw function
	     * var hitFunc = shape.hitFunc();
	     *
	     * // set hit draw function
	     * shape.hitFunc(function(context) {
	     *   context.beginPath();
	     *   context.rect(0, 0, this.width(), this.height());
	     *   context.closePath();
	     *   context.fillStrokeShape(this);
	     * });
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'dash');

	    /**
	     * get/set dash array for stroke.
	     * @name dash
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Array} dash
	     * @returns {Array}
	     * @example
	     *  // apply dashed stroke that is 10px long and 5 pixels apart
	     *  line.dash([10, 5]);
	     *  
	     *  // apply dashed stroke that is made up of alternating dashed 
	     *  // lines that are 10px long and 20px apart, and dots that have 
	     *  // a radius of 5px and are 20px apart
	     *  line.dash([10, 20, 0.001, 20]);
	     */


	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'shadowColor');

	    /**
	     * get/set shadow color
	     * @name shadowColor
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {String} color
	     * @returns {String}
	     * @example
	     * // get shadow color
	     * var shadow = shape.shadowColor();
	     *
	     * // set shadow color with color string
	     * shape.shadowColor('green');
	     *
	     * // set shadow color with hex
	     * shape.shadowColor('#00ff00');
	     *
	     * // set shadow color with rgb
	     * shape.shadowColor('rgb(0,255,0)');
	     *
	     * // set shadow color with rgba and make it 50% opaque
	     * shape.shadowColor('rgba(0,255,0,0.5');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'shadowRed', 0, Kinetic.Validators.RGBComponent);

	    /**
	     * get/set shadow red component
	     * @name shadowRed
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Integer} red
	     * @returns {Integer}
	     * @example
	     * // get shadow red component
	     * var shadowRed = shape.shadowRed();
	     *
	     * // set shadow red component
	     * shape.shadowRed(0);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'shadowGreen', 0, Kinetic.Validators.RGBComponent);

	    /**
	     * get/set shadow green component
	     * @name shadowGreen
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Integer} green
	     * @returns {Integer}
	     * @example
	     * // get shadow green component
	     * var shadowGreen = shape.shadowGreen();
	     *
	     * // set shadow green component
	     * shape.shadowGreen(255);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'shadowBlue', 0, Kinetic.Validators.RGBComponent);

	    /**
	     * get/set shadow blue component
	     * @name shadowBlue
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Integer} blue
	     * @returns {Integer}
	     * @example
	     * // get shadow blue component
	     * var shadowBlue = shape.shadowBlue();
	     *
	     * // set shadow blue component
	     * shape.shadowBlue(0);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'shadowAlpha', 1, Kinetic.Validators.alphaComponent);

	    /**
	     * get/set shadow alpha component.  Alpha is a real number between 0 and 1.  The default
	     *  is 1.
	     * @name shadowAlpha
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} alpha
	     * @returns {Number}
	     * @example
	     * // get shadow alpha component
	     * var shadowAlpha = shape.shadowAlpha();
	     *
	     * // set shadow alpha component
	     * shape.shadowAlpha(0.5);
	     */
	     
	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'shadowBlur');

	    /**
	     * get/set shadow blur
	     * @name shadowBlur
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} blur
	     * @returns {Number}
	     * @example
	     * // get shadow blur
	     * var shadowBlur = shape.shadowBlur();
	     *
	     * // set shadow blur
	     * shape.shadowBlur(10);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'shadowOpacity');

	    /**
	     * get/set shadow opacity.  must be a value between 0 and 1
	     * @name shadowOpacity
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} opacity
	     * @returns {Number}
	     * @example
	     * // get shadow opacity
	     * var shadowOpacity = shape.shadowOpacity();
	     *
	     * // set shadow opacity
	     * shape.shadowOpacity(0.5);
	     */

	    Kinetic.Factory.addComponentsGetterSetter(Kinetic.Shape, 'shadowOffset', ['x', 'y']);

	    /**
	     * get/set shadow offset
	     * @name shadowOffset
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Object} offset
	     * @param {Number} offset.x
	     * @param {Number} offset.y
	     * @returns {Object}
	     * @example
	     * // get shadow offset
	     * var shadowOffset = shape.shadowOffset();
	     *
	     * // set shadow offset
	     * shape.shadowOffset({
	     *   x: 20
	     *   y: 10
	     * });
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'shadowOffsetX', 0);

	     /**
	     * get/set shadow offset x
	     * @name shadowOffsetX
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} x
	     * @returns {Number}
	     * @example
	     * // get shadow offset x
	     * var shadowOffsetX = shape.shadowOffsetX();
	     *
	     * // set shadow offset x
	     * shape.shadowOffsetX(5);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'shadowOffsetY', 0);

	     /**
	     * get/set shadow offset y
	     * @name shadowOffsetY
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} y
	     * @returns {Number}
	     * @example
	     * // get shadow offset y
	     * var shadowOffsetY = shape.shadowOffsetY();
	     *
	     * // set shadow offset y
	     * shape.shadowOffsetY(5);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillPatternImage');

	    /**
	     * get/set fill pattern image
	     * @name fillPatternImage
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Image} image object
	     * @returns {Image}
	     * @example
	     * // get fill pattern image
	     * var fillPatternImage = shape.fillPatternImage();
	     *
	     * // set fill pattern image
	     * var imageObj = new Image();
	     * imageObj.onload = function() {
	     *   shape.fillPatternImage(imageObj);
	     * };
	     * imageObj.src = 'path/to/image/jpg';
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fill');

	    /**
	     * get/set fill color
	     * @name fill
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {String} color
	     * @returns {String}
	     * @example
	     * // get fill color
	     * var fill = shape.fill();
	     *
	     * // set fill color with color string
	     * shape.fill('green');
	     *
	     * // set fill color with hex
	     * shape.fill('#00ff00');
	     *
	     * // set fill color with rgb
	     * shape.fill('rgb(0,255,0)');
	     *
	     * // set fill color with rgba and make it 50% opaque
	     * shape.fill('rgba(0,255,0,0.5');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillRed', 0, Kinetic.Validators.RGBComponent);

	    /**
	     * get/set fill red component
	     * @name fillRed
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Integer} red
	     * @returns {Integer}
	     * @example
	     * // get fill red component
	     * var fillRed = shape.fillRed();
	     *
	     * // set fill red component
	     * shape.fillRed(0);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillGreen', 0, Kinetic.Validators.RGBComponent);

	    /**
	     * get/set fill green component
	     * @name fillGreen
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Integer} green
	     * @returns {Integer}
	     * @example
	     * // get fill green component
	     * var fillGreen = shape.fillGreen();
	     *
	     * // set fill green component
	     * shape.fillGreen(255);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillBlue', 0, Kinetic.Validators.RGBComponent);

	    /**
	     * get/set fill blue component
	     * @name fillBlue
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Integer} blue
	     * @returns {Integer}
	     * @example
	     * // get fill blue component
	     * var fillBlue = shape.fillBlue();
	     *
	     * // set fill blue component
	     * shape.fillBlue(0);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillAlpha', 1, Kinetic.Validators.alphaComponent);

	    /**
	     * get/set fill alpha component.  Alpha is a real number between 0 and 1.  The default
	     *  is 1.
	     * @name fillAlpha
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} alpha
	     * @returns {Number}
	     * @example
	     * // get fill alpha component
	     * var fillAlpha = shape.fillAlpha();
	     *
	     * // set fill alpha component
	     * shape.fillAlpha(0.5);
	     */


	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillPatternX', 0);

	    /**
	     * get/set fill pattern x
	     * @name fillPatternX
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} x
	     * @returns {Number}
	     * @example
	     * // get fill pattern x
	     * var fillPatternX = shape.fillPatternX();
	     * 
	     * // set fill pattern x
	     * shape.fillPatternX(20);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillPatternY', 0);

	    /**
	     * get/set fill pattern y
	     * @name fillPatternY
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} y
	     * @returns {Number}
	     * @example
	     * // get fill pattern y
	     * var fillPatternY = shape.fillPatternY();
	     * 
	     * // set fill pattern y
	     * shape.fillPatternY(20);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillLinearGradientColorStops');

	    /**
	     * get/set fill linear gradient color stops
	     * @name fillLinearGradientColorStops
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Array} colorStops
	     * @returns {Array} colorStops
	     * @example
	     * // get fill linear gradient color stops
	     * var colorStops = shape.fillLinearGradientColorStops();
	     *
	     * // create a linear gradient that starts with red, changes to blue 
	     * // halfway through, and then changes to green
	     * shape.fillLinearGradientColorStops(0, 'red', 0.5, 'blue', 1, 'green');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillRadialGradientStartRadius', 0);

	    /**
	     * get/set fill radial gradient start radius
	     * @name fillRadialGradientStartRadius
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} radius
	     * @returns {Number}
	     * @example
	     * // get radial gradient start radius
	     * var startRadius = shape.fillRadialGradientStartRadius();
	     *
	     * // set radial gradient start radius
	     * shape.fillRadialGradientStartRadius(0);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillRadialGradientEndRadius', 0);

	    /**
	     * get/set fill radial gradient end radius
	     * @name fillRadialGradientEndRadius
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} radius
	     * @returns {Number}
	     * @example
	     * // get radial gradient end radius
	     * var endRadius = shape.fillRadialGradientEndRadius();
	     *
	     * // set radial gradient end radius
	     * shape.fillRadialGradientEndRadius(100);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillRadialGradientColorStops');

	    /**
	     * get/set fill radial gradient color stops
	     * @name fillRadialGradientColorStops
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} colorStops
	     * @returns {Array}
	     * @example
	     * // get fill radial gradient color stops
	     * var colorStops = shape.fillRadialGradientColorStops();
	     *
	     * // create a radial gradient that starts with red, changes to blue 
	     * // halfway through, and then changes to green
	     * shape.fillRadialGradientColorStops(0, 'red', 0.5, 'blue', 1, 'green');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillPatternRepeat', 'repeat');

	    /**
	     * get/set fill pattern repeat.  Can be 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'.  The default is 'repeat'
	     * @name fillPatternRepeat
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {String} repeat
	     * @returns {String}
	     * @example
	     * // get fill pattern repeat
	     * var repeat = shape.fillPatternRepeat();
	     *
	     * // repeat pattern in x direction only
	     * shape.fillPatternRepeat('repeat-x');
	     *
	     * // do not repeat the pattern
	     * shape.fillPatternRepeat('no repeat');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillEnabled', true);

	    /**
	     * get/set fill enabled flag
	     * @name fillEnabled
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Boolean} enabled
	     * @returns {Boolean}
	     * @example
	     * // get fill enabled flag
	     * var fillEnabled = shape.fillEnabled();
	     *
	     * // disable fill
	     * shape.fillEnabled(false);
	     *
	     * // enable fill
	     * shape.fillEnabled(true);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'strokeEnabled', true);

	    /**
	     * get/set stroke enabled flag
	     * @name strokeEnabled
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Boolean} enabled
	     * @returns {Boolean}
	     * @example
	     * // get stroke enabled flag
	     * var strokeEnabled = shape.strokeEnabled();
	     *
	     * // disable stroke
	     * shape.strokeEnabled(false);
	     *
	     * // enable stroke
	     * shape.strokeEnabled(true);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'shadowEnabled', true);

	    /**
	     * get/set shadow enabled flag
	     * @name shadowEnabled
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Boolean} enabled
	     * @returns {Boolean}
	     * @example
	     * // get shadow enabled flag
	     * var shadowEnabled = shape.shadowEnabled();
	     *
	     * // disable shadow
	     * shape.shadowEnabled(false);
	     *
	     * // enable shadow
	     * shape.shadowEnabled(true);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'dashEnabled', true);

	    /**
	     * get/set dash enabled flag
	     * @name dashEnabled
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Boolean} enabled
	     * @returns {Boolean}
	     * @example
	     * // get dash enabled flag
	     * var dashEnabled = shape.dashEnabled();
	     *
	     * // disable dash
	     * shape.dashEnabled(false);
	     *
	     * // enable dash
	     * shape.dashEnabled(true);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'strokeScaleEnabled', true);

	    /**
	     * get/set strokeScale enabled flag
	     * @name strokeScaleEnabled
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Boolean} enabled
	     * @returns {Boolean}
	     * @example
	     * // get stroke scale enabled flag
	     * var strokeScaleEnabled = shape.strokeScaleEnabled();
	     *
	     * // disable stroke scale
	     * shape.strokeScaleEnabled(false);
	     *
	     * // enable stroke scale
	     * shape.strokeScaleEnabled(true);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillPriority', 'color');

	    /**
	     * get/set fill priority.  can be color, pattern, linear-gradient, or radial-gradient.  The default is color.
	     *   This is handy if you want to toggle between different fill types.
	     * @name fillPriority
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {String} priority
	     * @returns {String}
	     * @example
	     * // get fill priority
	     * var fillPriority = shape.fillPriority();
	     *
	     * // set fill priority
	     * shape.fillPriority('linear-gradient');
	     */

	    Kinetic.Factory.addComponentsGetterSetter(Kinetic.Shape, 'fillPatternOffset', ['x', 'y']);

	    /**
	     * get/set fill pattern offset
	     * @name fillPatternOffset
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Object} offset
	     * @param {Number} offset.x
	     * @param {Number} offset.y
	     * @returns {Object}
	     * @example
	     * // get fill pattern offset
	     * var patternOffset = shape.fillPatternOffset();
	     *
	     * // set fill pattern offset
	     * shape.fillPatternOffset({
	     *   x: 20
	     *   y: 10
	     * });
	     */


	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillPatternOffsetX', 0);
	    /**
	     * get/set fill pattern offset x
	     * @name fillPatternOffsetX
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} x
	     * @returns {Number}
	     * @example
	     * // get fill pattern offset x
	     * var patternOffsetX = shape.fillPatternOffsetX();
	     *
	     * // set fill pattern offset x
	     * shape.fillPatternOffsetX(20);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillPatternOffsetY', 0);
	    /**
	     * get/set fill pattern offset y
	     * @name fillPatternOffsetY
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} y
	     * @returns {Number}
	     * @example
	     * // get fill pattern offset y
	     * var patternOffsetY = shape.fillPatternOffsetY();
	     *
	     * // set fill pattern offset y
	     * shape.fillPatternOffsetY(10);
	     */

	    Kinetic.Factory.addComponentsGetterSetter(Kinetic.Shape, 'fillPatternScale', ['x', 'y']);

	    /**
	     * get/set fill pattern scale
	     * @name fillPatternScale
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Object} scale
	     * @param {Number} scale.x
	     * @param {Number} scale.y
	     * @returns {Object}
	     * @example
	     * // get fill pattern scale
	     * var patternScale = shape.fillPatternScale();
	     *
	     * // set fill pattern scale
	     * shape.fillPatternScale({
	     *   x: 2
	     *   y: 2
	     * });
	     */


	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillPatternScaleX', 1);
	    /**
	     * get/set fill pattern scale x
	     * @name fillPatternScaleX
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} x
	     * @returns {Number}
	     * @example
	     * // get fill pattern scale x
	     * var patternScaleX = shape.fillPatternScaleX();
	     *
	     * // set fill pattern scale x
	     * shape.fillPatternScaleX(2);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillPatternScaleY', 1);
	    /**
	     * get/set fill pattern scale y
	     * @name fillPatternScaleY
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} y
	     * @returns {Number}
	     * @example
	     * // get fill pattern scale y
	     * var patternScaleY = shape.fillPatternScaleY();
	     *
	     * // set fill pattern scale y
	     * shape.fillPatternScaleY(2);
	     */

	    Kinetic.Factory.addComponentsGetterSetter(Kinetic.Shape, 'fillLinearGradientStartPoint', ['x', 'y']);

	    /**
	     * get/set fill linear gradient start point
	     * @name fillLinearGradientStartPoint
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Object} startPoint
	     * @param {Number} startPoint.x
	     * @param {Number} startPoint.y
	     * @returns {Object}
	     * @example
	     * // get fill linear gradient start point
	     * var startPoint = shape.fillLinearGradientStartPoint();
	     *
	     * // set fill linear gradient start point
	     * shape.fillLinearGradientStartPoint({
	     *   x: 20
	     *   y: 10
	     * });
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillLinearGradientStartPointX', 0);
	    /**
	     * get/set fill linear gradient start point x
	     * @name fillLinearGradientStartPointX
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} x
	     * @returns {Number}
	     * @example
	     * // get fill linear gradient start point x
	     * var startPointX = shape.fillLinearGradientStartPointX();
	     *
	     * // set fill linear gradient start point x
	     * shape.fillLinearGradientStartPointX(20);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillLinearGradientStartPointY', 0);
	    /**
	     * get/set fill linear gradient start point y
	     * @name fillLinearGradientStartPointY
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} y
	     * @returns {Number}
	     * @example
	     * // get fill linear gradient start point y
	     * var startPointY = shape.fillLinearGradientStartPointY();
	     *
	     * // set fill linear gradient start point y
	     * shape.fillLinearGradientStartPointY(20);
	     */

	    Kinetic.Factory.addComponentsGetterSetter(Kinetic.Shape, 'fillLinearGradientEndPoint', ['x', 'y']);

	    /**
	     * get/set fill linear gradient end point
	     * @name fillLinearGradientEndPoint
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Object} endPoint
	     * @param {Number} endPoint.x
	     * @param {Number} endPoint.y
	     * @returns {Object}
	     * @example
	     * // get fill linear gradient end point
	     * var endPoint = shape.fillLinearGradientEndPoint();
	     *
	     * // set fill linear gradient end point
	     * shape.fillLinearGradientEndPoint({
	     *   x: 20
	     *   y: 10
	     * });
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillLinearGradientEndPointX', 0);
	    /**
	     * get/set fill linear gradient end point x
	     * @name fillLinearGradientEndPointX
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} x
	     * @returns {Number}
	     * @example
	     * // get fill linear gradient end point x
	     * var endPointX = shape.fillLinearGradientEndPointX();
	     *
	     * // set fill linear gradient end point x
	     * shape.fillLinearGradientEndPointX(20);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillLinearGradientEndPointY', 0);
	    /**
	     * get/set fill linear gradient end point y
	     * @name fillLinearGradientEndPointY
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} y
	     * @returns {Number}
	     * @example
	     * // get fill linear gradient end point y
	     * var endPointY = shape.fillLinearGradientEndPointY();
	     *
	     * // set fill linear gradient end point y
	     * shape.fillLinearGradientEndPointY(20);
	     */

	    Kinetic.Factory.addComponentsGetterSetter(Kinetic.Shape, 'fillRadialGradientStartPoint', ['x', 'y']);

	    /**
	     * get/set fill radial gradient start point
	     * @name fillRadialGradientStartPoint
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Object} startPoint
	     * @param {Number} startPoint.x
	     * @param {Number} startPoint.y
	     * @returns {Object}
	     * @example
	     * // get fill radial gradient start point
	     * var startPoint = shape.fillRadialGradientStartPoint();
	     *
	     * // set fill radial gradient start point
	     * shape.fillRadialGradientStartPoint({
	     *   x: 20
	     *   y: 10
	     * });
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillRadialGradientStartPointX', 0);
	    /**
	     * get/set fill radial gradient start point x
	     * @name fillRadialGradientStartPointX
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} x
	     * @returns {Number}
	     * @example
	     * // get fill radial gradient start point x
	     * var startPointX = shape.fillRadialGradientStartPointX();
	     *
	     * // set fill radial gradient start point x
	     * shape.fillRadialGradientStartPointX(20);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillRadialGradientStartPointY', 0);
	    /**
	     * get/set fill radial gradient start point y
	     * @name fillRadialGradientStartPointY
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} y
	     * @returns {Number}
	     * @example
	     * // get fill radial gradient start point y
	     * var startPointY = shape.fillRadialGradientStartPointY();
	     *
	     * // set fill radial gradient start point y
	     * shape.fillRadialGradientStartPointY(20);
	     */

	    Kinetic.Factory.addComponentsGetterSetter(Kinetic.Shape, 'fillRadialGradientEndPoint', ['x', 'y']);

	    /**
	     * get/set fill radial gradient end point
	     * @name fillRadialGradientEndPoint
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Object} endPoint
	     * @param {Number} endPoint.x
	     * @param {Number} endPoint.y
	     * @returns {Object}
	     * @example
	     * // get fill radial gradient end point
	     * var endPoint = shape.fillRadialGradientEndPoint();
	     *
	     * // set fill radial gradient end point
	     * shape.fillRadialGradientEndPoint({
	     *   x: 20
	     *   y: 10
	     * });
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillRadialGradientEndPointX', 0);
	    /**
	     * get/set fill radial gradient end point x
	     * @name fillRadialGradientEndPointX
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} x
	     * @returns {Number}
	     * @example
	     * // get fill radial gradient end point x
	     * var endPointX = shape.fillRadialGradientEndPointX();
	     *
	     * // set fill radial gradient end point x
	     * shape.fillRadialGradientEndPointX(20);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillRadialGradientEndPointY', 0);
	    /**
	     * get/set fill radial gradient end point y
	     * @name fillRadialGradientEndPointY
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} y
	     * @returns {Number}
	     * @example
	     * // get fill radial gradient end point y
	     * var endPointY = shape.fillRadialGradientEndPointY();
	     *
	     * // set fill radial gradient end point y
	     * shape.fillRadialGradientEndPointY(20);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Shape, 'fillPatternRotation', 0);

	    /**
	     * get/set fill pattern rotation in degrees
	     * @name fillPatternRotation
	     * @method
	     * @memberof Kinetic.Shape.prototype
	     * @param {Number} rotation
	     * @returns {Kinetic.Shape}
	     * @example
	     * // get fill pattern rotation
	     * var patternRotation = shape.fillPatternRotation();
	     *
	     * // set fill pattern rotation
	     * shape.fillPatternRotation(20);
	     */


	    Kinetic.Factory.backCompat(Kinetic.Shape, {
	        dashArray: 'dash',
	        getDashArray: 'getDash',
	        setDashArray: 'getDash',

	        drawFunc: 'sceneFunc',
	        getDrawFunc: 'getSceneFunc',
	        setDrawFunc: 'setSceneFunc',

	        drawHitFunc: 'hitFunc',
	        getDrawHitFunc: 'getHitFunc',
	        setDrawHitFunc: 'setHitFunc'
	    });

	    Kinetic.Collection.mapMethods(Kinetic.Shape);
	})();
	;/*jshint unused:false */
	(function() {
	    // CONSTANTS
	    var STAGE = 'Stage',
	        STRING = 'string',
	        PX = 'px',

	        MOUSEOUT = 'mouseout',
	        MOUSELEAVE = 'mouseleave',
	        MOUSEOVER = 'mouseover',
	        MOUSEENTER = 'mouseenter',
	        MOUSEMOVE = 'mousemove',
	        MOUSEDOWN = 'mousedown',
	        MOUSEUP = 'mouseup',
	        CLICK = 'click',
	        DBL_CLICK = 'dblclick',
	        TOUCHSTART = 'touchstart',
	        TOUCHEND = 'touchend',
	        TAP = 'tap',
	        DBL_TAP = 'dbltap',
	        TOUCHMOVE = 'touchmove',
	        DOMMOUSESCROLL = 'DOMMouseScroll',
	        MOUSEWHEEL = 'mousewheel',
	        WHEEL = 'wheel',

	        CONTENT_MOUSEOUT = 'contentMouseout',
	        CONTENT_MOUSEOVER = 'contentMouseover',
	        CONTENT_MOUSEMOVE = 'contentMousemove',
	        CONTENT_MOUSEDOWN = 'contentMousedown',
	        CONTENT_MOUSEUP = 'contentMouseup',
	        CONTENT_CLICK = 'contentClick',
	        CONTENT_DBL_CLICK = 'contentDblclick',
	        CONTENT_TOUCHSTART = 'contentTouchstart',
	        CONTENT_TOUCHEND = 'contentTouchend',
	        CONTENT_DBL_TAP = 'contentDbltap',
	        CONTENT_TOUCHMOVE = 'contentTouchmove',

	        DIV = 'div',
	        RELATIVE = 'relative',
	        INLINE_BLOCK = 'inline-block',
	        KINETICJS_CONTENT = 'kineticjs-content',
	        SPACE = ' ',
	        UNDERSCORE = '_',
	        CONTAINER = 'container',
	        EMPTY_STRING = '',
	        EVENTS = [MOUSEDOWN, MOUSEMOVE, MOUSEUP, MOUSEOUT, TOUCHSTART, TOUCHMOVE, TOUCHEND, MOUSEOVER, DOMMOUSESCROLL, MOUSEWHEEL, WHEEL],

	        // cached variables
	        eventsLength = EVENTS.length;

	    function addEvent(ctx, eventName) {
	        ctx.content.addEventListener(eventName, function(evt) {
	            ctx[UNDERSCORE + eventName](evt);
	        }, false);
	    }

	    Kinetic.Util.addMethods(Kinetic.Stage, {
	        ___init: function(config) {
	            this.nodeType = STAGE;
	            // call super constructor
	            Kinetic.Container.call(this, config);
	            this._id = Kinetic.idCounter++;
	            this._buildDOM();
	            this._bindContentEvents();
	            this._enableNestedTransforms = false;
	            Kinetic.stages.push(this);
	        },
	        _validateAdd: function(child) {
	            if (child.getType() !== 'Layer') {
	                Kinetic.Util.error('You may only add layers to the stage.');
	            }
	        },
	        /**
	         * set container dom element which contains the stage wrapper div element
	         * @method
	         * @memberof Kinetic.Stage.prototype
	         * @param {DomElement} container can pass in a dom element or id string
	         */
	        setContainer: function(container) {
	            if( typeof container === STRING) {
	                var id = container;
	                container = Kinetic.document.getElementById(container);
	                if (!container) {
	                    throw 'Can not find container in document with id ' + id;
	                }
	            }
	            this._setAttr(CONTAINER, container);
	            return this;
	        },
	        shouldDrawHit: function() {
	            return true;
	        },
	        draw: function() {
	            Kinetic.Node.prototype.draw.call(this);
	            return this;
	        },
	        /**
	         * draw layer scene graphs
	         * @name draw
	         * @method
	         * @memberof Kinetic.Stage.prototype
	         */

	        /**
	         * draw layer hit graphs
	         * @name drawHit
	         * @method
	         * @memberof Kinetic.Stage.prototype
	         */

	        /**
	         * set height
	         * @method
	         * @memberof Kinetic.Stage.prototype
	         * @param {Number} height
	         */
	        setHeight: function(height) {
	            Kinetic.Node.prototype.setHeight.call(this, height);
	            this._resizeDOM();
	            return this;
	        },
	        /**
	         * set width
	         * @method
	         * @memberof Kinetic.Stage.prototype
	         * @param {Number} width
	         */
	        setWidth: function(width) {
	            Kinetic.Node.prototype.setWidth.call(this, width);
	            this._resizeDOM();
	            return this;
	        },
	        /**
	         * clear all layers
	         * @method
	         * @memberof Kinetic.Stage.prototype
	         */
	        clear: function() {
	            var layers = this.children,
	                len = layers.length,
	                n;

	            for(n = 0; n < len; n++) {
	                layers[n].clear();
	            }
	            return this;
	        },
	        clone: function(obj) {
	            if (!obj) {
	                obj = {};
	            }
	            obj.container = Kinetic.document.createElement(DIV);
	            
	            return Kinetic.Container.prototype.clone.call(this, obj);
	        },
	        /**
	         * destroy stage
	         * @method
	         * @memberof Kinetic.Stage.prototype
	         */
	        destroy: function() {
	            var content = this.content;
	            Kinetic.Container.prototype.destroy.call(this);

	            if(content && Kinetic.Util._isInDocument(content)) {
	                this.getContainer().removeChild(content);
	            }
	            var index = Kinetic.stages.indexOf(this);
	            if (index > -1) {
	                Kinetic.stages.splice(index, 1);
	            }
	        },
	        /**
	         * get pointer position which can be a touch position or mouse position
	         * @method
	         * @memberof Kinetic.Stage.prototype
	         * @returns {Object}
	         */
	        getPointerPosition: function() {
	            return this.pointerPos;
	        },
	        getStage: function() {
	            return this;
	        },
	        /**
	         * get stage content div element which has the
	         *  the class name "kineticjs-content"
	         * @method
	         * @memberof Kinetic.Stage.prototype
	         */
	        getContent: function() {
	            return this.content;
	        },
	        /**
	         * Creates a composite data URL and requires a callback because the composite is generated asynchronously.
	         * @method
	         * @memberof Kinetic.Stage.prototype
	         * @param {Object} config
	         * @param {Function} config.callback function executed when the composite has completed
	         * @param {String} [config.mimeType] can be "image/png" or "image/jpeg".
	         *  "image/png" is the default
	         * @param {Number} [config.x] x position of canvas section
	         * @param {Number} [config.y] y position of canvas section
	         * @param {Number} [config.width] width of canvas section
	         * @param {Number} [config.height] height of canvas section
	         * @param {Number} [config.quality] jpeg quality.  If using an "image/jpeg" mimeType,
	         *  you can specify the quality from 0 to 1, where 0 is very poor quality and 1
	         *  is very high quality
	         */
	        toDataURL: function(config) {
	            config = config || {};

	            var mimeType = config.mimeType || null,
	                quality = config.quality || null,
	                x = config.x || 0,
	                y = config.y || 0,
	                canvas = new Kinetic.SceneCanvas({
	                    width: config.width || this.getWidth(),
	                    height: config.height || this.getHeight(),
	                    pixelRatio: 1
	                }),
	                _context = canvas.getContext()._context,
	                layers = this.children;

	            if(x || y) {
	                _context.translate(-1 * x, -1 * y);
	            }

	            function drawLayer(n) {
	                var layer = layers[n],
	                    layerUrl = layer.toDataURL(),
	                    imageObj = new Kinetic.window.Image();

	                imageObj.onload = function() {
	                    _context.drawImage(imageObj, 0, 0);

	                    if(n < layers.length - 1) {
	                        drawLayer(n + 1);
	                    }
	                    else {
	                        config.callback(canvas.toDataURL(mimeType, quality));
	                    }
	                };
	                imageObj.src = layerUrl;
	            }
	            drawLayer(0);
	        },
	        /**
	         * converts stage into an image.
	         * @method
	         * @memberof Kinetic.Stage.prototype
	         * @param {Object} config
	         * @param {Function} config.callback function executed when the composite has completed
	         * @param {String} [config.mimeType] can be "image/png" or "image/jpeg".
	         *  "image/png" is the default
	         * @param {Number} [config.x] x position of canvas section
	         * @param {Number} [config.y] y position of canvas section
	         * @param {Number} [config.width] width of canvas section
	         * @param {Number} [config.height] height of canvas section
	         * @param {Number} [config.quality] jpeg quality.  If using an "image/jpeg" mimeType,
	         *  you can specify the quality from 0 to 1, where 0 is very poor quality and 1
	         *  is very high quality
	         */
	        toImage: function(config) {
	            var cb = config.callback;

	            config.callback = function(dataUrl) {
	                Kinetic.Util._getImage(dataUrl, function(img) {
	                    cb(img);
	                });
	            };
	            this.toDataURL(config);
	        },
	        /**
	         * get visible intersection shape. This is the preferred
	         *  method for determining if a point intersects a shape or not
	         * @method
	         * @memberof Kinetic.Stage.prototype
	         * @param {Object} pos
	         * @param {Number} pos.x
	         * @param {Number} pos.y
	         * @returns {Kinetic.Shape}
	         */
	        getIntersection: function(pos) {
	            var layers = this.getChildren(),
	                len = layers.length,
	                end = len - 1,
	                n, shape;

	            for(n = end; n >= 0; n--) {
	                shape = layers[n].getIntersection(pos);
	                if (shape) {
	                    return shape;
	                }
	            }

	            return null;
	        },
	        _resizeDOM: function() {
	            if(this.content) {
	                var width = this.getWidth(),
	                    height = this.getHeight(),
	                    layers = this.getChildren(),
	                    len = layers.length,
	                    n, layer;

	                // set content dimensions
	                this.content.style.width = width + PX;
	                this.content.style.height = height + PX;

	                this.bufferCanvas.setSize(width, height);
	                this.bufferHitCanvas.setSize(width, height);

	                // set layer dimensions
	                for(n = 0; n < len; n++) {
	                    layer = layers[n];
	                    layer.setSize(width, height);
	                    layer.draw();
	                }
	            }
	        },
	        /**
	         * add layer or layers to stage
	         * @method
	         * @memberof Kinetic.Stage.prototype
	         * @param {...Kinetic.Layer} layer
	         * @example
	         * stage.add(layer1, layer2, layer3);
	         */
	        add: function(layer) {
	            if (arguments.length > 1) {
	                for (var i = 0; i < arguments.length; i++) {
	                    this.add(arguments[i]);
	                }
	                return;
	            }
	            Kinetic.Container.prototype.add.call(this, layer);
	            layer._setCanvasSize(this.width(), this.height());

	            // draw layer and append canvas to container
	            layer.draw();
	            this.content.appendChild(layer.canvas._canvas);

	            // chainable
	            return this;
	        },
	        getParent: function() {
	            return null;
	        },
	        getLayer: function() {
	            return null;
	        },
	        /**
	         * returns a {@link Kinetic.Collection} of layers
	         * @method
	         * @memberof Kinetic.Stage.prototype
	         */
	        getLayers: function() {
	            return this.getChildren();
	        },
	        _bindContentEvents: function() {
	            for (var n = 0; n < eventsLength; n++) {
	                addEvent(this, EVENTS[n]);
	            }
	        },
	        _mouseover: function(evt) {
	            if (!Kinetic.UA.mobile) {
	                this._setPointerPosition(evt);
	                this._fire(CONTENT_MOUSEOVER, {evt: evt});
	            }
	        },
	        _mouseout: function(evt) {
	            if (!Kinetic.UA.mobile) {
	                this._setPointerPosition(evt);
	                var targetShape = this.targetShape;

	                if(targetShape && !Kinetic.isDragging()) {
	                    targetShape._fireAndBubble(MOUSEOUT, {evt: evt});
	                    targetShape._fireAndBubble(MOUSELEAVE, {evt: evt});
	                    this.targetShape = null;
	                }
	                this.pointerPos = undefined;

	                this._fire(CONTENT_MOUSEOUT, {evt: evt});
	            }
	        },
	        _mousemove: function(evt) {
	        
	            // workaround for mobile IE to force touch event when unhandled pointer event elevates into a mouse event
	            if (Kinetic.UA.ieMobile) {
	                return this._touchmove(evt);
	            }
	            
	            // workaround fake mousemove event in chrome browser https://code.google.com/p/chromium/issues/detail?id=161464
	            if ((typeof evt.webkitMovementX !== 'undefined' || typeof evt.webkitMovementY !== 'undefined') && evt.webkitMovementY === 0 && evt.webkitMovementX === 0) {
	                return;
	            }
	            if (Kinetic.UA.mobile) {
	                return;
	            }
	            this._setPointerPosition(evt);
	            var dd = Kinetic.DD, shape;

	            if (!Kinetic.isDragging()) {
	                shape = this.getIntersection(this.getPointerPosition());
	                if(shape && shape.isListening()) {
	                    if(!Kinetic.isDragging() && (!this.targetShape || this.targetShape._id !== shape._id)) {
	                        if(this.targetShape) {
	                            this.targetShape._fireAndBubble(MOUSEOUT, {evt: evt}, shape);
	                            this.targetShape._fireAndBubble(MOUSELEAVE, {evt: evt}, shape);
	                        }
	                        shape._fireAndBubble(MOUSEOVER, {evt: evt}, this.targetShape);
	                        shape._fireAndBubble(MOUSEENTER, {evt: evt}, this.targetShape);
	                        this.targetShape = shape;
	                    }
	                    else {
	                        shape._fireAndBubble(MOUSEMOVE, {evt: evt});
	                    }
	                }
	                /*
	                 * if no shape was detected, clear target shape and try
	                 * to run mouseout from previous target shape
	                 */
	                else {
	                    if(this.targetShape && !Kinetic.isDragging()) {
	                        this.targetShape._fireAndBubble(MOUSEOUT, {evt: evt});
	                        this.targetShape._fireAndBubble(MOUSELEAVE, {evt: evt});
	                        this.targetShape = null;
	                    }

	                }

	                // content event
	                this._fire(CONTENT_MOUSEMOVE, {evt: evt});
	            }
	            if(dd) {
	                dd._drag(evt);
	            }

	            // always call preventDefault for desktop events because some browsers
	            // try to drag and drop the canvas element
	            if (evt.preventDefault) {
	                evt.preventDefault();
	            }
	        },
	        _mousedown: function(evt) {
	        
	            // workaround for mobile IE to force touch event when unhandled pointer event elevates into a mouse event       
	            if (Kinetic.UA.ieMobile) {
	                return this._touchstart(evt);
	            }
	            
	            if (!Kinetic.UA.mobile) {
	                this._setPointerPosition(evt);
	                var shape = this.getIntersection(this.getPointerPosition());

	                Kinetic.listenClickTap = true;

	                if (shape && shape.isListening()) {
	                    this.clickStartShape = shape;
	                    shape._fireAndBubble(MOUSEDOWN, {evt: evt});
	                }

	                // content event
	                this._fire(CONTENT_MOUSEDOWN, {evt: evt});
	            }

	            // always call preventDefault for desktop events because some browsers
	            // try to drag and drop the canvas element
	            if (evt.preventDefault) {
	                evt.preventDefault();
	            }
	        },
	        _mouseup: function(evt) {
	        
	            // workaround for mobile IE to force touch event when unhandled pointer event elevates into a mouse event       
	            if (Kinetic.UA.ieMobile) {
	                return this._touchend(evt);
	            }
	            if (!Kinetic.UA.mobile) {
	                this._setPointerPosition(evt);
	                var shape = this.getIntersection(this.getPointerPosition()),
	                    clickStartShape = this.clickStartShape,
	                    fireDblClick = false,
	                    dd = Kinetic.DD;

	                if(Kinetic.inDblClickWindow) {
	                    fireDblClick = true;
	                    Kinetic.inDblClickWindow = false;
	                }
	                // don't set inDblClickWindow after dragging
	                else if (!dd || !dd.justDragged) {
	                    Kinetic.inDblClickWindow = true;
	                } else if (dd) {
	                    dd.justDragged = false;
	                }

	                setTimeout(function() {
	                    Kinetic.inDblClickWindow = false;
	                }, Kinetic.dblClickWindow);

	                if (shape && shape.isListening()) {
	                    shape._fireAndBubble(MOUSEUP, {evt: evt});

	                    // detect if click or double click occurred
	                    if(Kinetic.listenClickTap && clickStartShape && clickStartShape._id === shape._id) {
	                        shape._fireAndBubble(CLICK, {evt: evt});

	                        if(fireDblClick) {
	                            shape._fireAndBubble(DBL_CLICK, {evt: evt});
	                        }
	                    }
	                }
	                // content events
	                this._fire(CONTENT_MOUSEUP, {evt: evt});
	                if (Kinetic.listenClickTap) {
	                    this._fire(CONTENT_CLICK, {evt: evt});
	                    if(fireDblClick) {
	                        this._fire(CONTENT_DBL_CLICK, {evt: evt});
	                    }
	                }

	                Kinetic.listenClickTap = false;
	            }

	            // always call preventDefault for desktop events because some browsers
	            // try to drag and drop the canvas element
	            if (evt.preventDefault) {
	                evt.preventDefault();
	            }
	        },
	        _touchstart: function(evt) {
	            this._setPointerPosition(evt);
	            var shape = this.getIntersection(this.getPointerPosition());

	            Kinetic.listenClickTap = true;

	            if (shape && shape.isListening()) {
	                this.tapStartShape = shape;
	                shape._fireAndBubble(TOUCHSTART, {evt: evt});

	                // only call preventDefault if the shape is listening for events
	                if (shape.isListening() && evt.preventDefault) {
	                    evt.preventDefault();
	                }
	            }
	            // content event
	            this._fire(CONTENT_TOUCHSTART, {evt: evt});
	        },
	        _touchend: function(evt) {
	            this._setPointerPosition(evt);
	            var shape = this.getIntersection(this.getPointerPosition()),
	                fireDblClick = false;

	            if(Kinetic.inDblClickWindow) {
	                fireDblClick = true;
	                Kinetic.inDblClickWindow = false;
	            }
	            else {
	                Kinetic.inDblClickWindow = true;
	            }

	            setTimeout(function() {
	                Kinetic.inDblClickWindow = false;
	            }, Kinetic.dblClickWindow);

	            if (shape && shape.isListening()) {
	                shape._fireAndBubble(TOUCHEND, {evt: evt});

	                // detect if tap or double tap occurred
	                if(Kinetic.listenClickTap && shape._id === this.tapStartShape._id) {
	                    shape._fireAndBubble(TAP, {evt: evt});

	                    if(fireDblClick) {
	                        shape._fireAndBubble(DBL_TAP, {evt: evt});
	                    }
	                }
	                // only call preventDefault if the shape is listening for events
	                if (shape.isListening() && evt.preventDefault) {
	                    evt.preventDefault();
	                }
	            }
	            // content events
	            if (Kinetic.listenClickTap) {
	                this._fire(CONTENT_TOUCHEND, {evt: evt});
	                if(fireDblClick) {
	                    this._fire(CONTENT_DBL_TAP, {evt: evt});
	                }
	            }

	            Kinetic.listenClickTap = false;
	        },
	        _touchmove: function(evt) {
	            this._setPointerPosition(evt);
	            var dd = Kinetic.DD,
	                shape;
	            if (!Kinetic.isDragging()) {
	                shape = this.getIntersection(this.getPointerPosition());
	                if (shape && shape.isListening()) {
	                    shape._fireAndBubble(TOUCHMOVE, {evt: evt});
	                    // only call preventDefault if the shape is listening for events
	                    if (shape.isListening() && evt.preventDefault) {
	                        evt.preventDefault();
	                    }
	                }
	                this._fire(CONTENT_TOUCHMOVE, {evt: evt});
	            }
	            if(dd) {
	                dd._drag(evt);
	                if (Kinetic.isDragging()) {
	                    evt.preventDefault();
	                }
	            }
	        },
	        _DOMMouseScroll: function(evt) {
	            this._mousewheel(evt);
	        },
	        _mousewheel: function(evt) {
	            this._setPointerPosition(evt);
	            var shape = this.getIntersection(this.getPointerPosition());

	            if (shape && shape.isListening()) {
	                shape._fireAndBubble(MOUSEWHEEL, {evt: evt});
	            }
	        },
	        _wheel: function(evt) {
	            this._mousewheel(evt);
	        },
	        _setPointerPosition: function(evt) {
	            var contentPosition = this._getContentPosition(),
	                offsetX = evt.offsetX,
	                clientX = evt.clientX,
	                x = null,
	                y = null,
	                touch;
	            evt = evt ? evt : window.event;

	            // touch events
	            if(evt.touches !== undefined) {
	                // currently, only handle one finger
	                if (evt.touches.length > 0) {

	                    touch = evt.touches[0];

	                    // get the information for finger #1
	                    x = touch.clientX - contentPosition.left;
	                    y = touch.clientY - contentPosition.top;
	                }
	            }
	            // mouse events
	            else {
	                // if offsetX is defined, assume that offsetY is defined as well
	                if (offsetX !== undefined) {
	                    x = offsetX;
	                    y = evt.offsetY;
	                }
	                // we unfortunately have to use UA detection here because accessing
	                // the layerX or layerY properties in newer versions of Chrome
	                // throws a JS warning.  layerX and layerY are required for FF
	                // when the container is transformed via CSS.
	                else if (Kinetic.UA.browser === 'mozilla') {
	                    x = evt.layerX;
	                    y = evt.layerY;
	                }
	                // if clientX is defined, assume that clientY is defined as well
	                else if (clientX !== undefined && contentPosition) {
	                    x = clientX - contentPosition.left;
	                    y = evt.clientY - contentPosition.top;
	                }
	            }

	            if (x !== null && y !== null) {
	                this.pointerPos = {
	                    x: x,
	                    y: y
	                };
	            }
	        },
	        _getContentPosition: function() {
	            var rect = this.content.getBoundingClientRect ? this.content.getBoundingClientRect() : { top: 0, left: 0 };
	            return {
	                top: rect.top,
	                left: rect.left
	            };
	        },
	        _buildDOM: function() {
	            var container = this.getContainer();
	            if (!container) {
	                if (Kinetic.Util.isBrowser()) {
	                    throw 'Stage has no container. A container is required.';
	                } else {
	                    // automatically create element for jsdom in nodejs env
	                    container = Kinetic.document.createElement(DIV);
	                }
	            }
	            // clear content inside container
	            container.innerHTML = EMPTY_STRING;

	            // content
	            this.content = Kinetic.document.createElement(DIV);
	            this.content.style.position = RELATIVE;
	            this.content.style.display = INLINE_BLOCK;
	            this.content.className = KINETICJS_CONTENT;
	            this.content.setAttribute('role', 'presentation');
	            container.appendChild(this.content);

	            // the buffer canvas pixel ratio must be 1 because it is used as an 
	            // intermediate canvas before copying the result onto a scene canvas.
	            // not setting it to 1 will result in an over compensation
	            this.bufferCanvas = new Kinetic.SceneCanvas({
	                pixelRatio: 1
	            });
	            this.bufferHitCanvas = new Kinetic.HitCanvas();

	            this._resizeDOM();
	        },
	        _onContent: function(typesStr, handler) {
	            var types = typesStr.split(SPACE),
	                len = types.length,
	                n, baseEvent;

	            for(n = 0; n < len; n++) {
	                baseEvent = types[n];
	                this.content.addEventListener(baseEvent, handler, false);
	            }
	        },
	        // currently cache function is now working for stage, because stage has no its own canvas element
	        // TODO: may be it is better to cache all children layers?
	        cache: function() {
	            Kinetic.Util.warn('Cache function is not allowed for stage. You may use cache only for layers, groups and shapes.');
	        },
	        clearCache : function() {
	        }
	    });
	    Kinetic.Util.extend(Kinetic.Stage, Kinetic.Container);

	    // add getters and setters
	    Kinetic.Factory.addGetter(Kinetic.Stage, 'container');
	    Kinetic.Factory.addOverloadedGetterSetter(Kinetic.Stage, 'container');

	    /**
	     * get container DOM element
	     * @name container
	     * @method
	     * @memberof Kinetic.Stage.prototype
	     * @returns {DomElement} container
	     * @example
	     * // get container
	     * var container = stage.container();
	     * 
	     * // set container
	     * var container = document.createElement('div');
	     * body.appendChild(container);
	     * stage.container(container);
	     */

	})();
	;(function() {
	    Kinetic.Util.addMethods(Kinetic.BaseLayer, {
	        ___init: function(config) {
	            this.nodeType = 'Layer';
	            Kinetic.Container.call(this, config);
	        },
	        createPNGStream : function() {
	            return this.canvas._canvas.createPNGStream();
	        },
	        /**
	         * get layer canvas
	         * @method
	         * @memberof Kinetic.BaseLayer.prototype
	         */
	        getCanvas: function() {
	            return this.canvas;
	        },
	        /**
	         * get layer hit canvas
	         * @method
	         * @memberof Kinetic.BaseLayer.prototype
	         */
	        getHitCanvas: function() {
	            return this.hitCanvas;
	        },
	        /**
	         * get layer canvas context
	         * @method
	         * @memberof Kinetic.BaseLayer.prototype
	         */
	        getContext: function() {
	            return this.getCanvas().getContext();
	        },
	        /**
	         * clear scene and hit canvas contexts tied to the layer
	         * @method
	         * @memberof Kinetic.BaseLayer.prototype
	         * @param {Object} [bounds]
	         * @param {Number} [bounds.x]
	         * @param {Number} [bounds.y]
	         * @param {Number} [bounds.width]
	         * @param {Number} [bounds.height]
	         * @example
	         * layer.clear();
	         * layer.clear(0, 0, 100, 100);
	         */
	        clear: function(bounds) {
	            this.getContext().clear(bounds);
	            this.getHitCanvas().getContext().clear(bounds);
	            return this;
	        },
	        clearHitCache: function() {
	            this._hitImageData = undefined;
	        },
	        // extend Node.prototype.setZIndex
	        setZIndex: function(index) {
	            Kinetic.Node.prototype.setZIndex.call(this, index);
	            var stage = this.getStage();
	            if(stage) {
	                stage.content.removeChild(this.getCanvas()._canvas);

	                if(index < stage.getChildren().length - 1) {
	                    stage.content.insertBefore(this.getCanvas()._canvas, stage.getChildren()[index + 1].getCanvas()._canvas);
	                }
	                else {
	                    stage.content.appendChild(this.getCanvas()._canvas);
	                }
	            }
	            return this;
	        },
	        // extend Node.prototype.moveToTop
	        moveToTop: function() {
	            Kinetic.Node.prototype.moveToTop.call(this);
	            var stage = this.getStage();
	            if(stage) {
	                stage.content.removeChild(this.getCanvas()._canvas);
	                stage.content.appendChild(this.getCanvas()._canvas);
	            }
	        },
	        // extend Node.prototype.moveUp
	        moveUp: function() {
	            if(Kinetic.Node.prototype.moveUp.call(this)) {
	                var stage = this.getStage();
	                if(stage) {
	                    stage.content.removeChild(this.getCanvas()._canvas);

	                    if(this.index < stage.getChildren().length - 1) {
	                        stage.content.insertBefore(this.getCanvas()._canvas, stage.getChildren()[this.index + 1].getCanvas()._canvas);
	                    }
	                    else {
	                        stage.content.appendChild(this.getCanvas()._canvas);
	                    }
	                }
	            }
	        },
	        // extend Node.prototype.moveDown
	        moveDown: function() {
	            if(Kinetic.Node.prototype.moveDown.call(this)) {
	                var stage = this.getStage();
	                if(stage) {
	                    var children = stage.getChildren();
	                    stage.content.removeChild(this.getCanvas()._canvas);
	                    stage.content.insertBefore(this.getCanvas()._canvas, children[this.index + 1].getCanvas()._canvas);
	                }
	            }
	        },
	        // extend Node.prototype.moveToBottom
	        moveToBottom: function() {
	            if(Kinetic.Node.prototype.moveToBottom.call(this)) {
	                var stage = this.getStage();
	                if(stage) {
	                    var children = stage.getChildren();
	                    stage.content.removeChild(this.getCanvas()._canvas);
	                    stage.content.insertBefore(this.getCanvas()._canvas, children[1].getCanvas()._canvas);
	                }
	            }
	        },
	        getLayer: function() {
	            return this;
	        },
	        remove: function() {
	            var _canvas = this.getCanvas()._canvas;

	            Kinetic.Node.prototype.remove.call(this);

	            if(_canvas && _canvas.parentNode && Kinetic.Util._isInDocument(_canvas)) {
	                _canvas.parentNode.removeChild(_canvas);
	            }
	            return this;
	        },
	        getStage: function() {
	            return this.parent;
	        },
	        setSize : function(width, height) {
	            this.canvas.setSize(width, height);
	        },
	        /**
	         * get/set width of layer.getter return width of stage. setter doing nothing.
	         * if you want change width use `stage.width(value);`
	         * @name width
	         * @method
	         * @memberof Kinetic.BaseLayer.prototype
	         * @returns {Number}
	         * @example
	         * var width = layer.width();
	         */
	        getWidth : function() {
	            if (this.parent) {
	                return this.parent.getWidth();
	            }
	        },
	        setWidth : function() {
	            Kinetic.Util.warn('Can not change width of layer. Use "stage.width(value)" function instead.');
	        },
	        /**
	         * get/set height of layer.getter return height of stage. setter doing nothing.
	         * if you want change height use `stage.height(value);`
	         * @name height
	         * @method
	         * @memberof Kinetic.BaseLayer.prototype
	         * @returns {Number}
	         * @example
	         * var height = layer.height();
	         */
	        getHeight : function() {
	            if (this.parent) {
	                return this.parent.getHeight();
	            }
	        },
	        setHeight : function() {
	            Kinetic.Util.warn('Can not change height of layer. Use "stage.height(value)" function instead.');
	        }
	    });
	    Kinetic.Util.extend(Kinetic.BaseLayer, Kinetic.Container);

	    // add getters and setters
	    Kinetic.Factory.addGetterSetter(Kinetic.BaseLayer, 'clearBeforeDraw', true);
	    /**
	     * get/set clearBeforeDraw flag which determines if the layer is cleared or not
	     *  before drawing
	     * @name clearBeforeDraw
	     * @method
	     * @memberof Kinetic.BaseLayer.prototype
	     * @param {Boolean} clearBeforeDraw
	     * @returns {Boolean}
	     * @example
	     * // get clearBeforeDraw flag
	     * var clearBeforeDraw = layer.clearBeforeDraw();
	     *
	     * // disable clear before draw
	     * layer.clearBeforeDraw(false);
	     *
	     * // enable clear before draw
	     * layer.clearBeforeDraw(true);
	     */

	    Kinetic.Collection.mapMethods(Kinetic.BaseLayer);
	})();
	;(function() {
	    // constants
	    var HASH = '#',
	        BEFORE_DRAW ='beforeDraw',
	        DRAW = 'draw',

	        /*
	         * 2 - 3 - 4
	         * |       |
	         * 1 - 0   5
	         *         |
	         * 8 - 7 - 6     
	         */
	        INTERSECTION_OFFSETS = [
	            {x:  0, y:  0}, // 0
	            {x: -1, y:  0}, // 1
	            {x: -1, y: -1}, // 2
	            {x:  0, y: -1}, // 3
	            {x:  1, y: -1}, // 4
	            {x:  1, y:  0}, // 5
	            {x:  1, y:  1}, // 6
	            {x:  0, y:  1}, // 7
	            {x: -1, y:  1}  // 8
	        ],
	        INTERSECTION_OFFSETS_LEN = INTERSECTION_OFFSETS.length;


	    Kinetic.Util.addMethods(Kinetic.Layer, {
	        ____init: function(config) {
	            this.nodeType = 'Layer';
	            this.canvas = new Kinetic.SceneCanvas();
	            this.hitCanvas = new Kinetic.HitCanvas();
	            // call super constructor
	            Kinetic.BaseLayer.call(this, config);
	        },
	        _setCanvasSize: function(width, height) {
	            this.canvas.setSize(width, height);
	            this.hitCanvas.setSize(width, height);
	        },
	        _validateAdd: function(child) {
	            var type = child.getType();
	            if (type !== 'Group' && type !== 'Shape') {
	                Kinetic.Util.error('You may only add groups and shapes to a layer.');
	            }
	        },
	        /**
	         * get visible intersection shape. This is the preferred
	         * method for determining if a point intersects a shape or not
	         * @method
	         * @memberof Kinetic.Layer.prototype
	         * @param {Object} pos
	         * @param {Number} pos.x
	         * @param {Number} pos.y
	         * @returns {Kinetic.Shape}
	         */
	        getIntersection: function(pos) {
	            var obj, i, intersectionOffset, shape;

	            if(this.hitGraphEnabled() && this.isVisible()) {
	                // in some cases antialiased area may be bigger than 1px
	                // it is possible if we will cache node, then scale it a lot
	                // TODO: check { 0; 0 } point before loop, and remove it from INTERSECTION_OFFSETS.
	                var spiralSearchDistance = 1;
	                var continueSearch = false;
	                while (true) {
	                    for (i=0; i<INTERSECTION_OFFSETS_LEN; i++) {
	                        intersectionOffset = INTERSECTION_OFFSETS[i];
	                        obj = this._getIntersection({
	                            x: pos.x + intersectionOffset.x * spiralSearchDistance,
	                            y: pos.y + intersectionOffset.y * spiralSearchDistance
	                        });
	                        shape = obj.shape;
	                        if (shape) {
	                            return shape;
	                        }
	                        // we should continue search if we found antialiased pixel
	                        // that means our node somewhere very close
	                        else if (obj.antialiased) {
	                            continueSearch = true;
	                        }
	                    }
	                    // if no shape, and no antialiased pixel, we should end searching 
	                    if (continueSearch) {
	                        spiralSearchDistance += 1;
	                    } else {
	                        return;
	                    }
	                }
	            } else {
	                return null;
	            }
	        },
	        _getImageData: function(x, y) {
	            var width = this.hitCanvas.width || 1,
	                height = this.hitCanvas.height || 1,
	                index = (Math.round(y) * width ) + Math.round(x);

	            if (!this._hitImageData) {
	                this._hitImageData = this.hitCanvas.context.getImageData(0, 0, width, height);
	            }

	            return [
	                this._hitImageData.data[4 * index + 0] , // Red
	                this._hitImageData.data[4 * index + 1], // Green
	                this._hitImageData.data[4 * index + 2], // Blue
	                this._hitImageData.data[4 * index + 3] // Alpha
	            ];
	        },
	        _getIntersection: function(pos) {
	            var p = this.hitCanvas.context.getImageData(pos.x, pos.y, 1, 1).data,
	                p3 = p[3],
	                colorKey, shape;

	            // fully opaque pixel
	            if(p3 === 255) {
	                colorKey = Kinetic.Util._rgbToHex(p[0], p[1], p[2]);
	                shape = Kinetic.shapes[HASH + colorKey];
	                return {
	                    shape: shape
	                };
	            }
	            // antialiased pixel
	            else if(p3 > 0) {
	                return {
	                    antialiased: true
	                };
	            }
	            // empty pixel
	            else {
	                return {};
	            }
	        },
	        drawScene: function(can, top) {
	            var layer = this.getLayer(),
	                canvas = can || (layer && layer.getCanvas());

	            this._fire(BEFORE_DRAW, {
	                node: this
	            });

	            if(this.getClearBeforeDraw()) {
	                canvas.getContext().clear();
	            }
	            
	            Kinetic.Container.prototype.drawScene.call(this, canvas, top);

	            this._fire(DRAW, {
	                node: this
	            });

	            return this;
	        },
	        // the apply transform method is handled by the Layer and FastLayer class
	        // because it is up to the layer to decide if an absolute or relative transform
	        // should be used
	        _applyTransform: function(shape, context, top) {
	            var m = shape.getAbsoluteTransform(top).getMatrix();
	            context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
	        },
	        drawHit: function(can, top) {
	            var layer = this.getLayer(),
	                canvas = can || (layer && layer.hitCanvas);

	            if(layer && layer.getClearBeforeDraw()) {
	                layer.getHitCanvas().getContext().clear();
	            }

	            Kinetic.Container.prototype.drawHit.call(this, canvas, top);
	            this.imageData = null; // Clear imageData cache
	            return this;
	        },
	        /**
	         * clear scene and hit canvas contexts tied to the layer
	         * @method
	         * @memberof Kinetic.Layer.prototype
	         * @param {Object} [bounds]
	         * @param {Number} [bounds.x]
	         * @param {Number} [bounds.y]
	         * @param {Number} [bounds.width]
	         * @param {Number} [bounds.height]
	         * @example
	         * layer.clear();
	         * layer.clear(0, 0, 100, 100);
	         */
	        clear: function(bounds) {
	            this.getContext().clear(bounds);
	            this.getHitCanvas().getContext().clear(bounds);
	            this.imageData = null; // Clear getImageData cache
	            return this;
	        },
	        // extend Node.prototype.setVisible
	        setVisible: function(visible) {
	            Kinetic.Node.prototype.setVisible.call(this, visible);
	            if(visible) {
	                this.getCanvas()._canvas.style.display = 'block';
	                this.hitCanvas._canvas.style.display = 'block';
	            }
	            else {
	                this.getCanvas()._canvas.style.display = 'none';
	                this.hitCanvas._canvas.style.display = 'none';
	            }
	            return this;
	        },
	        /**
	         * enable hit graph
	         * @name enableHitGraph
	         * @method
	         * @memberof Kinetic.Layer.prototype
	         * @returns {Layer}
	         */
	        enableHitGraph: function() {
	            this.setHitGraphEnabled(true);
	            return this;
	        },
	        /**
	         * disable hit graph
	         * @name disableHitGraph
	         * @method
	         * @memberof Kinetic.Layer.prototype
	         * @returns {Layer}
	         */
	        disableHitGraph: function() {
	            this.setHitGraphEnabled(false);
	            return this;
	        },
	        setSize : function(width, height) {
	            Kinetic.BaseLayer.prototype.setSize.call(this, width, height);
	            this.hitCanvas.setSize(width, height);
	        }
	    });
	    Kinetic.Util.extend(Kinetic.Layer, Kinetic.BaseLayer);

	    Kinetic.Factory.addGetterSetter(Kinetic.Layer, 'hitGraphEnabled', true);
	    /**
	     * get/set hitGraphEnabled flag.  Disabling the hit graph will greatly increase
	     *  draw performance because the hit graph will not be redrawn each time the layer is
	     *  drawn.  This, however, also disables mouse/touch event detection
	     * @name hitGraphEnabled
	     * @method
	     * @memberof Kinetic.Layer.prototype
	     * @param {Boolean} enabled
	     * @returns {Boolean}
	     * @example
	     * // get hitGraphEnabled flag
	     * var hitGraphEnabled = layer.hitGraphEnabled();
	     *
	     * // disable hit graph
	     * layer.hitGraphEnabled(false);
	     *
	     * // enable hit graph
	     * layer.hitGraphEnabled(true);
	     */
	    Kinetic.Collection.mapMethods(Kinetic.Layer);
	})();
	;(function() {

	    Kinetic.Util.addMethods(Kinetic.FastLayer, {
	        ____init: function(config) {
	            this.nodeType = 'Layer';
	            this.canvas = new Kinetic.SceneCanvas();
	            // call super constructor
	            Kinetic.BaseLayer.call(this, config);
	        },
	        _validateAdd: function(child) {
	            var type = child.getType();
	            if (type !== 'Shape') {
	                Kinetic.Util.error('You may only add shapes to a fast layer.');
	            }
	        },
	        _setCanvasSize: function(width, height) {
	            this.canvas.setSize(width, height);
	        },
	        hitGraphEnabled: function() {
	            return false;
	        },
	        getIntersection: function() {
	            return null;
	        },
	        drawScene: function(can) {
	            var layer = this.getLayer(),
	                canvas = can || (layer && layer.getCanvas());

	            if(this.getClearBeforeDraw()) {
	                canvas.getContext().clear();
	            }
	            
	            Kinetic.Container.prototype.drawScene.call(this, canvas);

	            return this;
	        },
	        // the apply transform method is handled by the Layer and FastLayer class
	        // because it is up to the layer to decide if an absolute or relative transform
	        // should be used
	        _applyTransform: function(shape, context, top) {
	            if (!top || top._id !== this._id) {
	                var m = shape.getTransform().getMatrix();
	                context.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
	            }
	        },
	        draw: function() {
	            this.drawScene();
	            return this;
	        },
	        /**
	         * clear scene and hit canvas contexts tied to the layer
	         * @method
	         * @memberof Kinetic.FastLayer.prototype
	         * @param {Object} [bounds]
	         * @param {Number} [bounds.x]
	         * @param {Number} [bounds.y]
	         * @param {Number} [bounds.width]
	         * @param {Number} [bounds.height]
	         * @example
	         * layer.clear();
	         * layer.clear(0, 0, 100, 100);
	         */
	        clear: function(bounds) {
	            this.getContext().clear(bounds);
	            return this;
	        },
	        // extend Node.prototype.setVisible
	        setVisible: function(visible) {
	            Kinetic.Node.prototype.setVisible.call(this, visible);
	            if(visible) {
	                this.getCanvas()._canvas.style.display = 'block';
	            }
	            else {
	                this.getCanvas()._canvas.style.display = 'none';
	            }
	            return this;
	        }
	    });
	    Kinetic.Util.extend(Kinetic.FastLayer, Kinetic.BaseLayer);

	    Kinetic.Collection.mapMethods(Kinetic.FastLayer);
	})();
	;(function() {
	    Kinetic.Util.addMethods(Kinetic.Group, {
	        ___init: function(config) {
	            this.nodeType = 'Group';
	            // call super constructor
	            Kinetic.Container.call(this, config);
	        },
	        _validateAdd: function(child) {
	            var type = child.getType();
	            if (type !== 'Group' && type !== 'Shape') {
	                Kinetic.Util.error('You may only add groups and shapes to groups.');
	            }
	        }
	    });
	    Kinetic.Util.extend(Kinetic.Group, Kinetic.Container);

	    Kinetic.Collection.mapMethods(Kinetic.Group);
	})();
	;(function() {
	    /**
	     * Rect constructor
	     * @constructor
	     * @memberof Kinetic
	     * @augments Kinetic.Shape
	     * @param {Object} config
	     * @param {Number} [config.cornerRadius]
	     * @param {String} [config.fill] fill color
	     * @param {Integer} [config.fillRed] set fill red component
	     * @param {Integer} [config.fillGreen] set fill green component
	     * @param {Integer} [config.fillBlue] set fill blue component
	     * @param {Integer} [config.fillAlpha] set fill alpha component
	     * @param {Image} [config.fillPatternImage] fill pattern image
	     * @param {Number} [config.fillPatternX]
	     * @param {Number} [config.fillPatternY]
	     * @param {Object} [config.fillPatternOffset] object with x and y component
	     * @param {Number} [config.fillPatternOffsetX] 
	     * @param {Number} [config.fillPatternOffsetY] 
	     * @param {Object} [config.fillPatternScale] object with x and y component
	     * @param {Number} [config.fillPatternScaleX]
	     * @param {Number} [config.fillPatternScaleY]
	     * @param {Number} [config.fillPatternRotation]
	     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
	     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientStartPointX]
	     * @param {Number} [config.fillLinearGradientStartPointY]
	     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientEndPointX]
	     * @param {Number} [config.fillLinearGradientEndPointY]
	     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
	     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientStartPointX]
	     * @param {Number} [config.fillRadialGradientStartPointY]
	     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientEndPointX] 
	     * @param {Number} [config.fillRadialGradientEndPointY] 
	     * @param {Number} [config.fillRadialGradientStartRadius]
	     * @param {Number} [config.fillRadialGradientEndRadius]
	     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
	     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
	     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
	     * @param {String} [config.stroke] stroke color
	     * @param {Integer} [config.strokeRed] set stroke red component
	     * @param {Integer} [config.strokeGreen] set stroke green component
	     * @param {Integer} [config.strokeBlue] set stroke blue component
	     * @param {Integer} [config.strokeAlpha] set stroke alpha component
	     * @param {Number} [config.strokeWidth] stroke width
	     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
	     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
	     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
	     *  is miter
	     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
	     *  is butt
	     * @param {String} [config.shadowColor]
	     * @param {Integer} [config.shadowRed] set shadow color red component
	     * @param {Integer} [config.shadowGreen] set shadow color green component
	     * @param {Integer} [config.shadowBlue] set shadow color blue component
	     * @param {Integer} [config.shadowAlpha] set shadow color alpha component
	     * @param {Number} [config.shadowBlur]
	     * @param {Object} [config.shadowOffset] object with x and y component
	     * @param {Number} [config.shadowOffsetX]
	     * @param {Number} [config.shadowOffsetY]
	     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
	     *  between 0 and 1
	     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
	     * @param {Array} [config.dash]
	     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
	     * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	     * @example
	     * var rect = new Kinetic.Rect({
	     *   width: 100,
	     *   height: 50,
	     *   fill: 'red',
	     *   stroke: 'black',
	     *   strokeWidth: 5
	     * });
	     */
	    Kinetic.Rect = function(config) {
	        this.___init(config);
	    };

	    Kinetic.Rect.prototype = {
	        ___init: function(config) {
	            Kinetic.Shape.call(this, config);
	            this.className = 'Rect';
	            this.sceneFunc(this._sceneFunc);
	        },
	        _sceneFunc: function(context) {
	            var cornerRadius = this.getCornerRadius(),
	                width = this.getWidth(),
	                height = this.getHeight();

	            
	            context.beginPath();

	            if(!cornerRadius) {
	                // simple rect - don't bother doing all that complicated maths stuff.
	                context.rect(0, 0, width, height);
	            }
	            else {
	                // arcTo would be nicer, but browser support is patchy (Opera)
	                context.moveTo(cornerRadius, 0);
	                context.lineTo(width - cornerRadius, 0);
	                context.arc(width - cornerRadius, cornerRadius, cornerRadius, Math.PI * 3 / 2, 0, false);
	                context.lineTo(width, height - cornerRadius);
	                context.arc(width - cornerRadius, height - cornerRadius, cornerRadius, 0, Math.PI / 2, false);
	                context.lineTo(cornerRadius, height);
	                context.arc(cornerRadius, height - cornerRadius, cornerRadius, Math.PI / 2, Math.PI, false);
	                context.lineTo(0, cornerRadius);
	                context.arc(cornerRadius, cornerRadius, cornerRadius, Math.PI, Math.PI * 3 / 2, false);
	            }
	            context.closePath();
	            context.fillStrokeShape(this);
	        }
	    };

	    Kinetic.Util.extend(Kinetic.Rect, Kinetic.Shape);

	    Kinetic.Factory.addGetterSetter(Kinetic.Rect, 'cornerRadius', 0);
	    /**
	     * get/set corner radius
	     * @name cornerRadius
	     * @method
	     * @memberof Kinetic.Rect.prototype
	     * @param {Number} cornerRadius
	     * @returns {Number}
	     * @example
	     * // get corner radius
	     * var cornerRadius = rect.cornerRadius();
	     * 
	     * // set corner radius
	     * rect.cornerRadius(10);
	     */

	    Kinetic.Collection.mapMethods(Kinetic.Rect);
	})();
	;(function() {
	    // the 0.0001 offset fixes a bug in Chrome 27
	    var PIx2 = (Math.PI * 2) - 0.0001,
	        CIRCLE = 'Circle';

	    /**
	     * Circle constructor
	     * @constructor
	     * @memberof Kinetic
	     * @augments Kinetic.Shape
	     * @param {Object} config
	     * @param {Number} config.radius
	     * @param {String} [config.fill] fill color
	     * @param {Integer} [config.fillRed] set fill red component
	     * @param {Integer} [config.fillGreen] set fill green component
	     * @param {Integer} [config.fillBlue] set fill blue component
	     * @param {Integer} [config.fillAlpha] set fill alpha component
	     * @param {Image} [config.fillPatternImage] fill pattern image
	     * @param {Number} [config.fillPatternX]
	     * @param {Number} [config.fillPatternY]
	     * @param {Object} [config.fillPatternOffset] object with x and y component
	     * @param {Number} [config.fillPatternOffsetX] 
	     * @param {Number} [config.fillPatternOffsetY] 
	     * @param {Object} [config.fillPatternScale] object with x and y component
	     * @param {Number} [config.fillPatternScaleX]
	     * @param {Number} [config.fillPatternScaleY]
	     * @param {Number} [config.fillPatternRotation]
	     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
	     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientStartPointX]
	     * @param {Number} [config.fillLinearGradientStartPointY]
	     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientEndPointX]
	     * @param {Number} [config.fillLinearGradientEndPointY]
	     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
	     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientStartPointX]
	     * @param {Number} [config.fillRadialGradientStartPointY]
	     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientEndPointX] 
	     * @param {Number} [config.fillRadialGradientEndPointY] 
	     * @param {Number} [config.fillRadialGradientStartRadius]
	     * @param {Number} [config.fillRadialGradientEndRadius]
	     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
	     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
	     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
	     * @param {String} [config.stroke] stroke color
	     * @param {Integer} [config.strokeRed] set stroke red component
	     * @param {Integer} [config.strokeGreen] set stroke green component
	     * @param {Integer} [config.strokeBlue] set stroke blue component
	     * @param {Integer} [config.strokeAlpha] set stroke alpha component
	     * @param {Number} [config.strokeWidth] stroke width
	     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
	     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
	     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
	     *  is miter
	     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
	     *  is butt
	     * @param {String} [config.shadowColor]
	     * @param {Integer} [config.shadowRed] set shadow color red component
	     * @param {Integer} [config.shadowGreen] set shadow color green component
	     * @param {Integer} [config.shadowBlue] set shadow color blue component
	     * @param {Integer} [config.shadowAlpha] set shadow color alpha component
	     * @param {Number} [config.shadowBlur]
	     * @param {Object} [config.shadowOffset] object with x and y component
	     * @param {Number} [config.shadowOffsetX]
	     * @param {Number} [config.shadowOffsetY]
	     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
	     *  between 0 and 1
	     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
	     * @param {Array} [config.dash]
	     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
	     * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	     * @example
	     * // create circle
	     * var circle = new Kinetic.Circle({
	     *   radius: 40,
	     *   fill: 'red',
	     *   stroke: 'black'
	     *   strokeWidth: 5
	     * });
	     */
	    Kinetic.Circle = function(config) {
	        this.___init(config);
	    };

	    Kinetic.Circle.prototype = {
	        ___init: function(config) {
	            // call super constructor
	            Kinetic.Shape.call(this, config);
	            this.className = CIRCLE;
	            this.sceneFunc(this._sceneFunc);
	        },
	        _sceneFunc: function(context) {
	            context.beginPath();
	            context.arc(0, 0, this.getRadius(), 0, PIx2, false);
	            context.closePath();
	            context.fillStrokeShape(this);
	        },
	        // implements Shape.prototype.getWidth()
	        getWidth: function() {
	            return this.getRadius() * 2;
	        },
	        // implements Shape.prototype.getHeight()
	        getHeight: function() {
	            return this.getRadius() * 2;
	        },
	        // implements Shape.prototype.setWidth()
	        setWidth: function(width) {
	            Kinetic.Node.prototype.setWidth.call(this, width);
	            if (this.radius() !== width / 2) {
	                this.setRadius(width / 2);
	            }
	        },
	        // implements Shape.prototype.setHeight()
	        setHeight: function(height) {
	            Kinetic.Node.prototype.setHeight.call(this, height);
	            if (this.radius() !== height / 2) {
	                this.setRadius(height / 2);
	            }
	        },
	        setRadius : function(val) {
	            this._setAttr('radius', val);
	            this.setWidth(val * 2);
	            this.setHeight(val * 2);
	        }
	    };
	    Kinetic.Util.extend(Kinetic.Circle, Kinetic.Shape);

	    // add getters setters
	    Kinetic.Factory.addGetter(Kinetic.Circle, 'radius', 0);
	    Kinetic.Factory.addOverloadedGetterSetter(Kinetic.Circle, 'radius');

	    /**
	     * get/set radius
	     * @name radius
	     * @method
	     * @memberof Kinetic.Circle.prototype
	     * @param {Number} radius
	     * @returns {Number}
	     * @example
	     * // get radius
	     * var radius = circle.radius();
	     *
	     * // set radius
	     * circle.radius(10);
	     */

	    Kinetic.Collection.mapMethods(Kinetic.Circle);
	})();
	;(function() {
	    // the 0.0001 offset fixes a bug in Chrome 27
	    var PIx2 = (Math.PI * 2) - 0.0001,
	        ELLIPSE = 'Ellipse';

	    /**
	     * Ellipse constructor
	     * @constructor
	     * @augments Kinetic.Shape
	     * @param {Object} config
	     * @param {Object} config.radius defines x and y radius
	     * @@ShapeParams
	     * @@NodeParams
	     * @example
	     * var ellipse = new Kinetic.Ellipse({
	     *   radius : {
	     *     x : 50,
	     *     y : 50
	     *   },
	     *   fill: 'red'
	     * });
	     */
	    Kinetic.Ellipse = function(config) {
	        this.___init(config);
	    };

	    Kinetic.Ellipse.prototype = {
	        ___init: function(config) {
	            // call super constructor
	            Kinetic.Shape.call(this, config);
	            this.className = ELLIPSE;
	            this.sceneFunc(this._sceneFunc);
	        },
	        _sceneFunc: function(context) {
	            var rx = this.getRadiusX(),
	                ry = this.getRadiusY();

	            context.beginPath();
	            context.save();
	            if(rx !== ry) {
	                context.scale(1, ry / rx);
	            }
	            context.arc(0, 0, rx, 0, PIx2, false);
	            context.restore();
	            context.closePath();
	            context.fillStrokeShape(this);
	        },
	        // implements Shape.prototype.getWidth()
	        getWidth: function() {
	            return this.getRadiusX() * 2;
	        },
	        // implements Shape.prototype.getHeight()
	        getHeight: function() {
	            return this.getRadiusY() * 2;
	        },
	        // implements Shape.prototype.setWidth()
	        setWidth: function(width) {
	            Kinetic.Node.prototype.setWidth.call(this, width);
	            this.setRadius({
	                x: width / 2
	            });
	        },
	        // implements Shape.prototype.setHeight()
	        setHeight: function(height) {
	            Kinetic.Node.prototype.setHeight.call(this, height);
	            this.setRadius({
	                y: height / 2
	            });
	        }
	    };
	    Kinetic.Util.extend(Kinetic.Ellipse, Kinetic.Shape);

	    // add getters setters
	    Kinetic.Factory.addComponentsGetterSetter(Kinetic.Ellipse, 'radius', ['x', 'y']);

	    /**
	     * get/set radius
	     * @name radius
	     * @method
	     * @memberof Kinetic.Ellipse.prototype
	     * @param {Object} radius
	     * @param {Number} radius.x
	     * @param {Number} radius.y
	     * @returns {Object}
	     * @example
	     * // get radius
	     * var radius = ellipse.radius();
	     * 
	     * // set radius
	     * ellipse.radius({
	     *   x: 200,
	     *   y: 100
	     * });
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Ellipse, 'radiusX', 0);
	    /**
	     * get/set radius x
	     * @name radiusX
	     * @method
	     * @memberof Kinetic.Ellipse.prototype
	     * @param {Number} x
	     * @returns {Number}
	     * @example
	     * // get radius x
	     * var radiusX = ellipse.radiusX();
	     * 
	     * // set radius x
	     * ellipse.radiusX(200);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Ellipse, 'radiusY', 0);
	    /**
	     * get/set radius y
	     * @name radiusY
	     * @method
	     * @memberof Kinetic.Ellipse.prototype
	     * @param {Number} y
	     * @returns {Number}
	     * @example
	     * // get radius y
	     * var radiusY = ellipse.radiusY();
	     * 
	     * // set radius y
	     * ellipse.radiusY(200);
	     */

	    Kinetic.Collection.mapMethods(Kinetic.Ellipse);

	})();;(function() {
	    // the 0.0001 offset fixes a bug in Chrome 27
	    var PIx2 = (Math.PI * 2) - 0.0001;
	    
	    /**
	     * Ring constructor
	     * @constructor
	     * @augments Kinetic.Shape
	     * @param {Object} config
	     * @param {Number} config.innerRadius
	     * @param {Number} config.outerRadius
	     * @param {Boolean} [config.clockwise]
	     * @param {String} [config.fill] fill color
	     * @param {Integer} [config.fillRed] set fill red component
	     * @param {Integer} [config.fillGreen] set fill green component
	     * @param {Integer} [config.fillBlue] set fill blue component
	     * @param {Integer} [config.fillAlpha] set fill alpha component
	     * @param {Image} [config.fillPatternImage] fill pattern image
	     * @param {Number} [config.fillPatternX]
	     * @param {Number} [config.fillPatternY]
	     * @param {Object} [config.fillPatternOffset] object with x and y component
	     * @param {Number} [config.fillPatternOffsetX] 
	     * @param {Number} [config.fillPatternOffsetY] 
	     * @param {Object} [config.fillPatternScale] object with x and y component
	     * @param {Number} [config.fillPatternScaleX]
	     * @param {Number} [config.fillPatternScaleY]
	     * @param {Number} [config.fillPatternRotation]
	     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
	     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientStartPointX]
	     * @param {Number} [config.fillLinearGradientStartPointY]
	     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientEndPointX]
	     * @param {Number} [config.fillLinearGradientEndPointY]
	     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
	     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientStartPointX]
	     * @param {Number} [config.fillRadialGradientStartPointY]
	     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientEndPointX] 
	     * @param {Number} [config.fillRadialGradientEndPointY] 
	     * @param {Number} [config.fillRadialGradientStartRadius]
	     * @param {Number} [config.fillRadialGradientEndRadius]
	     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
	     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
	     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
	     * @param {String} [config.stroke] stroke color
	     * @param {Integer} [config.strokeRed] set stroke red component
	     * @param {Integer} [config.strokeGreen] set stroke green component
	     * @param {Integer} [config.strokeBlue] set stroke blue component
	     * @param {Integer} [config.strokeAlpha] set stroke alpha component
	     * @param {Number} [config.strokeWidth] stroke width
	     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
	     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
	     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
	     *  is miter
	     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
	     *  is butt
	     * @param {String} [config.shadowColor]
	     * @param {Integer} [config.shadowRed] set shadow color red component
	     * @param {Integer} [config.shadowGreen] set shadow color green component
	     * @param {Integer} [config.shadowBlue] set shadow color blue component
	     * @param {Integer} [config.shadowAlpha] set shadow color alpha component
	     * @param {Number} [config.shadowBlur]
	     * @param {Object} [config.shadowOffset] object with x and y component
	     * @param {Number} [config.shadowOffsetX]
	     * @param {Number} [config.shadowOffsetY]
	     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
	     *  between 0 and 1
	     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
	     * @param {Array} [config.dash]
	     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
	     * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	     * @example
	     * var ring = new Kinetic.Ring({
	     *   innerRadius: 40,
	     *   outerRadius: 80,
	     *   fill: 'red',
	     *   stroke: 'black',
	     *   strokeWidth: 5
	     * });
	     */
	    Kinetic.Ring = function(config) {
	        this.___init(config);
	    };

	    Kinetic.Ring.prototype = {
	        ___init: function(config) {
	            // call super constructor
	            Kinetic.Shape.call(this, config);
	            this.className = 'Ring';
	            this.sceneFunc(this._sceneFunc);
	        },
	        _sceneFunc: function(context) {
	            context.beginPath();
	            context.arc(0, 0, this.getInnerRadius(), 0, PIx2, false);
	            context.moveTo(this.getOuterRadius(), 0);
	            context.arc(0, 0, this.getOuterRadius(), PIx2, 0, true);
	            context.closePath();
	            context.fillStrokeShape(this);
	        },
	        // implements Shape.prototype.getWidth()
	        getWidth: function() {
	            return this.getOuterRadius() * 2;
	        },
	        // implements Shape.prototype.getHeight()
	        getHeight: function() {
	            return this.getOuterRadius() * 2;
	        },
	        // implements Shape.prototype.setWidth()
	        setWidth: function(width) {
	            Kinetic.Node.prototype.setWidth.call(this, width);
	            if (this.outerRadius() !== width / 2) {
	                this.setOuterRadius(width / 2);
	            }
	        },
	        // implements Shape.prototype.setHeight()
	        setHeight: function(height) {
	            Kinetic.Node.prototype.setHeight.call(this, height);
	            if (this.outerRadius() !== height / 2) {
	                this.setOuterRadius(height / 2);
	            }
	        },
	        setOuterRadius : function(val) {
	            this._setAttr('outerRadius', val);
	            this.setWidth(val * 2);
	            this.setHeight(val * 2);
	        }
	    };
	    Kinetic.Util.extend(Kinetic.Ring, Kinetic.Shape);

	    // add getters setters
	    Kinetic.Factory.addGetterSetter(Kinetic.Ring, 'innerRadius', 0);

	    /**
	     * get/set innerRadius
	     * @name innerRadius
	     * @method
	     * @memberof Kinetic.Ring.prototype
	     * @param {Number} innerRadius
	     * @returns {Number}
	     * @example
	     * // get inner radius
	     * var innerRadius = ring.innerRadius();
	     *
	     * // set inner radius
	     * ring.innerRadius(20);
	     */
	     
	    Kinetic.Factory.addGetter(Kinetic.Ring, 'outerRadius', 0);
	    Kinetic.Factory.addOverloadedGetterSetter(Kinetic.Ring, 'outerRadius');

	    /**
	     * get/set outerRadius
	     * @name outerRadius
	     * @method
	     * @memberof Kinetic.Ring.prototype
	     * @param {Number} outerRadius
	     * @returns {Number}
	     * @example
	     * // get outer radius
	     * var outerRadius = ring.outerRadius();
	     *
	     * // set outer radius
	     * ring.outerRadius(20);
	     */

	    Kinetic.Collection.mapMethods(Kinetic.Ring);
	})();
	;(function() {
	    /**
	     * Wedge constructor
	     * @constructor
	     * @augments Kinetic.Shape
	     * @param {Object} config
	     * @param {Number} config.angle in degrees
	     * @param {Number} config.radius
	     * @param {Boolean} [config.clockwise]
	     * @param {String} [config.fill] fill color
	     * @param {Integer} [config.fillRed] set fill red component
	     * @param {Integer} [config.fillGreen] set fill green component
	     * @param {Integer} [config.fillBlue] set fill blue component
	     * @param {Integer} [config.fillAlpha] set fill alpha component
	     * @param {Image} [config.fillPatternImage] fill pattern image
	     * @param {Number} [config.fillPatternX]
	     * @param {Number} [config.fillPatternY]
	     * @param {Object} [config.fillPatternOffset] object with x and y component
	     * @param {Number} [config.fillPatternOffsetX] 
	     * @param {Number} [config.fillPatternOffsetY] 
	     * @param {Object} [config.fillPatternScale] object with x and y component
	     * @param {Number} [config.fillPatternScaleX]
	     * @param {Number} [config.fillPatternScaleY]
	     * @param {Number} [config.fillPatternRotation]
	     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
	     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientStartPointX]
	     * @param {Number} [config.fillLinearGradientStartPointY]
	     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientEndPointX]
	     * @param {Number} [config.fillLinearGradientEndPointY]
	     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
	     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientStartPointX]
	     * @param {Number} [config.fillRadialGradientStartPointY]
	     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientEndPointX] 
	     * @param {Number} [config.fillRadialGradientEndPointY] 
	     * @param {Number} [config.fillRadialGradientStartRadius]
	     * @param {Number} [config.fillRadialGradientEndRadius]
	     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
	     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
	     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
	     * @param {String} [config.stroke] stroke color
	     * @param {Integer} [config.strokeRed] set stroke red component
	     * @param {Integer} [config.strokeGreen] set stroke green component
	     * @param {Integer} [config.strokeBlue] set stroke blue component
	     * @param {Integer} [config.strokeAlpha] set stroke alpha component
	     * @param {Number} [config.strokeWidth] stroke width
	     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
	     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
	     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
	     *  is miter
	     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
	     *  is butt
	     * @param {String} [config.shadowColor]
	     * @param {Integer} [config.shadowRed] set shadow color red component
	     * @param {Integer} [config.shadowGreen] set shadow color green component
	     * @param {Integer} [config.shadowBlue] set shadow color blue component
	     * @param {Integer} [config.shadowAlpha] set shadow color alpha component
	     * @param {Number} [config.shadowBlur]
	     * @param {Object} [config.shadowOffset] object with x and y component
	     * @param {Number} [config.shadowOffsetX]
	     * @param {Number} [config.shadowOffsetY]
	     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
	     *  between 0 and 1
	     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
	     * @param {Array} [config.dash]
	     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
	     * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	     * @example
	     * // draw a wedge that's pointing downwards
	     * var wedge = new Kinetic.Wedge({
	     *   radius: 40,
	     *   fill: 'red',
	     *   stroke: 'black'
	     *   strokeWidth: 5,
	     *   angleDeg: 60,
	     *   rotationDeg: -120
	     * });
	     */
	    Kinetic.Wedge = function(config) {
	        this.___init(config);
	    };

	    Kinetic.Wedge.prototype = {
	        ___init: function(config) {
	            // call super constructor
	            Kinetic.Shape.call(this, config);
	            this.className = 'Wedge';
	            this.sceneFunc(this._sceneFunc);
	        },
	        _sceneFunc: function(context) {
	            context.beginPath();
	            context.arc(0, 0, this.getRadius(), 0, Kinetic.getAngle(this.getAngle()), this.getClockwise());
	            context.lineTo(0, 0);
	            context.closePath();
	            context.fillStrokeShape(this);
	        }
	    };
	    Kinetic.Util.extend(Kinetic.Wedge, Kinetic.Shape);

	    // add getters setters
	    Kinetic.Factory.addGetterSetter(Kinetic.Wedge, 'radius', 0);

	    /**
	     * get/set radius
	     * @name radius
	     * @method
	     * @memberof Kinetic.Wedge.prototype
	     * @param {Number} radius
	     * @returns {Number}
	     * @example
	     * // get radius
	     * var radius = wedge.radius();
	     *
	     * // set radius
	     * wedge.radius(10);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Wedge, 'angle', 0);

	    /**
	     * get/set angle in degrees
	     * @name angle
	     * @method
	     * @memberof Kinetic.Wedge.prototype
	     * @param {Number} angle
	     * @returns {Number}
	     * @example
	     * // get angle
	     * var angle = wedge.angle();
	     *
	     * // set angle
	     * wedge.angle(20);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Wedge, 'clockwise', false);

	    /**
	     * get/set clockwise flag
	     * @name clockwise
	     * @method
	     * @memberof Kinetic.Wedge.prototype
	     * @param {Number} clockwise
	     * @returns {Number}
	     * @example
	     * // get clockwise flag
	     * var clockwise = wedge.clockwise();
	     *
	     * // draw wedge counter-clockwise
	     * wedge.clockwise(false);
	     *
	     * // draw wedge clockwise
	     * wedge.clockwise(true);
	     */

	    Kinetic.Factory.backCompat(Kinetic.Wedge, {
	        angleDeg: 'angle',
	        getAngleDeg: 'getAngle',
	        setAngleDeg: 'setAngle'
	    });

	    Kinetic.Collection.mapMethods(Kinetic.Wedge);
	})();
	;(function() {
	    /**
	     * Arc constructor
	     * @constructor
	     * @augments Kinetic.Shape
	     * @param {Object} config
	     * @param {Number} config.angle in degrees
	     * @param {Number} config.innerRadius
	     * @param {Number} config.outerRadius
	     * @param {Boolean} [config.clockwise]
	     * @param {String} [config.fill] fill color
	     * @param {Integer} [config.fillRed] set fill red component
	     * @param {Integer} [config.fillGreen] set fill green component
	     * @param {Integer} [config.fillBlue] set fill blue component
	     * @param {Integer} [config.fillAlpha] set fill alpha component
	     * @param {Image} [config.fillPatternImage] fill pattern image
	     * @param {Number} [config.fillPatternX]
	     * @param {Number} [config.fillPatternY]
	     * @param {Object} [config.fillPatternOffset] object with x and y component
	     * @param {Number} [config.fillPatternOffsetX] 
	     * @param {Number} [config.fillPatternOffsetY] 
	     * @param {Object} [config.fillPatternScale] object with x and y component
	     * @param {Number} [config.fillPatternScaleX]
	     * @param {Number} [config.fillPatternScaleY]
	     * @param {Number} [config.fillPatternRotation]
	     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
	     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientStartPointX]
	     * @param {Number} [config.fillLinearGradientStartPointY]
	     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientEndPointX]
	     * @param {Number} [config.fillLinearGradientEndPointY]
	     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
	     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientStartPointX]
	     * @param {Number} [config.fillRadialGradientStartPointY]
	     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientEndPointX] 
	     * @param {Number} [config.fillRadialGradientEndPointY] 
	     * @param {Number} [config.fillRadialGradientStartRadius]
	     * @param {Number} [config.fillRadialGradientEndRadius]
	     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
	     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
	     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
	     * @param {String} [config.stroke] stroke color
	     * @param {Integer} [config.strokeRed] set stroke red component
	     * @param {Integer} [config.strokeGreen] set stroke green component
	     * @param {Integer} [config.strokeBlue] set stroke blue component
	     * @param {Integer} [config.strokeAlpha] set stroke alpha component
	     * @param {Number} [config.strokeWidth] stroke width
	     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
	     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
	     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
	     *  is miter
	     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
	     *  is butt
	     * @param {String} [config.shadowColor]
	     * @param {Integer} [config.shadowRed] set shadow color red component
	     * @param {Integer} [config.shadowGreen] set shadow color green component
	     * @param {Integer} [config.shadowBlue] set shadow color blue component
	     * @param {Integer} [config.shadowAlpha] set shadow color alpha component
	     * @param {Number} [config.shadowBlur]
	     * @param {Object} [config.shadowOffset] object with x and y component
	     * @param {Number} [config.shadowOffsetX]
	     * @param {Number} [config.shadowOffsetY]
	     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
	     *  between 0 and 1
	     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
	     * @param {Array} [config.dash]
	     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
	     * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	     * @example
	     * // draw a Arc that's pointing downwards
	     * var arc = new Kinetic.Arc({
	     *   innerRadius: 40,
	     *   outerRadius: 80,
	     *   fill: 'red',
	     *   stroke: 'black'
	     *   strokeWidth: 5,
	     *   angle: 60,
	     *   rotationDeg: -120
	     * });
	     */
	    Kinetic.Arc = function(config) {
	        this.___init(config);
	    };

	    Kinetic.Arc.prototype = {
	        ___init: function(config) {
	            // call super constructor
	            Kinetic.Shape.call(this, config);
	            this.className = 'Arc';
	            this.sceneFunc(this._sceneFunc);
	        },
	        _sceneFunc: function(context) {
	            var angle = Kinetic.getAngle(this.angle()),
	                clockwise = this.clockwise();

	            context.beginPath();
	            context.arc(0, 0, this.getOuterRadius(), 0, angle, clockwise);
	            context.arc(0, 0, this.getInnerRadius(), angle, 0, !clockwise);
	            context.closePath();
	            context.fillStrokeShape(this);
	        }
	    };
	    Kinetic.Util.extend(Kinetic.Arc, Kinetic.Shape);

	    // add getters setters
	    Kinetic.Factory.addGetterSetter(Kinetic.Arc, 'innerRadius', 0);

	    /**
	     * get/set innerRadius
	     * @name innerRadius
	     * @method
	     * @memberof Kinetic.Arc.prototype
	     * @param {Number} innerRadius
	     * @returns {Number}
	     * @example
	     * // get inner radius
	     * var innerRadius = arc.innerRadius();
	     *
	     * // set inner radius
	     * arc.innerRadius(20);
	     */
	     
	    Kinetic.Factory.addGetterSetter(Kinetic.Arc, 'outerRadius', 0);

	    /**
	     * get/set outerRadius
	     * @name outerRadius
	     * @method
	     * @memberof Kinetic.Arc.prototype
	     * @param {Number} outerRadius
	     * @returns {Number}
	     * @example
	     * // get outer radius
	     * var outerRadius = arc.outerRadius();
	     *
	     * // set outer radius
	     * arc.outerRadius(20);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Arc, 'angle', 0);

	    /**
	     * get/set angle in degrees
	     * @name angle
	     * @method
	     * @memberof Kinetic.Arc.prototype
	     * @param {Number} angle
	     * @returns {Number}
	     * @example
	     * // get angle
	     * var angle = arc.angle();
	     *
	     * // set angle
	     * arc.angle(20);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Arc, 'clockwise', false);

	    /**
	     * get/set clockwise flag
	     * @name clockwise
	     * @method
	     * @memberof Kinetic.Arc.prototype
	     * @param {Boolean} clockwise
	     * @returns {Boolean}
	     * @example
	     * // get clockwise flag
	     * var clockwise = arc.clockwise();
	     *
	     * // draw arc counter-clockwise
	     * arc.clockwise(false);
	     *
	     * // draw arc clockwise
	     * arc.clockwise(true);
	     */

	    Kinetic.Collection.mapMethods(Kinetic.Arc);
	})();
	;(function() {

	    // CONSTANTS
	    var IMAGE = 'Image';

	    /**
	     * Image constructor
	     * @constructor
	     * @memberof Kinetic
	     * @augments Kinetic.Shape
	     * @param {Object} config
	     * @param {Image} config.image
	     * @param {Object} [config.crop]
	     * @param {String} [config.fill] fill color
	     * @param {Integer} [config.fillRed] set fill red component
	     * @param {Integer} [config.fillGreen] set fill green component
	     * @param {Integer} [config.fillBlue] set fill blue component
	     * @param {Integer} [config.fillAlpha] set fill alpha component
	     * @param {Image} [config.fillPatternImage] fill pattern image
	     * @param {Number} [config.fillPatternX]
	     * @param {Number} [config.fillPatternY]
	     * @param {Object} [config.fillPatternOffset] object with x and y component
	     * @param {Number} [config.fillPatternOffsetX] 
	     * @param {Number} [config.fillPatternOffsetY] 
	     * @param {Object} [config.fillPatternScale] object with x and y component
	     * @param {Number} [config.fillPatternScaleX]
	     * @param {Number} [config.fillPatternScaleY]
	     * @param {Number} [config.fillPatternRotation]
	     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
	     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientStartPointX]
	     * @param {Number} [config.fillLinearGradientStartPointY]
	     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientEndPointX]
	     * @param {Number} [config.fillLinearGradientEndPointY]
	     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
	     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientStartPointX]
	     * @param {Number} [config.fillRadialGradientStartPointY]
	     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientEndPointX] 
	     * @param {Number} [config.fillRadialGradientEndPointY] 
	     * @param {Number} [config.fillRadialGradientStartRadius]
	     * @param {Number} [config.fillRadialGradientEndRadius]
	     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
	     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
	     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
	     * @param {String} [config.stroke] stroke color
	     * @param {Integer} [config.strokeRed] set stroke red component
	     * @param {Integer} [config.strokeGreen] set stroke green component
	     * @param {Integer} [config.strokeBlue] set stroke blue component
	     * @param {Integer} [config.strokeAlpha] set stroke alpha component
	     * @param {Number} [config.strokeWidth] stroke width
	     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
	     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
	     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
	     *  is miter
	     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
	     *  is butt
	     * @param {String} [config.shadowColor]
	     * @param {Integer} [config.shadowRed] set shadow color red component
	     * @param {Integer} [config.shadowGreen] set shadow color green component
	     * @param {Integer} [config.shadowBlue] set shadow color blue component
	     * @param {Integer} [config.shadowAlpha] set shadow color alpha component
	     * @param {Number} [config.shadowBlur]
	     * @param {Object} [config.shadowOffset] object with x and y component
	     * @param {Number} [config.shadowOffsetX]
	     * @param {Number} [config.shadowOffsetY]
	     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
	     *  between 0 and 1
	     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
	     * @param {Array} [config.dash]
	     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
	     * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	     * @example
	     * var imageObj = new Image();
	     * imageObj.onload = function() {
	     *   var image = new Kinetic.Image({
	     *     x: 200,
	     *     y: 50,
	     *     image: imageObj,
	     *     width: 100,
	     *     height: 100
	     *   });
	     * };
	     * imageObj.src = '/path/to/image.jpg'
	     */
	    Kinetic.Image = function(config) {
	        this.___init(config);
	    };

	    Kinetic.Image.prototype = {
	        ___init: function(config) {
	            // call super constructor
	            Kinetic.Shape.call(this, config);
	            this.className = IMAGE;
	            this.sceneFunc(this._sceneFunc);
	            this.hitFunc(this._hitFunc);
	        },
	        _useBufferCanvas: function() {
	            return (this.hasShadow() || this.getAbsoluteOpacity() !== 1) && this.hasStroke() && this.getStage();
	        },
	        _sceneFunc: function(context) {
	            var width = this.getWidth(),
	                height = this.getHeight(),
	                image = this.getImage(),
	                cropWidth, cropHeight, params;

	            if (image) {
	                cropWidth = this.getCropWidth();
	                cropHeight = this.getCropHeight();
	                if (cropWidth && cropHeight) {
	                    params = [image, this.getCropX(), this.getCropY(), cropWidth, cropHeight, 0, 0, width, height];
	                } else {
	                    params = [image, 0, 0, width, height];
	                }
	            }

	            if (this.hasFill() || this.hasStroke() || this.hasShadow()) {
	                context.beginPath();
	                context.rect(0, 0, width, height);
	                context.closePath();
	                context.fillStrokeShape(this);
	            }

	            if (image) {
	                context.drawImage.apply(context, params);
	            }
	        },
	        _hitFunc: function(context) {
	            var width = this.getWidth(),
	                height = this.getHeight();

	            context.beginPath();
	            context.rect(0, 0, width, height);
	            context.closePath();
	            context.fillStrokeShape(this);
	        },
	        getWidth: function() {
	            var image = this.getImage();
	            return this.attrs.width || (image ? image.width : 0);
	        },
	        getHeight: function() {
	            var image = this.getImage();
	            return this.attrs.height || (image ? image.height : 0);
	        }
	    };
	    Kinetic.Util.extend(Kinetic.Image, Kinetic.Shape);

	    // add getters setters
	    Kinetic.Factory.addGetterSetter(Kinetic.Image, 'image');

	    /**
	     * set image
	     * @name setImage
	     * @method
	     * @memberof Kinetic.Image.prototype
	     * @param {Image} image
	     */

	    /**
	     * get image
	     * @name getImage
	     * @method
	     * @memberof Kinetic.Image.prototype
	     * @returns {Image}
	     */

	    Kinetic.Factory.addComponentsGetterSetter(Kinetic.Image, 'crop', ['x', 'y', 'width', 'height']);
	    /**
	     * get/set crop
	     * @method
	     * @name crop
	     * @memberof Kinetic.Image.prototype
	     * @param {Object} crop 
	     * @param {Number} crop.x
	     * @param {Number} crop.y
	     * @param {Number} crop.width
	     * @param {Number} crop.height
	     * @returns {Object}
	     * @example
	     * // get crop
	     * var crop = image.crop();
	     *
	     * // set crop
	     * image.crop({
	     *   x: 20,
	     *   y: 20,
	     *   width: 20,
	     *   height: 20
	     * });
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Image, 'cropX', 0);
	    /**
	     * get/set crop x
	     * @method
	     * @name cropX
	     * @memberof Kinetic.Image.prototype
	     * @param {Number} x
	     * @returns {Number}
	     * @example
	     * // get crop x
	     * var cropX = image.cropX();
	     *
	     * // set crop x
	     * image.cropX(20);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Image, 'cropY', 0);
	    /**
	     * get/set crop y
	     * @name cropY
	     * @method
	     * @memberof Kinetic.Image.prototype
	     * @param {Number} y
	     * @returns {Number}
	     * @example
	     * // get crop y
	     * var cropY = image.cropY();
	     *
	     * // set crop y
	     * image.cropY(20);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Image, 'cropWidth', 0);
	    /**
	     * get/set crop width
	     * @name cropWidth
	     * @method
	     * @memberof Kinetic.Image.prototype
	     * @param {Number} width
	     * @returns {Number}
	     * @example
	     * // get crop width
	     * var cropWidth = image.cropWidth();
	     *
	     * // set crop width
	     * image.cropWidth(20);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Image, 'cropHeight', 0);
	    /**
	     * get/set crop height
	     * @name cropHeight
	     * @method
	     * @memberof Kinetic.Image.prototype
	     * @param {Number} height
	     * @returns {Number}
	     * @example
	     * // get crop height
	     * var cropHeight = image.cropHeight();
	     *
	     * // set crop height
	     * image.cropHeight(20);
	     */

	    Kinetic.Collection.mapMethods(Kinetic.Image);
	})();
	;(function() {
	    // constants
	    var AUTO = 'auto',
	        //CANVAS = 'canvas',
	        CENTER = 'center',
	        CHANGE_KINETIC = 'Change.kinetic',
	        CONTEXT_2D = '2d',
	        DASH = '-',
	        EMPTY_STRING = '',
	        LEFT = 'left',
	        TEXT = 'text',
	        TEXT_UPPER = 'Text',
	        MIDDLE = 'middle',
	        NORMAL = 'normal',
	        PX_SPACE = 'px ',
	        SPACE = ' ',
	        RIGHT = 'right',
	        WORD = 'word',
	        CHAR = 'char',
	        NONE = 'none',
	        ATTR_CHANGE_LIST = ['fontFamily', 'fontSize', 'fontStyle', 'fontVariant', 'padding', 'align', 'lineHeight', 'text', 'width', 'height', 'wrap'],

	        // cached variables
	        attrChangeListLen = ATTR_CHANGE_LIST.length,
	        dummyContext = Kinetic.Util.createCanvasElement().getContext(CONTEXT_2D);

	    /**
	     * Text constructor
	     * @constructor
	     * @memberof Kinetic
	     * @augments Kinetic.Shape
	     * @param {Object} config
	     * @param {String} [config.fontFamily] default is Arial
	     * @param {Number} [config.fontSize] in pixels.  Default is 12
	     * @param {String} [config.fontStyle] can be normal, bold, or italic.  Default is normal
	     * @param {String} [config.fontVariant] can be normal or small-caps.  Default is normal
	     * @param {String} config.text
	     * @param {String} [config.align] can be left, center, or right
	     * @param {Number} [config.padding]
	     * @param {Number} [config.width] default is auto
	     * @param {Number} [config.height] default is auto
	     * @param {Number} [config.lineHeight] default is 1
	     * @param {String} [config.wrap] can be word, char, or none. Default is word
	     * @param {String} [config.fill] fill color
	     * @param {Integer} [config.fillRed] set fill red component
	     * @param {Integer} [config.fillGreen] set fill green component
	     * @param {Integer} [config.fillBlue] set fill blue component
	     * @param {Integer} [config.fillAlpha] set fill alpha component
	     * @param {Image} [config.fillPatternImage] fill pattern image
	     * @param {Number} [config.fillPatternX]
	     * @param {Number} [config.fillPatternY]
	     * @param {Object} [config.fillPatternOffset] object with x and y component
	     * @param {Number} [config.fillPatternOffsetX] 
	     * @param {Number} [config.fillPatternOffsetY] 
	     * @param {Object} [config.fillPatternScale] object with x and y component
	     * @param {Number} [config.fillPatternScaleX]
	     * @param {Number} [config.fillPatternScaleY]
	     * @param {Number} [config.fillPatternRotation]
	     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
	     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientStartPointX]
	     * @param {Number} [config.fillLinearGradientStartPointY]
	     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientEndPointX]
	     * @param {Number} [config.fillLinearGradientEndPointY]
	     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
	     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientStartPointX]
	     * @param {Number} [config.fillRadialGradientStartPointY]
	     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientEndPointX] 
	     * @param {Number} [config.fillRadialGradientEndPointY] 
	     * @param {Number} [config.fillRadialGradientStartRadius]
	     * @param {Number} [config.fillRadialGradientEndRadius]
	     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
	     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
	     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
	     * @param {String} [config.stroke] stroke color
	     * @param {Integer} [config.strokeRed] set stroke red component
	     * @param {Integer} [config.strokeGreen] set stroke green component
	     * @param {Integer} [config.strokeBlue] set stroke blue component
	     * @param {Integer} [config.strokeAlpha] set stroke alpha component
	     * @param {Number} [config.strokeWidth] stroke width
	     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
	     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
	     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
	     *  is miter
	     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
	     *  is butt
	     * @param {String} [config.shadowColor]
	     * @param {Integer} [config.shadowRed] set shadow color red component
	     * @param {Integer} [config.shadowGreen] set shadow color green component
	     * @param {Integer} [config.shadowBlue] set shadow color blue component
	     * @param {Integer} [config.shadowAlpha] set shadow color alpha component
	     * @param {Number} [config.shadowBlur]
	     * @param {Object} [config.shadowOffset] object with x and y component
	     * @param {Number} [config.shadowOffsetX]
	     * @param {Number} [config.shadowOffsetY]
	     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
	     *  between 0 and 1
	     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
	     * @param {Array} [config.dash]
	     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
	     * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	     * @example
	     * var text = new Kinetic.Text({
	     *   x: 10,
	     *   y: 15,
	     *   text: 'Simple Text',
	     *   fontSize: 30,
	     *   fontFamily: 'Calibri',
	     *   fill: 'green'
	     * });
	     */
	    Kinetic.Text = function(config) {
	        this.___init(config);
	    };
	    function _fillFunc(context) {
	        context.fillText(this.partialText, 0, 0);
	    }
	    function _strokeFunc(context) {
	        context.strokeText(this.partialText, 0, 0);
	    }

	    Kinetic.Text.prototype = {
	        ___init: function(config) {
	            var that = this;

	            if (config.width === undefined) {
	                config.width = AUTO;
	            }
	            if (config.height === undefined) {
	                config.height = AUTO;
	            }

	            // call super constructor
	            Kinetic.Shape.call(this, config);

	            this._fillFunc = _fillFunc;
	            this._strokeFunc = _strokeFunc;
	            this.className = TEXT_UPPER;

	            // update text data for certain attr changes
	            for(var n = 0; n < attrChangeListLen; n++) {
	                this.on(ATTR_CHANGE_LIST[n] + CHANGE_KINETIC, that._setTextData);
	            }

	            this._setTextData();
	            this.sceneFunc(this._sceneFunc);
	            this.hitFunc(this._hitFunc);
	        },
	        _sceneFunc: function(context) {
	            var p = this.getPadding(),
	                textHeight = this.getTextHeight(),
	                lineHeightPx = this.getLineHeight() * textHeight,
	                textArr = this.textArr,
	                textArrLen = textArr.length,
	                totalWidth = this.getWidth(),
	                n;

	            context.setAttr('font', this._getContextFont());
	            context.setAttr('textBaseline', MIDDLE);
	            context.setAttr('textAlign', LEFT);
	            context.save();
	            context.translate(p, 0);
	            context.translate(0, p + textHeight / 2);

	            // draw text lines
	            for(n = 0; n < textArrLen; n++) {
	                var obj = textArr[n],
	                    text = obj.text,
	                    width = obj.width;

	                // horizontal alignment
	                context.save();
	                if(this.getAlign() === RIGHT) {
	                    context.translate(totalWidth - width - p * 2, 0);
	                }
	                else if(this.getAlign() === CENTER) {
	                    context.translate((totalWidth - width - p * 2) / 2, 0);
	                }

	                this.partialText = text;
	                context.fillStrokeShape(this);
	                context.restore();
	                context.translate(0, lineHeightPx);
	            }
	            context.restore();
	        },
	        _hitFunc: function(context) {
	            var width = this.getWidth(),
	                height = this.getHeight();

	            context.beginPath();
	            context.rect(0, 0, width, height);
	            context.closePath();
	            context.fillStrokeShape(this);
	        },
	        setText: function(text) {
	            var str = Kinetic.Util._isString(text) ? text : text.toString();
	            this._setAttr(TEXT, str);
	            return this;
	        },
	        /**
	         * get width of text area, which includes padding
	         * @method
	         * @memberof Kinetic.Text.prototype
	         * @returns {Number}
	         */
	        getWidth: function() {
	            return this.attrs.width === AUTO ? this.getTextWidth() + this.getPadding() * 2 : this.attrs.width;
	        },
	        /**
	         * get the height of the text area, which takes into account multi-line text, line heights, and padding
	         * @method
	         * @memberof Kinetic.Text.prototype
	         * @returns {Number}
	         */
	        getHeight: function() {
	            return this.attrs.height === AUTO ? (this.getTextHeight() * this.textArr.length * this.getLineHeight()) + this.getPadding() * 2 : this.attrs.height;
	        },
	        /**
	         * get text width
	         * @method
	         * @memberof Kinetic.Text.prototype
	         * @returns {Number}
	         */
	        getTextWidth: function() {
	            return this.textWidth;
	        },
	        /**
	         * get text height
	         * @method
	         * @memberof Kinetic.Text.prototype
	         * @returns {Number}
	         */
	        getTextHeight: function() {
	            return this.textHeight;
	        },
	        _getTextSize: function(text) {
	            var _context = dummyContext,
	                fontSize = this.getFontSize(),
	                metrics;

	            _context.save();
	            _context.font = this._getContextFont();

	            metrics = _context.measureText(text);
	            _context.restore();
	            return {
	                width: metrics.width,
	                height: parseInt(fontSize, 10)
	            };
	        },
	        _getContextFont: function() {
	            return this.getFontStyle() + SPACE + this.getFontVariant() + SPACE + this.getFontSize() + PX_SPACE + this.getFontFamily();
	        },
	        _addTextLine: function (line, width) {
	            return this.textArr.push({text: line, width: width});
	        },
	        _getTextWidth: function (text) {
	            return dummyContext.measureText(text).width;
	        },
	        _setTextData: function () {
	            var lines = this.getText().split('\n'),
	                fontSize = +this.getFontSize(),
	                textWidth = 0,
	                lineHeightPx = this.getLineHeight() * fontSize,
	                width = this.attrs.width,
	                height = this.attrs.height,
	                fixedWidth = width !== AUTO,
	                fixedHeight = height !== AUTO,
	                padding = this.getPadding(),
	                maxWidth = width - padding * 2,
	                maxHeightPx = height - padding * 2,
	                currentHeightPx = 0,
	                wrap = this.getWrap(),
	                shouldWrap = wrap !== NONE,
	                wrapAtWord = wrap !==  CHAR && shouldWrap;

	            this.textArr = [];
	            dummyContext.save();
	            dummyContext.font = this._getContextFont();
	            for (var i = 0, max = lines.length; i < max; ++i) {
	                var line = lines[i],
	                    lineWidth = this._getTextWidth(line);
	                if (fixedWidth && lineWidth > maxWidth) {
	                    /*
	                     * if width is fixed and line does not fit entirely
	                     * break the line into multiple fitting lines
	                     */
	                    while (line.length > 0) {
	                        /*
	                         * use binary search to find the longest substring that
	                         * that would fit in the specified width
	                         */
	                        var low = 0, high = line.length,
	                            match = '', matchWidth = 0;
	                        while (low < high) {
	                            var mid = (low + high) >>> 1,
	                                substr = line.slice(0, mid + 1),
	                                substrWidth = this._getTextWidth(substr);
	                            if (substrWidth <= maxWidth) {
	                                low = mid + 1;
	                                match = substr;
	                                matchWidth = substrWidth;
	                            } else {
	                                high = mid;
	                            }
	                        }
	                        /*
	                         * 'low' is now the index of the substring end
	                         * 'match' is the substring
	                         * 'matchWidth' is the substring width in px
	                         */
	                        if (match) {
	                            // a fitting substring was found
	                            if (wrapAtWord) {
	                                // try to find a space or dash where wrapping could be done
	                                var wrapIndex = Math.max(match.lastIndexOf(SPACE),
	                                                          match.lastIndexOf(DASH)) + 1;
	                                if (wrapIndex > 0) {
	                                    // re-cut the substring found at the space/dash position
	                                    low = wrapIndex;
	                                    match = match.slice(0, low);
	                                    matchWidth = this._getTextWidth(match);
	                                }
	                            }
	                            this._addTextLine(match, matchWidth);
	                            textWidth = Math.max(textWidth, matchWidth);
	                            currentHeightPx += lineHeightPx;
	                            if (!shouldWrap ||
	                                (fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx)) {
	                                /*
	                                 * stop wrapping if wrapping is disabled or if adding
	                                 * one more line would overflow the fixed height
	                                 */
	                                break;
	                            }
	                            line = line.slice(low);
	                            if (line.length > 0) {
	                                // Check if the remaining text would fit on one line
	                                lineWidth = this._getTextWidth(line);
	                                if (lineWidth <= maxWidth) {
	                                    // if it does, add the line and break out of the loop
	                                    this._addTextLine(line, lineWidth);
	                                    currentHeightPx += lineHeightPx;
	                                    textWidth = Math.max(textWidth, lineWidth);
	                                    break;
	                                }
	                            }
	                        } else {
	                            // not even one character could fit in the element, abort
	                            break;
	                        }
	                    }
	                } else {
	                    // element width is automatically adjusted to max line width
	                    this._addTextLine(line, lineWidth);
	                    currentHeightPx += lineHeightPx;
	                    textWidth = Math.max(textWidth, lineWidth);
	                }
	                // if element height is fixed, abort if adding one more line would overflow
	                if (fixedHeight && currentHeightPx + lineHeightPx > maxHeightPx) {
	                    break;
	                }
	            }
	            dummyContext.restore();
	            this.textHeight = fontSize;
	            this.textWidth = textWidth;
	        }
	    };
	    Kinetic.Util.extend(Kinetic.Text, Kinetic.Shape);

	    // add getters setters
	    Kinetic.Factory.addGetterSetter(Kinetic.Text, 'fontFamily', 'Arial');

	    /**
	     * get/set font family
	     * @name fontFamily
	     * @method
	     * @memberof Kinetic.Text.prototype
	     * @param {String} fontFamily
	     * @returns {String}
	     * @example
	     * // get font family
	     * var fontFamily = text.fontFamily();
	     *
	     * // set font family
	     * text.fontFamily('Arial');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Text, 'fontSize', 12);

	    /**
	     * get/set font size in pixels
	     * @name fontSize
	     * @method
	     * @memberof Kinetic.Text.prototype
	     * @param {Number} fontSize
	     * @returns {Number}
	     * @example
	     * // get font size
	     * var fontSize = text.fontSize();
	     *
	     * // set font size to 22px
	     * text.fontSize(22);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Text, 'fontStyle', NORMAL);

	    /**
	     * set font style.  Can be 'normal', 'italic', or 'bold'.  'normal' is the default.
	     * @name fontStyle
	     * @method
	     * @memberof Kinetic.Text.prototype
	     * @param {String} fontStyle
	     * @returns {String}
	     * @example
	     * // get font style
	     * var fontStyle = text.fontStyle();
	     *
	     * // set font style
	     * text.fontStyle('bold');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Text, 'fontVariant', NORMAL);

	    /**
	     * set font variant.  Can be 'normal' or 'small-caps'.  'normal' is the default.
	     * @name fontVariant
	     * @method
	     * @memberof Kinetic.Text.prototype
	     * @param {String} fontVariant
	     * @returns {String}
	     * @example
	     * // get font variant
	     * var fontVariant = text.fontVariant();
	     *
	     * // set font variant
	     * text.fontVariant('small-caps');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Text, 'padding', 0);

	    /**
	     * set padding
	     * @name padding
	     * @method
	     * @memberof Kinetic.Text.prototype
	     * @param {Number} padding
	     * @returns {Number}
	     * @example
	     * // get padding
	     * var padding = text.padding();
	     * 
	     * // set padding to 10 pixels
	     * text.padding(10);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Text, 'align', LEFT);

	    /**
	     * get/set horizontal align of text.  Can be 'left', 'center', or 'right'
	     * @name align
	     * @method
	     * @memberof Kinetic.Text.prototype
	     * @param {String} align
	     * @returns {String}
	     * @example
	     * // get text align
	     * var align = text.align();
	     *
	     * // center text
	     * text.align('center');
	     *
	     * // align text to right
	     * text.align('right');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Text, 'lineHeight', 1);

	    /**
	     * get/set line height.  The default is 1.
	     * @name lineHeight
	     * @method
	     * @memberof Kinetic.Text.prototype
	     * @param {Number} lineHeight
	     * @returns {Number}
	     * @example 
	     * // get line height
	     * var lineHeight = text.lineHeight();
	     *
	     * // set the line height
	     * text.lineHeight(2);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Text, 'wrap', WORD);

	    /**
	     * get/set wrap.  Can be word, char, or none. Default is word.
	     * @name wrap
	     * @method
	     * @memberof Kinetic.Text.prototype
	     * @param {String} wrap
	     * @returns {String}
	     * @example
	     * // get wrap
	     * var wrap = text.wrap();
	     *
	     * // set wrap
	     * text.wrap('word');
	     */

	    Kinetic.Factory.addGetter(Kinetic.Text, 'text', EMPTY_STRING);
	    Kinetic.Factory.addOverloadedGetterSetter(Kinetic.Text, 'text');

	    /**
	     * get/set text
	     * @name getText
	     * @method
	     * @memberof Kinetic.Text.prototype
	     * @param {String} text
	     * @returns {String}
	     * @example
	     * // get text
	     * var text = text.text();
	     * 
	     * // set text
	     * text.text('Hello world!');
	     */

	    Kinetic.Collection.mapMethods(Kinetic.Text);
	})();
	;(function() {
	    /**
	     * Line constructor.&nbsp; Lines are defined by an array of points and
	     *  a tension
	     * @constructor
	     * @memberof Kinetic
	     * @augments Kinetic.Shape
	     * @param {Object} config
	     * @param {Array} config.points
	     * @param {Number} [config.tension] Higher values will result in a more curvy line.  A value of 0 will result in no interpolation.
	     *   The default is 0
	     * @param {Boolean} [config.closed] defines whether or not the line shape is closed, creating a polygon or blob 
	     * @param {String} [config.fill] fill color
	     * @param {Integer} [config.fillRed] set fill red component
	     * @param {Integer} [config.fillGreen] set fill green component
	     * @param {Integer} [config.fillBlue] set fill blue component
	     * @param {Integer} [config.fillAlpha] set fill alpha component
	     * @param {Image} [config.fillPatternImage] fill pattern image
	     * @param {Number} [config.fillPatternX]
	     * @param {Number} [config.fillPatternY]
	     * @param {Object} [config.fillPatternOffset] object with x and y component
	     * @param {Number} [config.fillPatternOffsetX] 
	     * @param {Number} [config.fillPatternOffsetY] 
	     * @param {Object} [config.fillPatternScale] object with x and y component
	     * @param {Number} [config.fillPatternScaleX]
	     * @param {Number} [config.fillPatternScaleY]
	     * @param {Number} [config.fillPatternRotation]
	     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
	     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientStartPointX]
	     * @param {Number} [config.fillLinearGradientStartPointY]
	     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientEndPointX]
	     * @param {Number} [config.fillLinearGradientEndPointY]
	     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
	     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientStartPointX]
	     * @param {Number} [config.fillRadialGradientStartPointY]
	     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientEndPointX] 
	     * @param {Number} [config.fillRadialGradientEndPointY] 
	     * @param {Number} [config.fillRadialGradientStartRadius]
	     * @param {Number} [config.fillRadialGradientEndRadius]
	     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
	     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
	     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
	     * @param {String} [config.stroke] stroke color
	     * @param {Integer} [config.strokeRed] set stroke red component
	     * @param {Integer} [config.strokeGreen] set stroke green component
	     * @param {Integer} [config.strokeBlue] set stroke blue component
	     * @param {Integer} [config.strokeAlpha] set stroke alpha component
	     * @param {Number} [config.strokeWidth] stroke width
	     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
	     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
	     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
	     *  is miter
	     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
	     *  is butt
	     * @param {String} [config.shadowColor]
	     * @param {Integer} [config.shadowRed] set shadow color red component
	     * @param {Integer} [config.shadowGreen] set shadow color green component
	     * @param {Integer} [config.shadowBlue] set shadow color blue component
	     * @param {Integer} [config.shadowAlpha] set shadow color alpha component
	     * @param {Number} [config.shadowBlur]
	     * @param {Object} [config.shadowOffset] object with x and y component
	     * @param {Number} [config.shadowOffsetX]
	     * @param {Number} [config.shadowOffsetY]
	     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
	     *  between 0 and 1
	     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
	     * @param {Array} [config.dash]
	     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
	     * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	     * @example
	     * var line = new Kinetic.Line({
	     *   x: 100,
	     *   y: 50,
	     *   points: [73, 70, 340, 23, 450, 60, 500, 20],
	     *   stroke: 'red',
	     *   tension: 1
	     * });
	     */
	    Kinetic.Line = function(config) {
	        this.___init(config);
	    };

	    Kinetic.Line.prototype = {
	        ___init: function(config) {
	            // call super constructor
	            Kinetic.Shape.call(this, config);
	            this.className = 'Line';

	            this.on('pointsChange.kinetic tensionChange.kinetic closedChange.kinetic', function() {
	                this._clearCache('tensionPoints');
	            });

	            this.sceneFunc(this._sceneFunc);
	        },
	        _sceneFunc: function(context) {
	            var points = this.getPoints(),
	                length = points.length,
	                tension = this.getTension(),
	                closed = this.getClosed(),
	                tp, len, n;

	            context.beginPath();
	            context.moveTo(points[0], points[1]);

	            // tension
	            if(tension !== 0 && length > 4) {
	                tp = this.getTensionPoints();
	                len = tp.length;
	                n = closed ? 0 : 4;

	                if (!closed) {
	                    context.quadraticCurveTo(tp[0], tp[1], tp[2], tp[3]);
	                }

	                while(n < len - 2) {
	                    context.bezierCurveTo(tp[n++], tp[n++], tp[n++], tp[n++], tp[n++], tp[n++]);
	                }

	                if (!closed) {
	                    context.quadraticCurveTo(tp[len-2], tp[len-1], points[length-2], points[length-1]);
	                }
	            }
	            // no tension
	            else {
	                for(n = 2; n < length; n+=2) {
	                    context.lineTo(points[n], points[n+1]);
	                }
	            }

	            // closed e.g. polygons and blobs
	            if (closed) {
	                context.closePath();
	                context.fillStrokeShape(this);
	            }
	            // open e.g. lines and splines
	            else {
	                context.strokeShape(this);
	            }
	        },
	        getTensionPoints: function() {
	            return this._getCache('tensionPoints', this._getTensionPoints);
	        },
	        _getTensionPoints: function() {
	            if (this.getClosed()) {
	                return this._getTensionPointsClosed();
	            }
	            else {
	                return Kinetic.Util._expandPoints(this.getPoints(), this.getTension());
	            }
	        },
	        _getTensionPointsClosed: function() {
	            var p = this.getPoints(),
	                len = p.length,
	                tension = this.getTension(),
	                util = Kinetic.Util,
	                firstControlPoints = util._getControlPoints(
	                    p[len-2],
	                    p[len-1],
	                    p[0],
	                    p[1],
	                    p[2],
	                    p[3],
	                    tension
	                ),
	                lastControlPoints = util._getControlPoints(
	                    p[len-4],
	                    p[len-3],
	                    p[len-2],
	                    p[len-1],
	                    p[0],
	                    p[1],
	                    tension
	                ),
	                middle = Kinetic.Util._expandPoints(p, tension),
	                tp = [
	                    firstControlPoints[2],
	                    firstControlPoints[3]
	                ]
	                .concat(middle)
	                .concat([
	                    lastControlPoints[0],
	                    lastControlPoints[1],
	                    p[len-2],
	                    p[len-1],
	                    lastControlPoints[2],
	                    lastControlPoints[3],
	                    firstControlPoints[0],
	                    firstControlPoints[1],
	                    p[0],
	                    p[1]
	                ]);
	                    
	            return tp;
	        }
	    };
	    Kinetic.Util.extend(Kinetic.Line, Kinetic.Shape);

	    // add getters setters
	    Kinetic.Factory.addGetterSetter(Kinetic.Line, 'closed', false);

	    /**
	     * get/set closed flag.  The default is false
	     * @name closed
	     * @method
	     * @memberof Kinetic.Line.prototype
	     * @param {Boolean} closed
	     * @returns {Boolean}
	     * @example
	     * // get closed flag
	     * var closed = line.closed();
	     *
	     * // close the shape
	     * line.closed(true);
	     *
	     * // open the shape
	     * line.closed(false);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Line, 'tension', 0);

	    /**
	     * get/set tension
	     * @name tension
	     * @method
	     * @memberof Kinetic.Line.prototype
	     * @param {Number} Higher values will result in a more curvy line.  A value of 0 will result in no interpolation.
	     *   The default is 0
	     * @returns {Number}
	     * @example
	     * // get tension
	     * var tension = line.tension();
	     *
	     * // set tension
	     * line.tension(3);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Line, 'points');
	    /**
	     * get/set points array
	     * @name points
	     * @method
	     * @memberof Kinetic.Line.prototype
	     * @param {Array} points
	     * @returns {Array}
	     * @example
	     * // get points
	     * var points = line.points();
	     *
	     * // set points
	     * line.points([10, 20, 30, 40, 50, 60]);
	     *
	     * // push a new point
	     * line.points(line.points().concat([70, 80]));
	     */

	    Kinetic.Collection.mapMethods(Kinetic.Line);
	})();;(function() {
	    /**
	     * Sprite constructor
	     * @constructor
	     * @memberof Kinetic
	     * @augments Kinetic.Shape
	     * @param {Object} config
	     * @param {String} config.animation animation key
	     * @param {Object} config.animations animation map
	     * @param {Integer} [config.frameIndex] animation frame index
	     * @param {Image} config.image image object
	     * @param {String} [config.fill] fill color
	     * @param {Integer} [config.fillRed] set fill red component
	     * @param {Integer} [config.fillGreen] set fill green component
	     * @param {Integer} [config.fillBlue] set fill blue component
	     * @param {Integer} [config.fillAlpha] set fill alpha component
	     * @param {Image} [config.fillPatternImage] fill pattern image
	     * @param {Number} [config.fillPatternX]
	     * @param {Number} [config.fillPatternY]
	     * @param {Object} [config.fillPatternOffset] object with x and y component
	     * @param {Number} [config.fillPatternOffsetX] 
	     * @param {Number} [config.fillPatternOffsetY] 
	     * @param {Object} [config.fillPatternScale] object with x and y component
	     * @param {Number} [config.fillPatternScaleX]
	     * @param {Number} [config.fillPatternScaleY]
	     * @param {Number} [config.fillPatternRotation]
	     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
	     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientStartPointX]
	     * @param {Number} [config.fillLinearGradientStartPointY]
	     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientEndPointX]
	     * @param {Number} [config.fillLinearGradientEndPointY]
	     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
	     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientStartPointX]
	     * @param {Number} [config.fillRadialGradientStartPointY]
	     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientEndPointX] 
	     * @param {Number} [config.fillRadialGradientEndPointY] 
	     * @param {Number} [config.fillRadialGradientStartRadius]
	     * @param {Number} [config.fillRadialGradientEndRadius]
	     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
	     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
	     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
	     * @param {String} [config.stroke] stroke color
	     * @param {Integer} [config.strokeRed] set stroke red component
	     * @param {Integer} [config.strokeGreen] set stroke green component
	     * @param {Integer} [config.strokeBlue] set stroke blue component
	     * @param {Integer} [config.strokeAlpha] set stroke alpha component
	     * @param {Number} [config.strokeWidth] stroke width
	     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
	     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
	     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
	     *  is miter
	     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
	     *  is butt
	     * @param {String} [config.shadowColor]
	     * @param {Integer} [config.shadowRed] set shadow color red component
	     * @param {Integer} [config.shadowGreen] set shadow color green component
	     * @param {Integer} [config.shadowBlue] set shadow color blue component
	     * @param {Integer} [config.shadowAlpha] set shadow color alpha component
	     * @param {Number} [config.shadowBlur]
	     * @param {Object} [config.shadowOffset] object with x and y component
	     * @param {Number} [config.shadowOffsetX]
	     * @param {Number} [config.shadowOffsetY]
	     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
	     *  between 0 and 1
	     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
	     * @param {Array} [config.dash]
	     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
	     * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	     * @example
	     * var imageObj = new Image();
	     * imageObj.onload = function() {
	     *   var sprite = new Kinetic.Sprite({
	     *     x: 200,
	     *     y: 100,
	     *     image: imageObj,
	     *     animation: 'standing',
	     *     animations: {
	     *       standing: [
	     *         // x, y, width, height (6 frames)
	     *         0, 0, 49, 109,
	     *         52, 0, 49, 109,
	     *         105, 0, 49, 109,
	     *         158, 0, 49, 109,
	     *         210, 0, 49, 109,
	     *         262, 0, 49, 109
	     *       ],
	     *       kicking: [
	     *         // x, y, width, height (6 frames)
	     *         0, 109, 45, 98,
	     *         45, 109, 45, 98,
	     *         95, 109, 63, 98,
	     *         156, 109, 70, 98,
	     *         229, 109, 60, 98,
	     *         287, 109, 41, 98
	     *       ]          
	     *     },
	     *     frameRate: 7,
	     *     frameIndex: 0
	     *   });
	     * };
	     * imageObj.src = '/path/to/image.jpg'
	     */
	    Kinetic.Sprite = function(config) {
	        this.___init(config);
	    };

	    Kinetic.Sprite.prototype = {
	        ___init: function(config) {
	            // call super constructor
	            Kinetic.Shape.call(this, config);
	            this.className = 'Sprite';

	            this._updated = true;
	            var that = this;
	            this.anim = new Kinetic.Animation(function() {
	                // if we don't need to redraw layer we should return false
	                var updated = that._updated;
	                that._updated = false;
	                return updated;
	            });
	            this.on('animationChange.kinetic', function() {
	                // reset index when animation changes
	                this.frameIndex(0);
	            });
	            this.on('frameIndexChange.kinetic', function() {
	                this._updated = true;
	            });
	            // smooth change for frameRate
	            this.on('frameRateChange.kinetic', function() {
	                if (!this.anim.isRunning()) {
	                    return;
	                }
	                clearInterval(this.interval);
	                this._setInterval();
	            });

	            this.sceneFunc(this._sceneFunc);
	            this.hitFunc(this._hitFunc);
	        },
	        _sceneFunc: function(context) {
	            var anim = this.getAnimation(),
	                index = this.frameIndex(),
	                ix4 = index * 4,
	                set = this.getAnimations()[anim],
	                x =      set[ix4 + 0],
	                y =      set[ix4 + 1],
	                width =  set[ix4 + 2],
	                height = set[ix4 + 3],
	                image = this.getImage();

	            if(image) {
	                context.drawImage(image, x, y, width, height, 0, 0, width, height);
	            }
	        },
	        _hitFunc: function(context) {
	            var anim = this.getAnimation(),
	                index = this.frameIndex(),
	                ix4 = index * 4,
	                set = this.getAnimations()[anim],
	                width =  set[ix4 + 2],
	                height = set[ix4 + 3];

	            context.beginPath();
	            context.rect(0, 0, width, height);
	            context.closePath();
	            context.fillShape(this);
	        },
	        _useBufferCanvas: function() {
	            return (this.hasShadow() || this.getAbsoluteOpacity() !== 1) && this.hasStroke();
	        },
	        _setInterval: function() {
	            var that = this;
	            this.interval = setInterval(function() {
	                that._updateIndex();
	            }, 1000 / this.getFrameRate());
	        },
	        /**
	         * start sprite animation
	         * @method
	         * @memberof Kinetic.Sprite.prototype
	         */
	        start: function() {
	            var layer = this.getLayer();

	            /*
	             * animation object has no executable function because
	             *  the updates are done with a fixed FPS with the setInterval
	             *  below.  The anim object only needs the layer reference for
	             *  redraw
	             */
	            this.anim.setLayers(layer);
	            this._setInterval();
	            this.anim.start();
	        },
	        /**
	         * stop sprite animation
	         * @method
	         * @memberof Kinetic.Sprite.prototype
	         */
	        stop: function() {
	            this.anim.stop();
	            clearInterval(this.interval);
	        },
	        /**
	         * determine if animation of sprite is running or not.  returns true or false
	         * @method
	         * @memberof Kinetic.Animation.prototype
	         * @returns {Boolean}
	         */
	        isRunning: function() {
	            return this.anim.isRunning();
	        },
	        _updateIndex: function() {
	            var index = this.frameIndex(),
	                animation = this.getAnimation(),
	                animations = this.getAnimations(),
	                anim = animations[animation],
	                len = anim.length / 4;

	            if(index < len - 1) {
	                this.frameIndex(index + 1);
	            }
	            else {
	                this.frameIndex(0);
	            }
	        }
	    };
	    Kinetic.Util.extend(Kinetic.Sprite, Kinetic.Shape);

	    // add getters setters
	    Kinetic.Factory.addGetterSetter(Kinetic.Sprite, 'animation');

	    /**
	     * get/set animation key
	     * @name animation
	     * @method
	     * @memberof Kinetic.Sprite.prototype
	     * @param {String} anim animation key
	     * @returns {String}
	     * @example
	     * // get animation key
	     * var animation = sprite.animation();
	     *
	     * // set animation key
	     * sprite.animation('kicking');
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Sprite, 'animations');

	    /**
	     * get/set animations map
	     * @name animations
	     * @method
	     * @memberof Kinetic.Sprite.prototype
	     * @param {Object} animations
	     * @returns {Object}
	     * @example
	     * // get animations map
	     * var animations = sprite.animations();
	     * 
	     * // set animations map
	     * sprite.animations({
	     *   standing: [
	     *     // x, y, width, height (6 frames)
	     *     0, 0, 49, 109,
	     *     52, 0, 49, 109,
	     *     105, 0, 49, 109,
	     *     158, 0, 49, 109,
	     *     210, 0, 49, 109,
	     *     262, 0, 49, 109
	     *   ],
	     *   kicking: [
	     *     // x, y, width, height (6 frames)
	     *     0, 109, 45, 98,
	     *     45, 109, 45, 98,
	     *     95, 109, 63, 98,
	     *     156, 109, 70, 98,
	     *     229, 109, 60, 98,
	     *     287, 109, 41, 98
	     *   ]          
	     * });
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Sprite, 'image');

	    /**
	     * get/set image
	     * @name image
	     * @method
	     * @memberof Kinetic.Sprite.prototype
	     * @param {Image} image
	     * @returns {Image}
	     * @example
	     * // get image
	     * var image = sprite.image();
	     *
	     * // set image
	     * sprite.image(imageObj);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Sprite, 'frameIndex', 0);

	    /**
	     * set/set animation frame index
	     * @name frameIndex
	     * @method
	     * @memberof Kinetic.Sprite.prototype
	     * @param {Integer} frameIndex
	     * @returns {Integer}
	     * @example
	     * // get animation frame index
	     * var frameIndex = sprite.frameIndex();
	     *
	     * // set animation frame index
	     * sprite.frameIndex(3);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Sprite, 'frameRate', 17);

	    /**
	     * get/set frame rate in frames per second.  Increase this number to make the sprite
	     *  animation run faster, and decrease the number to make the sprite animation run slower
	     *  The default is 17 frames per second
	     * @name frameRate
	     * @method
	     * @memberof Kinetic.Sprite.prototype
	     * @param {Integer} frameRate
	     * @returns {Integer}
	     * @example
	     * // get frame rate
	     * var frameRate = sprite.frameRate();
	     *
	     * // set frame rate to 2 frames per second
	     * sprite.frameRate(2);
	     */

	    Kinetic.Factory.backCompat(Kinetic.Sprite, {
	        index: 'frameIndex',
	        getIndex: 'getFrameIndex',
	        setIndex: 'setFrameIndex'
	    });

	    Kinetic.Collection.mapMethods(Kinetic.Sprite);
	})();
	;(function () {
	    /**
	     * Path constructor.
	     * @author Jason Follas
	     * @constructor
	     * @memberof Kinetic
	     * @augments Kinetic.Shape
	     * @param {Object} config
	     * @param {String} config.data SVG data string
	     * @param {String} [config.fill] fill color
	     * @param {Integer} [config.fillRed] set fill red component
	     * @param {Integer} [config.fillGreen] set fill green component
	     * @param {Integer} [config.fillBlue] set fill blue component
	     * @param {Integer} [config.fillAlpha] set fill alpha component
	     * @param {Image} [config.fillPatternImage] fill pattern image
	     * @param {Number} [config.fillPatternX]
	     * @param {Number} [config.fillPatternY]
	     * @param {Object} [config.fillPatternOffset] object with x and y component
	     * @param {Number} [config.fillPatternOffsetX] 
	     * @param {Number} [config.fillPatternOffsetY] 
	     * @param {Object} [config.fillPatternScale] object with x and y component
	     * @param {Number} [config.fillPatternScaleX]
	     * @param {Number} [config.fillPatternScaleY]
	     * @param {Number} [config.fillPatternRotation]
	     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
	     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientStartPointX]
	     * @param {Number} [config.fillLinearGradientStartPointY]
	     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientEndPointX]
	     * @param {Number} [config.fillLinearGradientEndPointY]
	     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
	     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientStartPointX]
	     * @param {Number} [config.fillRadialGradientStartPointY]
	     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientEndPointX] 
	     * @param {Number} [config.fillRadialGradientEndPointY] 
	     * @param {Number} [config.fillRadialGradientStartRadius]
	     * @param {Number} [config.fillRadialGradientEndRadius]
	     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
	     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
	     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
	     * @param {String} [config.stroke] stroke color
	     * @param {Integer} [config.strokeRed] set stroke red component
	     * @param {Integer} [config.strokeGreen] set stroke green component
	     * @param {Integer} [config.strokeBlue] set stroke blue component
	     * @param {Integer} [config.strokeAlpha] set stroke alpha component
	     * @param {Number} [config.strokeWidth] stroke width
	     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
	     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
	     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
	     *  is miter
	     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
	     *  is butt
	     * @param {String} [config.shadowColor]
	     * @param {Integer} [config.shadowRed] set shadow color red component
	     * @param {Integer} [config.shadowGreen] set shadow color green component
	     * @param {Integer} [config.shadowBlue] set shadow color blue component
	     * @param {Integer} [config.shadowAlpha] set shadow color alpha component
	     * @param {Number} [config.shadowBlur]
	     * @param {Object} [config.shadowOffset] object with x and y component
	     * @param {Number} [config.shadowOffsetX]
	     * @param {Number} [config.shadowOffsetY]
	     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
	     *  between 0 and 1
	     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
	     * @param {Array} [config.dash]
	     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
	     * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	     * @example
	     * var path = new Kinetic.Path({
	     *   x: 240,
	     *   y: 40,
	     *   data: 'M12.582,9.551C3.251,16.237,0.921,29.021,7.08,38.564l-2.36,1.689l4.893,2.262l4.893,2.262l-0.568-5.36l-0.567-5.359l-2.365,1.694c-4.657-7.375-2.83-17.185,4.352-22.33c7.451-5.338,17.817-3.625,23.156,3.824c5.337,7.449,3.625,17.813-3.821,23.152l2.857,3.988c9.617-6.893,11.827-20.277,4.935-29.896C35.591,4.87,22.204,2.658,12.582,9.551z',
	     *   fill: 'green',
	     *   scale: 2
	     * });
	     */
	    Kinetic.Path = function (config) {
	        this.___init(config);
	    };

	    Kinetic.Path.prototype = {
	        ___init: function (config) {
	            this.dataArray = [];
	            var that = this;

	            // call super constructor
	            Kinetic.Shape.call(this, config);
	            this.className = 'Path';

	            this.dataArray = Kinetic.Path.parsePathData(this.getData());
	            this.on('dataChange.kinetic', function () {
	                that.dataArray = Kinetic.Path.parsePathData(this.getData());
	            });

	            this.sceneFunc(this._sceneFunc);
	        },
	        _sceneFunc: function(context) {
	            var ca = this.dataArray,
	                closedPath = false;

	            // context position
	            context.beginPath();
	            for (var n = 0; n < ca.length; n++) {
	                var c = ca[n].command;
	                var p = ca[n].points;
	                switch (c) {
	                    case 'L':
	                        context.lineTo(p[0], p[1]);
	                        break;
	                    case 'M':
	                        context.moveTo(p[0], p[1]);
	                        break;
	                    case 'C':
	                        context.bezierCurveTo(p[0], p[1], p[2], p[3], p[4], p[5]);
	                        break;
	                    case 'Q':
	                        context.quadraticCurveTo(p[0], p[1], p[2], p[3]);
	                        break;
	                    case 'A':
	                        var cx = p[0], cy = p[1], rx = p[2], ry = p[3], theta = p[4], dTheta = p[5], psi = p[6], fs = p[7];

	                        var r = (rx > ry) ? rx : ry;
	                        var scaleX = (rx > ry) ? 1 : rx / ry;
	                        var scaleY = (rx > ry) ? ry / rx : 1;

	                        context.translate(cx, cy);
	                        context.rotate(psi);
	                        context.scale(scaleX, scaleY);
	                        context.arc(0, 0, r, theta, theta + dTheta, 1 - fs);
	                        context.scale(1 / scaleX, 1 / scaleY);
	                        context.rotate(-psi);
	                        context.translate(-cx, -cy);

	                        break;
	                    case 'z':
	                        context.closePath();
	                        closedPath = true;
	                        break;
	                }
	            }

	            if (closedPath) {
	                context.fillStrokeShape(this);
	            }
	            else {
	                context.strokeShape(this);
	            }
	        }
	    };
	    Kinetic.Util.extend(Kinetic.Path, Kinetic.Shape);

	    Kinetic.Path.getLineLength = function(x1, y1, x2, y2) {
	        return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
	    };
	    Kinetic.Path.getPointOnLine = function(dist, P1x, P1y, P2x, P2y, fromX, fromY) {
	        if(fromX === undefined) {
	            fromX = P1x;
	        }
	        if(fromY === undefined) {
	            fromY = P1y;
	        }

	        var m = (P2y - P1y) / ((P2x - P1x) + 0.00000001);
	        var run = Math.sqrt(dist * dist / (1 + m * m));
	        if(P2x < P1x) {
	            run *= -1;
	        }
	        var rise = m * run;
	        var pt;

	        if (P2x === P1x) { // vertical line
	            pt = {
	                x: fromX,
	                y: fromY + rise
	            };
	        } else if((fromY - P1y) / ((fromX - P1x) + 0.00000001) === m) {
	            pt = {
	                x: fromX + run,
	                y: fromY + rise
	            };
	        }
	        else {
	            var ix, iy;

	            var len = this.getLineLength(P1x, P1y, P2x, P2y);
	            if(len < 0.00000001) {
	                return undefined;
	            }
	            var u = (((fromX - P1x) * (P2x - P1x)) + ((fromY - P1y) * (P2y - P1y)));
	            u = u / (len * len);
	            ix = P1x + u * (P2x - P1x);
	            iy = P1y + u * (P2y - P1y);

	            var pRise = this.getLineLength(fromX, fromY, ix, iy);
	            var pRun = Math.sqrt(dist * dist - pRise * pRise);
	            run = Math.sqrt(pRun * pRun / (1 + m * m));
	            if(P2x < P1x) {
	                run *= -1;
	            }
	            rise = m * run;
	            pt = {
	                x: ix + run,
	                y: iy + rise
	            };
	        }

	        return pt;
	    };

	    Kinetic.Path.getPointOnCubicBezier = function(pct, P1x, P1y, P2x, P2y, P3x, P3y, P4x, P4y) {
	        function CB1(t) {
	            return t * t * t;
	        }
	        function CB2(t) {
	            return 3 * t * t * (1 - t);
	        }
	        function CB3(t) {
	            return 3 * t * (1 - t) * (1 - t);
	        }
	        function CB4(t) {
	            return (1 - t) * (1 - t) * (1 - t);
	        }
	        var x = P4x * CB1(pct) + P3x * CB2(pct) + P2x * CB3(pct) + P1x * CB4(pct);
	        var y = P4y * CB1(pct) + P3y * CB2(pct) + P2y * CB3(pct) + P1y * CB4(pct);

	        return {
	            x: x,
	            y: y
	        };
	    };
	    Kinetic.Path.getPointOnQuadraticBezier = function(pct, P1x, P1y, P2x, P2y, P3x, P3y) {
	        function QB1(t) {
	            return t * t;
	        }
	        function QB2(t) {
	            return 2 * t * (1 - t);
	        }
	        function QB3(t) {
	            return (1 - t) * (1 - t);
	        }
	        var x = P3x * QB1(pct) + P2x * QB2(pct) + P1x * QB3(pct);
	        var y = P3y * QB1(pct) + P2y * QB2(pct) + P1y * QB3(pct);

	        return {
	            x: x,
	            y: y
	        };
	    };
	    Kinetic.Path.getPointOnEllipticalArc = function(cx, cy, rx, ry, theta, psi) {
	        var cosPsi = Math.cos(psi), sinPsi = Math.sin(psi);
	        var pt = {
	            x: rx * Math.cos(theta),
	            y: ry * Math.sin(theta)
	        };
	        return {
	            x: cx + (pt.x * cosPsi - pt.y * sinPsi),
	            y: cy + (pt.x * sinPsi + pt.y * cosPsi)
	        };
	    };
	    /*
	     * get parsed data array from the data
	     *  string.  V, v, H, h, and l data are converted to
	     *  L data for the purpose of high performance Path
	     *  rendering
	     */
	    Kinetic.Path.parsePathData = function(data) {
	        // Path Data Segment must begin with a moveTo
	        //m (x y)+  Relative moveTo (subsequent points are treated as lineTo)
	        //M (x y)+  Absolute moveTo (subsequent points are treated as lineTo)
	        //l (x y)+  Relative lineTo
	        //L (x y)+  Absolute LineTo
	        //h (x)+    Relative horizontal lineTo
	        //H (x)+    Absolute horizontal lineTo
	        //v (y)+    Relative vertical lineTo
	        //V (y)+    Absolute vertical lineTo
	        //z (closepath)
	        //Z (closepath)
	        //c (x1 y1 x2 y2 x y)+ Relative Bezier curve
	        //C (x1 y1 x2 y2 x y)+ Absolute Bezier curve
	        //q (x1 y1 x y)+       Relative Quadratic Bezier
	        //Q (x1 y1 x y)+       Absolute Quadratic Bezier
	        //t (x y)+    Shorthand/Smooth Relative Quadratic Bezier
	        //T (x y)+    Shorthand/Smooth Absolute Quadratic Bezier
	        //s (x2 y2 x y)+       Shorthand/Smooth Relative Bezier curve
	        //S (x2 y2 x y)+       Shorthand/Smooth Absolute Bezier curve
	        //a (rx ry x-axis-rotation large-arc-flag sweep-flag x y)+     Relative Elliptical Arc
	        //A (rx ry x-axis-rotation large-arc-flag sweep-flag x y)+  Absolute Elliptical Arc

	        // return early if data is not defined
	        if(!data) {
	            return [];
	        }

	        // command string
	        var cs = data;

	        // command chars
	        var cc = ['m', 'M', 'l', 'L', 'v', 'V', 'h', 'H', 'z', 'Z', 'c', 'C', 'q', 'Q', 't', 'T', 's', 'S', 'a', 'A'];
	        // convert white spaces to commas
	        cs = cs.replace(new RegExp(' ', 'g'), ',');
	        // create pipes so that we can split the data
	        for(var n = 0; n < cc.length; n++) {
	            cs = cs.replace(new RegExp(cc[n], 'g'), '|' + cc[n]);
	        }
	        // create array
	        var arr = cs.split('|');
	        var ca = [];
	        // init context point
	        var cpx = 0;
	        var cpy = 0;
	        for( n = 1; n < arr.length; n++) {
	            var str = arr[n];
	            var c = str.charAt(0);
	            str = str.slice(1);
	            // remove ,- for consistency
	            str = str.replace(new RegExp(',-', 'g'), '-');
	            // add commas so that it's easy to split
	            str = str.replace(new RegExp('-', 'g'), ',-');
	            str = str.replace(new RegExp('e,-', 'g'), 'e-');
	            var p = str.split(',');
	            if(p.length > 0 && p[0] === '') {
	                p.shift();
	            }
	            // convert strings to floats
	            for(var i = 0; i < p.length; i++) {
	                p[i] = parseFloat(p[i]);
	            }
	            while(p.length > 0) {
	                if(isNaN(p[0])) {// case for a trailing comma before next command
	                    break;
	                }

	                var cmd = null;
	                var points = [];
	                var startX = cpx, startY = cpy;
	                // Move var from within the switch to up here (jshint)
	                var prevCmd, ctlPtx, ctlPty;     // Ss, Tt
	                var rx, ry, psi, fa, fs, x1, y1; // Aa


	                // convert l, H, h, V, and v to L
	                switch (c) {

	                    // Note: Keep the lineTo's above the moveTo's in this switch
	                    case 'l':
	                        cpx += p.shift();
	                        cpy += p.shift();
	                        cmd = 'L';
	                        points.push(cpx, cpy);
	                        break;
	                    case 'L':
	                        cpx = p.shift();
	                        cpy = p.shift();
	                        points.push(cpx, cpy);
	                        break;

	                    // Note: lineTo handlers need to be above this point
	                    case 'm':
	                        var dx = p.shift();
	                        var dy = p.shift();
	                        cpx += dx;
	                        cpy += dy;
	                        cmd = 'M';
	                        // After closing the path move the current position 
	                        // to the the first point of the path (if any). 
	                        if(ca.length>2 && ca[ca.length-1].command==='z'){
	                            for(var idx=ca.length-2;idx>=0;idx--){
	                                if(ca[idx].command==='M'){
	                                    cpx=ca[idx].points[0]+dx;
	                                    cpy=ca[idx].points[1]+dy;
	                                    break;
	                                }
	                            }
	                        }
	                        points.push(cpx, cpy);
	                        c = 'l';
	                        // subsequent points are treated as relative lineTo
	                        break;
	                    case 'M':
	                        cpx = p.shift();
	                        cpy = p.shift();
	                        cmd = 'M';
	                        points.push(cpx, cpy);
	                        c = 'L';
	                        // subsequent points are treated as absolute lineTo
	                        break;

	                    case 'h':
	                        cpx += p.shift();
	                        cmd = 'L';
	                        points.push(cpx, cpy);
	                        break;
	                    case 'H':
	                        cpx = p.shift();
	                        cmd = 'L';
	                        points.push(cpx, cpy);
	                        break;
	                    case 'v':
	                        cpy += p.shift();
	                        cmd = 'L';
	                        points.push(cpx, cpy);
	                        break;
	                    case 'V':
	                        cpy = p.shift();
	                        cmd = 'L';
	                        points.push(cpx, cpy);
	                        break;
	                    case 'C':
	                        points.push(p.shift(), p.shift(), p.shift(), p.shift());
	                        cpx = p.shift();
	                        cpy = p.shift();
	                        points.push(cpx, cpy);
	                        break;
	                    case 'c':
	                        points.push(cpx + p.shift(), cpy + p.shift(), cpx + p.shift(), cpy + p.shift());
	                        cpx += p.shift();
	                        cpy += p.shift();
	                        cmd = 'C';
	                        points.push(cpx, cpy);
	                        break;
	                    case 'S':
	                        ctlPtx = cpx;
	                        ctlPty = cpy;
	                        prevCmd = ca[ca.length - 1];
	                        if(prevCmd.command === 'C') {
	                            ctlPtx = cpx + (cpx - prevCmd.points[2]);
	                            ctlPty = cpy + (cpy - prevCmd.points[3]);
	                        }
	                        points.push(ctlPtx, ctlPty, p.shift(), p.shift());
	                        cpx = p.shift();
	                        cpy = p.shift();
	                        cmd = 'C';
	                        points.push(cpx, cpy);
	                        break;
	                    case 's':
	                        ctlPtx = cpx;
	                        ctlPty = cpy;
	                        prevCmd = ca[ca.length - 1];
	                        if(prevCmd.command === 'C') {
	                            ctlPtx = cpx + (cpx - prevCmd.points[2]);
	                            ctlPty = cpy + (cpy - prevCmd.points[3]);
	                        }
	                        points.push(ctlPtx, ctlPty, cpx + p.shift(), cpy + p.shift());
	                        cpx += p.shift();
	                        cpy += p.shift();
	                        cmd = 'C';
	                        points.push(cpx, cpy);
	                        break;
	                    case 'Q':
	                        points.push(p.shift(), p.shift());
	                        cpx = p.shift();
	                        cpy = p.shift();
	                        points.push(cpx, cpy);
	                        break;
	                    case 'q':
	                        points.push(cpx + p.shift(), cpy + p.shift());
	                        cpx += p.shift();
	                        cpy += p.shift();
	                        cmd = 'Q';
	                        points.push(cpx, cpy);
	                        break;
	                    case 'T':
	                        ctlPtx = cpx;
	                        ctlPty = cpy;
	                        prevCmd = ca[ca.length - 1];
	                        if(prevCmd.command === 'Q') {
	                            ctlPtx = cpx + (cpx - prevCmd.points[0]);
	                            ctlPty = cpy + (cpy - prevCmd.points[1]);
	                        }
	                        cpx = p.shift();
	                        cpy = p.shift();
	                        cmd = 'Q';
	                        points.push(ctlPtx, ctlPty, cpx, cpy);
	                        break;
	                    case 't':
	                        ctlPtx = cpx;
	                        ctlPty = cpy;
	                        prevCmd = ca[ca.length - 1];
	                        if(prevCmd.command === 'Q') {
	                            ctlPtx = cpx + (cpx - prevCmd.points[0]);
	                            ctlPty = cpy + (cpy - prevCmd.points[1]);
	                        }
	                        cpx += p.shift();
	                        cpy += p.shift();
	                        cmd = 'Q';
	                        points.push(ctlPtx, ctlPty, cpx, cpy);
	                        break;
	                    case 'A':
	                        rx = p.shift();
	                        ry = p.shift();
	                        psi = p.shift();
	                        fa = p.shift();
	                        fs = p.shift();
	                        x1 = cpx;
	                        y1 = cpy;
	                        cpx = p.shift();
	                        cpy = p.shift();
	                        cmd = 'A';
	                        points = this.convertEndpointToCenterParameterization(x1, y1, cpx, cpy, fa, fs, rx, ry, psi);
	                        break;
	                    case 'a':
	                        rx = p.shift();
	                        ry = p.shift();
	                        psi = p.shift();
	                        fa = p.shift();
	                        fs = p.shift();
	                        x1 = cpx;
	                        y1 = cpy; cpx += p.shift();
	                        cpy += p.shift();
	                        cmd = 'A';
	                        points = this.convertEndpointToCenterParameterization(x1, y1, cpx, cpy, fa, fs, rx, ry, psi);
	                        break;
	                }

	                ca.push({
	                    command: cmd || c,
	                    points: points,
	                    start: {
	                        x: startX,
	                        y: startY
	                    },
	                    pathLength: this.calcLength(startX, startY, cmd || c, points)
	                });
	            }

	            if(c === 'z' || c === 'Z') {
	                ca.push({
	                    command: 'z',
	                    points: [],
	                    start: undefined,
	                    pathLength: 0
	                });
	            }
	        }

	        return ca;
	    };
	    Kinetic.Path.calcLength = function(x, y, cmd, points) {
	        var len, p1, p2, t;
	        var path = Kinetic.Path;

	        switch (cmd) {
	            case 'L':
	                return path.getLineLength(x, y, points[0], points[1]);
	            case 'C':
	                // Approximates by breaking curve into 100 line segments
	                len = 0.0;
	                p1 = path.getPointOnCubicBezier(0, x, y, points[0], points[1], points[2], points[3], points[4], points[5]);
	                for( t = 0.01; t <= 1; t += 0.01) {
	                    p2 = path.getPointOnCubicBezier(t, x, y, points[0], points[1], points[2], points[3], points[4], points[5]);
	                    len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
	                    p1 = p2;
	                }
	                return len;
	            case 'Q':
	                // Approximates by breaking curve into 100 line segments
	                len = 0.0;
	                p1 = path.getPointOnQuadraticBezier(0, x, y, points[0], points[1], points[2], points[3]);
	                for( t = 0.01; t <= 1; t += 0.01) {
	                    p2 = path.getPointOnQuadraticBezier(t, x, y, points[0], points[1], points[2], points[3]);
	                    len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
	                    p1 = p2;
	                }
	                return len;
	            case 'A':
	                // Approximates by breaking curve into line segments
	                len = 0.0;
	                var start = points[4];
	                // 4 = theta
	                var dTheta = points[5];
	                // 5 = dTheta
	                var end = points[4] + dTheta;
	                var inc = Math.PI / 180.0;
	                // 1 degree resolution
	                if(Math.abs(start - end) < inc) {
	                    inc = Math.abs(start - end);
	                }
	                // Note: for purpose of calculating arc length, not going to worry about rotating X-axis by angle psi
	                p1 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], start, 0);
	                if(dTheta < 0) {// clockwise
	                    for( t = start - inc; t > end; t -= inc) {
	                        p2 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], t, 0);
	                        len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
	                        p1 = p2;
	                    }
	                }
	                else {// counter-clockwise
	                    for( t = start + inc; t < end; t += inc) {
	                        p2 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], t, 0);
	                        len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);
	                        p1 = p2;
	                    }
	                }
	                p2 = path.getPointOnEllipticalArc(points[0], points[1], points[2], points[3], end, 0);
	                len += path.getLineLength(p1.x, p1.y, p2.x, p2.y);

	                return len;
	        }

	        return 0;
	    };
	    Kinetic.Path.convertEndpointToCenterParameterization = function(x1, y1, x2, y2, fa, fs, rx, ry, psiDeg) {
	        // Derived from: http://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
	        var psi = psiDeg * (Math.PI / 180.0);
	        var xp = Math.cos(psi) * (x1 - x2) / 2.0 + Math.sin(psi) * (y1 - y2) / 2.0;
	        var yp = -1 * Math.sin(psi) * (x1 - x2) / 2.0 + Math.cos(psi) * (y1 - y2) / 2.0;

	        var lambda = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);

	        if(lambda > 1) {
	            rx *= Math.sqrt(lambda);
	            ry *= Math.sqrt(lambda);
	        }

	        var f = Math.sqrt((((rx * rx) * (ry * ry)) - ((rx * rx) * (yp * yp)) - ((ry * ry) * (xp * xp))) / ((rx * rx) * (yp * yp) + (ry * ry) * (xp * xp)));

	        if(fa === fs) {
	            f *= -1;
	        }
	        if(isNaN(f)) {
	            f = 0;
	        }

	        var cxp = f * rx * yp / ry;
	        var cyp = f * -ry * xp / rx;

	        var cx = (x1 + x2) / 2.0 + Math.cos(psi) * cxp - Math.sin(psi) * cyp;
	        var cy = (y1 + y2) / 2.0 + Math.sin(psi) * cxp + Math.cos(psi) * cyp;

	        var vMag = function(v) {
	            return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
	        };
	        var vRatio = function(u, v) {
	            return (u[0] * v[0] + u[1] * v[1]) / (vMag(u) * vMag(v));
	        };
	        var vAngle = function(u, v) {
	            return (u[0] * v[1] < u[1] * v[0] ? -1 : 1) * Math.acos(vRatio(u, v));
	        };
	        var theta = vAngle([1, 0], [(xp - cxp) / rx, (yp - cyp) / ry]);
	        var u = [(xp - cxp) / rx, (yp - cyp) / ry];
	        var v = [(-1 * xp - cxp) / rx, (-1 * yp - cyp) / ry];
	        var dTheta = vAngle(u, v);

	        if(vRatio(u, v) <= -1) {
	            dTheta = Math.PI;
	        }
	        if(vRatio(u, v) >= 1) {
	            dTheta = 0;
	        }
	        if(fs === 0 && dTheta > 0) {
	            dTheta = dTheta - 2 * Math.PI;
	        }
	        if(fs === 1 && dTheta < 0) {
	            dTheta = dTheta + 2 * Math.PI;
	        }
	        return [cx, cy, rx, ry, theta, dTheta, psi, fs];
	    };
	    // add getters setters
	    Kinetic.Factory.addGetterSetter(Kinetic.Path, 'data');

	    /**
	     * set SVG path data string.  This method
	     *  also automatically parses the data string
	     *  into a data array.  Currently supported SVG data:
	     *  M, m, L, l, H, h, V, v, Q, q, T, t, C, c, S, s, A, a, Z, z
	     * @name setData
	     * @method
	     * @memberof Kinetic.Path.prototype
	     * @param {String} SVG path command string
	     */

	    /**
	     * get SVG path data string
	     * @name getData
	     * @method
	     * @memberof Kinetic.Path.prototype
	     */

	    Kinetic.Collection.mapMethods(Kinetic.Path);
	})();
	;(function() {
	    var EMPTY_STRING = '',
	        //CALIBRI = 'Calibri',
	        NORMAL = 'normal';

	    /**
	     * Path constructor.
	     * @author Jason Follas
	     * @constructor
	     * @memberof Kinetic
	     * @augments Kinetic.Shape
	     * @param {Object} config
	     * @param {String} [config.fontFamily] default is Calibri
	     * @param {Number} [config.fontSize] default is 12
	     * @param {String} [config.fontStyle] can be normal, bold, or italic.  Default is normal
	     * @param {String} [config.fontVariant] can be normal or small-caps.  Default is normal
	     * @param {String} config.text
	     * @param {String} config.data SVG data string
	     * @param {String} [config.fill] fill color
	     * @param {Integer} [config.fillRed] set fill red component
	     * @param {Integer} [config.fillGreen] set fill green component
	     * @param {Integer} [config.fillBlue] set fill blue component
	     * @param {Integer} [config.fillAlpha] set fill alpha component
	     * @param {Image} [config.fillPatternImage] fill pattern image
	     * @param {Number} [config.fillPatternX]
	     * @param {Number} [config.fillPatternY]
	     * @param {Object} [config.fillPatternOffset] object with x and y component
	     * @param {Number} [config.fillPatternOffsetX] 
	     * @param {Number} [config.fillPatternOffsetY] 
	     * @param {Object} [config.fillPatternScale] object with x and y component
	     * @param {Number} [config.fillPatternScaleX]
	     * @param {Number} [config.fillPatternScaleY]
	     * @param {Number} [config.fillPatternRotation]
	     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
	     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientStartPointX]
	     * @param {Number} [config.fillLinearGradientStartPointY]
	     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientEndPointX]
	     * @param {Number} [config.fillLinearGradientEndPointY]
	     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
	     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientStartPointX]
	     * @param {Number} [config.fillRadialGradientStartPointY]
	     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientEndPointX] 
	     * @param {Number} [config.fillRadialGradientEndPointY] 
	     * @param {Number} [config.fillRadialGradientStartRadius]
	     * @param {Number} [config.fillRadialGradientEndRadius]
	     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
	     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
	     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
	     * @param {String} [config.stroke] stroke color
	     * @param {Integer} [config.strokeRed] set stroke red component
	     * @param {Integer} [config.strokeGreen] set stroke green component
	     * @param {Integer} [config.strokeBlue] set stroke blue component
	     * @param {Integer} [config.strokeAlpha] set stroke alpha component
	     * @param {Number} [config.strokeWidth] stroke width
	     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
	     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
	     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
	     *  is miter
	     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
	     *  is butt
	     * @param {String} [config.shadowColor]
	     * @param {Integer} [config.shadowRed] set shadow color red component
	     * @param {Integer} [config.shadowGreen] set shadow color green component
	     * @param {Integer} [config.shadowBlue] set shadow color blue component
	     * @param {Integer} [config.shadowAlpha] set shadow color alpha component
	     * @param {Number} [config.shadowBlur]
	     * @param {Object} [config.shadowOffset] object with x and y component
	     * @param {Number} [config.shadowOffsetX]
	     * @param {Number} [config.shadowOffsetY]
	     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
	     *  between 0 and 1
	     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
	     * @param {Array} [config.dash]
	     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
	     * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	     * @example
	     * var textpath = new Kinetic.TextPath({
	     *   x: 100,
	     *   y: 50,
	     *   fill: '#333',
	     *   fontSize: '24',
	     *   fontFamily: 'Arial',
	     *   text: 'All the world\'s a stage, and all the men and women merely players.',
	     *   data: 'M10,10 C0,0 10,150 100,100 S300,150 400,50'
	     * });
	     */
	    Kinetic.TextPath = function(config) {
	        this.___init(config);
	    };

	    function _fillFunc(context) {
	        context.fillText(this.partialText, 0, 0);
	    }
	    function _strokeFunc(context) {
	        context.strokeText(this.partialText, 0, 0);
	    }

	    Kinetic.TextPath.prototype = {
	        ___init: function(config) {
	            var that = this;
	            this.dummyCanvas = Kinetic.Util.createCanvasElement();
	            this.dataArray = [];

	            // call super constructor
	            Kinetic.Shape.call(this, config);

	            // overrides
	            // TODO: shouldn't this be on the prototype?
	            this._fillFunc = _fillFunc;
	            this._strokeFunc = _strokeFunc;
	            this._fillFuncHit = _fillFunc;
	            this._strokeFuncHit = _strokeFunc;
	            
	            this.className = 'TextPath';

	            this.dataArray = Kinetic.Path.parsePathData(this.attrs.data);
	            this.on('dataChange.kinetic', function() {
	                that.dataArray = Kinetic.Path.parsePathData(this.attrs.data);
	            });

	            // update text data for certain attr changes
	            this.on('textChange.kinetic textStroke.kinetic textStrokeWidth.kinetic', that._setTextData);
	            that._setTextData();
	            this.sceneFunc(this._sceneFunc);
	        },
	        _sceneFunc: function(context) {
	            context.setAttr('font', this._getContextFont());
	            context.setAttr('textBaseline', 'middle');
	            context.setAttr('textAlign', 'left');
	            context.save();

	            var glyphInfo = this.glyphInfo;
	            for(var i = 0; i < glyphInfo.length; i++) {
	                context.save();

	                var p0 = glyphInfo[i].p0;

	                context.translate(p0.x, p0.y);
	                context.rotate(glyphInfo[i].rotation);
	                this.partialText = glyphInfo[i].text;

	                context.fillStrokeShape(this);
	                context.restore();

	                //// To assist with debugging visually, uncomment following
	                // context.beginPath();
	                // if (i % 2)
	                // context.strokeStyle = 'cyan';
	                // else
	                // context.strokeStyle = 'green';
	                // var p1 = glyphInfo[i].p1;
	                // context.moveTo(p0.x, p0.y);
	                // context.lineTo(p1.x, p1.y);
	                // context.stroke();
	            }
	            context.restore();
	        },
	        /**
	         * get text width in pixels
	         * @method
	         * @memberof Kinetic.TextPath.prototype
	         */
	        getTextWidth: function() {
	            return this.textWidth;
	        },
	        /**
	         * get text height in pixels
	         * @method
	         * @memberof Kinetic.TextPath.prototype
	         */
	        getTextHeight: function() {
	            return this.textHeight;
	        },
	        /**
	         * set text
	         * @method
	         * @memberof Kinetic.TextPath.prototype
	         * @param {String} text
	         */
	        setText: function(text) {
	            Kinetic.Text.prototype.setText.call(this, text);
	        },
	        _getTextSize: function(text) {
	            var dummyCanvas = this.dummyCanvas;
	            var _context = dummyCanvas.getContext('2d');

	            _context.save();

	            _context.font = this._getContextFont();
	            var metrics = _context.measureText(text);

	            _context.restore();

	            return {
	                width: metrics.width,
	                height: parseInt(this.attrs.fontSize, 10)
	            };
	        },
	        _setTextData: function() {

	            var that = this;
	            var size = this._getTextSize(this.attrs.text);
	            this.textWidth = size.width;
	            this.textHeight = size.height;

	            this.glyphInfo = [];

	            var charArr = this.attrs.text.split('');

	            var p0, p1, pathCmd;

	            var pIndex = -1;
	            var currentT = 0;

	            var getNextPathSegment = function() {
	                currentT = 0;
	                var pathData = that.dataArray;

	                for(var i = pIndex + 1; i < pathData.length; i++) {
	                    if(pathData[i].pathLength > 0) {
	                        pIndex = i;

	                        return pathData[i];
	                    }
	                    else if(pathData[i].command == 'M') {
	                        p0 = {
	                            x: pathData[i].points[0],
	                            y: pathData[i].points[1]
	                        };
	                    }
	                }

	                return {};
	            };
	            var findSegmentToFitCharacter = function(c) {

	                var glyphWidth = that._getTextSize(c).width;

	                var currLen = 0;
	                var attempts = 0;

	                p1 = undefined;
	                while(Math.abs(glyphWidth - currLen) / glyphWidth > 0.01 && attempts < 25) {
	                    attempts++;
	                    var cumulativePathLength = currLen;
	                    while(pathCmd === undefined) {
	                        pathCmd = getNextPathSegment();

	                        if(pathCmd && cumulativePathLength + pathCmd.pathLength < glyphWidth) {
	                            cumulativePathLength += pathCmd.pathLength;
	                            pathCmd = undefined;
	                        }
	                    }

	                    if(pathCmd === {} || p0 === undefined) {
	                        return undefined;
	                    }

	                    var needNewSegment = false;

	                    switch (pathCmd.command) {
	                        case 'L':
	                            if(Kinetic.Path.getLineLength(p0.x, p0.y, pathCmd.points[0], pathCmd.points[1]) > glyphWidth) {
	                                p1 = Kinetic.Path.getPointOnLine(glyphWidth, p0.x, p0.y, pathCmd.points[0], pathCmd.points[1], p0.x, p0.y);
	                            }
	                            else {
	                                pathCmd = undefined;
	                            }
	                            break;
	                        case 'A':

	                            var start = pathCmd.points[4];
	                            // 4 = theta
	                            var dTheta = pathCmd.points[5];
	                            // 5 = dTheta
	                            var end = pathCmd.points[4] + dTheta;

	                            if(currentT === 0){
	                                currentT = start + 0.00000001;
	                            }
	                            // Just in case start is 0
	                            else if(glyphWidth > currLen) {
	                                currentT += (Math.PI / 180.0) * dTheta / Math.abs(dTheta);
	                            }
	                            else {
	                                currentT -= Math.PI / 360.0 * dTheta / Math.abs(dTheta);
	                            }

	                            // Credit for bug fix: @therth https://github.com/ericdrowell/KineticJS/issues/249
	                            // Old code failed to render text along arc of this path: "M 50 50 a 150 50 0 0 1 250 50 l 50 0"
	                            if(dTheta < 0 && currentT < end || dTheta >= 0 && currentT > end) {
	                                currentT = end;
	                                needNewSegment = true;
	                            }
	                            p1 = Kinetic.Path.getPointOnEllipticalArc(pathCmd.points[0], pathCmd.points[1], pathCmd.points[2], pathCmd.points[3], currentT, pathCmd.points[6]);
	                            break;
	                        case 'C':
	                            if(currentT === 0) {
	                                if(glyphWidth > pathCmd.pathLength) {
	                                    currentT = 0.00000001;
	                                }
	                                else {
	                                    currentT = glyphWidth / pathCmd.pathLength;
	                                }
	                            }
	                            else if(glyphWidth > currLen) {
	                                currentT += (glyphWidth - currLen) / pathCmd.pathLength;
	                            }
	                            else {
	                                currentT -= (currLen - glyphWidth) / pathCmd.pathLength;
	                            }

	                            if(currentT > 1.0) {
	                                currentT = 1.0;
	                                needNewSegment = true;
	                            }
	                            p1 = Kinetic.Path.getPointOnCubicBezier(currentT, pathCmd.start.x, pathCmd.start.y, pathCmd.points[0], pathCmd.points[1], pathCmd.points[2], pathCmd.points[3], pathCmd.points[4], pathCmd.points[5]);
	                            break;
	                        case 'Q':
	                            if(currentT === 0) {
	                                currentT = glyphWidth / pathCmd.pathLength;
	                            }
	                            else if(glyphWidth > currLen) {
	                                currentT += (glyphWidth - currLen) / pathCmd.pathLength;
	                            }
	                            else {
	                                currentT -= (currLen - glyphWidth) / pathCmd.pathLength;
	                            }

	                            if(currentT > 1.0) {
	                                currentT = 1.0;
	                                needNewSegment = true;
	                            }
	                            p1 = Kinetic.Path.getPointOnQuadraticBezier(currentT, pathCmd.start.x, pathCmd.start.y, pathCmd.points[0], pathCmd.points[1], pathCmd.points[2], pathCmd.points[3]);
	                            break;

	                    }

	                    if(p1 !== undefined) {
	                        currLen = Kinetic.Path.getLineLength(p0.x, p0.y, p1.x, p1.y);
	                    }

	                    if(needNewSegment) {
	                        needNewSegment = false;
	                        pathCmd = undefined;
	                    }
	                }
	            };
	            for(var i = 0; i < charArr.length; i++) {

	                // Find p1 such that line segment between p0 and p1 is approx. width of glyph
	                findSegmentToFitCharacter(charArr[i]);

	                if(p0 === undefined || p1 === undefined) {
	                    break;
	                }

	                var width = Kinetic.Path.getLineLength(p0.x, p0.y, p1.x, p1.y);

	                // Note: Since glyphs are rendered one at a time, any kerning pair data built into the font will not be used.
	                // Can foresee having a rough pair table built in that the developer can override as needed.

	                var kern = 0;
	                // placeholder for future implementation

	                var midpoint = Kinetic.Path.getPointOnLine(kern + width / 2.0, p0.x, p0.y, p1.x, p1.y);

	                var rotation = Math.atan2((p1.y - p0.y), (p1.x - p0.x));
	                this.glyphInfo.push({
	                    transposeX: midpoint.x,
	                    transposeY: midpoint.y,
	                    text: charArr[i],
	                    rotation: rotation,
	                    p0: p0,
	                    p1: p1
	                });
	                p0 = p1;
	            }
	        }
	    };

	    // map TextPath methods to Text
	    Kinetic.TextPath.prototype._getContextFont = Kinetic.Text.prototype._getContextFont;

	    Kinetic.Util.extend(Kinetic.TextPath, Kinetic.Shape);

	    // add setters and getters
	    Kinetic.Factory.addGetterSetter(Kinetic.TextPath, 'fontFamily', 'Arial');

	    /**
	     * set font family
	     * @name setFontFamily
	     * @method
	     * @memberof Kinetic.TextPath.prototype
	     * @param {String} fontFamily
	     */

	     /**
	     * get font family
	     * @name getFontFamily
	     * @method
	     * @memberof Kinetic.TextPath.prototype
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.TextPath, 'fontSize', 12);

	    /**
	     * set font size
	     * @name setFontSize
	     * @method
	     * @memberof Kinetic.TextPath.prototype
	     * @param {int} fontSize
	     */

	     /**
	     * get font size
	     * @name getFontSize
	     * @method
	     * @memberof Kinetic.TextPath.prototype
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.TextPath, 'fontStyle', NORMAL);

	    /**
	     * set font style.  Can be 'normal', 'italic', or 'bold'.  'normal' is the default.
	     * @name setFontStyle
	     * @method
	     * @memberof Kinetic.TextPath.prototype
	     * @param {String} fontStyle
	     */

	     /**
	     * get font style
	     * @name getFontStyle
	     * @method
	     * @memberof Kinetic.TextPath.prototype
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.TextPath, 'fontVariant', NORMAL);

	    /**
	     * set font variant.  Can be 'normal' or 'small-caps'.  'normal' is the default.
	     * @name setFontVariant
	     * @method
	     * @memberof Kinetic.TextPath.prototype
	     * @param {String} fontVariant
	     */

	    /**
	     * @get font variant
	     * @name getFontVariant
	     * @method
	     * @memberof Kinetic.TextPath.prototype
	     */

	    Kinetic.Factory.addGetter(Kinetic.TextPath, 'text', EMPTY_STRING);

	    /**
	     * get text
	     * @name getText
	     * @method
	     * @memberof Kinetic.TextPath.prototype
	     */

	    Kinetic.Collection.mapMethods(Kinetic.TextPath);
	})();
	;(function() {
	    /**
	     * RegularPolygon constructor.&nbsp; Examples include triangles, squares, pentagons, hexagons, etc.
	     * @constructor
	     * @memberof Kinetic
	     * @augments Kinetic.Shape
	     * @param {Object} config
	     * @param {Number} config.sides
	     * @param {Number} config.radius
	     * @param {String} [config.fill] fill color
	     * @param {Integer} [config.fillRed] set fill red component
	     * @param {Integer} [config.fillGreen] set fill green component
	     * @param {Integer} [config.fillBlue] set fill blue component
	     * @param {Integer} [config.fillAlpha] set fill alpha component
	     * @param {Image} [config.fillPatternImage] fill pattern image
	     * @param {Number} [config.fillPatternX]
	     * @param {Number} [config.fillPatternY]
	     * @param {Object} [config.fillPatternOffset] object with x and y component
	     * @param {Number} [config.fillPatternOffsetX] 
	     * @param {Number} [config.fillPatternOffsetY] 
	     * @param {Object} [config.fillPatternScale] object with x and y component
	     * @param {Number} [config.fillPatternScaleX]
	     * @param {Number} [config.fillPatternScaleY]
	     * @param {Number} [config.fillPatternRotation]
	     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
	     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientStartPointX]
	     * @param {Number} [config.fillLinearGradientStartPointY]
	     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientEndPointX]
	     * @param {Number} [config.fillLinearGradientEndPointY]
	     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
	     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientStartPointX]
	     * @param {Number} [config.fillRadialGradientStartPointY]
	     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientEndPointX] 
	     * @param {Number} [config.fillRadialGradientEndPointY] 
	     * @param {Number} [config.fillRadialGradientStartRadius]
	     * @param {Number} [config.fillRadialGradientEndRadius]
	     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
	     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
	     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
	     * @param {String} [config.stroke] stroke color
	     * @param {Integer} [config.strokeRed] set stroke red component
	     * @param {Integer} [config.strokeGreen] set stroke green component
	     * @param {Integer} [config.strokeBlue] set stroke blue component
	     * @param {Integer} [config.strokeAlpha] set stroke alpha component
	     * @param {Number} [config.strokeWidth] stroke width
	     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
	     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
	     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
	     *  is miter
	     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
	     *  is butt
	     * @param {String} [config.shadowColor]
	     * @param {Integer} [config.shadowRed] set shadow color red component
	     * @param {Integer} [config.shadowGreen] set shadow color green component
	     * @param {Integer} [config.shadowBlue] set shadow color blue component
	     * @param {Integer} [config.shadowAlpha] set shadow color alpha component
	     * @param {Number} [config.shadowBlur]
	     * @param {Object} [config.shadowOffset] object with x and y component
	     * @param {Number} [config.shadowOffsetX]
	     * @param {Number} [config.shadowOffsetY]
	     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
	     *  between 0 and 1
	     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
	     * @param {Array} [config.dash]
	     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
	     * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	     * @example
	     * var hexagon = new Kinetic.RegularPolygon({
	     *   x: 100,
	     *   y: 200,
	     *   sides: 6,
	     *   radius: 70,
	     *   fill: 'red',
	     *   stroke: 'black',
	     *   strokeWidth: 4
	     * });
	     */
	    Kinetic.RegularPolygon = function(config) {
	        this.___init(config);
	    };

	    Kinetic.RegularPolygon.prototype = {
	        ___init: function(config) {
	            // call super constructor
	            Kinetic.Shape.call(this, config);
	            this.className = 'RegularPolygon';
	            this.sceneFunc(this._sceneFunc);
	        },
	        _sceneFunc: function(context) {
	            var sides = this.attrs.sides,
	                radius = this.attrs.radius,
	                n, x, y;

	            context.beginPath();
	            context.moveTo(0, 0 - radius);

	            for(n = 1; n < sides; n++) {
	                x = radius * Math.sin(n * 2 * Math.PI / sides);
	                y = -1 * radius * Math.cos(n * 2 * Math.PI / sides);
	                context.lineTo(x, y);
	            }
	            context.closePath();
	            context.fillStrokeShape(this);
	        }
	    };
	    Kinetic.Util.extend(Kinetic.RegularPolygon, Kinetic.Shape);

	    // add getters setters
	    Kinetic.Factory.addGetterSetter(Kinetic.RegularPolygon, 'radius', 0);

	    /**
	     * set radius
	     * @name setRadius
	     * @method
	     * @memberof Kinetic.RegularPolygon.prototype
	     * @param {Number} radius
	     */

	     /**
	     * get radius
	     * @name getRadius
	     * @method
	     * @memberof Kinetic.RegularPolygon.prototype
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.RegularPolygon, 'sides', 0);

	    /**
	     * set number of sides
	     * @name setSides
	     * @method
	     * @memberof Kinetic.RegularPolygon.prototype
	     * @param {int} sides
	     */

	    /**
	     * get number of sides
	     * @name getSides
	     * @method
	     * @memberof Kinetic.RegularPolygon.prototype
	     */

	    Kinetic.Collection.mapMethods(Kinetic.RegularPolygon);
	})();
	;(function() {
	    /**
	     * Star constructor
	     * @constructor
	     * @memberof Kinetic
	     * @augments Kinetic.Shape
	     * @param {Object} config
	     * @param {Integer} config.numPoints
	     * @param {Number} config.innerRadius
	     * @param {Number} config.outerRadius
	     * @param {String} [config.fill] fill color
	     * @param {Integer} [config.fillRed] set fill red component
	     * @param {Integer} [config.fillGreen] set fill green component
	     * @param {Integer} [config.fillBlue] set fill blue component
	     * @param {Integer} [config.fillAlpha] set fill alpha component
	     * @param {Image} [config.fillPatternImage] fill pattern image
	     * @param {Number} [config.fillPatternX]
	     * @param {Number} [config.fillPatternY]
	     * @param {Object} [config.fillPatternOffset] object with x and y component
	     * @param {Number} [config.fillPatternOffsetX] 
	     * @param {Number} [config.fillPatternOffsetY] 
	     * @param {Object} [config.fillPatternScale] object with x and y component
	     * @param {Number} [config.fillPatternScaleX]
	     * @param {Number} [config.fillPatternScaleY]
	     * @param {Number} [config.fillPatternRotation]
	     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
	     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientStartPointX]
	     * @param {Number} [config.fillLinearGradientStartPointY]
	     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientEndPointX]
	     * @param {Number} [config.fillLinearGradientEndPointY]
	     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
	     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientStartPointX]
	     * @param {Number} [config.fillRadialGradientStartPointY]
	     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientEndPointX] 
	     * @param {Number} [config.fillRadialGradientEndPointY] 
	     * @param {Number} [config.fillRadialGradientStartRadius]
	     * @param {Number} [config.fillRadialGradientEndRadius]
	     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
	     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
	     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
	     * @param {String} [config.stroke] stroke color
	     * @param {Integer} [config.strokeRed] set stroke red component
	     * @param {Integer} [config.strokeGreen] set stroke green component
	     * @param {Integer} [config.strokeBlue] set stroke blue component
	     * @param {Integer} [config.strokeAlpha] set stroke alpha component
	     * @param {Number} [config.strokeWidth] stroke width
	     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
	     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
	     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
	     *  is miter
	     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
	     *  is butt
	     * @param {String} [config.shadowColor]
	     * @param {Integer} [config.shadowRed] set shadow color red component
	     * @param {Integer} [config.shadowGreen] set shadow color green component
	     * @param {Integer} [config.shadowBlue] set shadow color blue component
	     * @param {Integer} [config.shadowAlpha] set shadow color alpha component
	     * @param {Number} [config.shadowBlur]
	     * @param {Object} [config.shadowOffset] object with x and y component
	     * @param {Number} [config.shadowOffsetX]
	     * @param {Number} [config.shadowOffsetY]
	     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
	     *  between 0 and 1
	     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
	     * @param {Array} [config.dash]
	     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
	     * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	     * @example
	     * var star = new Kinetic.Star({
	     *   x: 100,
	     *   y: 200,
	     *   numPoints: 5,
	     *   innerRadius: 70,
	     *   outerRadius: 70,
	     *   fill: 'red',
	     *   stroke: 'black',
	     *   strokeWidth: 4
	     * });
	     */
	    Kinetic.Star = function(config) {
	        this.___init(config);
	    };

	    Kinetic.Star.prototype = {
	        ___init: function(config) {
	            // call super constructor
	            Kinetic.Shape.call(this, config);
	            this.className = 'Star';
	            this.sceneFunc(this._sceneFunc);
	        },
	        _sceneFunc: function(context) {
	            var innerRadius = this.innerRadius(),
	                outerRadius = this.outerRadius(),
	                numPoints = this.numPoints();

	            context.beginPath();
	            context.moveTo(0, 0 - outerRadius);

	            for(var n = 1; n < numPoints * 2; n++) {
	                var radius = n % 2 === 0 ? outerRadius : innerRadius;
	                var x = radius * Math.sin(n * Math.PI / numPoints);
	                var y = -1 * radius * Math.cos(n * Math.PI / numPoints);
	                context.lineTo(x, y);
	            }
	            context.closePath();

	            context.fillStrokeShape(this);
	        }
	    };
	    Kinetic.Util.extend(Kinetic.Star, Kinetic.Shape);

	    // add getters setters
	    Kinetic.Factory.addGetterSetter(Kinetic.Star, 'numPoints', 5);

	    /**
	     * set number of points
	     * @name setNumPoints
	     * @method
	     * @memberof Kinetic.Star.prototype
	     * @param {Integer} points
	     */

	     /**
	     * get number of points
	     * @name getNumPoints
	     * @method
	     * @memberof Kinetic.Star.prototype
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Star, 'innerRadius', 0);

	    /**
	     * set inner radius
	     * @name setInnerRadius
	     * @method
	     * @memberof Kinetic.Star.prototype
	     * @param {Number} radius
	     */

	     /**
	     * get inner radius
	     * @name getInnerRadius
	     * @method
	     * @memberof Kinetic.Star.prototype
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Star, 'outerRadius', 0);

	    /**
	     * set outer radius
	     * @name setOuterRadius
	     * @method
	     * @memberof Kinetic.Star.prototype
	     * @param {Number} radius
	     */

	     /**
	     * get outer radius
	     * @name getOuterRadius
	     * @method
	     * @memberof Kinetic.Star.prototype
	     */

	    Kinetic.Collection.mapMethods(Kinetic.Star);
	})();
	;(function() {
	    // constants
	    var ATTR_CHANGE_LIST = ['fontFamily', 'fontSize', 'fontStyle', 'padding', 'lineHeight', 'text'],
	        CHANGE_KINETIC = 'Change.kinetic',
	        NONE = 'none',
	        UP = 'up',
	        RIGHT = 'right',
	        DOWN = 'down',
	        LEFT = 'left',
	        LABEL = 'Label',

	     // cached variables
	     attrChangeListLen = ATTR_CHANGE_LIST.length;

	    /**
	     * Label constructor.&nbsp; Labels are groups that contain a Text and Tag shape
	     * @constructor
	     * @memberof Kinetic
	     * @param {Object} config
	     * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	     * @example
	     * // create label
	     * var label = new Kinetic.Label({
	     *   x: 100,
	     *   y: 100, 
	     *   draggable: true
	     * });
	     *
	     * // add a tag to the label
	     * label.add(new Kinetic.Tag({
	     *   fill: '#bbb',
	     *   stroke: '#333',
	     *   shadowColor: 'black',
	     *   shadowBlur: 10,
	     *   shadowOffset: [10, 10],
	     *   shadowOpacity: 0.2,
	     *   lineJoin: 'round',
	     *   pointerDirection: 'up',
	     *   pointerWidth: 20,
	     *   pointerHeight: 20,
	     *   cornerRadius: 5
	     * }));
	     *
	     * // add text to the label
	     * label.add(new Kinetic.Text({
	     *   text: 'Hello World!',
	     *   fontSize: 50,
	     *   lineHeight: 1.2,
	     *   padding: 10,
	     *   fill: 'green'
	     *  }));
	     */
	    Kinetic.Label = function(config) {
	        this.____init(config);
	    };

	    Kinetic.Label.prototype = {
	        ____init: function(config) {
	            var that = this;

	            Kinetic.Group.call(this, config);
	            this.className = LABEL;
	            
	            this.on('add.kinetic', function(evt) {
	                that._addListeners(evt.child);
	                that._sync();
	            });
	        },
	        /**
	         * get Text shape for the label.  You need to access the Text shape in order to update
	         * the text properties
	         * @name getText
	         * @method
	         * @memberof Kinetic.Label.prototype
	         */
	        getText: function() {
	            return this.find('Text')[0];
	        },
	        /**
	         * get Tag shape for the label.  You need to access the Tag shape in order to update
	         * the pointer properties and the corner radius
	         * @name getTag
	         * @method
	         * @memberof Kinetic.Label.prototype
	         */
	        getTag: function() {
	            return this.find('Tag')[0];
	        },
	        _addListeners: function(text) {
	            var that = this,
	                n;
	            var func = function(){
	                    that._sync();
	                };

	            // update text data for certain attr changes
	            for(n = 0; n < attrChangeListLen; n++) {
	                text.on(ATTR_CHANGE_LIST[n] + CHANGE_KINETIC, func);
	            }
	        },
	        getWidth: function() {
	            return this.getText().getWidth();
	        },
	        getHeight: function() {
	            return this.getText().getHeight();
	        },
	        _sync: function() {
	            var text = this.getText(),
	                tag = this.getTag(),
	                width, height, pointerDirection, pointerWidth, x, y, pointerHeight;

	            if (text && tag) {
	                width = text.getWidth();
	                height = text.getHeight();
	                pointerDirection = tag.getPointerDirection();
	                pointerWidth = tag.getPointerWidth();
	                pointerHeight = tag.getPointerHeight();
	                x = 0;
	                y = 0;

	                switch(pointerDirection) {
	                    case UP:
	                        x = width / 2;
	                        y = -1 * pointerHeight;
	                        break;
	                    case RIGHT:
	                        x = width + pointerWidth;
	                        y = height / 2;
	                        break;
	                    case DOWN:
	                        x = width / 2;
	                        y = height + pointerHeight;
	                        break;
	                    case LEFT:
	                        x = -1 * pointerWidth;
	                        y = height / 2;
	                        break;
	                }

	                tag.setAttrs({
	                    x: -1 * x,
	                    y: -1 * y,
	                    width: width,
	                    height: height
	                });

	                text.setAttrs({
	                    x: -1 * x,
	                    y: -1 * y
	                });
	            }
	        }
	    };

	    Kinetic.Util.extend(Kinetic.Label, Kinetic.Group);

	    Kinetic.Collection.mapMethods(Kinetic.Label);

	    /**
	     * Tag constructor.&nbsp; A Tag can be configured
	     *  to have a pointer element that points up, right, down, or left
	     * @constructor
	     * @memberof Kinetic
	     * @param {Object} config
	     * @param {String} [config.pointerDirection] can be up, right, down, left, or none; the default
	     *  is none.  When a pointer is present, the positioning of the label is relative to the tip of the pointer.
	     * @param {Number} [config.pointerWidth]
	     * @param {Number} [config.pointerHeight]
	     * @param {Number} [config.cornerRadius]
	     */
	    Kinetic.Tag = function(config) {
	        this.___init(config);
	    };

	    Kinetic.Tag.prototype = {
	        ___init: function(config) {
	            Kinetic.Shape.call(this, config);
	            this.className = 'Tag';
	            this.sceneFunc(this._sceneFunc);
	        },
	        _sceneFunc: function(context) {
	            var width = this.getWidth(),
	                height = this.getHeight(),
	                pointerDirection = this.getPointerDirection(),
	                pointerWidth = this.getPointerWidth(),
	                pointerHeight = this.getPointerHeight(),
	                cornerRadius = this.getCornerRadius();

	            context.beginPath();
	            context.moveTo(0,0);

	            if (pointerDirection === UP) {
	                context.lineTo((width - pointerWidth)/2, 0);
	                context.lineTo(width/2, -1 * pointerHeight);
	                context.lineTo((width + pointerWidth)/2, 0);
	            }

	            if(!cornerRadius) {
	                context.lineTo(width, 0);
	            } else {
	                context.lineTo(width - cornerRadius, 0);
	                context.arc(width - cornerRadius, cornerRadius, cornerRadius, Math.PI * 3 / 2, 0, false);
	            }
	            
	            if (pointerDirection === RIGHT) {
	                context.lineTo(width, (height - pointerHeight)/2);
	                context.lineTo(width + pointerWidth, height/2);
	                context.lineTo(width, (height + pointerHeight)/2);
	            }
	            
	            if(!cornerRadius) {
	                context.lineTo(width, height);
	            } else {
	                context.lineTo(width, height - cornerRadius);
	                context.arc(width - cornerRadius, height - cornerRadius, cornerRadius, 0, Math.PI / 2, false);
	            }

	            if (pointerDirection === DOWN) {
	                context.lineTo((width + pointerWidth)/2, height);
	                context.lineTo(width/2, height + pointerHeight);
	                context.lineTo((width - pointerWidth)/2, height);
	            }
	            
	            if(!cornerRadius) {
	                context.lineTo(0, height);
	            } else {
	                context.lineTo(cornerRadius, height);
	                context.arc(cornerRadius, height - cornerRadius, cornerRadius, Math.PI / 2, Math.PI, false);
	            }

	            if (pointerDirection === LEFT) {
	                context.lineTo(0, (height + pointerHeight)/2);
	                context.lineTo(-1 * pointerWidth, height/2);
	                context.lineTo(0, (height - pointerHeight)/2);
	            }
	            
	            if(cornerRadius) {
	                context.lineTo(0, cornerRadius);
	                context.arc(cornerRadius, cornerRadius, cornerRadius, Math.PI, Math.PI * 3 / 2, false);
	            }

	            context.closePath();
	            context.fillStrokeShape(this);
	        }
	    };

	    Kinetic.Util.extend(Kinetic.Tag, Kinetic.Shape);
	    Kinetic.Factory.addGetterSetter(Kinetic.Tag, 'pointerDirection', NONE);

	    /**
	     * set pointer Direction
	     * @name setPointerDirection
	     * @method
	     * @memberof Kinetic.Tag.prototype
	     * @param {String} pointerDirection can be up, right, down, left, or none.  The
	     *  default is none
	     */

	     /**
	     * get pointer Direction
	     * @name getPointerDirection
	     * @method
	     * @memberof Kinetic.Tag.prototype
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Tag, 'pointerWidth', 0);

	    /**
	     * set pointer width
	     * @name setPointerWidth
	     * @method
	     * @memberof Kinetic.Tag.prototype
	     * @param {Number} pointerWidth
	     */

	     /**
	     * get pointer width
	     * @name getPointerWidth
	     * @method
	     * @memberof Kinetic.Tag.prototype
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Tag, 'pointerHeight', 0);

	    /**
	     * set pointer height
	     * @name setPointerHeight
	     * @method
	     * @memberof Kinetic.Tag.prototype
	     * @param {Number} pointerHeight
	     */

	     /**
	     * get pointer height
	     * @name getPointerHeight
	     * @method
	     * @memberof Kinetic.Tag.prototype
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Tag, 'cornerRadius', 0);

	    /**
	     * set corner radius
	     * @name setCornerRadius
	     * @method
	     * @memberof Kinetic.Tag.prototype
	     * @param {Number} corner radius
	     */

	    /**
	     * get corner radius
	     * @name getCornerRadius
	     * @method
	     * @memberof Kinetic.Tag.prototype
	     */

	    Kinetic.Collection.mapMethods(Kinetic.Tag);
	})();
	;(function() {
	    /**
	     * Arrow constructor
	     * @constructor
	     * @memberof Kinetic
	     * @augments Kinetic.Shape
	     * @param {Object} config
	     * @param {Array} config.points
	     * @param {Number} [config.tension] Higher values will result in a more curvy line.  A value of 0 will result in no interpolation.
	     *   The default is 0
	     * @param {Number} config.pointerLength
	     * @param {Number} config.pointerWidth
	     * @param {String} [config.fill] fill color
	     * @param {Integer} [config.fillRed] set fill red component
	     * @param {Integer} [config.fillGreen] set fill green component
	     * @param {Integer} [config.fillBlue] set fill blue component
	     * @param {Integer} [config.fillAlpha] set fill alpha component
	     * @param {Image} [config.fillPatternImage] fill pattern image
	     * @param {Number} [config.fillPatternX]
	     * @param {Number} [config.fillPatternY]
	     * @param {Object} [config.fillPatternOffset] object with x and y component
	     * @param {Number} [config.fillPatternOffsetX] 
	     * @param {Number} [config.fillPatternOffsetY] 
	     * @param {Object} [config.fillPatternScale] object with x and y component
	     * @param {Number} [config.fillPatternScaleX]
	     * @param {Number} [config.fillPatternScaleY]
	     * @param {Number} [config.fillPatternRotation]
	     * @param {String} [config.fillPatternRepeat] can be "repeat", "repeat-x", "repeat-y", or "no-repeat".  The default is "no-repeat"
	     * @param {Object} [config.fillLinearGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientStartPointX]
	     * @param {Number} [config.fillLinearGradientStartPointY]
	     * @param {Object} [config.fillLinearGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillLinearGradientEndPointX]
	     * @param {Number} [config.fillLinearGradientEndPointY]
	     * @param {Array} [config.fillLinearGradientColorStops] array of color stops
	     * @param {Object} [config.fillRadialGradientStartPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientStartPointX]
	     * @param {Number} [config.fillRadialGradientStartPointY]
	     * @param {Object} [config.fillRadialGradientEndPoint] object with x and y component
	     * @param {Number} [config.fillRadialGradientEndPointX] 
	     * @param {Number} [config.fillRadialGradientEndPointY] 
	     * @param {Number} [config.fillRadialGradientStartRadius]
	     * @param {Number} [config.fillRadialGradientEndRadius]
	     * @param {Array} [config.fillRadialGradientColorStops] array of color stops
	     * @param {Boolean} [config.fillEnabled] flag which enables or disables the fill.  The default value is true
	     * @param {String} [config.fillPriority] can be color, linear-gradient, radial-graident, or pattern.  The default value is color.  The fillPriority property makes it really easy to toggle between different fill types.  For example, if you want to toggle between a fill color style and a fill pattern style, simply set the fill property and the fillPattern properties, and then use setFillPriority('color') to render the shape with a color fill, or use setFillPriority('pattern') to render the shape with the pattern fill configuration
	     * @param {String} [config.stroke] stroke color
	     * @param {Integer} [config.strokeRed] set stroke red component
	     * @param {Integer} [config.strokeGreen] set stroke green component
	     * @param {Integer} [config.strokeBlue] set stroke blue component
	     * @param {Integer} [config.strokeAlpha] set stroke alpha component
	     * @param {Number} [config.strokeWidth] stroke width
	     * @param {Boolean} [config.strokeScaleEnabled] flag which enables or disables stroke scale.  The default is true
	     * @param {Boolean} [config.strokeEnabled] flag which enables or disables the stroke.  The default value is true
	     * @param {String} [config.lineJoin] can be miter, round, or bevel.  The default
	     *  is miter
	     * @param {String} [config.lineCap] can be butt, round, or sqare.  The default
	     *  is butt
	     * @param {String} [config.shadowColor]
	     * @param {Integer} [config.shadowRed] set shadow color red component
	     * @param {Integer} [config.shadowGreen] set shadow color green component
	     * @param {Integer} [config.shadowBlue] set shadow color blue component
	     * @param {Integer} [config.shadowAlpha] set shadow color alpha component
	     * @param {Number} [config.shadowBlur]
	     * @param {Object} [config.shadowOffset] object with x and y component
	     * @param {Number} [config.shadowOffsetX]
	     * @param {Number} [config.shadowOffsetY]
	     * @param {Number} [config.shadowOpacity] shadow opacity.  Can be any real number
	     *  between 0 and 1
	     * @param {Boolean} [config.shadowEnabled] flag which enables or disables the shadow.  The default value is true
	     * @param {Array} [config.dash]
	     * @param {Boolean} [config.dashEnabled] flag which enables or disables the dashArray.  The default value is true
	     * @param {Number} [config.x]
	     * @param {Number} [config.y]
	     * @param {Number} [config.width]
	     * @param {Number} [config.height]
	     * @param {Boolean} [config.visible]
	     * @param {Boolean} [config.listening] whether or not the node is listening for events
	     * @param {String} [config.id] unique id
	     * @param {String} [config.name] non-unique name
	     * @param {Number} [config.opacity] determines node opacity.  Can be any number between 0 and 1
	     * @param {Object} [config.scale] set scale
	     * @param {Number} [config.scaleX] set scale x
	     * @param {Number} [config.scaleY] set scale y
	     * @param {Number} [config.rotation] rotation in degrees
	     * @param {Object} [config.offset] offset from center point and rotation point
	     * @param {Number} [config.offsetX] set offset x
	     * @param {Number} [config.offsetY] set offset y
	     * @param {Boolean} [config.draggable] makes the node draggable.  When stages are draggable, you can drag and drop
	     *  the entire stage by dragging any portion of the stage
	     * @param {Number} [config.dragDistance]
	     * @param {Function} [config.dragBoundFunc]
	     * @example
	     * var line = new Kinetic.Line({
	     *   points: [73, 70, 340, 23, 450, 60, 500, 20],
	     *   stroke: 'red',
	     *   tension: 1,
	     *   pointerLength : 10,
	     *   pointerWidth : 12
	     * });
	     */
	    Kinetic.Arrow = function(config) {
	        this.____init(config);
	    };

	    Kinetic.Arrow.prototype = {
	        ____init : function(config) {
	            // call super constructor
	            Kinetic.Line.call(this, config);
	            this.className = 'Arrow';
	        },
	        _sceneFunc : function(ctx) {
	            var PI2 = Math.PI * 2;
	            var points = this.points();
	            var n = points.length;
	            var dx = points[n-2] - points[n-4];
	            var dy = points[n-1] - points[n-3];
	            var radians = (Math.atan2(dy, dx) + PI2) % PI2;
	            var length = this.pointerLength();
	            var width = this.pointerWidth();

	            ctx.save();
	            ctx.beginPath();
	            ctx.translate(points[n-2], points[n-1]);
	            ctx.rotate(radians);
	            ctx.moveTo(0, 0);
	            ctx.lineTo(-length, width / 2);
	            ctx.lineTo(-length, -width / 2);
	            ctx.closePath();
	            ctx.restore();

	            if (this.pointerAtBeginning()) {
	                ctx.save();
	                ctx.translate(points[0], points[1]);
	                dx = points[2] - points[0];
	                dy = points[3] - points[1];
	                ctx.rotate((Math.atan2(-dy, -dx) + PI2) % PI2);
	                ctx.moveTo(0, 0);
	                ctx.lineTo(-10, 6);
	                ctx.lineTo(-10, -6);
	                ctx.closePath();
	                ctx.restore();
	            }

	            ctx.fillStrokeShape(this);
	            Kinetic.Line.prototype._sceneFunc.apply(this, arguments);
	        }
	    };

	    Kinetic.Util.extend(Kinetic.Arrow, Kinetic.Line);
	    /**
	     * get/set pointerLength
	     * @name pointerLength
	     * @method
	     * @memberof Kinetic.Arrow.prototype
	     * @param {Number} Length of pointer of arrow.
	     *   The default is 10.
	     * @returns {Number}
	     * @example
	     * // get tension
	     * var pointerLength = line.pointerLength();
	     *
	     * // set tension
	     * line.pointerLength(15);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Arrow, 'pointerLength', 10);
	    /**
	     * get/set pointerWidth
	     * @name pointerWidth
	     * @method
	     * @memberof Kinetic.Arrow.prototype
	     * @param {Number} Width of pointer of arrow.
	     *   The default is 10.
	     * @returns {Number}
	     * @example
	     * // get tension
	     * var pointerWidth = line.pointerWidth();
	     *
	     * // set tension
	     * line.pointerWidth(15);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Arrow, 'pointerWidth', 10);
	    /**
	     * get/set pointerAtBeginning
	     * @name pointerAtBeginning
	     * @method
	     * @memberof Kinetic.Arrow.prototype
	     * @param {Number} Should pointer displayed at beginning of arrow.
	     *   The default is false.
	     * @returns {Boolean}
	     * @example
	     * // get tension
	     * var pointerAtBeginning = line.pointerAtBeginning();
	     *
	     * // set tension
	     * line.pointerAtBeginning(true);
	     */

	    Kinetic.Factory.addGetterSetter(Kinetic.Arrow, 'pointerAtBeginning', false);
	    Kinetic.Collection.mapMethods(Kinetic.Arrow);

	})();


	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * WAVEFORM.AXIS.JS
	 *
	 * This module handles all functionality related to drawing the
	 * visualisations. Only a sigle object of this type is
	 * instantiated meaning this code is reused multiple times.
	 *
	 */
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(4), __webpack_require__(11)], __WEBPACK_AMD_DEFINE_RESULT__ = function(mixins, Kinetic) {
	    'use strict';

	    /*
	     * Rounds the given value up to the nearest given multiple.
	     * e.g: roundUpToNearest(5.5, 3) returns 6
	     *      roundUpToNearest(141.0, 10) returns 150
	     *      roundUpToNearest(-5.5, 3) returns -6
	     */

	    function roundUpToNearest(value, multiple) {
	        var remainder = value % multiple;
	        if (remainder === 0) {
	            return value;
	        } else {
	            return value + multiple - remainder;
	        }
	    }

	    function WaveformAxis(view) {
	        this.view = view; // store reference to waveform view object

	        this.axisShape = new Kinetic.Shape({
	            fill: 'rgba(38, 255, 161, 1)',
	            strokeWidth: 0,
	            opacity: 1
	        });

	        this.axisShape.setDrawFunc(this.axisDrawFunction.bind(this, view));

	        this.view.uiLayer.add(this.axisShape);
	    }

	    /*
	     * Returns number of seconds for each x-axis marker, appropriate for the
	     * current zoom level, ensuring that markers are not too close together
	     * and that markers are placed at intuitive time intervals (i.e., every 1,
	     * 2, 5, 10, 20, 30 seconds, then every 1, 2, 5, 10, 20, 30 minutes, then
	     * every 1, 2, 5, 10, 20, 30 hours).
	     */

	    WaveformAxis.prototype.getAxisLabelScale = function() {
	        var baseSecs = 1; // seconds
	        var steps = [1, 2, 5, 10, 20, 30];
	        var minSpacing = 60;
	        var index = 0;

	        var secs;

	        for (;;) {
	            secs = baseSecs * steps[index];
	            var pixels = this.view.data.at_time(secs);
	            if (pixels < minSpacing) {
	                if (++index == steps.length) {
	                    baseSecs *= 60; // seconds -> minutes -> hours
	                    index = 0;
	                }
	            } else {
	                break;
	            }
	        }
	        return secs;
	    };


	    /**
	     *
	     * @param {WaveformOverview|WaveformZoomview} view
	     * @param {Kinetic.Context} context
	     */
	    WaveformAxis.prototype.axisDrawFunction = function(view, context) {
	        var currentFrameStartTime = view.data.time(view.frameOffset);

	        // Draw axis markers
	        var markerHeight = 10;

	        // Time interval between axis markers (seconds)
	        var axisLabelIntervalSecs = this.getAxisLabelScale();

	        // Time of first axis marker (seconds)
	        var firstAxisLabelSecs = roundUpToNearest(currentFrameStartTime, axisLabelIntervalSecs);

	        // Distance between waveform start time and first axis marker (seconds)
	        var axisLabelOffsetSecs = firstAxisLabelSecs - currentFrameStartTime;

	        // Distance between waveform start time and first axis marker (pixels)
	        var axisLabelOffsetPixels = this.view.data.at_time(axisLabelOffsetSecs);

	        context.strokeStyle = "#ccc";
	        context.lineWidth = 1;

	        // Set text style
	        context.font = "11px sans-serif";
	        context.fillStyle = "#aaa";
	        context.textAlign = "left";
	        context.textBaseline = "bottom";

	        var secs = firstAxisLabelSecs;
	        var x;

	        for (;;) {
	            // Position of axis marker (pixels)
	            x = axisLabelOffsetPixels + this.view.data.at_time(secs - firstAxisLabelSecs);
	            if (x >= this.view.width) {
	                break;
	            }

	            // Draw the axis out old-skool canvas style

	            context.beginPath();
	            context.moveTo(x + 0.5, 0);
	            context.lineTo(x + 0.5, 0 + markerHeight);
	            context.moveTo(x + 0.5, this.view.height);
	            context.lineTo(x + 0.5, this.view.height - markerHeight);
	            context.stroke();

	            var label = mixins.niceTime(secs, true);
	            var labelWidth = context._context.measureText(label).width; // todo handle this with Kinetic.Text
	            var labelX = x - labelWidth / 2;
	            var labelY = this.view.height - 1 - markerHeight;

	            if (labelX >= 0) {
	                context.fillText(label, labelX, labelY);
	            }

	            secs += axisLabelIntervalSecs;
	        }
	    };

	    return WaveformAxis;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * WAVEFORM.SEGMENTS.JS
	 *
	 * This module handles all functionality related to the adding,
	 * removing and manipulation of segments
	 */
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(11)], __WEBPACK_AMD_DEFINE_RESULT__ = function(Kinetic) {
	    'use strict';

	    return {
	        init: function(currentSampleRate, previousSampleRate, view) {
	            var that = view;
	            var currentTime = that.peaks.time.getCurrentTime();
	            var frameData = [];

	            var numOfFrames = 30;
	            var input_index;
	            var output_index;
	            var lastFrameOffsetTime;

	            //Fade out the time axis and the segments
	            //that.axis.axisShape.setAttr('opacity', 0);
	            //Fade out segments
	            if (that.segmentLayer) {
	                that.segmentLayer.setVisible(false);
	                that.pointLayer.setVisible(false);
	            }

	            // Determine whether zooming in or out
	            if (previousSampleRate < currentSampleRate) {
	                numOfFrames = 15;
	            }

	            // Create array with resampled data for each animation frame (need to know duration, resample points per frame)
	            for (var i = 0; i < numOfFrames; i++) {
	                // Work out interpolated resample scale using currentSampleRate and previousSampleRate
	                var frame_sample_rate = Math.round(previousSampleRate + ((i + 1) * (currentSampleRate - previousSampleRate) / numOfFrames));
	                //Determine the timeframe for the zoom animation (start and end of dataset for zooming animation)

	                var newWidthSeconds = that.width * frame_sample_rate / that.rootData.adapter.sample_rate;

	                if ((currentTime >= 0) && (currentTime <= 0 + newWidthSeconds / 2)) {
	                    input_index = 0;
	                    output_index = 0;
	                } else if ((currentTime <= that.rootData.duration) && (currentTime >= that.rootData.duration - newWidthSeconds / 2)) {
	                    lastFrameOffsetTime = that.rootData.duration - newWidthSeconds;

	                    input_index = (lastFrameOffsetTime * that.rootData.adapter.sample_rate) / previousSampleRate;
	                    output_index = (lastFrameOffsetTime * that.rootData.adapter.sample_rate) / frame_sample_rate; //sample rate = 44100
	                } else {
	                    //This way calculates the index of the start time at the scale we are coming from and the scale we are going to
	                    var oldPixelIndex = (currentTime * that.rootData.adapter.sample_rate) / previousSampleRate;
	                    input_index = oldPixelIndex - (that.width / 2);

	                    var newPixelIndex = (currentTime * that.rootData.adapter.sample_rate) / frame_sample_rate; //sample rate = 44100
	                    output_index = newPixelIndex - (that.width / 2);
	                }

	                if (input_index < 0) {
	                    input_index = 0;
	                }

	                var resampled = that.rootData.resample({ // rootData should be swapped for your resampled dataset
	                    scale: frame_sample_rate,
	                    input_index: Math.floor(input_index),
	                    output_index: Math.floor(output_index),
	                    width: that.width
	                });

	                frameData.push(resampled);

	                previousSampleRate = frame_sample_rate;
	            }

	            return new Kinetic.Animation(this.onFrameData(view, frameData), view);
	        },
	        onFrameData: function(view, frameData) {
	            var that = view;
	            that.intermediateData = null;

	            /**
	             * @param {Object} frame
	             * @this {Kinetic.Animation}
	             */
	            return function(frame) {
	                if (frameData.length) {
	                    //Send correct resampled waveform data object to drawFunc and draw it
	                    that.intermediateData = frameData.shift();
	                    that.zoomWaveformLayer.draw();
	                } else {
	                    this.stop();
	                    that.segmentLayer.setVisible(true);
	                    that.pointLayer.setVisible(true);
	                    that.seekFrame(that.data.at_time(that.currentTime));
	                }
	            };
	        }
	    };
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * WAVEFORM.SEGMENTS.JS
	 *
	 * This module handles all functionality related to the adding,
	 * removing and manipulation of segments
	 */
	!(__WEBPACK_AMD_DEFINE_ARRAY__ = [
	    __webpack_require__(20),
	    __webpack_require__(4),
	    __webpack_require__(11)
	], __WEBPACK_AMD_DEFINE_RESULT__ = function(BaseShape, mixins, Kinetic) {
	    'use strict';

	    var WaveShape = Object.create(BaseShape.prototype);

	    /**
	     *
	     * @param segmentData
	     * @param view
	     * @returns {Kinetic.Shape}
	     */
	    WaveShape.createShape = function createShape(segmentData, view) {
	        var shape = new Kinetic.Shape({
	            fill: segmentData.color,
	            strokeWidth: 0,
	            opacity: 1
	        });

	        shape.setDrawFunc(WaveShape.drawFunc.bind(shape, view, segmentData.id));

	        return shape;
	    };

	    /**
	     *
	     * @this  {Kinetic.Shape}
	     * @param {WaveformData} waveform
	     * @param {Kinetic.Context} context
	     * @param {interpolateHeight} y
	     */
	    WaveShape.drawFunc = function WaveShapedrawFunc(view, segmentId, context) {
	        var waveformData = view.data;

	        if (waveformData.segments[segmentId] === undefined) {
	            return;
	        }

	        var segment = waveformData.segments[segmentId];
	        var offset_length = segment.offset_length;
	        var offset_start = segment.offset_start - waveformData.offset_start;
	        var y = mixins.interpolateHeight(view.height);

	        mixins.drawWaveform(context, segment.min, segment.max, offset_start, offset_length, y);
	        context.fillStrokeShape(this);
	    };

	    return WaveShape;
	}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/* (ignored) */

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	/* (ignored) */

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var WaveformDataSegment = __webpack_require__(21);
	var WaveformDataPoint = __webpack_require__(22);

	/**
	 * Facade to iterate on audio waveform response.
	 *
	 * ```javascript
	 *  var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
	 *
	 *  var json_waveform = new WaveformData(xhr.responseText, WaveformData.adapters.object);
	 *
	 *  var arraybuff_waveform = new WaveformData(getArrayBufferData(), WaveformData.adapters.arraybuffer);
	 * ```
	 *
	 * ## Offsets
	 *
	 * An **offset** is a non-destructive way to iterate on a subset of data.
	 *
	 * It is the easiest way to **navigate** through data without having to deal with complex calculations.
	 * Simply iterate over the data to display them.
	 *
	 * *Notice*: the default offset is the entire set of data.
	 *
	 * @param {String|ArrayBuffer|Mixed} response_data Waveform data, to be consumed by the related adapter.
	 * @param {WaveformData.adapter|Function} adapter Backend adapter used to manage access to the data.
	 * @constructor
	 */
	var WaveformData = module.exports = function WaveformData(response_data, adapter){
	  /**
	   * Backend adapter used to manage access to the data.
	   *
	   * @type {Object}
	   */
	  this.adapter = adapter.fromResponseData(response_data);

	  /**
	   * Defined segments.
	   *
	   * ```javascript
	   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
	   *
	   * console.log(waveform.segments.speakerA);          // -> undefined
	   *
	   * waveform.set_segment(30, 90, "speakerA");
	   *
	   * console.log(waveform.segments.speakerA.start);    // -> 30
	   * ```
	   *
	   * @type {Object} A hash of `WaveformDataSegment` objects.
	   */
	  this.segments = {};

	  /**
	   * Defined points.
	   *
	   * ```javascript
	   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
	   *
	   * console.log(waveform.points.speakerA);          // -> undefined
	   *
	   * waveform.set_point(30, "speakerA");
	   *
	   * console.log(waveform.points.speakerA.timeStamp);    // -> 30
	   * ```
	   *
	   * @type {Object} A hash of `WaveformDataPoint` objects.
	   */
	  this.points = {};

	  this.offset(0, this.adapter.length);
	};

	/**
	 * Creates an instance of WaveformData by guessing the adapter from the data type.
	 * As an icing sugar, it will also do the detection job from an XMLHttpRequest response.
	 *
	 * ```javascript
	 * var xhr = new XMLHttpRequest();
	 * xhr.open("GET", "http://example.com/waveforms/track.dat");
	 * xhr.responseType = "arraybuffer";
	 *
	 * xhr.addEventListener("load", function onResponse(progressEvent){
	 *   var waveform = WaveformData.create(progressEvent.target);
	 *
	 *   console.log(waveform.duration);
	 * });
	 *
	 * xhr.send();
	 * ```
	 *
	 * @static
	 * @throws TypeError
	 * @param {XMLHttpRequest|Mixed} data
	 * @return {WaveformData}
	 */
	WaveformData.create = function createFromResponseData(data){
	  var adapter = null;
	  var xhrData = null;

	  if (data && typeof data === "object" && ("responseText" in data || "response" in data)){
	    xhrData = ("responseType" in data) ? data.response : (data.responseText || data.response);
	  }

	  Object.keys(WaveformData.adapters).some(function(adapter_id){
	    if (WaveformData.adapters[adapter_id].isCompatible(xhrData || data)){
	      adapter = WaveformData.adapters[adapter_id];
	      return true;
	    }
	  });

	  if (adapter === null){
	    throw new TypeError("Could not detect a WaveformData adapter from the input.");
	  }

	  return new WaveformData(xhrData || data, adapter);
	};

	/**
	 * Public API for the Waveform Data manager.
	 *
	 * @namespace WaveformData
	 */
	WaveformData.prototype = {
	  /**
	   * Clamp an offset of data upon the whole response body.
	   * Pros: it's just a reference, not a new array. So it's fast.
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   *
	   * console.log(waveform.offset_length);   // -> 150
	   * console.log(waveform.min[0]);          // -> -12
	   *
	   * waveform.offset(20, 50);
	   *
	   * console.log(waveform.min.length);      // -> 30
	   * console.log(waveform.min[0]);          // -> -9
	   * ```
	   *
	   * @param {Integer} start New beginning of the offset. (inclusive)
	   * @param {Integer} end New ending of the offset (exclusive)
	   */
	  offset: function(start, end){
	    var data_length = this.adapter.length;

	    if (end < 0){
	      throw new RangeError("End point must be non-negative [" + Number(end) + " < 0]");
	    }

	    if (end <= start){
	      throw new RangeError("We can't end prior to the starting point [" + Number(end) + " <= " + Number(start) + "]");
	    }

	    if (start < 0){
	      throw new RangeError("Start point must be non-negative [" + Number(start) + " < 0]");
	    }

	    if (start >= data_length){
	      throw new RangeError("Start point must be within range [" + Number(start) + " >= " + data_length + "]");
	    }

	    if (end > data_length){
	      end = data_length;
	    }

	    this.offset_start = start;
	    this.offset_end = end;
	    this.offset_length = end - start;
	  },
	  /**
	   * Creates a new segment of data.
	   * Pretty handy if you need to bookmark a duration and display it according to the current offset.
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   *
	   * console.log(Object.keys(waveform.segments));          // -> []
	   *
	   * waveform.set_segment(10, 120);
	   * waveform.set_segment(30, 90, "speakerA");
	   *
	   * console.log(Object.keys(waveform.segments));          // -> ['default', 'speakerA']
	   * console.log(waveform.segments.default.min.length);    // -> 110
	   * console.log(waveform.segments.speakerA.min.length);   // -> 60
	   * ```
	   *
	   * @param {Integer} start Beginning of the segment (inclusive)
	   * @param {Integer} end Ending of the segment (exclusive)
	   * @param {String*} identifier Unique identifier. If nothing is specified, *default* will be used as a value.
	   * @return {WaveformDataSegment}
	   */
	  set_segment: function setSegment(start, end, identifier){
	    identifier = identifier || "default";

	    this.segments[identifier] = new WaveformDataSegment(this, start, end);

	    return this.segments[identifier];
	  },
	  /**
	   * Creates a new point of data.
	   * Pretty handy if you need to bookmark a specific point and display it according to the current offset.
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   *
	   * console.log(Object.keys(waveform.points));          // -> []
	   *
	   * waveform.set_point(10);
	   * waveform.set_point(30, "speakerA");
	   *
	   * console.log(Object.keys(waveform.points));          // -> ['default', 'speakerA']
	   * ```
	   *
	   * @param {Integer} timeStamp the time to place the bookmark
	   * @param {String*} identifier Unique identifier. If nothing is specified, *default* will be used as a value.
	   * @return {WaveformDataPoint}
	   */
	  set_point: function setPoint(timeStamp, identifier){
	    if(identifier === undefined || identifier === null || identifier.length === 0) {
	      identifier = "default";
	    }

	    this.points[identifier] = new WaveformDataPoint(this, timeStamp);

	    return this.points[identifier];
	  },
	  /**
	   * Removes a point of data.
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   *
	   * console.log(Object.keys(waveform.points));          // -> []
	   *
	   * waveform.set_point(30, "speakerA");
	   * console.log(Object.keys(waveform.points));          // -> ['speakerA']
	   * waveform.remove_point("speakerA");
	   * console.log(Object.keys(waveform.points));          // -> []
	   * ```
	   *
	   * @param {String*} identifier Unique identifier. If nothing is specified, *default* will be used as a value.
	   * @return null
	   */
	  remove_point: function removePoint(identifier) {
	    if(this.points[identifier]) {
	      delete this.points[identifier];
	    }
	  },
	  /**
	   * Creates a new WaveformData object with resampled data.
	   * Returns a rescaled waveform, to either fit the waveform to a specific width, or to a specific zoom level.
	   *
	   * **Note**: You may specify either the *width* or the *scale*, but not both. The `scale` will be deduced from the `width` you want to fit the data into.
	   *
	   * Adapted from Sequence::GetWaveDisplay in Audacity, with permission.
	   *
	   * ```javascript
	   * // ...
	   * var waveform = WaveformData.create({ ... });
	   *
	   * // fitting the data in a 500px wide canvas
	   * var resampled_waveform = waveform.resample({ width: 500 });
	   *
	   * console.log(resampled_waveform.min.length);   // -> 500
	   *
	   * // zooming out on a 3 times less precise scale
	   * var resampled_waveform = waveform.resample({ scale: waveform.adapter.scale * 3 });
	   *
	   * // partial resampling (to perform fast animations involving a resampling per animation frame)
	   * var partially_resampled_waveform = waveform.resample({ width: 500, from: 0, to: 500 });
	   *
	   * // ...
	   * ```
	   *
	   * @see https://code.google.com/p/audacity/source/browse/audacity-src/trunk/src/Sequence.cpp
	   * @param {Number|{width: Number, scale: Number}} options Either a constraint width or a constraint sample rate
	   * @return {WaveformData} New resampled object
	   */
	  resample: function(options){
	    if (typeof options === 'number'){
	      options = {
	        width: options
	      };
	    }

	    options.input_index = typeof options.input_index === 'number' ? options.input_index : null;
	    options.output_index = typeof options.output_index === 'number' ? options.output_index : null;
	    options.scale = typeof options.scale === 'number' ? options.scale : null;
	    options.width = typeof options.width === 'number' ? options.width : null;

	    var is_partial_resampling = Boolean(options.input_index) || Boolean(options.output_index);

	    if (options.input_index !== null && (options.input_index >= 0) === false){
	      throw new RangeError('options.input_index should be a positive integer value. ['+ options.input_index +']');
	    }

	    if (options.output_index !== null && (options.output_index >= 0) === false){
	      throw new RangeError('options.output_index should be a positive integer value. ['+ options.output_index +']');
	    }

	    if (options.width !== null && (options.width > 0) === false){
	      throw new RangeError('options.width should be a strictly positive integer value. ['+ options.width +']');
	    }

	    if (options.scale !== null && (options.scale > 0) === false){
	      throw new RangeError('options.scale should be a strictly positive integer value. ['+ options.scale +']');
	    }

	    if (!options.scale && !options.width){
	      throw new RangeError('You should provide either a resampling scale or a width in pixel the data should fit in.');
	    }

	    var definedPartialOptionsCount = ['width', 'scale', 'output_index', 'input_index'].reduce(function(count, key){
	      return count + (options[key] === null ? 0 : 1);
	    }, 0);

	    if (is_partial_resampling && definedPartialOptionsCount !== 4) {
	      throw new Error('Some partial resampling options are missing. You provided ' + definedPartialOptionsCount + ' of them over 4.');
	    }

	    var output_data = [];
	    var samples_per_pixel = options.scale || Math.floor(this.duration * this.adapter.sample_rate / options.width);    //scale we want to reach
	    var scale = this.adapter.scale;   //scale we are coming from
	    var channel_count = 2;

	    var input_buffer_size = this.adapter.length; //the amount of data we want to resample i.e. final zoom want to resample all data but for intermediate zoom we want to resample subset
	    var input_index = options.input_index || 0; //is this start point? or is this the index at current scale
	    var output_index = options.output_index || 0; //is this end point? or is this the index at scale we want to be?
	    var min = input_buffer_size ? this.min_sample(input_index) : 0; //min value for peak in waveform
	    var max = input_buffer_size ? this.max_sample(input_index) : 0; //max value for peak in waveform
	    var min_value = -128;
	    var max_value = 127;

	    if (samples_per_pixel < scale){
	      throw new Error("Zoom level "+samples_per_pixel+" too low, minimum: "+scale);
	    }

	    var where, prev_where, stop, value, last_input_index;

	    var sample_at_pixel = function sample_at_pixel(x){
	      return Math.floor(x * samples_per_pixel);
	    };

	    var add_sample = function add_sample(min, max){
	      output_data.push(min, max);
	    };

	    while (input_index < input_buffer_size) {
	      while (Math.floor(sample_at_pixel(output_index) / scale) <= input_index){
	        if (output_index){
	          add_sample(min, max);
	        }

	        last_input_index = input_index;

	        output_index++;

	        where      = sample_at_pixel(output_index);
	        prev_where = sample_at_pixel(output_index - 1);

	        if (where !== prev_where){
	          min = max_value;
	          max = min_value;
	        }
	      }

	      where = sample_at_pixel(output_index);
	      stop = Math.floor(where / scale);

	      if (stop > input_buffer_size){
	        stop = input_buffer_size;
	      }

	      while (input_index < stop){
	        value = this.min_sample(input_index);

	        if (value < min){
	          min = value;
	        }

	        value = this.max_sample(input_index);

	        if (value > max){
	          max = value;
	        }

	        input_index++;
	      }

	      if (is_partial_resampling && (output_data.length / channel_count) >= options.width) {
	        break;
	      }
	    }

	    if (is_partial_resampling) {
	      if ((output_data.length / channel_count) > options.width && input_index !== last_input_index){
	        add_sample(min, max);
	      }
	    }
	    else if(input_index !== last_input_index){
	      add_sample(min, max);
	    }

	    return new WaveformData({
	      version: this.adapter.version,
	      samples_per_pixel: samples_per_pixel,
	      length: output_data.length / channel_count,
	      data: output_data,
	      sample_rate: this.adapter.sample_rate
	    }, WaveformData.adapters.object);
	  },
	  /**
	   * Returns all the min peaks values.
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   *
	   * console.log(waveform.min.length);      // -> 150
	   * console.log(waveform.min[0]);          // -> -12
	   *
	   * waveform.offset(20, 50);
	   *
	   * console.log(waveform.min.length);      // -> 30
	   * console.log(waveform.min[0]);          // -> -9
	   * ```
	   *
	   * @api
	   * @return {Array.<Integer>} Min values contained in the offset.
	   */
	  get min(){
	    return this.offsetValues(this.offset_start, this.offset_length, 0);
	  },
	  /**
	   * Returns all the max peaks values.
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   *
	   * console.log(waveform.max.length);      // -> 150
	   * console.log(waveform.max[0]);          // -> 12
	   *
	   * waveform.offset(20, 50);
	   *
	   * console.log(waveform.max.length);      // -> 30
	   * console.log(waveform.max[0]);          // -> 5
	   * ```
	   *
	   * @api
	   * @return {Array.<Integer>} Max values contained in the offset.
	   */
	  get max(){
	    return this.offsetValues(this.offset_start, this.offset_length, 1);
	  },
	  /**
	   * Return the unpacked values for a particular offset.
	   *
	   * @param {Integer} start
	   * @param {Integer} length
	   * @param {Integer} correction The step to skip for each iteration (as the response body is [min, max, min, max...])
	   * @return {Array.<Integer>}
	   */
	  offsetValues: function getOffsetValues(start, length, correction){
	    var adapter = this.adapter;
	    var values = [];

	    correction += (start * 2);  //offsetting the positioning query

	    for (var i = 0; i < length; i++){
	      values.push(adapter.at((i * 2) + correction));
	    }

	    return values;
	  },
	  /**
	   * Compute the duration in seconds of the audio file.
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   * console.log(waveform.duration);    // -> 10.33333333333
	   *
	   * waveform.offset(20, 50);
	   * console.log(waveform.duration);    // -> 10.33333333333
	   * ```
	   *
	   * @api
	   * @return {number} Duration of the audio waveform, in seconds.
	   */
	  get duration(){
	    return (this.adapter.length * this.adapter.scale) / this.adapter.sample_rate;
	  },
	  /**
	   * Return the duration in seconds of the current offset.
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   *
	   * console.log(waveform.offset_duration);    // -> 10.33333333333
	   *
	   * waveform.offset(20, 50);
	   *
	   * console.log(waveform.offset_duration);    // -> 2.666666666667
	   * ```
	   *
	   * @api
	   * @return {number} Duration of the offset, in seconds.
	   */
	  get offset_duration(){
	    return (this.offset_length * this.adapter.scale) / this.adapter.sample_rate;
	  },
	  /**
	   * Return the number of pixels per second.
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   *
	   * console.log(waveform.pixels_per_second);       // -> 93.75
	   * ```
	   *
	   * @api
	   * @return {number} Number of pixels per second.
	   */
	  get pixels_per_second(){
	    return this.adapter.sample_rate / this.adapter.scale;
	  },
	  /**
	   * Return the amount of time represented by a single pixel.
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   *
	   * console.log(waveform.seconds_per_pixel);       // -> 0.010666666666666666
	   * ```
	   *
	   * @return {number} Amount of time (in seconds) contained in a pixel.
	   */
	  get seconds_per_pixel(){
	    return this.adapter.scale / this.adapter.sample_rate;
	  },
	  /**
	   * Returns a value at a specific offset.
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   *
	   * console.log(waveform.at(20));              // -> -7
	   * console.log(waveform.at(21));              // -> 12
	   * ```
	   *
	   * @proxy
	   * @param {Integer} index
	   * @return {number} Offset value
	   */
	  at: function at_sample_proxy(index){
	    return this.adapter.at(index);
	  },
	  /**
	   * Return the pixel location for a certain time.
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   *
	   * console.log(waveform.at_time(0.0000000023));       // -> 10
	   * ```
	   * @param {number} time
	   * @return {integer} Index location for a specific time.
	   */
	  at_time: function at_time(time){
	    return Math.floor((time * this.adapter.sample_rate) / this.adapter.scale);
	  },
	  /**
	   * Returns the time in seconds for a particular index
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   *
	   * console.log(waveform.time(10));                    // -> 0.0000000023
	   * ```
	   *
	   * @param {Integer} index
	   * @return {number}
	   */
	  time: function time(index){
	    return index * this.seconds_per_pixel;
	  },
	  /**
	   * Return if a pixel lies within the current offset.
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   *
	   * console.log(waveform.in_offset(50));      // -> true
	   * console.log(waveform.in_offset(120));     // -> true
	   *
	   * waveform.offset(100, 150);
	   *
	   * console.log(waveform.in_offset(50));      // -> false
	   * console.log(waveform.in_offset(120));     // -> true
	   * ```
	   *
	   * @param {number} pixel
	   * @return {boolean} True if the pixel lies in the current offset, false otherwise.
	   */
	  in_offset: function isInOffset(pixel){
	    return pixel >= this.offset_start && pixel < this.offset_end;
	  },
	  /**
	   * Returns a min value for a specific offset.
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   *
	   * console.log(waveform.min_sample(10));      // -> -7
	   * ```
	   *
	   * @param {Integer} offset
	   * @return {Number} Offset min value
	   */
	  min_sample: function getMinValue(offset){
	    return this.adapter.at(offset * 2);
	  },
	  /**
	   * Returns a max value for a specific offset.
	   *
	   * ```javascript
	   * var waveform = WaveformData.create({ ... });
	   *
	   * console.log(waveform.max_sample(10));      // -> 12
	   * ```
	   *
	   * @param {Integer} offset
	   * @return {Number} Offset max value
	   */
	  max_sample: function getMaxValue(offset){
	    return this.adapter.at((offset * 2) + 1);
	  }
	};

	/**
	 * Available adapters to manage the data backends.
	 *
	 * @type {Object}
	 */
	WaveformData.adapters = {};


	/**
	 * WaveformData Adapter Structure
	 *
	 * @typedef {{from: Number, to: Number, platforms: {}}}
	 */
	WaveformData.adapter = function WaveformDataAdapter(response_data){
	  this.data = response_data;
	};


/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var audioContext = __webpack_require__(26);
	var audioDecoder = __webpack_require__(23);

	/**
	 * Creates a working WaveformData based on binary audio data.
	 *
	 * This is still quite experimental and the result will mostly depend of the
	 * support state of the running browser.
	 *
	 * ```javascript
	 * var xhr = new XMLHttpRequest();
	 *
	 * // URL of a CORS MP3/Ogg file
	 * xhr.open("GET", "http://example.com/audio/track.ogg");
	 * xhr.responseType = "arraybuffer";
	 *
	 * xhr.addEventListener("load", function onResponse(progressEvent){
	 *   WaveformData.builders.webaudio(progressEvent.target.response, onProcessed(waveform){
	 *     console.log(waveform.duration);
	 *   });
	 * });
	 *
	 * xhr.send();
	 *  ```
	 *
	 * @todo use the errorCallback for `decodeAudioData` to handle possible failures
	 * @todo use a Web Worker to offload processing of the binary data
	 * @todo or use `SourceBuffer.appendBuffer` and `ProgressEvent` to stream the decoding
	 * @todo abstract the number of channels, because it is assumed the audio file is stereo
	 * @param {ArrayBuffer} raw_response
	 * @param {callback} what to do once the decoding is done
	 * @constructor
	 */
	function fromAudioObjectBuilder(raw_response, options, callback){
	  var defaultOptions = {
	    scale: 512,
	    scale_adjuster: 127
	  };

	  if (typeof options === 'function') {
	    callback = options;
	    options = {};
	  }
	  else {
	    options = options || {};
	  }

	  options.scale = options.scale || defaultOptions.scale;
	  options.scale_adjuster = options.scale_adjuster || defaultOptions.scale_adjuster;

	  /*
	   * The result will vary on the codec implentation of the browser.
	   * We don't handle the case where the browser is unable to handle the decoding.
	   *
	   * @see https://dvcs.w3.org/hg/audio/raw-file/tip/webaudio/specification.html#dfn-decodeAudioData
	   *
	   * Adapted from BlockFile::CalcSummary in Audacity, with permission.
	   * @see https://code.google.com/p/audacity/source/browse/audacity-src/trunk/src/BlockFile.cpp
	   */
	  audioContext.decodeAudioData(raw_response, audioDecoder(options, callback));
	}

	fromAudioObjectBuilder.getAudioContext = function getAudioContext(){
	  return audioContext;
	};

	module.exports = fromAudioObjectBuilder;

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	module.exports = {
	  "arraybuffer": __webpack_require__(24),
	  "object": __webpack_require__(25)
	};

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * WAVEFORM.SEGMENTS.JS
	 *
	 * This module handles all functionality related to the adding,
	 * removing and manipulation of segments
	 */
	!(__WEBPACK_AMD_DEFINE_RESULT__ = function() {
	    'use strict';

	    function BaseShape() {}

	    function noop() {}

	    function throwUndefined() {
	        throw new Error('You should extend this method in your parent class.');
	    }

	    BaseShape.prototype = {
	        createShape: throwUndefined,
	        update: noop
	    };

	    return BaseShape;
	}.call(exports, __webpack_require__, exports, module), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));


/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	/**
	 * Segments are an easy way to keep track of portions of the described audio file.
	 *
	 * They return values based on the actual offset. Which means if you change your offset and:
	 *
	 * * a segment becomes **out of scope**, no data will be returned;
	 * * a segment is only **partially included in the offset**, only the visible parts will be returned;
	 * * a segment is **fully included in the offset**, its whole content will be returned.
	 *
	 * Segments are created with the `WaveformData.set_segment(from, to, name?)` method.
	 *
	 * @see WaveformData.prototype.set_segment
	 * @param {WaveformData} context WaveformData instance
	 * @param {Integer} start Initial start index
	 * @param {Integer} end Initial end index
	 * @constructor
	 */
	var WaveformDataSegment = module.exports = function WaveformDataSegment(context, start, end){
	  this.context = context;

	  /**
	   * Start index.
	   *
	   * ```javascript
	   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
	   * waveform.set_segment(10, 50, "example");
	   *
	   * console.log(waveform.segments.example.start);  // -> 10
	   *
	   * waveform.offset(20, 50);
	   * console.log(waveform.segments.example.start);  // -> 10
	   *
	   * waveform.offset(70, 100);
	   * console.log(waveform.segments.example.start);  // -> 10
	   * ```
	   * @type {Integer} Initial starting point of the segment.
	   */
	  this.start = start;

	  /**
	   * End index.
	   *
	   * ```javascript
	   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
	   * waveform.set_segment(10, 50, "example");
	   *
	   * console.log(waveform.segments.example.end);  // -> 50
	   *
	   * waveform.offset(20, 50);
	   * console.log(waveform.segments.example.end);  // -> 50
	   *
	   * waveform.offset(70, 100);
	   * console.log(waveform.segments.example.end);  // -> 50
	   * ```
	   * @type {Integer} Initial ending point of the segment.
	   */
	  this.end = end;
	};

	/**
	 * @namespace WaveformDataSegment
	 */
	WaveformDataSegment.prototype = {
	  /**
	   * Dynamic starting point based on the WaveformData instance offset.
	   *
	   * ```javascript
	   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
	   * waveform.set_segment(10, 50, "example");
	   *
	   * console.log(waveform.segments.example.offset_start);  // -> 10
	   *
	   * waveform.offset(20, 50);
	   * console.log(waveform.segments.example.offset_start);  // -> 20
	   *
	   * waveform.offset(70, 100);
	   * console.log(waveform.segments.example.offset_start);  // -> null
	   * ```
	   *
	   * @return {number} Starting point of the segment within the waveform offset. (inclusive)
	   */
	  get offset_start(){
	    if (this.start < this.context.offset_start && this.end > this.context.offset_start){
	      return this.context.offset_start;
	    }

	    if (this.start >= this.context.offset_start && this.start < this.context.offset_end){
	      return this.start;
	    }

	    return null;
	  },
	  /**
	   * Dynamic ending point based on the WaveformData instance offset.
	   *
	   * ```javascript
	   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
	   * waveform.set_segment(10, 50, "example");
	   *
	   * console.log(waveform.segments.example.offset_end);  // -> 50
	   *
	   * waveform.offset(20, 50);
	   * console.log(waveform.segments.example.offset_end);  // -> 50
	   *
	   * waveform.offset(70, 100);
	   * console.log(waveform.segments.example.offset_end);  // -> null
	   * ```
	   *
	   * @return {number} Ending point of the segment within the waveform offset. (exclusive)
	   */
	  get offset_end(){
	    if (this.end > this.context.offset_start && this.end <= this.context.offset_end){
	      return this.end;
	    }

	    if (this.end > this.context.offset_end && this.start < this.context.offset_end){
	      return this.context.offset_end;
	    }

	    return null;
	  },
	  /**
	   * Dynamic segment length based on the WaveformData instance offset.
	   *
	   * ```javascript
	   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
	   * waveform.set_segment(10, 50, "example");
	   *
	   * console.log(waveform.segments.example.offset_length);  // -> 40
	   *
	   * waveform.offset(20, 50);
	   * console.log(waveform.segments.example.offset_length);  // -> 30
	   *
	   * waveform.offset(70, 100);
	   * console.log(waveform.segments.example.offset_length);  // -> 0
	   * ```
	   *
	   * @return {number} Visible length of the segment within the waveform offset.
	   */
	  get offset_length(){
	    return this.offset_end - this.offset_start;
	  },
	  /**
	   * Initial length of the segment.
	   *
	   * ```javascript
	   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
	   * waveform.set_segment(10, 50, "example");
	   *
	   * console.log(waveform.segments.example.length);  // -> 40
	   *
	   * waveform.offset(20, 50);
	   * console.log(waveform.segments.example.length);  // -> 40
	   *
	   * waveform.offset(70, 100);
	   * console.log(waveform.segments.example.length);  // -> 40
	   * ```
	   *
	   * @return {number} Initial length of the segment.
	   */
	  get length(){
	    return this.end - this.start;
	  },
	  /**
	   * Indicates if the segment has some visible part in the actual WaveformData offset.
	   *
	   * ```javascript
	   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
	   * waveform.set_segment(10, 50, "example");
	   *
	   * console.log(waveform.segments.example.visible);        // -> true
	   *
	   * waveform.offset(20, 50);
	   * console.log(waveform.segments.example.visible);        // -> true
	   *
	   * waveform.offset(70, 100);
	   * console.log(waveform.segments.example.visible);        // -> false
	   * ```
	   *
	   * @return {Boolean} True if at least partly visible, false otherwise.
	   */
	  get visible(){
	    return this.context.in_offset(this.start) || this.context.in_offset(this.end) || (this.context.offset_start > this.start && this.context.offset_start < this.end);
	  },
	  /**
	   * Return the minimum values for the segment.
	   *
	   * ```javascript
	   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
	   * waveform.set_segment(10, 50, "example");
	   *
	   * console.log(waveform.segments.example.min.length);        // -> 40
	   * console.log(waveform.segments.example.min.offset_length); // -> 40
	   * console.log(waveform.segments.example.min[0]);            // -> -12
	   *
	   * waveform.offset(20, 50);
	   *
	   * console.log(waveform.segments.example.min.length);        // -> 40
	   * console.log(waveform.segments.example.min.offset_length); // -> 30
	   * console.log(waveform.segments.example.min[0]);            // -> -5
	   * ```
	   *
	   * @return {Array.<Integer>} Min values of the segment.
	   */
	  get min(){
	    return this.visible ? this.context.offsetValues(this.offset_start, this.offset_length, 0) : [];
	  },
	  /**
	   * Return the maximum values for the segment.
	   *
	   * ```javascript
	   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
	   * waveform.set_segment(10, 50, "example");
	   *
	   * console.log(waveform.segments.example.max.length);        // -> 40
	   * console.log(waveform.segments.example.max.offset_length); // -> 40
	   * console.log(waveform.segments.example.max[0]);            // -> 5
	   *
	   * waveform.offset(20, 50);
	   *
	   * console.log(waveform.segments.example.max.length);        // -> 40
	   * console.log(waveform.segments.example.max.offset_length); // -> 30
	   * console.log(waveform.segments.example.max[0]);            // -> 11
	   * ```
	   *
	   * @return {Array.<Integer>} Max values of the segment.
	   */
	  get max(){
	    return this.visible ? this.context.offsetValues(this.offset_start, this.offset_length, 1) : [];
	  }
	};

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	/**
	 * Points are an easy way to keep track bookmarks of the described audio file.
	 *
	 * They return values based on the actual offset. Which means if you change your offset and:
	 *
	 * * a point becomes **out of scope**, no data will be returned; 
	 * * a point is **fully included in the offset**, its whole content will be returned.
	 *
	 * Points are created with the `WaveformData.set_point(timeStamp, name?)` method.
	 *
	 * @see WaveformData.prototype.set_point
	 * @param {WaveformData} context WaveformData instance
	 * @param {Integer} start Initial start index
	 * @param {Integer} end Initial end index
	 * @constructor
	 */
	var WaveformDataPoint = module.exports = function WaveformDataPoint(context, timeStamp){
	  this.context = context;

	  /**
	   * Start index.
	   *
	   * ```javascript
	   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
	   * waveform.set_point(10, "example");
	   *
	   * console.log(waveform.points.example.timeStamp);  // -> 10
	   *
	   * waveform.offset(20, 50);
	   * console.log(waveform.points.example.timeStamp);  // -> 10
	   *
	   * waveform.offset(70, 100);
	   * console.log(waveform.points.example.timeStamp);  // -> 10
	   * ```
	   * @type {Integer} Time Stamp of the point
	   */
	  this.timeStamp = timeStamp;
	};

	/**
	 * @namespace WaveformDataPoint
	 */
	WaveformDataPoint.prototype = {
	  /**
	   * Indicates if the point has some visible part in the actual WaveformData offset.
	   *
	   * ```javascript
	   * var waveform = new WaveformData({ ... }, WaveformData.adapters.object);
	   * waveform.set_point(10, "example");
	   *
	   * console.log(waveform.points.example.visible);        // -> true
	   *
	   * waveform.offset(0, 50);
	   * console.log(waveform.points.example.visible);        // -> true
	   *
	   * waveform.offset(70, 100);
	   * console.log(waveform.points.example.visible);        // -> false
	   * ```
	   *
	   * @return {Boolean} True if visible, false otherwise.
	   */
	  get visible(){
	    return this.context.in_offset(this.timeStamp);
	  }
	};

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var WaveformData = __webpack_require__(17);
	/**
	 * This callback is executed once the audio has been decoded by the browser and resampled by waveform-data.
	 *
	 * @callback onAudioResampled
	 * @param {WaveformData} waveform_data Waveform instance of the browser decoded audio
	 * @param {AudioBuffer} audio_buffer Decoded audio buffer
	 */
	 
	/**
	 * AudioBuffer-based WaveformData generator
	 *
	 * @param {Object.<{scale: Number, scale_adjuster: Number}>} options
	 * @param {onAudioResampled} callback
	 * @returns {Function.<AudioBuffer>}
	 */
	module.exports = function getAudioDecoder(options, callback){
	  var scale = options.scale;
	  var scale_adjuster = options.scale_adjuster;

	  return function onAudioDecoded(audio_buffer){
	    var data_length = Math.floor(audio_buffer.length / scale);
	    var offset = 20;
	    var data_object = new DataView(new ArrayBuffer(offset + data_length * 2));
	    var left_channel, right_channel;
	    var min_value = Infinity, max_value = -Infinity, scale_counter = scale;
	    var buffer_length = audio_buffer.length;

	    data_object.setInt32(0, 1, true);   //version
	    data_object.setUint32(4, 1, true);   //is 8 bit
	    data_object.setInt32(8, audio_buffer.sampleRate, true);   //sample rate
	    data_object.setInt32(12, scale, true);   //scale
	    data_object.setInt32(16, data_length, true);   //length

	    left_channel = audio_buffer.getChannelData(0);
	    right_channel = audio_buffer.getChannelData(0);

	    for (var i = 0; i < buffer_length; i++){
	      var sample = (left_channel[i] + right_channel[i]) / 2 * scale_adjuster;

	      if (sample < min_value){
	        min_value = sample;
	        if (min_value < -128) {
	          min_value = -128;
	        }
	      }

	      if (sample > max_value){
	        max_value = sample;
	        if (max_value > 127) {
	          max_value = 127;
	        }
	      }

	      if (--scale_counter === 0){
	        data_object.setInt8(offset++, Math.floor(min_value));
	        data_object.setInt8(offset++, Math.floor(max_value));
	        min_value = Infinity; max_value = -Infinity; scale_counter = scale;
	      }
	    }

	    callback(new WaveformData(data_object.buffer, WaveformData.adapters.arraybuffer), audio_buffer);
	  };
	};


/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	/**
	 * ArrayBuffer adapter consumes binary waveform data (data format version 1).
	 * It is used as a data abstraction layer by `WaveformData`.
	 *
	 * This is supposed to be the fastest adapter ever:
	 * * **Pros**: working directly in memory, everything is done by reference (including the offsetting)
	 * * **Cons**: binary data are hardly readable without data format knowledge (and this is why this adapter exists).
	 *
	 * Also, it is recommended to use the `fromResponseData` factory.
	 *
	 * @see WaveformDataArrayBufferAdapter.fromResponseData
	 * @param {DataView} response_data
	 * @constructor
	 */
	var WaveformDataArrayBufferAdapter = module.exports = function WaveformDataArrayBufferAdapter(response_data){
	  this.data = response_data;
	};

	/**
	 * Detects if a set of data is suitable for the ArrayBuffer adapter.
	 * It is used internally by `WaveformData.create` so you should not bother using it.
	 *
	 * @static
	 * @param {Mixed} data
	 * @returns {boolean}
	 */
	WaveformDataArrayBufferAdapter.isCompatible = function isCompatible(data){
	  return data && typeof data === "object" && "byteLength" in data;
	};

	/**
	 * Setup factory to create an adapter based on heterogeneous input formats.
	 *
	 * It is the preferred way to build an adapter instance.
	 *
	 * ```javascript
	 * var arrayBufferAdapter = WaveformData.adapters.arraybuffer;
	 * var xhr = new XMLHttpRequest();
	 *
	 * // .dat file generated by audiowaveform program
	 * xhr.open("GET", "http://example.com/waveforms/track.dat");
	 * xhr.responseType = "arraybuffer";
	 * xhr.addEventListener("load", function onResponse(progressEvent){
	 *  var responseData = progressEvent.target.response;
	 *
	 *  // doing stuff with the raw data ...
	 *  // you only have access to WaveformDataArrayBufferAdapter API
	 *  var adapter = arrayBufferAdapter.fromResponseData(responseData);
	 *
	 *  // or making things easy by using WaveformData ...
	 *  // you have access WaveformData API
	 *  var waveform = new WaveformData(responseData, arrayBufferAdapter);
	 * });
	 *
	 * xhr.send();
	 * ```

	 * @static
	 * @param {ArrayBuffer} response_data
	 * @return {WaveformDataArrayBufferAdapter}
	 */
	WaveformDataArrayBufferAdapter.fromResponseData = function fromArrayBufferResponseData(response_data){
	  return new WaveformDataArrayBufferAdapter(new DataView(response_data));
	};

	/**
	 * @namespace WaveformDataArrayBufferAdapter
	 */
	WaveformDataArrayBufferAdapter.prototype = {
	  /**
	   * Returns the data format version number.
	   *
	   * @return {Integer} Version number of the consumed data format.
	   */
	  get version(){
	    return this.data.getInt32(0, true);
	  },
	  /**
	   * Indicates if the response body is encoded in 8bits.
	   *
	   * **Notice**: currently the adapter only deals with 8bits encoded data.
	   * You should favor that too because of the smaller data network fingerprint.
	   *
	   * @return {boolean} True if data are declared to be 8bits encoded.
	   */
	  get is_8_bit(){
	    return !!this.data.getUint32(4, true);
	  },
	  /**
	   * Indicates if the response body is encoded in 16bits.
	   *
	   * @return {boolean} True if data are declared to be 16bits encoded.
	   */
	  get is_16_bit(){
	    return !this.is_8_bit;
	  },
	  /**
	   * Returns the number of samples per second.
	   *
	   * @return {Integer} Number of samples per second.
	   */
	  get sample_rate(){
	    return this.data.getInt32(8, true);
	  },
	  /**
	   * Returns the scale (number of samples per pixel).
	   *
	   * @return {Integer} Number of samples per pixel.
	   */
	  get scale(){
	    return this.data.getInt32(12, true);
	  },
	  /**
	   * Returns the length of the waveform data (number of data points).
	   *
	   * @return {Integer} Length of the waveform data.
	   */
	  get length(){
	    return this.data.getUint32(16, true);
	  },
	  /**
	   * Returns a value at a specific offset.
	   *
	   * @param {Integer} index
	   * @return {number} waveform value
	   */
	  at: function at_sample(index){
	    return Math.round(this.data.getInt8(20 + index));
	  }
	};


/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	/**
	 * Object adapter consumes stringified JSON or JSON waveform data (data format version 1).
	 * It is used as a data abstraction layer by `WaveformData`.
	 *
	 * This is supposed to be a fallback for browsers not supporting ArrayBuffer:
	 * * **Pros**: easy to debug response_data and quite self describing.
	 * * **Cons**: slower than ArrayBuffer, more memory consumption.
	 *
	 * Also, it is recommended to use the `fromResponseData` factory.
	 *
	 * @see WaveformDataObjectAdapter.fromResponseData
	 * @param {String|Object} response_data JSON or stringified JSON
	 * @constructor
	 */
	var WaveformDataObjectAdapter = module.exports = function WaveformDataObjectAdapter(response_data){
	  this.data = response_data;
	};

	/**
	 * Detects if a set of data is suitable for the Object adapter.
	 * It is used internally by `WaveformData.create` so you should not bother using it.
	 *
	 * @static
	 * @param {Mixed} data
	 * @returns {boolean}
	 */
	WaveformDataObjectAdapter.isCompatible = function isCompatible(data){
	  return data && (typeof data === "object" && "sample_rate" in data) || (typeof data === "string" && "sample_rate" in JSON.parse(data));
	};

	/**
	 * Setup factory to create an adapter based on heterogeneous input formats.
	 *
	 * It is the preferred way to build an adapter instance.
	 *
	 * ```javascript
	 * var objectAdapter = WaveformData.adapters.object;
	 * var xhr = new XMLHttpRequest();
	 *
	 * // .dat file generated by audiowaveform program
	 * xhr.open("GET", "http://example.com/waveforms/track.json");
	 * xhr.responseType = "json";
	 * xhr.addEventListener("load", function onResponse(progressEvent){
	 *  var responseData = progressEvent.target.response;
	 *
	 *  // doing stuff with the raw data ...
	 *  // you only have access to WaveformDataObjectAdapter API
	 *  var adapter = objectAdapter.fromResponseData(responseData);
	 *
	 *  // or making things easy by using WaveformData ...
	 *  // you have access WaveformData API
	 *  var waveform = new WaveformData(responseData, objectAdapter);
	 * });
	 *
	 * xhr.send();
	 * ```

	 * @static
	 * @param {String|Object} response_data JSON or stringified JSON
	 * @return {WaveformDataObjectAdapter}
	 */
	WaveformDataObjectAdapter.fromResponseData = function fromJSONResponseData(response_data){
	  if (typeof response_data === "string"){
	    return new WaveformDataObjectAdapter(JSON.parse(response_data));
	  }
	  else{
	    return new WaveformDataObjectAdapter(response_data);
	  }
	};
	/**
	 * @namespace WaveformDataObjectAdapter
	 */
	WaveformDataObjectAdapter.prototype = {
	  /**
	   * Returns the data format version number.
	   *
	   * @return {Integer} Version number of the consumed data format.
	   */
	  get version(){
	    return this.data.version || 1;
	  },
	  /**
	   * Indicates if the response body is encoded in 8bits.
	   *
	   * **Notice**: currently the adapter only deals with 8bits encoded data.
	   * You should favor that too because of the smaller data network fingerprint.
	   *
	   * @return {boolean} True if data are declared to be 8bits encoded.
	   */
	  get is_8_bit(){
	    return this.data.bits === 8;
	  },
	  /**
	   * Indicates if the response body is encoded in 16bits.
	   *
	   * @return {boolean} True if data are declared to be 16bits encoded.
	   */
	  get is_16_bit(){
	    return !this.is_8_bit;
	  },
	  /**
	   * Returns the number of samples per second.
	   *
	   * @return {Integer} Number of samples per second.
	   */
	  get sample_rate(){
	    return this.data.sample_rate;
	  },
	  /**
	   * Returns the scale (number of samples per pixel).
	   *
	   * @return {Integer} Number of samples per pixel.
	   */
	  get scale(){
	    return this.data.samples_per_pixel;
	  },
	  /**
	   * Returns the length of the waveform data (number of data points).
	   *
	   * @return {Integer} Length of the waveform data.
	   */
	  get length(){
	    return this.data.length;
	  },
	  /**
	   * Returns a value at a specific offset.
	   *
	   * @param {Integer} index
	   * @return {number} waveform value
	   */
	  at: function at_sample(index){
	    return Math.round(this.data.data[index]);
	  }
	};


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var window = __webpack_require__(27);

	var Context = window.AudioContext || window.webkitAudioContext;
	if (Context) module.exports = new Context;


/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {if (typeof window !== "undefined") {
	    module.exports = window;
	} else if (typeof global !== "undefined") {
	    module.exports = global;
	} else {
	    module.exports = {};
	}

	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ }
/******/ ]);