const path = require('path');

export default {
  createResolver() {
    return (context, request) => {
      return path.resolve(context, request);
    }
  }
}