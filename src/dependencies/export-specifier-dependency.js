import Dependency from './dependency';

export default class ExportSpecifierDependency extends Dependency {
  constructor(statement, def) {
    super();
    this.start = statement.start;
    this.def = def;
  }
}

ExportSpecifierDependency.Template = class ExportSpecifierDependencyTemplate {
  apply(dep, source) {
    return source.slice(0, dep.start) + this.getContent(dep) + source.slice(dep.start);
  }

  getContent(dep) {
    const { def } = dep;
    return `__require__.d(__exports__, '${def.name}', function() {return ${def.name}});\n`;
  }
}