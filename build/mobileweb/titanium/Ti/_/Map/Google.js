define(["Ti/_/declare", "Ti/_/dom", "Ti/_/event", "Ti/_/lang", "Ti/App/Properties", "Ti/Geolocation", "Ti/Map", "Ti/UI/View", "Ti/Utils"],
	function(declare, dom, event, lang, Properties, Geolocation, Map, View, Utils) {

	function mapType(type) {
		var t = gmaps.MapTypeId;
		switch (type) {
			case Map.HYBRID_TYPE: return t.HYBRID;
			case Map.SATELLITE_TYPE: return t.SATELLITE;
			case Map.TERRAIN_TYPE: return t.TERRAIN;
		}
		return t.ROADMAP;
	};

	var isDef = lang.isDef,
		mix = require.mix,
		on = require.on,
		handleTouchEvent = View.prototype._handleTouchEvent,
		defaultRegion = {
			latitude: 39.828175,
			longitude: -98.5795,
			latitudeDelta: 30.137412,
			longitudeDelta: 63.235658
		},
		gmaps,
		gevent,
		theInfoWindow,
		// the order of the markers MUST match the ANNOTATION_* constants defined in Ti.Map
		markers = { 0: "red", 1: "green", 2: "purple" },
		locationMarkerImage,
		onload = Ti.deferStart(),
		MapView = declare("Ti.Map.View", View, {

			constructor: function() {
				this.properties.annotations = [];
				this._routes = [];
				this.fireEvent("loading");
			},

			postscript: function() {
				var region = this.region,
					gmap = this._gmap = new gmaps.Map(this.domNode, {
						disableDefaultUI: true,
						zoom: 2,
						zoomControl: true,
						center: new gmaps.LatLng(region.latitude, region.longitude),
						mapTypeId: mapType(this.mapType)
					});

				this._boundsEvt = gevent.addListener(gmap, "bounds_changed", lang.hitch(this, "_fitRegion"));
				this._updateMap(region, 1);
				this._updateUserLocation(this.userLocation);
				this.annotations.forEach(this._createMarker, this);
				this._annotationEvents = [];
			},

			destroy: function() {
				event.off(this._annotationEvents);
				gevent.removeListener(this._boundsEvt);
				gevent.clearInstanceListeners(this._gmap);
				this.removeAllAnnotations();
				this._gmap = null;
				View.prototype.destroy.apply(this, arguments);
			},

			addAnnotation: function(/*Object|Ti.Map.Annotation*/a) {
				if (a) {
					a.declaredClass === "Ti.Map.Annotation" || (a = new Annotation(a));
					~this.annotations.indexOf(a) || this._createMarker(a, this.annotations.length);
				}
			},

			addAnnotations: function(/*Array*/annotations) {
				annotations && annotations.forEach(this.addAnnotation, this);
			},

			addRoute: function(/*Object*/route) {
				if (route && (route.points || []).length) {
					route.pline = new gmaps.Polyline({
						map: this._gmap,
						path: route.points.map(function(p) {
							return new gmaps.LatLng(p.latitude, p.longitude);
						}),
						strokeColor: route.color || "#000",
						strokeWeight: route.width || 1
					});
					this._routes.push(route);
				}
			},

			deselectAnnotation: function(/*String|Ti.Map.Annotation*/a) {
				var idx = this._indexOfAnnotation(a);
				theInfoWindow && theInfoWindow.idx === idx && this._hide(this.annotations[idx]);
			},

			removeAllAnnotations: function() {
				theInfoWindow && theInfoWindow.close();
				this.removeAnnotations(this.annotations);
			},

			removeAnnotation: function(/*String|Ti.Map.Annotation*/a) {
				var anno = this.properties.annotations,
					i = 0,
					idx = this._indexOfAnnotation(a);

				if (a = anno[idx]) {
					theInfoWindow && this._hide(a);
					gevent.removeListener(a.evt);
					a.marker.setMap(null);
					delete a.marker;
					a.destroy();
					anno[idx] = null;
				}
			},

			removeAnnotations: function(/*Array*/annotations) {
				annotations.forEach(function(a) {
					this.removeAnnotation(a);
				}, this);
			},

			removeRoute: function(/*Object*/route) {
				if (route && route.name) {
					var r = this._routes,
						i = 0;
					for (; i < r.length; i++) {
						if (r[i].name === route.name) {
							route.pline.setMap(null);
							delete route.pline;
							r.splice(i--, 1);
						}
					}
				}
			},

			selectAnnotation: function(/*String|Ti.Map.Annotation*/a) {
				var idx = this._indexOfAnnotation(a);
				~idx && this._show(this.annotations[idx]);
			},

			setLocation: function(location) {
				location && (this.region = location);
				isDef(location.animate) && (this.animated = location.animate);
				isDef(location.animated) && (this.animated = location.animated);
				isDef(location.regionFit) && (this.regionFit = location.regionFit);
				this._updateMap(location);
			},

			zoom: function(level) {
				var gmap = this._gmap;
				gmap.setZoom(gmap.getZoom() + level);
			},

			_show: function(annotation, clicksource) {
				if (annotation && (!theInfoWindow || theInfoWindow.idx !== annotation.idx)) {
					var _t = this,
						idx = annotation.idx,
						cls = "TiMapAnnotation",
						type,
						p = dom.create("div", { className: cls }),
						annotationNode = p,
						nodes = {
							annotation: annotationNode,
							leftButton: annotation.leftButton && dom.create("img", { className: cls + "LeftButton", src: annotation.leftButton }, p),
							rightButton: annotation.rightButton && dom.create("img", { className: cls + "RightButton", src: annotation.rightButton }, p),
							dummy: (p = dom.create("div", { className: cls + "Content" }, p)) && 0,
							title: dom.create("h1", { innerHTML: annotation._getTitle() }, p),
							subtitle: dom.create("p", { innerHTML: annotation._getSubtitle() }, p)
						},
						shown;

					function onShow() {
						var i = theInfoWindow.idx;
						i !== void 0 && ~i && i !== idx && _t._hide(_t.annotations[i]);
						shown || (shown = 1) && _t._dispatchEvents(annotation, clicksource);
					}

					// wire up the dom nodes in the info window
					event.off(_t._annotationEvents);
					for (type in nodes) {
						(function(t, node) {
							node && _t._annotationEvents.push(on(node, "click", function(evt) {
								event.stop(evt);
								_t._hide(annotation, t);
							}));
						}(type, nodes[type]));
					}

					// listen for updates to the annotation object
					_t._annotationEvents.push(on(annotation, "update", function(args) {
						if (theInfoWindow.idx === idx) {
							var p = args.property,
								markerImg;
							switch (p) {
								case "title":
								case "subtitle":
									nodes[p].innerHTML = args.value;
									break;
								case "leftButton":
								case "rightButton":
									nodes[p].src = args.value;
									break;
								case "image":
								case "pincolor":
									markerImg = _t._getMarkerImage(annotation);
									annotation.marker.setIcon(markerImg[0]);
									annotation.marker.setShadow(markerImg[1] || null);
							}
						}
					}));

					if (theInfoWindow) {
						onShow();
						theInfoWindow.setContent(annotationNode);
					} else {
						theInfoWindow = new gmaps.InfoWindow({ content: annotationNode });
						gevent.addListener(theInfoWindow, "domready", onShow);
						gevent.addListener(theInfoWindow, "closeclick", function() {
							_t._hide(annotation, "annotation");
						});
					}

					theInfoWindow.open(_t._gmap, annotation.marker);
					theInfoWindow.idx = idx;
				}
			},

			_hide: function(annotation, clicksource) {
				if (!clicksource || !~clicksource.indexOf("Button")) {
					theInfoWindow.close();
					theInfoWindow.idx = -1;
				}
				this._dispatchEvents(annotation, clicksource);
			},

			_dispatchEvents: function(annotation, clicksource) {
				var idx = annotation.idx,
					props = {
						annotation: annotation,
						clicksource: clicksource = clicksource || "pin",
						index: idx,
						latitude: annotation.latitude,
						longitude: annotation.longitude,
						map: this,
						subtitle: annotation._getSubtitle(),
						title: annotation._getTitle()
					};

				handleTouchEvent.call(this, "singletap", props);
				handleTouchEvent.call(this, "click", props);
				annotation._onclick(this, idx, clicksource);
			},

			_getMarkerImage: function(a) {
				var markerImg = markers[a.pincolor | 0],
					hash,
					blob;

				if (a.image) {
					if (a.image.declaredClass === "Ti.Blob") {
						markerImg = markers[hash = Utils.md5HexDigest(blob = a.image.toString())];
						markerImg || (markerImg = markers[hash] = [new gmaps.MarkerImage(blob)]); //, new gmaps.Size(x1, 34), new point(x2, 0), new point(10, 34));
					} else {
						markerImg = markers[a.image];
						markerImg || (markerImg = markers[a.image] = [new gmaps.MarkerImage(a.image)]);
					}
				}

				return markerImg;
			},

			_createMarker: function(a, i) {
				var markerImg = this._getMarkerImage(a);
				a.idx = i;
				a.evt = gevent.addListener(a.marker = new gmaps.Marker({
					map: this._gmap,
					icon: markerImg[0],
					shadow: markerImg[1],
					position: new gmaps.LatLng(a.latitude, a.longitude),
					optimized: false,
					title: a._getTitle(),
					animation: a.animate && gmaps.Animation.DROP
				}), "click", lang.hitch(this, function() {
					this[theInfoWindow && theInfoWindow.idx === i ? "_hide" : "_show"](a);
				}));
				this.properties.__values__.annotations[i] = a;
			},

			_indexOfAnnotation: function(/*String|Ti.Map.Annotation*/a) {
				var anno = this.properties.annotations,
					i = 0;

				if (a && a.declaredClass === "Ti.Map.Annotation") {
					return a.idx;
				}

				for (; i < anno.length; i++) {
					if (anno[i].title === a) {
						return i;
					}
				}
				return -1;
			},

			_fitRegion: function() {
				var c = this.constants,
					gmap = this._gmap,
					center = gmap.getCenter(),
					bounds = gmap.getBounds(),
					ne = bounds.getNorthEast(),
					sw = bounds.getSouthWest(),
					latD = c.latitudeDelta = ne.lat() - sw.lat(),
					lngD = c.longitudeDelta = ne.lng() - sw.lng(),
					region = {
						latitude: center.lat(),
						longitude: center.lng(),
						latitudeDelta: latD,
						longitudeDelta: lngD
					};

				this.regionFit && (this.properties.__values__.region = region);

				if (!this._initialized) {
					this._initialized = 1;
					this.fireEvent("complete");
				}

				this.fireEvent("regionChanged", region);
			},

			_updateMap: function(region, dontAnimate) {
				var gmap = this._gmap;
				if (gmap) {
					var animated = !dontAnimate && this.animated,
						latD = region.latitudeDelta / 2.0,
						lngD = region.longitudeDelta / 2.0;
					gmap[animated ? "panTo" : "setCenter"](new gmaps.LatLng(region.latitude, region.longitude));
					gmap[animated ? "panToBounds" : "fitBounds"](new gmaps.LatLngBounds(
						new gmaps.LatLng(region.latitude - latD, region.longitude - lngD),
						new gmaps.LatLng(region.latitude + latD, region.longitude + lngD)
					));
				}
			},

			_updateUserLocation: function(userLocation) {
				var gmap = this._gmap;
				if (gmap && (userLocation || this._locationInited)) {
					this._locationInited = 1;

					Geolocation[userLocation ? "addEventListener" : "removeEventListener"]("location", lang.hitch(this, function(e) {
						var marker = this._locationMarker,
							coords = e.coords,
							code = e.code,
							msg,
							pos;

						if (coords) {
							pos = new gmaps.LatLng(coords.latitude, coords.longitude);
							if (marker) {
								marker.setPosition(pos);
							} else {
								this._locationMarker = new gmaps.Marker({
									map: this._gmap,
									icon: locationMarkerImage,
									position: pos
								});
							}
						} else if ("code" in e) {
							Ti.API.warn("Geolocation error: " + (code === Geolocation.ERROR_DENIED ? "permission denied" : code === Geolocation.ERROR_TIMEOUT ? "timeout" : code === Geolocation.ERROR_LOCATION_UNKNOWN ? "position unavailable" : "unknown"));
						}
					}));

					if (!Geolocation.locationServicesEnabled) {
						Ti.API.warn("Geolocation services unavailable");
						this.properties.__values__.userLocation = false;
					} else if (!userLocation || this._locationMarker) {
						this._locationMarker.setVisible(userLocation);
					}
				}
			},

			_handleTouchEvent: function(type, e) {
				/(click|singletap)/.test(type) || View.prototype._handleTouchEvent.apply(this,arguments);
			},

			constants: {
				latitudeDelta: 0,
				longitudeDelta: 0
			},

			properties: {
				animated: false,
				annotations: {
					set: function(value) {
						value = value.filter(function(a) { return a && a.declaredClass === "Ti.Map.Annotation"; });
						if (this._gmap) {
							this.removeAllAnnotations();
							value.forEach(this._createMarker, this);
						}
						return value;
					}
				},
				mapType: {
					set: function(value) {
						this._gmap && this._gmap.setMapTypeId(mapType(value));
						return value;
					}
				},
				region: {
					set: function(newValue, oldValue) {
						return mix({}, defaultRegion, oldValue, newValue);
					},
					post: function(newValue, oldValue) {
						newValue !== oldValue && this._updateMap(newValue);
					},
					value: null
				},
				regionFit: true,
				userLocation: {
					post: function(value) {
						this._updateUserLocation(value);
					},
					value: false
				}
			}

		});

	window.TiMapViewInit = function() {
		gmaps = google.maps;
		gevent = gmaps.event;

		var i,
			prefix = "themes/" + require.config.ti.theme + "/Map/",
			point = gmaps.Point;

		function makeMarker(color, x1, x2) {
			return new gmaps.MarkerImage(prefix + "marker_" + color + ".png", new gmaps.Size(x1, 34), new point(x2, 0), new point(10, 34));
		}

		for (i in markers) {
			markers[i] = [makeMarker(markers[i], 20, 0), makeMarker(markers[i], 37, 20)];
		}

		locationMarkerImage = new gmaps.MarkerImage(prefix + "location.png", new gmaps.Size(22, 22), new point(0, 0), new point(11, 11));

		onload();
	};

	require(["http://maps.googleapis.com/maps/api/js?key=" + Properties.getString("ti.map.apikey", "") + "&sensor=true&callback=TiMapViewInit"]);

	return MapView;

});
