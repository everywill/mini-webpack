import Tapable from './tapable/index';
import Module from './module';
import Parser from './parser';

export default class ModuleFactory extends Tapable {
  constructor(params) {
    super();
    this.resolver = params.resolver;

    this.tap('factory', () => {
      return (result) => {
        const resolver = this.callWaterfall('resolver', null);
        const data = resolver(result);

        const createdModule = new Module({
          request: result.request,
          resource: data,
          parser: this.getParser(),
        })

        return createdModule;
      };
    });

    this.tap('resolver', () => {
      return (data) => {
        const context = data.context;
        const request = data.request;

        return this.resolver(context, request);
      };
    });
  }

  getParser() {
    const parser = new Parser();
    this.callSync('parser', parser);
    return parser;
  }

  create(data) {
    const dependencies = data.dependencies;
    const context = data.context;
    const request = dependencies[0].request;

    const factory = this.callWaterfall('factory', null);
    const createdModule = factory({context, request});

    debugger

    console.log(`moduleFactory(create): created \n${JSON.stringify(createdModule)}\n`);
    return createdModule;
  }
}
