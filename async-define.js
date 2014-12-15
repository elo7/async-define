/*
    AMD-compatible async 'define' modularization by sergiolopes and luiz:
    https://gist.github.com/luiz/d71c99cf1cda53190e70

    Contains the 'define' module syntax compatible with the official API and
    support for injecting the 'export' variable and a flexible dependency
    resolver with no restrictions on how you load your files.

    This implementation doesn't load your JS files so you have to do it. You
    can bundle one big file, load multiple files, load them asynchronously, out
    of order, your call.

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

    - Very small (~300 bytes w/ gzip and no debug) so you can inline it on every page.
    - Don't expect your modules to be loaded in a specific order.
    - Allows asynchronous loading of your files for maximum performance.
    - Very simple.

 */
(function(debug) {
    // object with all executes modules (module_name => module_value)
    var modules = {};

    // (dependency_name => [modules])
    var define_queue = {};

    // the 'define' function
    function _define(/* <exports>, name, dependencies, factory */) {
        var
            // extract arguments
            argv = arguments,
            argc = argv.length,

            // extract arguments from function call - (exports?, name?, modules?, factory)
            exports = argv[argc - 4] || {},
            name = argv[argc - 3],
            dependencies = argv[argc - 2] || [],
            factory = argv[argc - 1],

            // helper variables
            params = [],
            dependencies_satisfied = true,
            dependency_name,
            result,
            i = 0;

        debug && console.log('registering', name);

        // find params
        for (; i < dependencies.length; i++) {
            dependency_name = dependencies[i];
            debug && console.log('dependency found on', dependency_name);

            // if this dependency exists, push it to param injection
            if (modules.hasOwnProperty(dependency_name)) {
                debug && console.log('dependency is already loaded; continuing');
                params.push(modules[dependency_name]);
            } else if (dependency_name === 'exports') {
                debug && console.log('pushing exports');
                params.push(exports);
            } else {
                debug && console.log('dependency not loaded; waiting on it');

                if (argc != 4) { // if 4 values, is reexecuting
                    // no module found. save these arguments for future execution.
                    define_queue[dependency_name] = define_queue[dependency_name] || [];
                    define_queue[dependency_name].push([exports, name, dependencies, factory]);
                }

                dependencies_satisfied = false;
            }
        }

        // all dependencies are satisfied, so proceed
        if (dependencies_satisfied) {

            debug && console.log('all dependencies for', name, 'were satisfied; instantiating');

            // execute this module
            result = factory.apply(this, params);

            if (result) {
                debug && console.log('module returned value');
                modules[name] = result;
            } else {
                // assuming result is in exports object
                debug && console.log('module did not return value; assuming exports was used');
                modules[name] = exports;
            }

            // execute others waiting for this module
            while (define_queue[name] && (argv = define_queue[name].pop())) {
                _define.apply(this, argv);
            }
        }
    }

    // register this as AMD compatible (optional)
    _define.amd = { jQuery: true };

    // exports the define function in global scope
    define = _define;
})(false);