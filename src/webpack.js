import Compiler from './compiler';
import EntryOptionPlugin from './plugins/entry-option-plugin';

export default function webpack(options) {
  const compiler = new Compiler();
  compiler.options = options;

  // notify entry-point
  new EntryOptionPlugin().apply(compiler);
  compiler.callSyncBail('entry-option', options.entry);

  return compiler;
}