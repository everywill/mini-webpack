import Tapable from './tapable/index';
import Compilation from './compilation';

export default class Compiler extends Tapable {
  constructor() {
    super();
  }

  compile() {
    const compilation = new Compilation(this);
    this.callAsyncParallel('make', compilation, function() {
      compilation.finish();
      compilation.seal();
    })
  }

  emitAssets() {}

  run() {
    this.compile()
  }
}