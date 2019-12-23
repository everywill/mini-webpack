export default class Tapable {
  constructor() {
    this.tasks = {};
  }

  tap(name, task) {
    this.tasks[name] = this.tasks[name] || [];
    this.tasks[name].push(task);
  }

  apply(...plugins) {
    for (let i = 0, l = plugins.length; i < l; i++) {
      plugins[i].apply(this);
    }
  }

  callSync(name, ...args) {
    const tasks = this.tasks[name];
    for (let i = 0, l = tasks.length; i < l; i++) {
      tasks[i](...args);
    }
  }

  callSyncBail(name, ...args) {
    let i = 0, ret;
    do {
      ret = this.tasks[name][i++](...args);
    } while (!ret);
  }

  callLoop(name, ...args) {
    const tasks = this.tasks[name];
    for (let i = 0, l = tasks.length; i < l; i++) {
      let ret;
      do {
        ret = tasks[i](...args);
      } while (ret === true || !(ret === undefined));
    }
  }

  callWaterfall(name, ...args) {
    const tasks = this.tasks[name];
    return tasks.reduce((ret, task) => task(ret), ...args);
  }

  callAsyncParallel(name, ...args) {
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

  callPromiseParallel(name, ...args) {
    const tasks = this.tasks[name];
    return Promise.all(tasks.map(task => task(...args)));
  }

  callAsyncSeries(name, ...args) {
    const tasks = this.tasks[name];
    const finalCallback = args.pop();

    let i = 0;
    const next = () => {
      const task = tasks[i++];
      task ? task(...args, next) : finalCallback();
    }

    next();
  }

  callPromiseSeries(name, ...args) {
    const tasks = this.tasks[name];

    return tasks.reduce((promise, task) => {
      return promise.then(() => task(...args));
    }, Promise.resolve());
  }
}
