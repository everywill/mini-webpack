export default class SyncWaterfallHook {
  constructor() {
    this.tasks = {};
  }
  tap(name, task) {
    this.tasks[name] = this.tasks[name] || [];
    this.tasks[name].push(task);
  }
  call(name, ...args) {
    const tasks = this.tasks[name];
    return tasks.reduce((ret, task) => task(ret), ...args);
  }
}