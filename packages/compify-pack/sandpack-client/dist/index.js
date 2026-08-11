/* Compify browser-only derivative of CodeSandbox Sandpack v2.19.8, Apache-2.0; see PROVENANCE.md. */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib_es6 = require('./tslib.es6-09b702d7.js');
var utils = require('./utils-398f522a.js');
require('outvariant');

function loadSandpackClient(iframeSelector_1, sandboxSetup_1) {
    return tslib_es6.__awaiter(this, arguments, void 0, function (iframeSelector, sandboxSetup, options) {
        var template, Client, _a;
        var _b;
        if (options === void 0) { options = {}; }
        return tslib_es6.__generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    template = (_b = sandboxSetup.template) !== null && _b !== void 0 ? _b : "parcel";
                    if (template === "node") {
                        throw new Error("[sandpack-client]: template \"".concat(template, "\" requires the unsupported server runtime; this build supports browser runtime and static templates only"));
                    }
                    if (!(template === "static")) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('./clients/static/index.js'); }).then(function (module) { return module.SandpackStatic; })];
                case 1:
                    _a = _c.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, Promise.resolve().then(function () { return require('./clients/runtime/index.js'); }).then(function (module) { return module.SandpackRuntime; })];
                case 3:
                    _a = _c.sent();
                    _c.label = 4;
                case 4:
                    Client = _a;
                    return [2 /*return*/, new Client(iframeSelector, sandboxSetup, options)];
            }
        });
    });
}

Object.defineProperty(exports, 'SandpackLogLevel', {
    enumerable: true,
    get: function () { return utils.SandpackLogLevel; }
});
exports.addPackageJSONIfNeeded = utils.addPackageJSONIfNeeded;
exports.createError = utils.createError;
exports.createPackageJSON = utils.createPackageJSON;
exports.extractErrorDetails = utils.extractErrorDetails;
exports.normalizePath = utils.normalizePath;
exports.nullthrows = utils.nullthrows;
exports.loadSandpackClient = loadSandpackClient;
