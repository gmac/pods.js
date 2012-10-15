//	Micro Module Definition (MMD)
//	A tiny module definition and dependency management framework.
//	(c) 2012 Greg MacWilliam, Threespot.
//	Freely distributed under the MIT license.

var mmd = (function(modules, api) {
	modules = {};
	
	return api = {
		// Defines a new module.
		// @param string-id
		// @param array-dependencies?
		// @param function-factory
		define: function() {
			var definition = arguments,
				getParam = function( type, i ) {
					for ( i = 0; i < definition.length; i++ ) {
						if ( typeof(definition[i]) === type ) return definition[i];
					}
				},
				id = getParam('string'),
				dependencies = getParam('object'),
				factory = getParam('function');
	
			// Error if a name or factory were not provided.
			if (!id || !factory) throw('invalid definition');
	
			// Set new module definition.
			modules[ id ] = {
				d: dependencies instanceof Array ? dependencies : [],
				f: factory
			};
		},
		// Requires a module. This fetches the module and all of its dependencies.
		// @param string|array-moduleId
		// @param function-callback
		require: function( req, callback ) {
			var single = !(req instanceof Array),
				self = this,
				nil = null,
				id,
				mod,
				i;
		
			// Wrap a single dependency definition in an array.
			if (single) req = [ req ];
		
			for ( i = 0; i < req.length; i++ ) {
				id = req[i];
				
				if (id === 'mmd') {
					// MMD framework reference:
					// Populate with self.
					req[ i ] = api;
					
				} else if (self.hasOwnProperty.call( modules, id )) {
					// Known module reference:
					// Pull module definition from key table.
					mod = modules[ id ];

					// If the module has no existing export,
					// Resolve dependencies and create module.
					if ( !mod.e ) {
						// If module is active within the working dependency path chain,
						// throw a circular reference error.
						if (mod.p) throw('circular reference to ' + id);

						// Flag module as active within the path chain.
						mod.p = 1;

						// Run factory function with recursive require call to fetch dependencies.
						mod.e = mod.f.apply(nil, self.require(mod.d));

						// Release module from the active path.
						mod.p = 0;
					}

					// Replace dependency reference with the resolved module.
					req[ i ] = mod.e;
					
				} else {
					
					// Error for undefined module references.
					throw(id + ' is undefined');
				}
			}
	
			// If a callback function was provided,
			// Inject dependency array into the callback.
			if (callback && callback.apply) callback.apply(nil, req);
		
			// If directly referenced by ID, return module.
			// otherwise, return array of all required modules.
			return single ? req[0] : req;
		}
	};
}());