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
    for (let i = 0, l = tasks.length; i < l; i++) {
      let ret;
      do {
        ret = tasks[i](...args);
      } while (ret === true || !(ret === undefined));
    }
  }
}