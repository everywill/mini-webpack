# mini-webpack

##### Everything in webpack is a plugin.

The main process of a bundler is simple: resolve the entry, find the dependencies(modules) with the help of transformed asts, assemble them together(a chunk) and write the genarated assets out. Tapable provides extension points well known as `Plugins`.



##### Implementation details

By now, loaders and other features like `dynamic import` is not supported, but can be easily implemented in the frame.



Minimal working example:

```
// use a compiler
const webpack = require('mini-webpack');
const compiler = webpack({
  entry: './a.js',
  output: {
    path: './build',
    filename: 'bundle.js',
  }
});
compiler.run(() => {
  console.log('Pack Completed');
});

// a.js
import { b } from './b.js';

const a = 1;
console.log(a + b);

// b.js
export const b = 2
```


