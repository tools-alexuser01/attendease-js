/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var Client = __webpack_require__(1)

	// Public Attendease interface.
	function Attendease(subdomain, options) {
	  return new Client(subdomain, options)
	}

	// Export module for Node and the browser.
	module.exports = Attendease

	if(typeof window !== 'undefined') {
	  window.Attendease = Attendease
	}


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var util = __webpack_require__(2)

	// Constructs a new attendease client and kicks things off.
	function Client(subdomain, options) {
	  this.subdomain = subdomain
	  this.endpoint = options && options.apiRoot
	}

	// Returns the Attendease event API endpoint.
	Client.prototype.apiRoot = function() {
	  return this.endpoint || ('https://' + this.subdomain + '.attendease.com/')
	}

	// Mixin instance methods.
	util.extend(Client.prototype, __webpack_require__(3))
	util.extend(Client.prototype, __webpack_require__(4))
	util.extend(Client.prototype, __webpack_require__(5))
	util.extend(Client.prototype, __webpack_require__(6))
	util.extend(Client.prototype, __webpack_require__(7))
	util.extend(Client.prototype, __webpack_require__(8))
	util.extend(Client.prototype, __webpack_require__(9))

	// Export
	module.exports = Client


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	// Mix properties into target object.
	exports.extend = function (to, from) {
	  for (var key in from) {
	    to[key] = from[key]
	  }

	  return to
	}


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	// Authenticate as a registered attendee. Returns a promise.
	exports.login = function(credentials) {
	  this.logout()

	  return $.ajax({
	    type: "POST",
	    url: this.apiRoot() + 'api/authenticate.json',
	    data: credentials,
	    success: function(response) {
	      localStorage.user_details = JSON.stringify(response)

	      localStorage.credentials = JSON.stringify({
	        attendee_token: response.access_token
	      })
	    }
	  })
	}

	// Logout. Returns a promise.
	exports.logout = function() {
	  var def = $.Deferred()
	  localStorage.clear()
	  def.resolve()
	  return def.promise()
	}

	// Returns the current user object.
	exports.user = function(sync) {
	  var data

	  if (sync) {
	    return this.sync('user_details')
	  } else {
	    data = localStorage.user_details
	    return data ? JSON.parse(data) : false
	  }
	}

	// Returns the credentials for the current user.
	exports.credentials = function() {
	  return JSON.parse(localStorage.credentials)
	}


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	// Appends new items and updates existing items on the current localStorage
	// collection for the given resource and dataset.
	var mergeData = function(resource, data) {
	  var current = localStorage[resource]
	  var merged = current ? JSON.parse(current) : null
	  var index = {}, existing

	  if (Array.isArray(merged)) {
	    merged.forEach(function(item) {
	      index[item.id] = item
	    })

	    data.forEach(function(item) {
	      if (existing = index[item.id]) {
	        merged.splice(merged.indexOf(existing), 1, item)
	      } else {
	        merged.push(item)
	      }
	    })
	  } else {
	    merged = data
	  }

	  localStorage[resource] = JSON.stringify(merged)
	  return merged
	}

	var resourceMap = {
	  session_ids:   'sessions',
	  room_ids:      'rooms',
	  presenter_ids: 'presenters',
	  filter_ids:    'filters'
	}

	// Removes items from the current localStorage collections.
	var removeData = function(data) {
	  var index, resource, resourceName, ids, items, existing

	  for (resource in data) {
	    if (data.hasOwnProperty(resource)) {
	      ids = data[resource]
	      resourceName = resourceMap[resource]

	      if (ids.length && (items = localStorage[resourceName])) {
	        items = JSON.parse(items)
	        index = {}

	        items.forEach(function(item) {
	          index[item.id] = item
	        })

	        ids.forEach(function(id) {
	          if (existing = index[id]) {
	            items.splice(items.indexOf(existing), 1)
	          }
	        })

	        localStorage[resourceName] = JSON.stringify(items)
	      }
	    }
	  }
	}

	// Returns the last sync timestamp for the given resource.
	var lastSync = function(resource) {
	  return localStorage['last_sync_' + resource]
	}

	// Updates the last sync timestamp for the given resource and timestamp.
	var updateLastSync = function(resource, timestamp) {
	  localStorage['last_sync_' + resource] = timestamp
	}

	// Syncs the resource with Attendease event API and stores in localStorage.
	exports.sync = function(resource) {
	  var def = $.Deferred()
	  var data = this.credentials()
	  var timestamp = Math.floor(Date.now() / 1000)
	  var merged

	  data.since = lastSync(resource)
	  data.meta = true

	  $.ajax({
	    type: "GET",
	    url: this.apiRoot() + 'api/' + resource + '.json',
	    data: data,
	    success: function(response) {
	      merged = mergeData(resource, response)
	      updateLastSync(resource, timestamp)
	      def.resolve(merged)
	    },
	    error: def.reject
	  })

	  return def.promise()
	}

	// Syncs the deleted resources with Attendease event API and updates the
	// collection in localStorage.
	exports.syncDeletions = function() {
	  var data = this.credentials()
	  var timestamp = Math.floor(Date.now() / 1000)

	  data.since = lastSync('deletions')

	  return $.ajax({
	    type: "GET",
	    url: this.apiRoot() + 'api/deletions.json',
	    data: data,
	    success: function(response) {
	      removeData(response)
	      updateLastSync('deletions', timestamp)
	    }
	  })
	}


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	// Fetches the resource from localStorage if there is existing data available in
	// localStorage, otherwise a server sync will happen. If sync is true, the
	// server sync will happen unconditionally.
	exports.fetch = function(resource, sync) {
	  var def = $.Deferred()
	  var data

	  if (!sync && (data = localStorage[resource])) {
	    def.resolve(JSON.parse(data))
	    return def.promise()
	  } else {
	    return this.sync(resource)
	  }
	}

	// Fetches and returns the event details.
	exports.event = function(sync) {
	  return this.fetch('event', sync)
	}

	// Fetches and returns all sessions for the event.
	exports.sessions = function(sync) {
	  return this.fetch('sessions', sync)
	}

	// Fetches and returns all presenters for the event.
	exports.presenters = function(sync) {
	  return this.fetch('presenters', sync)
	}

	// Fetches and returns all rooms for the event.
	exports.rooms = function(sync) {
	  return this.fetch('rooms', sync)
	}

	// Fetches and returns all venues for the event.
	exports.venues = function(sync) {
	  return this.fetch('venues', sync)
	}

	// Fetches and returns all filters for the event.
	exports.filters = function(sync) {
	  return this.fetch('filters', sync)
	}

	// Fetches and returns the user's schedule statuses.
	exports.scheduleStatuses = function(sync) {
	  return this.fetch('schedule_status', sync)
	}


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	// Fetches and returns all sessions (mapped as instances) for the event.
	exports.instances = function(sync) {
	  var def = $.Deferred()
	  var instances = []

	  this.sessions(sync).then(function(sessions) {
	    sessions.forEach(function(session) {
	      (session.instances || []).forEach(function(instance) {
	        instance.session = session
	        instances.push(instance)
	      })
	    })

	    def.resolve(instances)
	  }, def.reject)

	  return def.promise()
	}


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	// Likes the item for the current user.
	exports.like = function(id, type) {
	  var data = this.credentials()
	  data.like_type = type

	  return $.ajax({
	    type: "POST",
	    url: this.apiRoot() + 'api/likes/' + id,
	    data: data
	  })
	}

	// Unlikes the item for the current user.
	exports.unlike = function(id) {
	  return $.ajax({
	    type: "POST",
	    url: this.apiRoot() + 'api/likes_remove/' + id,
	    data: this.credentials()
	  })
	}


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	// Likes the item for the current user.
	exports.rate = function(id, type, rating) {
	  var data = this.credentials()

	  data.like_id = id
	  data.like_type = type
	  data.rating = rating

	  return $.ajax({
	    type: "POST",
	    url: this.apiRoot() + 'api/rate.json',
	    data: data
	  })
	}


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	// Schedules the current user for the session instance.
	exports.schedule = function(instanceId) {
	  return $.ajax({
	    type: "POST",
	    url: this.apiRoot() + 'api/schedule/' + instanceId + '.json',
	    data: this.credentials()
	  })
	}

	// Unschedules the current user from the session instance.
	exports.unschedule = function(instanceId) {
	  return $.ajax({
	    type: "POST",
	    url: this.apiRoot() + 'api/unschedule/' + instanceId + '.json',
	    data: this.credentials()
	  })
	}

	// Returns the user's schedule status for the session instance.
	exports.scheduleStatus = function(instanceId) {
	  var def = $.Deferred()

	  this.scheduleStatuses(true).then(function(statuses) {
	    def.resolve(statuses[instanceId])
	  })

	  return def.promise()
	}


/***/ }
/******/ ])