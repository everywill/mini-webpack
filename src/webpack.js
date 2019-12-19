import Compiler from './compiler';

export default function webpack(options) {
  const compiler = new Compiler();
  compiler.options = options;
  return compiler;
}