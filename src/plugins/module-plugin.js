import EntryDependency from '../dependencies/entry-dependency';
import ImportDependency from '../dependencies/import-dependency';
import ModuleFactory from '../module-factory';

export default class ModulePlugin {
  apply(compiler) {
    compiler.tap('compilation', (compilation, params) => {
      const moduleFactory = new ModuleFactory(params);
      
      compilation.dependencyFactories.set(EntryDependency, moduleFactory);
      compilation.dependencyFactories.set(ImportDependency, ModuleFactory);
    });
  }
}