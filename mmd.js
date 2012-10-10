//	Micro Module Definition (MMD)
//	A tiny module definition and dependency management framework.
//	(c) 2012 Greg MacWilliam, Threespot.
//	Freely distributed under the MIT license.

var mmd = (function() {
	var modules = {};
	
	return {
		define: function() {
			var args = arguments,
				i,
				getArgument = function( type ) {
					for (i = 0; i < args.length; i++) {
						if (typeof(args[i]) === type) return args[i];
					}
				},
				id = getArgument('string'),
				dependencies = getArgument('object'),
				factory = getArgument('function');
	
			// Error if a name or factory were not provided.
			if (!id || !factory) throw('invalid definition');
	
			// Set new module definition.
			modules[ id ] = {
				d: dependencies instanceof Array ? dependencies : [],
				f: factory
			};
		},
		require: function( dependencies, callback ) {
			var directRef = !(dependencies instanceof Array),
				id,
				mod,
				i;
		
			// Wrap a single dependency definition in an array.
			if (directRef) dependencies = [dependencies];
		
			for ( i = 0; i < dependencies.length; i++ ) {
				id = dependencies[i];
				
				if (id === 'mmd') {
					// MMD framework reference:
					// Populate with self.
					dependencies[ i ] = this;
					
				} else if (modules.hasOwnProperty( id )) {
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
						mod.e = mod.f.apply(null, this.require(mod.d));

						// Release module from the active path.
						mod.p = 0;
					}

					// Replace dependency reference with the resolved module.
					dependencies[ i ] = mod.e;
					
				} else {
					
					// Error for undefined module references.
					throw(id + ' is undefined');
				}
			}
	
			// If a callback function was provided,
			// Inject dependency array into the callback.
			if (callback && callback.apply) callback.apply(null, dependencies);
		
			// If directly referenced by ID, return module.
			// otherwise, return array of all required modules.
			return directRef ? dependencies[0] : dependencies;
		}
	};
}());