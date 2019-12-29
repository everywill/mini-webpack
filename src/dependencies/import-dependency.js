import Dependency from './dependency';

export default class ImportDependency extends Dependency {
  constructor(request, statement) {
    super();
    this.request = request;
    this.start = statement.start;
    this.end = statement.end;
  }
}

ImportDependency.Template = class ImportDependencyTemplate {
  apply(dep, source) {
    return source.slice(0, dep.start) + this.makeImportStatement(dep) + source.slice(dep.end);
  }

  makeImportStatement(dep) {
    const idx = dep.module.id;
    const content = `var __IMPORTED_MODULE_${idx}__ = __require__(${idx});\n`;
    return content;
  }
};
