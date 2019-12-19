export default class AsyncSeriesHook {
  constructor() {
    this.tasks = {};
  }

  tapAsync(name, task) {
    this.tasks[name] = this.tasks[name] || [];
    this.tasks[name].push(task);
  }
  callAsync(name, ...args) {
    const tasks = this.tasks[name];
    const finalCallback = args.pop();

    let i = 0;
    const next = () => {
      const task = tasks[i++];
      task ? task(...args, next) : finalCallback();
    }

    next();
  }

  tapPromise(name, task) {
    this.tasks[name] = this.tasks[name] || [];
    this.tasks[name].push(task);
  }
  callPromise(name, ...args) {
    const tasks = this.tasks[name];

    return tasks.reduce((promise, task) => {
      return promise.then(() => task(...args));
    }, Promise.resolve());
  }
}