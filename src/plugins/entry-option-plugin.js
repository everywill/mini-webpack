export default class EntryOptionPlugin {
  constructor() {
    this.name = 'main';
    this.entry = '';
  }
  apply(compiler) {
    compiler.tap('entry-option', (entry) => {
      this.entry = entry;
      console.log(`receiving entry-point: ${entry}`)
      return true;
    })

    compiler.tap('make', (compilation, callback) => {
      compilation.addEntry(this.entry, this.name, callback);
    })
  }
}