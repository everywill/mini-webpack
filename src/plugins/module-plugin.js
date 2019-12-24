import EntryDependency from '../dependencies/entry-dependency';
import ImportDependency from '../dependencies/import-dependency';
import ModuleFactory from '../module-factory';
import ImportDependencyParserPlugin from './import-dependency-parser-plugin';

export default class ModulePlugin {
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