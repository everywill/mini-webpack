import Dependency from './dependency';

export default class EntryDependency extends Dependency {
  constructor(request) {
    super();
    this.request = request;
  }
}
