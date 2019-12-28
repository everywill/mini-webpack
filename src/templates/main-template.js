import Template from './template';

export default class MainTemplate extends Template {
  constructor() {
    super();
  }
  render(chunk, moduleTemplate, dependencyTemplates) {
    const source = `
      (function(modules) {
        const installedModules = {};

        function __require__(moduleId) {
          if (installedModules[moduleId]) {
            return installedModules[moduleId].exports;
          }
          
          const module = installedModules[moduleId] = {
            exports: {},
          };

          modules[moduleId].call(module.exports, module, module.exports, __require__);

          return module.exports;
        }

        __require__.d = function(exports, name, getter) {
          if (!__require__.o(exports, name)) {
            Object.defineProperty(exports, name, {
              configurable: false,
              enumerable: true,
              get: getter,
            });
          }
        }

        __require__.o = function(object, property) {
          return Object.prototype.hasOwnProperty.call(object, property);
        }

        __require__(${chunk.entryModule.id});
      }) (${this.renderChunkModules(chunk, moduleTemplate, dependencyTemplates)})
    `;
    
    return Buffer.from(source, 'utf-8');
  }
}
