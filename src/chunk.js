function addToCollection(collection, item) {
  if (collection.indexOf(item) !== -1) {
    return false;
  }
  collection.push(item);
  return true;
}

export default class Chunk {
  constructor(name) {
    this.modules = [];
    this.name = name;
    this.entryModule = null;
  }

  addModule(module) {
    return addToCollection(this.modules, module);
  }
}