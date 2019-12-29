import ImportDependency from '../dependencies/import-dependency';
import ImportSpecifierDependency from '../dependencies/import-specifier-dependency';

export default class ImportDependencyParserPlugin {
  constructor() {}
  
  apply(parser) {
    parser.tap('import', (statement) => {
      const request = statement.source.value
      parser.state.current.addDependency(new ImportDependency(request, statement));
      return true;
    });

    parser.tap('import specifier', (name) => {
      const currentModule = parser.state.current;
      const lastDep = currentModule.dependencies[currentModule.dependencies.length - 1];
      parser.state.importSpecifiers = parser.state.importSpecifiers || {};
      parser.state.importSpecifiers[name] = lastDep;
      return true;
    });

    parser.tap('expression imported var', (expression) => {
      const name = expression.name;
      const importedDep = parser.state.importSpecifiers[name];
      parser.state.current.addDependency(new ImportSpecifierDependency(name, expression, importedDep));
      return true;
    });
  }
}