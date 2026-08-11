/* Compify browser-only derivative of CodeSandbox Sandpack v2.19.8, Apache-2.0; see PROVENANCE.md. */
import { _ as __awaiter, a as __generator } from './tslib.es6-a7a4a4fb.mjs';
export { S as SandpackLogLevel, b as addPackageJSONIfNeeded, c as createError, a as createPackageJSON, e as extractErrorDetails, d as normalizePath, n as nullthrows } from './utils-80f06da0.mjs';
import 'outvariant';

function loadSandpackClient(iframeSelector_1, sandboxSetup_1) {
    return __awaiter(this, arguments, void 0, function (iframeSelector, sandboxSetup, options) {
        var template, Client, _a;
        var _b;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    template = (_b = sandboxSetup.template) !== null && _b !== void 0 ? _b : "parcel";
                    if (template === "node") {
                        throw new Error("[sandpack-client]: template \"".concat(template, "\" requires the unsupported server runtime; this build supports browser runtime and static templates only"));
                    }
                    if (!(template === "static")) return [3 /*break*/, 2];
                    return [4 /*yield*/, import('./clients/static/index.mjs').then(function (module) { return module.SandpackStatic; })];
                case 1:
                    _a = _c.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, import('./clients/runtime/index.mjs').then(function (module) { return module.SandpackRuntime; })];
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

export { loadSandpackClient };
