import Template from './template';

export default class ModuleTemplate extends Template{
  constructor() {
    super();
  }

  render(module, dependencyTemplates) {
    const source = `
      (function(module, __exports__, __require__) {
        ${module.source(dependencyTemplates)}
      })
    `;
    return source;
  }
}