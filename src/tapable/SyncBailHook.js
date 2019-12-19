export default class SyncBailHook {
  constructor() {
    this.tasks = {};
  }
  tap(name, task) {
    this.tasks[name] = this.tasks[name] || [];
    this.tasks[name].push(task);
  }
  call(name, ...args) {
    let i = 0, ret;
    do {
      let task = this.tasks[name][i++](...args);
    } while (!ret);
  }
}