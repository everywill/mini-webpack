import Tapable from './tapable/index';

export default class Compilation extends Tapable {
  constructor(compiler) {
    super();
    this.compiler = compiler;
    this.modules = [];
  }

  finish() {}

  seal() {}
}