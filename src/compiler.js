import Tapable from './tapable/index';
import Compilation from './compilation';

export default class Compiler extends Tapable {
  constructor() {
    super();
  }

  compile(callback) {
    const compilation = new Compilation(this);

    this.callAsyncParallel('make', compilation, function() {
      compilation.seal(() => {
        callback(compilation);
      });
    })
  }

  emitAssets(compilation) {
    console.log('compiler: emitting assets');
  }

  // compile: make => seal => emit
  run() {
    console.log('compiler: beginning run a compilation')
    this.compile((compilation) => {
      this.emitAssets(compilation);
    })
  }
}