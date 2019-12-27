import Tapable from './tapable/index';
import acorn from 'acorn';

export default class Parser extends Tapable {
  constructor() {
    super();
    // store the processing module
    this.state = undefined;
  }
  parse(source, state) {
    this.state = state;
    const ast = acorn.parse(source, {
      sourceType: 'module',
    });
    this.walkStatements(ast.body);
  }

  walkStatements(statements) {
    debugger
    for (let i = 0, l = statements.length; i < l; i++) {
      this.walkStatement(statements[i]);
    }
  }

  walkStatement(statement) {
    const handler = this[`walk${statement.type}`];
    if (handler) {
      handler.call(this, statement);
    }
  }

  walkImportDeclaration(statement) {
    this.callSyncBail('import', statement);
    const { specifiers } = statement;
    let specifier;
    for (let i = 0, l = specifiers.length; i < l; i++) {
      specifier = specifiers[i];
      if (specifiers.type === 'ImportSpecifier') {
        this.callSyncBail('import specifier', specifier.imported.name);
      }
    }
  }

  walkExportNamedDeclaration(statement) {
    this.callSyncBail('export', statement);

  }
}