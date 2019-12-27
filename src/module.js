const path = require('path');
const fs = require('fs');
const readFile = fs.readFile.bind(fs);

function getContext(resource) {
  return path.dirname(resource);
}

export default class Module {
  constructor(params) {
    this.request = params.request;
    this.resource = params.resource;
    this.context = getContext(params.resource);
    this.dependencies = [];
    this.parser = params.parser;
    this._source = '';
  }

  build(callback) {
    console.log(`module(build): parsing resource ${this.resource}\n`);

    readFile(this.resource, (err, data) => {
      this._source = data.toString();
      this.parser.parse(this._source, {
        current: this,
      });
      return callback();
    });
    
  }

  addDependency(dep) {
    this.dependencies.push(dep);
  }

  source(dependencyTemplates) {
    const source = this._source;
    return source;
  }
}