import EntryDependency from '../dependencies/entry-dependency';
import ImportDependency from '../dependencies/import-dependency';
import ModuleFactory from '../module-factories/normal-module-factory';
import NullFactory from '../module-factories/null-factory';
import ImportDependencyParserPlugin from './import-dependency-parser-plugin';
import ExportDependencyParserPlugin from './export-dependency-parser-plugin';
import ExportDependency from '../dependencies/export-dependency';

export default class ModulePlugin {
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