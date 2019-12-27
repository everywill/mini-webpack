import Tapable from './tapable/index';
import Chunk from './chunk';
import MainTemplate from './templates/main-template';
import ModuleTemplate from './templates/module-template';

export default class Compilation extends Tapable {
  constructor(compiler) {
    super();
    this.compiler = compiler;
    this.options = compiler.options;
    this.entries = [];
    this.preparedChunks = [];
    this.chunks = []
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
    }
    this.preparedChunks.push(slot);
    this._addModuleChain(context, entry, (module) => {
      this.entries.push(module);
    }, (module) => {
      slot.module = module;
      console.log('compilation(addEntry): entry module completed\n');
      callback();
    })
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
    })
  }

  addModule(module) {
    this.modules.push(module);
  }

  buildModule(module, callback) {
    module.build(() => {
      callback();
    })
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
        callback()
      }
    }

    for (let i = 0, l = dependencies.length; i < l; i++) {
      const moduleFactory = this.dependencyFactories.get(dependencies[i][0].constructor);
      const dependentModule = moduleFactory.create({
        dependencies: dependencies[i],
        context: module.context,
      });

      this.addModule(dependentModule);

      function iterationDependencies(deps) {
        for (let i = 0, l = deps.length; i < l; i++) {
          deps[i].module = dependentModule;
        }
      }

      iterationDependencies(dependencies[i]);

      this.buildModule(dependentModule, () => {
        this.processModuleDependencies(dependentModule, done);
      })
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