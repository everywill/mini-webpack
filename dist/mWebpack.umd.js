(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('acorn')) :
  typeof define === 'function' && define.amd ? define(['acorn'], factory) :
  (global = global || self, global.mWebpack = factory(global.acorn));
}(this, (function (acorn) { 'use strict';

  acorn = acorn && acorn.hasOwnProperty('default') ? acorn['default'] : acorn;

  class Tapable {
    constructor() {
      this.tasks = {};
    }

    tap(name, task) {
      this.tasks[name] = this.tasks[name] || [];
      this.tasks[name].push(task);
    }

    apply(...plugins) {
      for (let i = 0, l = plugins.length; i < l; i++) {
        plugins[i].apply(this);
      }
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
        console.log('compilation(addEntry): entry module completed\n');
        callback();
      });
    }

    _addModuleChain(context, dependency, onModule, callback) {
      const moduleFactory = this.dependencyFactories.get(dependency.constructor);

      const createdModule = moduleFactory.create({
        dependencies: [dependency],
        context,
      });

      this.addModule(createdModule);

      onModule(createdModule);
      this.buildModule(createdModule, () => {
        this.processModuleDependencies(createdModule, callback);
      });
    }

    addModule(module) {
      this.modules.push(module);
    }

    buildModule(module, callback) {
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
      console.log(`compilation(addModuleDependencies): adding \n${JSON.stringify(dependencies)}\n`);

      if (dependencies.length === 0) {
        callback();
      }

      let i = 0;

      const done = () => {
        if (++i === dependencies.length) {
          callback();
        }
      };

      for (let i = 0, l = dependencies.length; i < l; i++) {
        debugger
        const moduleFactory = this.dependencyFactories.get(dependencies[i][0].constructor);
        const dependentModule = moduleFactory.create({
          dependencies: dependencies[i],
          context: module.context,
        });

        this.addModule(dependentModule);

        this.buildModule(dependentModule, () => {
          this.processModuleDependencies(dependentModule, done);
        });
      }
    }

    seal(callback) {
      console.log('compilation(seal): sealing\n');
      debugger
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

      console.log('compiler(compile): created a new compilation\n');

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
      console.log('compiler(emitAssets): emitting assets');
    }

    // compile: make => seal => emit
    run() {
      this.compile((compilation) => {
        this.emitAssets(compilation);
      });
    }
  }

  class Dependency {
    constructor(request) {
      this.request = request;
    }
    isEqualResource(dep) {
      return dep.request === this.request;
    }
  }

  class EntryDependency extends Dependency {
    constructor(request) {
      super(request);
    }
  }

  class EntryOptionPlugin {
    constructor(context) {
      this.name = 'main';
      this.entry = '';
      this.context = context;
    }
    apply(compiler) {
      
      compiler.tap('entry-option', (entry) => {
        this.entry = entry;
        return true;
      });

      compiler.tap('make', (compilation, callback) => {
        const entry = new EntryDependency(this.entry);

        console.log(`entry-option-plugin: adding entry to compilation\n${JSON.stringify(entry)}\n`);

        compilation.addEntry(this.context, entry, this.name, callback);
      });
    }
  }

  class ImportDependency extends Dependency {
    constructor(request) {
      super(request);
    }
  }

  const path$1 = require('path');
  const fs = require('fs');
  const readFile = fs.readFile.bind(fs);

  function getContext(resource) {
    return path$1.dirname(resource);
  }

  class Module {
    constructor(params) {
      this.request = params.request;
      this.resource = params.resource;
      this.context = getContext(params.resource);
      this.dependencies = [];
      this.parser = params.parser;
    }

    build(callback) {
      console.log(`module(build): parsing resource ${this.resource}\n`);

      readFile(this.resource, (err, data) => {
        this._source = data.toString();
        this.parser.parse(this._source, {
          current: this,
        });
        return callback();
      });
      
    }

    addDependency(dep) {
      this.dependencies.push(dep);
    }
  }

  class Parser extends Tapable {
    constructor() {
      super();
      // store the processing module
      this.state = undefined;
    }
    parse(source, state) {
      this.state = state;
      const ast = acorn.parse(source, {
        sourceType: 'module',
      });
      this.walkStatements(ast.body);
    }

    walkStatements(statements) {
      for (let i = 0, l = statements.length; i < l; i++) {
        this.walkStatement(statements[i]);
      }
    }

    walkStatement(statement) {
      const handler = this[`walk${statement.type}`];
      if (handler) {
        handler.call(this, statement);
      }
    }

    walkImportDeclaration(statement) {
      this.callSyncBail('import', statement);
      const { specifiers } = statement;
      let specifier;
      debugger
      for (let i = 0, l = specifiers.length; i < l; i++) {
        specifier = specifiers[i];
        if (specifiers.type === 'ImportSpecifier') {
          this.callSyncBail('import specifier', specifier.imported.name);
        }
      }
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
            parser: this.getParser(),
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

    getParser() {
      const parser = new Parser();
      this.callSync('parser', parser);
      return parser;
    }

    create(data) {
      const dependencies = data.dependencies;
      const context = data.context;
      const request = dependencies[0].request;

      const factory = this.callWaterfall('factory', null);
      const createdModule = factory({context, request});

      debugger

      console.log(`moduleFactory(create): created \n${JSON.stringify(createdModule)}\n`);
      return createdModule;
    }
  }

  class ImportDependencyParserPlugin {
    constructor() {}
    
    apply(parser) {
      parser.tap('import', (statement) => {
        const request = statement.source.value;
        parser.state.current.addDependency(new ImportDependency(request));
        return true;
      });

      parser.tap('import specifier', (name) => {
        
      });
    }
  }

  class ModulePlugin {
    constructor() {}

    apply(compiler) {
      compiler.tap('compilation', (compilation, params) => {
        const moduleFactory = new ModuleFactory(params);
        
        compilation.dependencyFactories.set(EntryDependency, moduleFactory);
        compilation.dependencyFactories.set(ImportDependency, moduleFactory);

        moduleFactory.tap('parser', (parser) => {
          parser.apply(
            new ImportDependencyParserPlugin()
          );
        });
      });
    }
  }

  function webpack(options) {
    const compiler = new Compiler();
    compiler.options = options;

    compiler.apply(
      new EntryOptionPlugin(process.cwd()),
      new ModulePlugin(),
    );

    // notify entry-point
    compiler.callSyncBail('entry-option', options.entry);

    return compiler;
  }

  return webpack;

})));
