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

  addEntry(entry, name, callback) {
    console.log(`compilation: adding entry ${JSON.stringify(entry)}`);
    const slot = {
      name,
      module: null,
    }
    this._addModuleChain(entry, (module) => {
      this.entries.push(module);
    }, (module) => {
      slot.module = module;

      return callback(module);
    })
  }

  _addModuleChain(dependency, onModule, callback) {
    const moduleFactory = this.dependencyFactories.get(dependency.constructor);
    moduleFactory.create();
  }

  processModuleDependencies(module) {
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
        dependenies.push([dep]);
      }
    }

    this.addModuleDependencies(module, dependencies);
  }

  addModuleDependencies(module, dependencies) {

  }

  seal(callback) {
    console.log('compilation: sealing');
    callback();
  }
}