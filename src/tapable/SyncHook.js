export default class SyncHook {
  constructor() {
    this.tasks = {};
  }
  tap(name, task) {
    this.tasks[name] = this.tasks[name] || [];
    this.tasks[name].push(task);
  }
  call(name, ...args) {
    const tasks = this.tasks[name];
    for (let i = 0, l = tasks.length; i < l; i++) {
      tasks[i](...args);
    }
  }
}