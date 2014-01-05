describe('Pod Static API', function() {
  
  var id = 'testid';
  var depA = 'dep-a';
  var depB = 'dep-b';
  
  afterEach(function() {
    Pod._m = {};
  });
  
	it('should provide "define", "declare", and "require" static methods.', function() {
		expect(Pod.define).to.be.a('function');
		expect(Pod.declare).to.be.a('function');
		expect(Pod.require).to.be.a('function');
	});

	it('should have "define" accept an id, factory function, and optional dependencies array as arguments.', function() {
		
		// Okay: includes id, dependencies, and factory.
		expect(function() {
			Pod.define(id, [], function() {});
		}).to.not.throw();
		
		// Okay: includes id and factory, omits dependencies.
		expect(function() {
			Pod.define(id, function() {});
		}).to.not.throw();
		
		// Okay: includes id and exports, omits dependencies.
		expect(function() {
			Pod.define(id, {});
		}).to.not.throw();
	});
	
	it('should have "define" throw exceptions when called with invalid arguments.', function() {
		// Missing factory:
		expect(function() {
			Pod.define(id);
		}).to.throw();
		
		// Missing id:
		expect(function() {
			Pod.define(function() {});
		}).to.throw();
		
		// Missing both:
		expect(function() {
			Pod.define([]);
		}).to.throw();
		
		// Missing everything:
		expect(function() {
			Pod.define();
		}).to.throw();
	});
	
	it('should have "define" add a new module definition to its table of managed modules.', function() {
	  Pod.define(id, [depA], function() {});
	  expect(_.size(Pod._m)).to.equal(1);
	  expect(Pod._m[id]).to.exist;
	  expect(Pod._m[id].d).to.contain(depA);
	});
	
	it('should have "define" create a new managed module with a dependencies array and factory function.', function() {
	  var deps = [depA];
	  var factory = function() {};
	  Pod.define(id, deps, factory);
	  
	  var mod = Pod._m[id];
	  expect(mod.d).to.equal(deps);
	  expect(mod.f).to.equal(factory);
	});
	
	it('should have "define" automatically create a missing dependencies array.', function() {
	  var factory = function() {};
	  Pod.define(id, factory);
	  
	  var mod = Pod._m[id];
	  expect(mod.d).to.be.instanceof(Array);
	  expect(mod.d).to.have.length(0);
	  expect(mod.f).to.equal(factory);
	});
	
	it('should have "define" automatically wrap non-function definitions with a factory function.', function() {
	  var exports = {};
	  Pod.define(id, exports);
	  
	  var mod = Pod._m[id];
	  expect(mod.f).to.be.a('function');
	  expect(mod.f()).to.equal(exports);
	});
	
	it('should have "declare" automatically define a module with its exports wrapped in a factory function.', function() {
	  var exports = {};
	  Pod.declare(id, exports);
	  
	  var mod = Pod._m[id];
	  expect(mod.f).to.be.a('function');
	  expect(mod.f()).to.equal(exports);
	});
	
	it('should have "declare" allow the safe definition of function objects as module exports.', function() {
	  var exports = function() {};
	  Pod.declare(id, exports);
	  
	  var mod = Pod._m[id];
	  expect(mod.f).to.be.a('function');
	  expect(mod.f).to.not.equal(exports);
	  expect(mod.f()).to.equal(exports);
	});
	
	it ('should have "declare" define all key-value pairs in a definitions object.', function() {
	  Pod.declare({
	    'mocha': mocha,
	    'underscore': _
	  });
	  
	  expect(_.size(Pod._m)).to.equal(2);
	  expect(Pod._m.underscore.f).to.be.a('function');
	  expect(Pod._m.underscore.f).to.not.equal(_);
	  expect(Pod._m.underscore.f()).to.equal(_);
	});
	
	it('should have "require" get and return a single module by id string.', function() {
		var content = 'module content';
		Pod.declare(id, content);
		expect(Pod.require(id)).to.equal(content);
	});
	
	it('should have "require" get a single module by id string, and inject it into a callback.', function() {
		var content = 'module content';
		Pod.declare(id, content);
		Pod.require(id, function(injected) {
			expect(injected).to.equal(content);
		});
	});
	
	it('should have "require" return an array of requested module ids as an array of mapped modules.', function() {
		Pod.declare({
		  'a': depA,
		  'b': depB
		});
		
		var result = Pod.require(['a', 'b']);
		expect(result.length).to.equal( 2 );
		expect(result[0]).to.equal(depA);
		expect(result[1]).to.equal(depB);
	});
	
	it('should have "require" inject an array of requested module ids as mapped callback arguments.', function() {
		Pod.declare({
		  'a': depA,
		  'b': depB
		});
		
		Pod.require(['a', 'b'], function(a, b) {
			expect(a).to.equal(depA);
			expect(b).to.equal(depB);
		});
	});
	
	it('should have "require" fulfill "pod" dependencies with a reference to the parent Pod.', function() {
		expect(Pod.require('pod')).to.equal(Pod);
		
		Pod.require('pod', function(injected) {
			expect(injected).to.equal(Pod);
		});
	});
	
	it('should have "require" throw an exception when requiring undefined modules.', function() {
		Pod.define(id, {});
		
		expect(function() {
			Pod.require('undefined-module');
		}).to.throw();

		expect(function() {
			Pod.require([id, 'undefined-module']);
		}).to.throw();
	});
	
	it('should have "require" only build each module once when first required.', function() {
		var exports = {};
		var factory = sinon.spy(function() {
			return exports;
		});
		
		Pod.define(id, factory);
		
		var first = Pod.require(id);
		expect(factory.calledOnce).to.be.true;
		expect(first).to.equal(exports);
		
		var second = Pod.require(id);
		expect(factory.calledOnce).to.be.true;
		expect(second).to.equal(exports);
	});
	
	it('should have "require" fulfill module dependencies in cascading order.', function() {
		
		var exportsA = {};
		var exportsB = {};
		var exportsC = {};
		Pod.define('a', exportsA);
		
		Pod.define('b', ['a'], function(a) {
			expect(a).to.equal(exportsA);
			exportsB.a = a;
			return exportsB;
		});
		
		Pod.define('c', ['a'], function(a) {
			expect(a).to.equal(exportsA);
			exportsC.a = a;
			return exportsC;
		});
		
		Pod.require(['b', 'c'], function(b, c) {
			expect(b).to.equal(exportsB);
			expect(c).to.equal(exportsC);
			expect(exportsB.a).to.equal(exportsA);
			expect(exportsC.a).to.equal(exportsA);
		});
	});
	
	it('should have "require" fulfill redundant module requests.', function() {
		var content = 'module content';
		Pod.define('redundant', content);
		
		var result = Pod.require(['redundant', 'redundant']);
		expect(result.length).to.equal(2);
		expect(result[0]).to.equal(content);
		expect(result[1]).to.equal(content);
	});
	
	it('should have "require" throw an exception when a circular dependency chain is encountered.', function() {
		Pod.define('loop.1', ['loop.2'], {});
		Pod.define('loop.2', ['loop.3'], {});
		Pod.define('loop.3', ['loop.1'], {});
		Pod.define('self', ['self'], {});

		expect(function() {
			Pod.require('loop.1');
		}).to.throw();
		
		expect(function() {
			Pod.require('self');	
		}).to.throw();
	});
});

