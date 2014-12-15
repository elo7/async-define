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

    - Very small (~250 bytes) so you can inline it on every page.
    - Don't expect your modules to be loaded in a specific order.
    - Allows asynchronous loading of your files for maximum performance.
    - Very simple.
    
 */
(function() {
    // object with all executes modules (module_name => module_value)
    var modules = {}; 

    // (dependency_name => [modules])
    var define_queue = {};

    // the 'define' function
    function _define(/* reexecuting?, name, dependencies, factory */) {
        var 
            // extract arguments
            argv = arguments,
            argc = argv.length,

            // extract arguments from function call - (name?, modules?, factory)
            name = argv[argc - 3],
            dependencies = argv[argc - 2] || [],
            factory = argv[argc - 1],

            // helper variables
            params = [],
            dependencies_satisfied = true,
            dependency_name,
            i = 0;

        // config dependecies
        if(_define.prototype.config_dependencies && _define.prototype.config_dependencies.constructor === Array) {
          var config_dependencies = _define.prototype.config_dependencies || [];
          var config_dependencies_index = config_dependencies.indexOf(name);
          if(config_dependencies_index != -1) {
            config_dependencies.splice(config_dependencies_index, 1);
          }
          dependencies = dependencies.concat(config_dependencies);
        }

        // find params
        for (; i < dependencies.length; i++) {
            dependency_name = dependencies[i];

            // if this dependency exists, push it to param injection
            if (modules.hasOwnProperty(dependency_name)) {
                params.push(modules[dependency_name]);
            } else {
                if (argc != 4) { // if 4 values, is reexecuting
                    // no module found. save these arguments for future execution.
                    define_queue[dependency_name] = define_queue[dependency_name] || [];
                    define_queue[dependency_name].push([0, name, dependencies, factory]);
                }

                dependencies_satisfied = false;
            }
        }

        // all dependencies are satisfied, so proceed
        if (dependencies_satisfied) {

            if(!modules.hasOwnProperty(name)) {
              // execute this module
              modules[name] = factory.apply(this, params);
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
})();