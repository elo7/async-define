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

        undefine(name)
        where
            name - a string with a loaded module name that you want to remove from amd definition

    Advantages:

    - Very small (~400 bytes w/ gzip) so you can inline it on every page.
    - Don't expect your modules to be loaded in a specific order.
    - Allows asynchronous loading of your files for maximum performance.
    - Very simple.

 */
(function() {
    if (typeof define == 'undefined') {
        // object with all executes modules (module_name => module_value)
        var modules = {};

        // (dependency_name => [modules])
        var define_queue = {};

        var debug_timer = null;

        function _log_debug(msg) {
            console.log('%c[async-define]%c ' + msg, 'color: #fdb933', 'color: #2ca75d');
        }

        function _set_debug_timer() {
            if (debug_timer === null) {
                _log_debug('A new module was registered; will monitor if it loads correctly.');
                debug_timer = setInterval(function() {
                    var entriesWaiting = Object.entries(define_queue).filter(queue => queue[1].length > 0);
                    if (entriesWaiting.length > 0) {
                        _log_debug('Modules waiting for a dependency:\n' + entriesWaiting.map(entry => ` - ${entry[0]}: [${entry[1].map(queue => queue[1]).join(', ')}]`).join('\n'));
                    } else {
                        _log_debug('All modules loaded.');
                        clearInterval(debug_timer);
                        debug_timer = null;
                    }
                }, 1000);
            }
        }

        // the 'define' function
        function _define(/* <exports>, name, dependencies, factory */) {
            var
                // extract arguments
                argv = arguments,
                argc = argv.length,

                // extract arguments from function call - (exports?, name?, modules?, factory)
                exports = argv[argc - 4] || {},
                name = argv[argc - 3] || Math.floor(new Date().getTime() * (Math.random())), // if name is undefined or falsy value we add some timestamp like to name.
                dependencies = argv[argc - 2] || [],
                factory = argv[argc - 1],

                // helper variables
                params = [],
                dependencies_satisfied = true,
                dependency_name,
                result,
                config_dependencies_iterator = 0,
                dependencies_iterator = 0,
                config_dependencies_index = -1;

            _set_debug_timer();

            // config dependecies
            if (_define.prototype.config_dependencies && _define.prototype.config_dependencies.constructor === Array) {
                var config_dependencies = _define.prototype.config_dependencies || [];

                var config_dependencies_size = config_dependencies.length;
                for (; config_dependencies_iterator < config_dependencies_size; config_dependencies_iterator++) {
                    if (name === config_dependencies[config_dependencies_iterator]) {
                        config_dependencies_index = config_dependencies_iterator;
                    }
                }
                if (config_dependencies_index !== -1) {
                    config_dependencies.splice(config_dependencies_index, 1)
                } else {
                    dependencies = dependencies.concat(config_dependencies);
                }
            }

            // find params
            for (; dependencies_iterator < dependencies.length; dependencies_iterator++) {
                dependency_name = dependencies[dependencies_iterator];

                // if this dependency exists, push it to param injection
                if (modules.hasOwnProperty(dependency_name)) {
                    params.push(modules[dependency_name]);
                } else if (dependency_name === 'exports') {
                    params.push(exports);
                } else {
                    if (argc !== 4) { // if 4 values, is reexecuting
                        // no module found. save these arguments for future execution.
                        define_queue[dependency_name] = define_queue[dependency_name] || [];
                        define_queue[dependency_name].push([exports, name, dependencies, factory]);
                    }

                    dependencies_satisfied = false;
                }
            }

            // all dependencies are satisfied, so proceed
            if (dependencies_satisfied) {
                if (!modules.hasOwnProperty(name)) {
                    // execute this module
                    result = factory.apply(this, params);

                    if (result) {
                        modules[name] = result;
                    } else {
                        // assuming result is in exports object
                        modules[name] = exports;
                    }
                }

                // execute others waiting for this module
                while (define_queue[name] && (argv = define_queue[name].pop())) {
                    _define.apply(this, argv);
                }
            }
        }

        function _undefine(name) {
            if (name && modules[name]) {
                delete modules[name];
            }
        }

        // register this as AMD compatible (optional)
        _define.amd = { jQuery: true };

        // exports the define and undefine functions in global scope
        define = _define;
        undefine = _undefine;
    }
})();
