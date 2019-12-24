export default class Dependency {
  constructor(request) {
    this.request = request;
  }
  isEqualResource(dep) {
    return dep.request === this.request;
  }
}