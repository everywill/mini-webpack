import Tapable from './tapable/index';
import Compilation from './compilation';
import ResolverFactory from './resolver-factory';

export default class Compiler extends Tapable {
  constructor() {
    super();
    this.resolver = ResolverFactory.createResolver();
  }

  compile(callback) {
    const compilation = new Compilation(this);

    console.log('compiler: created a new compilation');

    this.callSync('compilation', compilation, {
      resolver: this.resolver,
    })

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
    console.log('compiler: beginning running');
    this.compile((compilation) => {
      this.emitAssets(compilation);
    })
  }
}