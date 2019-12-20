import ModuleDependency from '../dependencies/module-dependency';
import ModuleFactory from '../module-factory';

export default class EntryOptionPlugin {
  constructor() {
    this.name = 'main';
    this.entry = '';
  }
  apply(compiler) {
    compiler.tap('compilation', (compilation) => {
      compilation.dependencyFactories.set(ModuleDependency, ModuleFactory);
    });
    
    compiler.tap('entry-option', (entry) => {
      this.entry = entry;
      console.log(`receiving entry-point: ${entry}`)
      return true;
    });

    compiler.tap('make', (compilation, callback) => {
      compilation.addEntry(new ModuleDependency(this.entry), this.name, callback);
    });
  }
}