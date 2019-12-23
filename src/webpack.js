import Compiler from './compiler';
import EntryOptionPlugin from './plugins/entry-option-plugin';
import ModulePlugin from './plugins/module-plugin';
import {} from './plugins/module-plugin';

export default function webpack(options) {
  const compiler = new Compiler();
  compiler.options = options;

  compiler.apply(
    new EntryOptionPlugin(process.cwd()),
    new ModulePlugin(),
  );

  // notify entry-point
  compiler.callSyncBail('entry-option', options.entry);

  return compiler;
}