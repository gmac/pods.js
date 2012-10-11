# Micro Module Definition (MMD)

MMD is a tiny (0.6kb / 0.4kb-gzipped) synchronous module definition and dependency management framework, built around a familiar define/require interface. While AMD is great, even the big kid frameworks such as [Require.js](http://requirejs.org/ "Require.js") and [curl.js](https://github.com/cujojs/curl "curl.js") can sometimes be overkill for tiny (< 5kb) web applications contained in a single script file. MMD is designed to provide module definition, deferred parsing, and dependency injection for those micro applications without adding excessive weight. MMD is built and tested to be small, simple, and robust.

The `mmd` API has only two methods: `define` and `require`.

## define()

The `define` method creates a module definition.	

	mmd.define( "moduleId", [dependencies]?, factoryFunction );

- `"moduleId"` : *Required*. Unique string identifier for this module.
- `[dependencies]?` : *Optional*. Array of dependency module ids to be required and injected into the module's scope.
- `factoryFunction` : *Required*. Function used to build the module. This function should provide arguments mapped to the module's dependencies, and return the constructed module export.

The complete usage of `define` allows:

	// 1) Define a module without dependencies.
	mmd.define("module1", function() {
		return {}; // << module export object.
	});
	
	// 2) Define a module with a single dependency.
	mmd.define("module2", ["module1"], function( mod1 ) {
		return {};
	});
	
	// 3) Define a module with multiple dependencies.
	mmd.define("main", ["module1", "module2"], function( mod1, mod2 ) {
		return {};
	});
	
	// Require a module to load it...
	mmd.require("main");
	
While listing module dependencies, you may include `"mmd"` as an identifier to have MMD provide a reference to itself. This is handy for including a local reference to MMD within an encapsulated module scope. While a module can *technically* reference MMD through the scope chain, local references keep things tidy.

	mmd.define("demo", function() {
		return {};
	});
	
	// Require "mmd" as a local resource, then use it to require other modules.
	mmd.define("main", ["mmd"] function( mmd ) {
		if ( window.isDemo ) {
			mmd.require( "demo" );
		}
	});
	
	mmd.require("main");
	
Modules may be defined in any order, however, all `define` calls should precede your first `require` call. A good practice is to define a `"main"` module for launching your application, and then require `"main"` as your final line of code. For example, here's a simple modular application pattern:

	// 1) Create an application scope...
	(function() {
		"use strict";
		
		// 2) Define all application modules...
		mmd.define("module1", function() {
			return {};
		});
		
		mmd.define("module2", function() {
			return {};
		});
		
		// 3) Define a "main" module for bootstrapping your application...
		mmd.define("main", ["mmd"], function( mmd ) {
			if ( window.someCondition ) {
				mmd.require( ["module1", "module2"] );
			}
		});
		
		// 4) Require "main" to run your application.
		mmd.require("main");
	}());


## require()

The `require` method gets a module or collection of modules. Required modules are built with their dependencies, then returned AND injected into an optional callback.

	var module = mmd.require( ["moduleId"], callbackFunction? );

- `["moduleId"]` : *Required*. The string identifier of a single module, OR an array of module ids.
- `callbackFunction?` : *Optional*. Callback function into which the required modules are injected. Provide mapped argument names.
- `return` : A single module is returned when a single id string is required; an array of modules is returned when an array of module ids are required.

The complete usage of `require` allows:
	
	// 1) Return a single module by direct id reference.
	var module = mmd.require('module1');
	
	// 2) Inject a single module as an argument of a callback function.
	mmd.require('module1', function( mod1 ) {
		// do stuff.
	});
	
	// 3) Return an array of modules mapped to a list of required ids.
	var moduleArray = mmd.require(['module1', 'module2']);
	
	// 4) Inject a collection of modules as arguments of a callback function.
	mmd.require(['module1', 'module2'], function( mod1, mod2 ) {
		// do stuff.
	});
	
	// 5) OR, all of the above... return and inject one or more modules with a single require call.
	var returned = mmd.require(['module1', 'module2'], function( mod1, mod2 ) {
		// do stuff.
	});

Which came first, the chicken or the egg? MMD doesn't care to figure it out, so throws an exception when a circular reference is required. Avoid circular references; you should probably be rethinking your organization anyway if you encounter this problem.

## Go global

MMD is designed to be small and unimposing; consider copying and pasting the minified MMD script directly into your application scope rather than including a separate script file. The `mmd` namespace variable will be local to the scope in which you place it.

However, if you're used to AMD and would prefer calling define/require as global methods, simply assign global references to the MMD methods, and you're off to the races...

	// Assign global references (at your own risk!)
	window.define = mmd.define;
	window.require = mmd.require;	

	// Proceed with global calls:
	define("demo", function() {});
	require("demo");

Please be a responsible web citizen... make sure you don't hijack another framework's define/require methods.