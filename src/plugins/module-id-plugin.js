export default class ModuleIdPlugin {
  constructor(startId = 0) {
    this.moduleIndex = startId;
  }

  apply(compiler) {
    compiler.tap('compilation', (compilation) => {
      compilation.tap('module-ids', (modules) => {
        for (let i = 0, l = modules.length; i < l; i++) {
          modules[i].id = this.moduleIndex ++;
        }
      });
    });
  }
}