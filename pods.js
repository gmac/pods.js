//	pods.js
//	Tiny managers for module definition and dependency management.
//	(c) 2012-2014 Greg MacWilliam.
//	Freely distributed under the MIT license.

// Pod instance constructor function:
function Pod(name) {
	this.name = name;
  this._m = {};
}

// Pod static instance store:
Pod._m = {};

// Defines a new module.
// @param String id: the reference id for the module.
// @param Array deps: an optional array of dependency ids.
// @param Function factory: a factory function or exports object for the module.
Pod.define = function(id, deps, factory) {
  // Resolve dependency array:
  if (!(deps instanceof Array)) {
    factory = deps;
    deps = [];
  }
  
	// Error if id or factory were not provided:
	if (!id || !factory) {
	  throw('invalid definition');
  }
  
  // Resolve exports as a factory function:
  if (typeof factory != 'function') {
    var exports = factory;
    factory = function() {
      return exports;
    };
  }

	// Set new module definition:
	this._m[ id ] = {
		d: deps,
		f: factory
	};
	
	return this;
};

// Declares a new module as the provided exports literal:
// Signature 1:
// @param String id: reference id of the module.
// @param Object exports: an object of any type to be assigned to the specified id.
// Signature 2:
// @param Object definitions: an object of key-value pairs to define as modules.
Pod.declare = function(id, exports) {
	var defs = id;
	
	if (typeof id == 'string') {
		defs = {};
		defs[id] = exports;
	}
	
	function factory(exports) {
		return function() { return exports; };
	}
	
	for (id in defs) {
		if (defs.hasOwnProperty(id)) {
			this.define(id, factory(defs[id]));
		}
	}
	return this;
};

// Requires a module. This fetches the module and all of its dependencies.
// @param String/Array req: the id (or list of ids) to require.
// @param Function callback: an optional callback to inject the required modules into.
Pod.require = function(req, callback) {
	var single = !(req instanceof Array);

	// Wrap a single dependency definition in an array.
	req = single ? [req] : req.slice();
	
	for (var i=0; i < req.length; i++) {
		var id = req[i];
		
		if (this._m.hasOwnProperty(id)) {
			// Known module reference:
			// Pull module definition from key table.
			var mod = this._m[id];

			// If the module has no existing export,
			// Resolve dependencies and create module.
			if (!mod.e) {
				// If module is active within the working dependency path chain,
				// throw a circular reference error.
				if (mod._) throw('circular reference to '+id);

				// Flag module as active within the path chain.
				mod._ = 1;

				// Run factory function with recursive require call to fetch dependencies:
				mod.e = mod.f.apply(null, this.require(mod.d));

				// Release module from the active path.
				mod._ = 0;
			}

			// Replace dependency reference with the resolved module.
			req[i] = mod.e;
		} 
		else if (id === this.name || id === 'pod') {
			// Pod self-reference:
			req[i] = this;
		}
		else {
			// Error for undefined module references.
			throw(id+' is undefined');
		}
	}

	// If a callback function was provided,
	// Inject dependency array into the callback.
	if (typeof callback == 'function') {
	  callback.apply(null, req);
  }
  
	// If directly referenced by ID, return module.
	// otherwise, return array of all required modules.
	return single ? req[0] : req;
};

// Extend static methods to all instances:
Pod.prototype = {
  define: Pod.define,
  declare: Pod.declare,
  require: Pod.require
};