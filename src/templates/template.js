import Tapable from '../tapable/index';

export default class Template extends Tapable {
  constructor() {
    super();
  }

  renderChunkModules(chunk, moduleTemplate, dependencyTemplates) {
    const source = `
      [
        ${chunk.modules.map((module) => {
          return moduleTemplate.render(module, dependencyTemplates);
        })}
      ]
    `;

    return source;
  }

}