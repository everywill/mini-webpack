export default class ExportDependencyParserPlugin {
  constructor() {}

  apply(parser) {
    parser.tap('export', (statement) => {
      return true;
    });
  }
}