describe('Pod Instance API', function() {
	
	var name = 'test';
	var id = 'testId';
	var pod;
	
	beforeEach(function() {
    pod = new Pod(name);
  });

	afterEach(function() {
		Pod._m = {};
  });
	
	it('should provide "define", "declare", and "require" instance methods.', function() {
		expect(pod.define).to.be.a('function');
		expect(pod.declare).to.be.a('function');
		expect(pod.require).to.be.a('function');
	});
	
	it('should be constructed with an optional name attribute.', function() {
		expect(pod.name).to.equal(name);
	});
	
	it('should use "define" to add a module to the instance without affecting static API.', function() {
		pod.define(id, {});
		expect(_.size(pod._m)).to.equal(1);
		expect(_.size(Pod._m)).to.equal(0);
	});
	
	it('should use "define" to add a module to the instance without affecting other instances.', function() {
		var pod2 = new Pod();
		pod.define(id, {});
		expect(_.size(pod._m)).to.equal(1);
		expect(_.size(pod2._m)).to.equal(0);
	});
	
	it('should use "declare" to add a module to the instance without affecting static API.', function() {
		pod.declare(id, {});
		expect(_.size(pod._m)).to.equal(1);
		expect(_.size(Pod._m)).to.equal(0);
	});
	
	it('should use "declare" to add a module to the instance without affecting other instances.', function() {
		var pod2 = new Pod();
		pod.declare(id, {});
		expect(_.size(pod._m)).to.equal(1);
		expect(_.size(pod2._m)).to.equal(0);
	});
	
	it('should use "require" to fetch a module from the instance on which it was defined.', function() {
		var instanceExp = {};
		var staticExp = {};
		
		pod.define(id, instanceExp);
		Pod.define(id, staticExp);
		
		expect(pod.require(id)).to.equal(instanceExp);
		expect(Pod.require(id)).to.equal(staticExp);
	});
	
	it('should have "require" throw an exception when the requested module does not exist on the instance.', function() {
		Pod.define(id, {});
		
		expect(function() {
			pod.require(id);
		}).to.throw();
	});
	
	it('should have "require" fulfill "pod" dependencies with a reference to the parent Pod instance.', function() {
		expect(pod.require('pod')).to.equal(pod);
	});
	
	it('should have "require" fulfill "[name]" dependencies with a reference to the parent Pod instance.', function() {
		expect(pod.require(name)).to.equal(pod);
	});
});
