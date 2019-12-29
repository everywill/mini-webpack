import Dependency from './dependency';

export default class ExportSpecifierDependency extends Dependency {
  constructor(statement, def) {
    super();
    this.insertIndex = statement.start;
    this.def = def;
  }
}

ExportSpecifierDependency.Template = class ExportSpecifierDependencyTemplate {
  apply(dep, source) {
    debugger
    return source.slice(0, dep.insertIndex) + this.getContent(dep) + source.slice(dep.insertIndex);
  }

  getContent(dep) {
    const { def } = dep;
    return `__require__.d(__exports__, '${def.name}', function() {return ${def.name}})\n`;
  }
}