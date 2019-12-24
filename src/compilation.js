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
      this.processModuleDependencies(createdModule, callback);
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
      debugger
      const moduleFactory = this.dependencyFactories.get(dependencies[i][0].constructor);
      const dependentModule = moduleFactory.create({
        dependencies: dependencies[i],
        context: module.context,
      });

      this.addModule(dependentModule);

      this.buildModule(dependentModule, () => {
        this.processModuleDependencies(dependentModule, done);
      })
    }
  }

  seal(callback) {
    console.log('compilation(seal): sealing\n');
    debugger
    callback();
  }
}