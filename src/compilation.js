import Tapable from './tapable/index';

export default class Compilation extends Tapable {
  constructor(compiler) {
    super();
    this.compiler = compiler;
    this.entries = [];
    this.chunks = []
    this.modules = [];
    this.dependencyFactories = new Map();
  }

  addEntry(context, entry, name, callback) {
    const slot = {
      name,
      module: null,
    }
    this._addModuleChain(context, entry, (module) => {
      this.entries.push(module);
    }, (module) => {
      slot.module = module;
      console.log('compilation: entry module completed');
      callback();
    })
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
    })
  }

  buildModule(module, callback) {
    console.log(`compilation: starting building module\n${JSON.stringify(module)}`);
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

  addModuleDependencies(module, dependencies, callback) {
    console.log(`compilation: adding dependencies\n${JSON.stringify(dependencies)}`);
    callback();
  }

  seal(callback) {
    console.log('compilation: sealing');
    callback();
  }
}