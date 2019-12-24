import EntryDependency from '../dependencies/entry-dependency';

export default class EntryOptionPlugin {
  constructor(context) {
    this.name = 'main';
    this.entry = '';
    this.context = context;
  }
  apply(compiler) {
    
    compiler.tap('entry-option', (entry) => {
      this.entry = entry;
      return true;
    });

    compiler.tap('make', (compilation, callback) => {
      const entry = new EntryDependency(this.entry);

      console.log(`entry-option-plugin: adding entry to compilation\n${JSON.stringify(entry)}\n`);

      compilation.addEntry(this.context, entry, this.name, callback);
    });
  }
}