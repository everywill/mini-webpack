(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.mWebpack = factory());
}(this, (function () { 'use strict';

  class Tapable {
    constructor() {
      this.tasks = {};
    }

    tap(name, task) {
      this.tasks[name] = this.tasks[name] || [];
      this.tasks[name].push(task);
    }

    callSync(name, ...args) {
      const tasks = this.tasks[name];
      for (let i = 0, l = tasks.length; i < l; i++) {
        tasks[i](...args);
      }
    }

    callSyncBail(name, ...args) {
      let i = 0, ret;
      do {
        ret = this.tasks[name][i++](...args);
      } while (!ret);
    }

    callLoop(name, ...args) {
      const tasks = this.tasks[name];
      for (let i = 0, l = tasks.length; i < l; i++) {
        let ret;
        do {
          ret = tasks[i](...args);
        } while (ret === true || !(ret === undefined));
      }
    }

    callWaterfall(name, ...args) {
      const tasks = this.tasks[name];
      return tasks.reduce((ret, task) => task(ret), ...args);
    }

    callAsyncParallel(name, ...args) {
      const tasks = this.tasks[name];
      const finanlCallback = args.pop();
      let i = 0;
      const done = () => {
        if (++i === tasks.length) {
          finanlCallback();
        }
      };

      for(let i = 0, l = tasks.length; i < l; i++) {
        tasks[i](...args, done);
      }
    }

    callPromiseParallel(name, ...args) {
      const tasks = this.tasks[name];
      return Promise.all(tasks.map(task => task(...args)));
    }

    callAsyncSeries(name, ...args) {
      const tasks = this.tasks[name];
      const finalCallback = args.pop();

      let i = 0;
      const next = () => {
        const task = tasks[i++];
        task ? task(...args, next) : finalCallback();
      };

      next();
    }

    callPromiseSeries(name, ...args) {
      const tasks = this.tasks[name];

      return tasks.reduce((promise, task) => {
        return promise.then(() => task(...args));
      }, Promise.resolve());
    }
  }

  class Compilation extends Tapable {
    constructor(compiler) {
      super();
      this.compiler = compiler;
      this.entries = [];
      this.chunks = [];
      this.modules = [];
      this.dependencyFactories = new Map();
    }

    addEntry(context, entry, name, callback) {
      this._addModuleChain(context, entry, (module) => {
        this.entries.push(module);
      }, (module) => {
        console.log('compilation: entry module completed');
        callback();
      });
    }

    _addModuleChain(context, dependency, onModule, callback) {
      const moduleFactory = this.dependencyFactories.get(dependency.constructor);

      const createdModule = moduleFactory.create({
        dependencies: [dependency],
        context,
      });

      onModule(createdModule);
      this.buildModule(createdModule, () => {
        this.processModuleDependencies(createdModule, callback);
      });
    }

    buildModule(module, callback) {
      console.log(`compilation: starting building module\n${JSON.stringify(module)}`);
      module.build(() => {
        callback();
      });
    }

    processModuleDependencies(module, callback) {
      const dependencies = [];
      let dep;
      let isDepExists;

      for (let i = 0, l = module.dependencies.length; i < l; i++) {
        dep = module.dependencies[i];
        isDepExists = false;
        for (let j = 0, k = dependencies.length; j < k; j++) {
          if (dep.isEqualResource(dependencies[j][0])) {
            isDepExists = true;
            dependencies[j].push(dep);
            break;
          }
        }
        if (!isDepExists) {
          dependencies.push([dep]);
        }
      }

      this.addModuleDependencies(module, dependencies, callback);
    }

    addModuleDependencies(module, dependencies, callback) {
      console.log(`compilation: adding dependencies\n${JSON.stringify(dependencies)}`);
      callback();
    }

    seal(callback) {
      console.log('compilation: sealing');
      callback();
    }
  }

  const path = require('path');

  var ResolverFactory = {
    createResolver() {
      return (context, request) => {
        return path.resolve(context, request);
      }
    }
  };

  class Compiler extends Tapable {
    constructor() {
      super();
      this.resolver = ResolverFactory.createResolver();
    }

    compile(callback) {
      const compilation = new Compilation(this);

      console.log('compiler: created a new compilation');

      this.callSync('compilation', compilation, {
        resolver: this.resolver,
      });

      this.callAsyncParallel('make', compilation, function() {
        compilation.seal(() => {
          callback(compilation);
        });
      });
    }

    emitAssets(compilation) {
      console.log('compiler: emitting assets');
    }

    // compile: make => seal => emit
    run() {
      console.log('compiler: beginning running');
      this.compile((compilation) => {
        this.emitAssets(compilation);
      });
    }
  }

  class ModuleDependency {
    constructor(request) {
      this.request = request;
    }
    isEqualResource(dep) {
      return dep.request === this.request;
    }
  }

  const path$1 = require('path');

  function getContext(resource) {
    return path$1.dirname(resource);
  }

  class Module {
    constructor(params) {
      this.request = params.request;
      this.resource = params.resource;
      this.context = getContext(params.resource);
      this.dependencies = [];
    }

    build(callback) {
      console.log('module: building');
      callback();
    }
  }

  class ModuleFactory extends Tapable {
    constructor(params) {
      super();
      this.resolver = params.resolver;

      this.tap('factory', () => {
        return (result) => {
          const resolver = this.callWaterfall('resolver', null);
          const data = resolver(result);

          const createdModule = new Module({
            request: result.request,
            resource: data,
          });

          return createdModule;
        };
      });

      this.tap('resolver', () => {
        return (data) => {
          const context = data.context;
          const request = data.request;

          return this.resolver(context, request);
        };
      });
    }

    create(data) {
      const dependencies = data.dependencies;
      const context = data.context;
      const request = dependencies[0].request;

      const factory = this.callWaterfall('factory', null);
      const createdModule = factory({context, request});

      console.log(`moduleFactory: created module\n${JSON.stringify(createdModule)}`);
      return createdModule;
    }
  }

  class EntryOptionPlugin {
    constructor(context) {
      this.name = 'main';
      this.entry = '';
      this.context = context;
    }
    apply(compiler) {
      compiler.tap('compilation', (compilation, params) => {
        const moduleFactory = new ModuleFactory(params);
        
        compilation.dependencyFactories.set(ModuleDependency, moduleFactory);
      });
      
      compiler.tap('entry-option', (entry) => {
        this.entry = entry;
        console.log(`receiving entry-point: ${entry}`);
        return true;
      });

      compiler.tap('make', (compilation, callback) => {
        const entry = new ModuleDependency(this.entry);

        console.log(`entry-option-plugin: adding entry to compilation\n${JSON.stringify(entry)}`);

        compilation.addEntry(this.context, entry, this.name, callback);
      });
    }
  }

  function webpack(options) {
    const compiler = new Compiler();
    compiler.options = options;

    // notify entry-point
    new EntryOptionPlugin(process.cwd()).apply(compiler);
    compiler.callSyncBail('entry-option', options.entry);

    return compiler;
  }

  return webpack;

})));
