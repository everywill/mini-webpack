import ImportDependency from '../dependencies/import-dependency';

export default class ImportDependencyParserPlugin {
  constructor() {}
  
  apply(parser) {
    parser.tap('import', (statement) => {
      const request = statement.source.value
      parser.state.current.addDependency(new ImportDependency(request));
      return true;
    });

    parser.tap('import specifier', (name) => {
      
    });
  }
}