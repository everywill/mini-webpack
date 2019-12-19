(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.mWebpack = factory());
}(this, (function () { 'use strict';

  class Tapable {
    constructor() {
      this.tasks = {};
    }

    tap(name, task) {
      this.tasks[name] = this.tasks[name] || [];
      this.tasks[name].push(task);
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
          finanlCallback();
        }
      };

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
      };

      next();
    }

    callPromiseSeries(name, ...args) {
      const tasks = this.tasks[name];

      return tasks.reduce((promise, task) => {
        return promise.then(() => task(...args));
      }, Promise.resolve());
    }
  }

  class Compilation extends Tapable {
    constructor(compiler) {
      super();
      this.compiler = compiler;
      this.modules = [];
    }

    addEntry(entry, name, callback) {
      console.log(`compilation: adding entry ${entry}`);
      callback();
    }

    seal(callback) {
      console.log('compilation: sealing');
      callback();
    }
  }

  class Compiler extends Tapable {
    constructor() {
      super();
    }

    compile(callback) {
      const compilation = new Compilation(this);

      this.callAsyncParallel('make', compilation, function() {
        compilation.seal(() => {
          callback(compilation);
        });
      });
    }

    emitAssets(compilation) {
      console.log('compiler: emitting assets');
    }

    // compile: make => seal => emit
    run() {
      console.log('compiler: beginning run a compilation');
      this.compile((compilation) => {
        this.emitAssets(compilation);
      });
    }
  }

  class EntryOptionPlugin {
    constructor() {
      this.name = 'main';
      this.entry = '';
    }
    apply(compiler) {
      compiler.tap('entry-option', (entry) => {
        this.entry = entry;
        console.log(`receiving entry-point: ${entry}`);
        return true;
      });

      compiler.tap('make', (compilation, callback) => {
        compilation.addEntry(this.entry, this.name, callback);
      });
    }
  }

  function webpack(options) {
    const compiler = new Compiler();
    compiler.options = options;

    // notify entry-point
    new EntryOptionPlugin().apply(compiler);
    compiler.callSyncBail('entry-option', options.entry);

    return compiler;
  }

  return webpack;

})));
