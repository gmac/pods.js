# Pod.js (formerly Micro Module Definition)

Pod.js is a tiny synchronous module definition and dependency management library, built around a familiar define/require interface. Pods are designed to provide a light-weight manager for organizing collections of related module components. Pods are a great way to break up a large compiled application codebase into managed modules. The synchronous nature of Pods also makes their benefits orthogonal to that of an AMD system such as RequireJS; it can still be useful to break down large AMD application modules into locally-scoped component clusters.

The `Pod` API has three methods: `define`, `declare`, and `require`. Pod objects may be instanced; each instance will manage its own collection of modules. Modules may also be managed through the static `Pod` object.

```javascript
// Manage using a pod instance:
var myPod = new Pod();
myPod.define("module", {});
myPod.require("module");

// Manage as a static library interface:
Pod.define("module", {});
Pod.require("module");
```

Note that all `Pod` instances and the static `Pod` object will each manage their own unique module collections. A module defined in one Pod instance will not be available to other Pods.

## define()

The `define` method creates a module definition.	

```javascript
Pod.define( "moduleId", [dependencies]?, exports );
```

- `"moduleId"` : *Required*. Unique string identifier for this module.
- `[dependencies]?` : *Optional*. Array of dependency module ids to be required and injected into the module's scope.
- `exports` : *Required*. An export object for the module, or a factory function used to build the module export. A factory function should receive arguments mapped to the module's dependencies.

The complete usage of `define` allows:

```javascript
// 1) Define a module with a plain exports object.
Pod.define("module", {data: "hello world"});

// 2) Define a module with a factory function.
Pod.define("module1", function() {
	return {}; // << module export object.
});

// 3) Define a module with a single dependency and factory function.
Pod.define("module2", ["module1"], function( mod1 ) {
	return {};
});

// 4) Define a module with multiple dependencies and a factory function.
Pod.define("main", ["module1", "module2"], function( mod1, mod2 ) {
	return {};
});

// Require a module to load it...
Pod.require("main");
```

While listing module dependencies, you may include `"pod"` as an identifier to have the managing Pod instance provide a reference to itself:

```javascript
var myPod = new Pod();

myPod.require(["pod"], function(pod) {
	console.log(pod === myPod); // true
});
```

Modules may be defined in any order, however, all `define` calls should precede your first `require` call. A good practice is to define a `"main"` module for launching your application, and then require `"main"` as your final line of code. For example, here's a simple modular application pattern:

```javascript
// 1) Create an application scope...
(function() {
	"use strict";
	
	// 2) Define all application modules...
	Pod.define("module1", function() {
		return {};
	});
	
	Pod.define("module2", function() {
		return {};
	});
	
	// 3) Define a "main" module for bootstrapping your application...
	Pod.define("main", ["module1", "module2"], function( mod1, mod2 ) {
		// Launch application!
	});
	
	// 4) Require "main" to run your application.
	Pod.require("main");
}());
```

## declare()

The `declare` method is a convenient way to quickly define one or more modules without dependencies. When using `declare`, exported functions will be preserved rather than being used as factories. Use this method to safely declare third-party libraries as defined resources.

```javascript
Pod.declare( "moduleId", exports );
// OR:
Pod.declare( exportsMap );
```

- `"moduleId"` : *Required*. Unique string identifier for the declared module.
- `exports` : *Required*. An export object for the module. The provided object will be set as the module's definitive export value; functions provided as the export will be preserved rather than being used as the module's factory function.

OR:

- `exportsMap` : *Required*. An object with key-value pairs mapping multiple module ids to their related export objects.

The complete usage of `declare` allows:

```javascript
// 1) Declare any object type as a module export.
Pod.declare("message", "Hello World!");
Pod.declare("data", {});

// 2) Safely declare functions/libraries as module exports.
// (note that the root jQuery object is a *function*...)
Pod.declare("jquery", $);

// 3) Declare multiple exports as a map of key-value pairs.
Pod.declare({
	"backbone": Backbone,
	"jquery": $,
	"underscore": _
});
```

Why `declare` third-party libraries rather than `define`? jQuery is a great example: the root jQuery object is actually a function. In order to `define` the jQuery function, we'd need to wrap it in a factory function that exports it. The `declare` method does this for us, like so:

```javascript
Pod.define("jquery", function() {
	return $;
});

// Is identical to...

Pod.declare("jquery", $);
```

## require()

The `require` method builds/accesses a module or collection of modules. Modules and their dependencies are built the first time they are required. Built modules are returned by the `require` method, *and* injected into an optional callback.

```javascript
var module = Pod.require( ["moduleId"], callbackFunction? );
```

- `["moduleId"]` : *Required*. The string identifier of a single module, *or* an array of module ids.
- `callbackFunction?` : *Optional*. Callback function into which the required modules are injected. Provide mapped arguments.
- `return` : A single module is returned when a single id string is required; an array of modules is returned when an array of module ids are required.

The complete usage of `require` allows:

```javascript
// 1) Return a single module by direct id reference.
var module = Pod.require('module1');

// 2) Inject a single module as an argument of a callback function.
Pod.require('module1', function( mod1 ) {
	// do stuff.
});

// 3) Return an array of modules mapped to a list of required ids.
var moduleArray = Pod.require(['module1', 'module2']);

// 4) Inject a collection of modules as arguments of a callback function.
Pod.require(['module1', 'module2'], function( mod1, mod2 ) {
	// do stuff.
});

// 5) OR, do all of the above... return AND inject one or more modules with a single require call.
var returned = Pod.require(['module1', 'module2'], function( mod1, mod2 ) {
	// do stuff.
});
```

Which came first, the chicken or the egg? Pod.js doesn't care to figure it out, so throws an exception when a circular reference is required. Avoid circular references; you should probably be rethinking your organization anyway if you encounter this problem.