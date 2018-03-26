const postcss = require('postcss');
const valueParser = require('postcss-value-parser');
const URI = require('urijs');

const path = require('path');
const fs = require('fs');

function Walker() {

    const fromToPathMap = {};
    const toFromPathMap = {};

    const getToPath = function (fromPath) {
        let toPath = fromToPathMap[fromPath];
        if (!toPath) {
            toPath = path.basename(fromPath);
            let seq = 1;
            while (toFromPathMap[toPath] && toFromPathMap[toPath] !== fromPath) {
                toPath = path.basename(fromPath, path.extname(fromPath)) + '-' + seq + path.extname(fromPath);
            }
            toFromPathMap[toPath] = fromPath;
            fromToPathMap[fromPath] = toPath;
        }
        return toPath;
    };

    const visitDeclValue = function (decl, value) {
        if (value && value.type === 'function' && value.value === 'url' && value.nodes && value.nodes.length) {
            const param = value.nodes[0];
            if (param && param.type === 'string' && param.value) {
                const uri = new URI(param.value);
                const fromPath = path.normalize(path.join(path.dirname(decl.source.input.file), uri.pathname()));
                const toPath = getToPath(fromPath);
                const newUri = uri.clone().pathname(toPath);
                // console.log('replace', decl.value, uri.href(), newUri.href());
                decl.value = decl.value.replace(uri.href(), newUri.href());
            }
        }
    };

    const visitDecl = function (decl) {
        const declValueWalker = visitDeclValue.bind(undefined, decl);
        const declValue = valueParser(decl.value);
        declValue.walk(declValueWalker);
    };

    this.fromToPathMap = fromToPathMap;
    this.visitDecl = visitDecl;
}

function transform(pluginOptions, root, result) {

    const postcssOptions = result.opts || {};

    const walker = new Walker();

    root.walkDecls(walker.visitDecl);

    let toDir = 'dist';
    if (postcssOptions.to) {
        toDir = path.dirname(postcssOptions.to);
    }

    if (!fs.existsSync(toDir)) {
        fs.mkdirSync(toDir);
    }

    for (let [fromPath, toPath] of Object.entries(walker.fromToPathMap)) {
        toPath = path.join(toDir, toPath);
        // console.log('copy', fromPath, toPath);
        fs.copyFile(fromPath, toPath, err => {
            if (err) {
                throw err;
            }
        });
    }
}

module.exports = postcss.plugin('postcss-extract-asset', function (pluginOptions) {
    return transform.bind(undefined, pluginOptions);
});
