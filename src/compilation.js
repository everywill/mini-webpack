import Tapable from './tapable/index';

export default class Compilation extends Tapable {
  constructor(compiler) {
    super();
    this.compiler = compiler;
    this.modules = [];
  }

  addEntry(entry, name, callback) {
    console.log(`compilation: adding entry ${entry}`);
    callback();
  }

  processModuleDependencies() {}

  seal(callback) {
    console.log('compilation: sealing');
    callback();
  }
}