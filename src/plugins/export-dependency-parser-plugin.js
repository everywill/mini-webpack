import ExportHeaderDependency from '../dependencies/export-header-dependency';
import ExportSpecifierDependency from '../dependencies/export-specifier-dependency';

export default class ExportDependencyParserPlugin {
  constructor() {}

  apply(parser) {
    parser.tap('export', (statement) => {
      parser.state.current.addDependency(new ExportHeaderDependency(statement));
      return true;
    });

    parser.tap('export specifier', (statement, def) => {
      parser.state.current.addDependency(new ExportSpecifierDependency(statement, def));
      return true;
    })
  }
}