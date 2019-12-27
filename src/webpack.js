import Compiler from './compiler';
import EntryOptionPlugin from './plugins/entry-option-plugin';
import ModulePlugin from './plugins/module-plugin';
import ModuleIdPlugin from './plugins/module-id-plugin';

export default function webpack(options) {
  const compiler = new Compiler();

  compiler.options = options;
  compiler.outputPath = options.output.path;

  compiler.apply(
    new EntryOptionPlugin(process.cwd()),
    new ModulePlugin(),
    new ModuleIdPlugin(),
  );

  // notify entry-point
  compiler.callSyncBail('entry-option', options.entry);

  return compiler;
}