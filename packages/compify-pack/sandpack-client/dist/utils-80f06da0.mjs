/* Compify browser-only derivative of CodeSandbox Sandpack v2.19.8, Apache-2.0; see PROVENANCE.md. */
import { b as __assign } from './tslib.es6-a7a4a4fb.mjs';
import { invariant } from 'outvariant';

var SandpackLogLevel;
(function (SandpackLogLevel) {
    SandpackLogLevel[SandpackLogLevel["None"] = 0] = "None";
    SandpackLogLevel[SandpackLogLevel["Error"] = 10] = "Error";
    SandpackLogLevel[SandpackLogLevel["Warning"] = 20] = "Warning";
    SandpackLogLevel[SandpackLogLevel["Info"] = 30] = "Info";
    SandpackLogLevel[SandpackLogLevel["Debug"] = 40] = "Debug";
})(SandpackLogLevel || (SandpackLogLevel = {}));

var createError = function (message) {
    return "[sandpack-client]: ".concat(message);
};
function nullthrows(value, err) {
    if (err === void 0) { err = "Value is nullish"; }
    invariant(value != null, createError(err));
    return value;
}
var DEPENDENCY_ERROR_MESSAGE = "\"dependencies\" was not specified - provide either a package.json or a \"dependencies\" value";
var ENTRY_ERROR_MESSAGE = "\"entry\" was not specified - provide either a package.json with the \"main\" field or an \"entry\" value";
function createPackageJSON(dependencies, devDependencies, entry) {
    if (dependencies === void 0) { dependencies = {}; }
    if (devDependencies === void 0) { devDependencies = {}; }
    if (entry === void 0) { entry = "/index.js"; }
    return JSON.stringify({
        name: "sandpack-project",
        main: entry,
        dependencies: dependencies,
        devDependencies: devDependencies,
    }, null, 2);
}
function addPackageJSONIfNeeded(files, dependencies, devDependencies, entry) {
    var _a, _b;
    var normalizedFilesPath = normalizePath(files);
    var packageJsonFile = normalizedFilesPath["/package.json"];
    /**
     * Create a new package json
     */
    if (!packageJsonFile) {
        nullthrows(dependencies, DEPENDENCY_ERROR_MESSAGE);
        nullthrows(entry, ENTRY_ERROR_MESSAGE);
        normalizedFilesPath["/package.json"] = {
            code: createPackageJSON(dependencies, devDependencies, entry),
        };
        return normalizedFilesPath;
    }
    /**
     * Merge package json with custom setup
     */
    if (packageJsonFile) {
        var packageJsonContent = JSON.parse(packageJsonFile.code);
        nullthrows(!(!dependencies && !packageJsonContent.dependencies), ENTRY_ERROR_MESSAGE);
        if (dependencies) {
            packageJsonContent.dependencies = __assign(__assign({}, ((_a = packageJsonContent.dependencies) !== null && _a !== void 0 ? _a : {})), (dependencies !== null && dependencies !== void 0 ? dependencies : {}));
        }
        if (devDependencies) {
            packageJsonContent.devDependencies = __assign(__assign({}, ((_b = packageJsonContent.devDependencies) !== null && _b !== void 0 ? _b : {})), (devDependencies !== null && devDependencies !== void 0 ? devDependencies : {}));
        }
        if (entry) {
            packageJsonContent.main = entry;
        }
        normalizedFilesPath["/package.json"] = {
            code: JSON.stringify(packageJsonContent, null, 2),
        };
    }
    return normalizedFilesPath;
}
function extractErrorDetails(msg) {
    var _a;
    if (msg.title === "SyntaxError") {
        var title = msg.title, path = msg.path, message = msg.message, line = msg.line, column = msg.column;
        return { title: title, path: path, message: message, line: line, column: column };
    }
    var relevantStackFrame = getRelevantStackFrame((_a = msg.payload) === null || _a === void 0 ? void 0 : _a.frames);
    if (!relevantStackFrame) {
        return { message: msg.message };
    }
    var errorInCode = getErrorInOriginalCode(relevantStackFrame);
    var errorLocation = getErrorLocation(relevantStackFrame);
    var errorMessage = formatErrorMessage(relevantStackFrame._originalFileName, msg.message, errorLocation, errorInCode);
    return {
        message: errorMessage,
        title: msg.title,
        path: relevantStackFrame._originalFileName,
        line: relevantStackFrame._originalLineNumber,
        column: relevantStackFrame._originalColumnNumber,
    };
}
function getRelevantStackFrame(frames) {
    if (!frames) {
        return;
    }
    return frames.find(function (frame) { return !!frame._originalFileName; });
}
function getErrorLocation(errorFrame) {
    return errorFrame
        ? " (".concat(errorFrame._originalLineNumber, ":").concat(errorFrame._originalColumnNumber, ")")
        : "";
}
function getErrorInOriginalCode(errorFrame) {
    var lastScriptLine = errorFrame._originalScriptCode[errorFrame._originalScriptCode.length - 1];
    var numberOfLineNumberCharacters = lastScriptLine.lineNumber.toString().length;
    var leadingCharacterOffset = 2;
    var barSeparatorCharacterOffset = 3;
    var extraLineLeadingSpaces = leadingCharacterOffset +
        numberOfLineNumberCharacters +
        barSeparatorCharacterOffset +
        errorFrame._originalColumnNumber;
    return errorFrame._originalScriptCode.reduce(function (result, scriptLine) {
        var leadingChar = scriptLine.highlight ? ">" : " ";
        var lineNumber = scriptLine.lineNumber.toString().length === numberOfLineNumberCharacters
            ? "".concat(scriptLine.lineNumber)
            : " ".concat(scriptLine.lineNumber);
        var extraLine = scriptLine.highlight
            ? "\n" + " ".repeat(extraLineLeadingSpaces) + "^"
            : "";
        return (result + // accumulator
            "\n" +
            leadingChar + // > or " "
            " " +
            lineNumber + // line number on equal number of characters
            " | " +
            scriptLine.content + // code
            extraLine // line under the highlighed line to show the column index
        );
    }, "");
}
function formatErrorMessage(filePath, message, location, errorInCode) {
    return "".concat(filePath, ": ").concat(message).concat(location, "\n").concat(errorInCode);
}
/* eslint-disable @typescript-eslint/no-explicit-any */
var normalizePath = function (path) {
    if (typeof path === "string") {
        return (path.startsWith("/") ? path : "/".concat(path));
    }
    if (Array.isArray(path)) {
        return path.map(function (p) { return (p.startsWith("/") ? p : "/".concat(p)); });
    }
    if (typeof path === "object" && path !== null) {
        return Object.entries(path).reduce(function (acc, _a) {
            var key = _a[0], content = _a[1];
            var fileName = key.startsWith("/") ? key : "/".concat(key);
            acc[fileName] = content;
            return acc;
        }, {});
    }
    return null;
};

export { SandpackLogLevel as S, createPackageJSON as a, addPackageJSONIfNeeded as b, createError as c, normalizePath as d, extractErrorDetails as e, nullthrows as n };
