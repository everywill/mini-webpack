export default class ModuleDependency {
  constructor(request) {
    this.request = request;
  }
  isEqualResource(dep) {
    return dep.request === this.request;
  }
}