# PostCSS Extract Asset

[PostCSS](https://github.com/postcss/postcss) plugin to copy assets referenced by url()s into a destination directory.

## Install

```sh
npm install --save postcss precss postcss-extract-asset
```

## Usage

```js
const postcss = require('postcss');
const precss = require('precss');
const postcssExtractAsset = require('postcss-extract-asset');

const fs = require('fs');

const inFile = 'src/main.css';
const outFile = 'dist/main.css';

postcss([precss, postcssExtractAsset])
    .process(fs.readFileSync(inFile, 'utf8'), {
        from: inFile, 
        to: outFile
    })
    .then(function (result) {
        fs.writeFileSync(outFile, result.css);
    });
```
