import Dependency from './dependency';

export default class ExportHeaderDependency extends Dependency {
  constructor(statement) {
    super();
    this.start = statement.start;
    this.end = statement.end;
    if (statement.declaration) {
      this.end = statement.declaration.start;
    }
  }
}

ExportHeaderDependency.Template = class ExportHeaderDependencyTemplate {
  apply(dep, source) {
    const exportHeader = source.substring(dep.start, dep.end);
    return source.replace(exportHeader, '');
  }
}