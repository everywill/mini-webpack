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

  function addToCollection(collection, item) {
    if (collection.indexOf(item) !== -1) {
      return false;
    }
    collection.push(item);
    return true;
  }

  class Chunk {
    constructor(name) {
      this.modules = [];
      this.name = name;
      this.entryModule = null;
    }

    addModule(module) {
      return addToCollection(this.modules, module);
    }
  }

  class Template extends Tapable {
    constructor() {
      super();
    }

    renderChunkModules(chunk, moduleTemplate, dependencyTemplates) {
      const source = `
      [
        ${chunk.modules.map((module) => {
          return moduleTemplate.render(module, dependencyTemplates);
        })}
      ]
    `;

      return source;
    }

  }

  class MainTemplate extends Template {
    constructor() {
      super();
    }
    render(chunk, moduleTemplate, dependencyTemplates) {
      const source = `
      (function(modules) {
        const installedModules = {};

        function __require__(moduleId) {
          if (installedModules[moduleId]) {
            return installedModules[moduleId].exports;
          }
          
          const module = installedModules[moduleId] = {
            exports: {},
          };

          modules[moduleId].call(module.exports, module, module.exports, __require__);

          return module.exports;
        }

        __require__.d = function(exports, name, getter) {
          if (!__require__.o(exports, name)) {
            Object.defineProperty(exports, name, {
              configurable: false,
              enumerable: true,
              get: getter,
            });
          }
        }

        __require__.o = function(object, property) {
          return Object.prototype.hasOwnProperty.call(object, property);
        }

        __require__(${chunk.entryModule.id});
      }) (${this.renderChunkModules(chunk, moduleTemplate, dependencyTemplates)})
    `;
      
      return Buffer.from(source, 'utf-8');
    }
  }

  class ModuleTemplate extends Template{
    constructor() {
      super();
    }

    render(module, dependencyTemplates) {
      const source = `
      (function(module, __exports__, __require__) {
        ${module.source(dependencyTemplates)}
      })
    `;
      return source;
    }
  }

  class Compilation extends Tapable {
    constructor(compiler) {
      super();
      this.compiler = compiler;
      this.options = compiler.options;
      this.entries = [];
      this.preparedChunks = [];
      this.chunks = [];
      this.modules = [];
      this.assets = [];
      this.mainTemplate = new MainTemplate();
      this.moduleTemplate = new ModuleTemplate();
      this.dependencyFactories = new Map();
      this.dependencyTemplates = new Map();
    }

    addEntry(context, entry, name, callback) {
      const slot = {
        name,
        module: null,
      };
      this.preparedChunks.push(slot);
      this._addModuleChain(context, entry, (module) => {
        this.entries.push(module);
      }, (module) => {
        slot.module = module;
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
        this.processModuleDependencies(createdModule, () => {
          callback(createdModule);
        });
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

    processModuleDependenciesForChunk(module, chunk) {
      function iterationDependency(dep) {
        if (dep.module && chunk.addModule(dep.module)) {
          queue.push(module);
        }
      }

      const queue = [ module ];

      while(queue.length) {
        const currentModule = queue.shift();

        currentModule.dependencies.forEach((dep) => {
          iterationDependency(dep);
        });
      }
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
        const moduleFactory = this.dependencyFactories.get(dependencies[i][0].constructor);
        const dependentModule = moduleFactory.create({
          dependencies: dependencies[i],
          context: module.context,
        });

        if (!dependentModule) {
          done();
          continue;
        }

        this.addModule(dependentModule);

        function iterationDependencies(deps) {
          for (let i = 0, l = deps.length; i < l; i++) {
            deps[i].module = dependentModule;
          }
        }

        iterationDependencies(dependencies[i]);

        this.buildModule(dependentModule, () => {
          this.processModuleDependencies(dependentModule, done);
        });
      }
    }

    seal(callback) {
      console.log('compilation(seal): sealing\n');
      debugger
      this.preparedChunks.forEach((preparedChunk) => {
        const module = preparedChunk.module;
        const chunk = this.addChunk(preparedChunk.name);
        
        chunk.addModule(module);
        chunk.entryModule = module;

        this.processModuleDependenciesForChunk(module, chunk);
      });

      this.callSync('module-ids', this.modules);

      this.createChunkAssets();
      callback();
    }

    createChunkAssets() {
      const filename = this.options.output.filename;
      for (let i = 0, l = this.chunks.length; i < l; i++) {
        const chunk = this.chunks[i];
        let source;
        if (chunk.entryModule) {
          source = this.mainTemplate.render(chunk, this.moduleTemplate, this.dependencyTemplates);
        }
        this.assets[filename] = source;
      }
    }

    addChunk(chunkName) {
      const chunk = new Chunk(chunkName);
      this.chunks.push(chunk);

      return chunk;
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

  const path$1 = require('path');
  const fs = require('fs');
  const mkdirp = require('mkdirp');

  class Compiler extends Tapable {
    constructor() {
      super();
      this.options = null;
      this.outputPath = '';
      this.resolver = ResolverFactory.createResolver();
      this.outputFileSystem = {
        mkdirp,
        join: path$1.join.bind(path$1),
        writeFile: fs.writeFile.bind(fs),
      };
    }

    compile(callback) {
      const compilation = new Compilation(this);

      console.log('Compiler(compile): created a new compilation\n');

      this.callSync('compilation', compilation, {
        resolver: this.resolver,
      });

      this.callAsyncParallel('make', compilation, function() {
        compilation.seal(() => {
          callback(compilation);
        });
      });
    }

    emitAssets(compilation, callback) {
      console.log('Compiler(emitAssets): emitting assets');
      this.outputFileSystem.mkdirp(this.outputPath, emitFiles.bind(this));

      function emitFiles(err) {
        if (err) {
          return console.log('Error occured when emitting files');
        }

        const filePaths = Object.keys(compilation.assets);

        if (!filePaths.length) {
          callback();
        }

        let i = 0;
        const done = () => {
          if (++i === filePaths.length) {
            callback();
          }
        };

        filePaths.forEach((filePath) => {
          writeOut.call(this);
          function writeOut() {
            const targetFilePath = this.outputFileSystem.join(this.outputPath, filePath);
            const source = compilation.assets[filePath];

            this.outputFileSystem.writeFile(targetFilePath, source, done);
          } 
        });
      }
    }

    // compile: make => seal => emit
    run(callback) {
      callback = callback || function() {};

      this.compile((compilation) => {
        this.emitAssets(compilation, callback);
      });
    }
  }

  class Dependency {
    constructor(request) {
      this.request = request;
      this.module = null;
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

  ImportDependency.Template = class ImportDependencyTemplate {
    apply(dep, source) {
      return source;
    }
  };

  const path$2 = require('path');
  const fs$1 = require('fs');
  const readFile = fs$1.readFile.bind(fs$1);

  function getContext(resource) {
    return path$2.dirname(resource);
  }

  class Module {
    constructor(params) {
      this.request = params.request;
      this.resource = params.resource;
      this.context = getContext(params.resource);
      this.dependencies = [];
      this.parser = params.parser;
      this._source = '';
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

    source(dependencyTemplates) {
      const source = this._source;
      const createdSource = this.dependencies.reduce((s, dep) => {
        const template = dependencyTemplates.get(dep.constructor);
        return template.apply(dep, source);
      }, source);
      return createdSource;
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
      debugger
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
      for (let i = 0, l = specifiers.length; i < l; i++) {
        specifier = specifiers[i];
        if (specifiers.type === 'ImportSpecifier') {
          this.callSyncBail('import specifier', specifier.imported.name);
        }
      }
    }

    walkExportNamedDeclaration(statement) {
      this.callSyncBail('export', statement);

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

      console.log(`moduleFactory(create): created \n${JSON.stringify(createdModule)}\n`);
      return createdModule;
    }
  }

  class NullFactory {
    create() {
      return null;
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

  class ExportDependency extends Dependency {
    constructor(request) {
      super(request);
    }
  }

  ExportDependency.Template = class ExportDependencyTemplate {
    apply(dep, source) {
      return source;
    }
  };

  class ExportDependencyParserPlugin {
    constructor() {}

    apply(parser) {
      parser.tap('export', (statement) => {
        parser.state.current.addDependency(new ExportDependency());
        return true;
      });
    }
  }

  class ModulePlugin {
    constructor() {}

    apply(compiler) {
      compiler.tap('compilation', (compilation, params) => {
        const moduleFactory = new ModuleFactory(params);
        const nullFactory = new NullFactory();
        
        compilation.dependencyFactories.set(EntryDependency, moduleFactory);

        compilation.dependencyFactories.set(ImportDependency, moduleFactory);
        compilation.dependencyTemplates.set(ImportDependency, new ImportDependency.Template());

        compilation.dependencyFactories.set(ExportDependency, nullFactory);
        compilation.dependencyTemplates.set(ExportDependency, new ExportDependency.Template());


        moduleFactory.tap('parser', (parser) => {
          parser.apply(
            new ImportDependencyParserPlugin(),
            new ExportDependencyParserPlugin()
          );
        });
      });
    }
  }

  class ModuleIdPlugin {
    constructor(startId = 0) {
      this.moduleIndex = startId;
    }

    apply(compiler) {
      compiler.tap('compilation', (compilation) => {
        compilation.tap('module-ids', (modules) => {
          for (let i = 0, l = modules.length; i < l; i++) {
            modules[i].id = this.moduleIndex ++;
          }
        });
      });
    }
  }

  function webpack(options) {
    const compiler = new Compiler();

    compiler.options = options;
    compiler.outputPath = options.output.path;

    compiler.apply(
      new EntryOptionPlugin(process.cwd()),
      new ModulePlugin(),
      new ModuleIdPlugin(),
    );

    // notify entry-point
    compiler.callSyncBail('entry-option', options.entry);

    return compiler;
  }

  return webpack;

})));
