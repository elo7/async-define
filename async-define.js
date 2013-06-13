/*
    AMD-compatible async 'define' modularization.

    Contains only the 'define' module syntax compatible with the official API
    and a flexible dependency resolver with no restrictions on how you load your files.

    This implementation doesn't load your JS files so you have to do it. You can bundle
    one big file, load multiple files, load them asynchronously, out of order, your call.

    (doesn't include the 'require' and 'requirejs' objects)

    Usage:
        define(name, dependencies, factory)
        define(dependencies, factory)
        define(factory)

        where
            name - a string with your module name
            dependencies - an array listing your dependencies names
            factory - a function that receives your dependencies and returns the module result


    Advantages:

    - Very small (~250 bytes gzipped) so you can inline ir on every page.
    - Don't expect your modules to be loaded in a specific order.
    - Allows asynchronous loading of your files for maximum performance.
    - Very simple.
    
 */
define = (function() {
    var modules = {};
    var define_queue = {};
    var anonymous_count = 0;

	return function _define(/* name, dependencies, factory */) {
		var params = [],
		    i = 0,

            // extract arguments
            argv = arguments,
            argc = argv.length,

            // extract arguments from function call - (name?, modules?, factory)
            name = argc == 3? argv[0] : '_anon' + anonymous_count++,
            dependencies = argc > 1? argv[argc - 2] : [],
            factory = argv[argc - 1];

		// find params
		for (i = 0; i < dependencies.length; i++) {
			if (!modules.hasOwnProperty(dependencies[i])) {

                // put in queue if it's the first time
                if (!define_queue.hasOwnProperty(name)) {
				    define_queue[name] = [name, dependencies, factory];
                }

				return;
			} else {
				params.push(modules[dependencies[i]]);
			}
		}

		// execute
		modules[name] = factory.apply(window, params);
        delete define_queue[name];

		// execute others in queue
		for (name in define_queue) {
            _define.apply(window, define_queue[name]);
		}
	}
})();