import Dependency from './dependency';

export default class ImportDependency extends Dependency {
  constructor(request) {
    super(request);
  }
}

ImportDependency.Template = class ImportDependencyTemplate {
  apply(dep, source) {
    return source;
  }
};
