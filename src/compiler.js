const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

import Tapable from './tapable/index';
import Compilation from './compilation';
import ResolverFactory from './resolver-factory';

export default class Compiler extends Tapable {
  constructor() {
    super();
    this.options = null;
    this.outputPath = '';
    this.resolver = ResolverFactory.createResolver();
    this.outputFileSystem = {
      mkdirp,
      join: path.join.bind(path),
      writeFile: fs.writeFile.bind(fs),
    };
  }

  compile(callback) {
    const compilation = new Compilation(this);

    console.log('Compiler(compile): created a new compilation\n');

    this.callSync('compilation', compilation, {
      resolver: this.resolver,
    })

    this.callAsyncParallel('make', compilation, function() {
      compilation.seal(() => {
        callback(compilation);
      });
    })
  }

  emitAssets(compilation, callback) {
    console.log('Compiler(emitAssets): emitting assets');
    this.outputFileSystem.mkdirp(this.outputPath, emitFiles.bind(this));

    function emitFiles(err) {
      if (err) {
        return console.log('Error occured when emitting files');
      }

      const filePaths = Object.keys(compilation.assets);

      if (!filePaths.length) {
        callback();
      }

      let i = 0;
      const done = () => {
        if (++i === filePaths.length) {
          callback()
        }
      }

      filePaths.forEach((filePath) => {
        writeOut.call(this)
        function writeOut() {
          const targetFilePath = this.outputFileSystem.join(this.outputPath, filePath);
          const source = compilation.assets[filePath];

          this.outputFileSystem.writeFile(targetFilePath, source, done);
        } 
      });
    }
  }

  // compile: make => seal => emit
  run(callback) {
    callback = callback || function() {};

    this.compile((compilation) => {
      this.emitAssets(compilation, callback);
    })
  }
}