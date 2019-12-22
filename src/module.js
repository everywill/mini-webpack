const path = require('path');

function getContext(resource) {
  return path.dirname(resource);
}

export default class Module {
  constructor(params) {
    this.request = params.request;
    this.resource = params.resource;
    this.context = getContext(params.resource);
    this.dependencies = [];
  }

  build(callback) {
    console.log('module: building');
    callback();
  }
}