import Dependency from './dependency';

export default class ImportSpecifierDependency extends Dependency {
  constructor(name, expression, importedDep) {
    super();
    this.name = name;
    this.start = expression.start;
    this.end = expression.end;
    this.importedDep = importedDep;
  }
}

ImportSpecifierDependency.Template = class ImportSpecifierDependencyTemplate {
  apply(dep, source) {
    debugger
    return source.slice(0, dep.start) + this.makeImportStatement(dep) + source.slice(dep.end);
  }

  makeImportStatement(dep) {
    const { importedDep, name } = dep;
    return `__IMPORTED_MODULE_${importedDep.module.id}__['${name}']`;
  }
}