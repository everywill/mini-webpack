export default class Dependency {
  constructor() {
    this.module = null;
  }
  isEqualResource(dep) {
    return dep.request === this.request;
  }
}