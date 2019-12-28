import ExportDependency from '../dependencies/export-dependency';

export default class ExportDependencyParserPlugin {
  constructor() {}

  apply(parser) {
    parser.tap('export', (statement) => {
      parser.state.current.addDependency(new ExportDependency());
      return true;
    });
  }
}