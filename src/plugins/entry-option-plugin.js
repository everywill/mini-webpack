import ModuleDependency from '../dependencies/module-dependency';
import ModuleFactory from '../module-factory';

export default class EntryOptionPlugin {
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
      console.log(`receiving entry-point: ${entry}`)
      return true;
    });

    compiler.tap('make', (compilation, callback) => {
      const entry = new ModuleDependency(this.entry);

      console.log(`entry-option-plugin: adding entry to compilation\n${JSON.stringify(entry)}`);

      compilation.addEntry(this.context, entry, this.name, callback);
    });
  }
}