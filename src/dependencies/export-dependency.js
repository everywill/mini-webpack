import Dependency from './dependency';

export default class ExportDependency extends Dependency {
  constructor(request) {
    super(request);
  }
}

ExportDependency.Template = class ExportDependencyTemplate {
  apply(dep, source) {
    return source;
  }
}