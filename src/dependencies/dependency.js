export default class Dependency {
  constructor(request) {
    this.request = request;
    this.module = null;
  }
  isEqualResource(dep) {
    return dep.request === this.request;
  }
}