export default class AsyncParallelHook {
  constructor() {
    this.tasks = {};
  }

  tabSync(name, task) {
    this.tasks[name] = this.tasks[name] || [];
    this.tasks[name].push(task);
  }
  callAsync(name, ...args) {
    const tasks = this.tasks[name];
    const finanlCallback = args.pop();
    let i = 0;
    const done = () => {
      if (++i === tasks.length) {
        finanlCallback()
      }
    }

    for(let i = 0, l = tasks.length; i < l; i++) {
      tasks[i](...args, done);
    }
  }

  tapPromise(name, task) {
    this.tasks[name] = this.tasks[name] || [];
    this.tasks[name].push(task);
  }
  callPromise(name, ...args) {
    const tasks = this.tasks[name];
    return Promise.all(tasks.map(task => task(...args)));
  }
}