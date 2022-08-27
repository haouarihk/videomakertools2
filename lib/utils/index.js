"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeNow = exports.getFilesUsingPatternPath = exports.getFiles = exports.tsPutter = exports.putter = exports.getFormat = exports.getName = exports.directoryC = exports.randomInt = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const glob_1 = __importDefault(require("glob"));
function randomInt(max = 10, min = 0) {
    return Math.floor(Math.random() * max) + 1 + min;
}
exports.randomInt = randomInt;
function directoryC(dir) {
    const _dir = dir;
    if (_dir[_dir.length - 1] == "/") {
        return _dir;
    }
    _dir[_dir.length] = "/";
    return _dir;
}
exports.directoryC = directoryC;
function getName(path, ex) {
    return path_1.default.basename(path, getFormat(path)) + (ex || "");
}
exports.getName = getName;
function getFormat(file) {
    return path_1.default.extname(file);
}
exports.getFormat = getFormat;
function putter(path, fileName, format) {
    return directoryC(path) + fileName + format;
}
exports.putter = putter;
function tsPutter(path, fileName) {
    return putter(path, fileName, ".ts");
}
exports.tsPutter = tsPutter;
async function getFiles(source, isdirectory = false, extname = "") {
    return (await promises_1.default.readdir(source, { withFileTypes: true }))
        .filter(dirent => isdirectory ? dirent.isDirectory() : !dirent.isDirectory())
        .map(dirent => source + dirent.name)
        .filter(file => extname == "" ? true : path_1.default.extname(file) == extname);
}
exports.getFiles = getFiles;
function getFilesUsingPatternPath(path, rootDir) {
    return new Promise((s, r) => {
        (0, glob_1.default)(path_1.default.join(rootDir || "", "..", path), (err, files) => {
            if (err)
                r(err);
            s(files);
        });
    });
}
exports.getFilesUsingPatternPath = getFilesUsingPatternPath;
function timeNow() {
    const timenow = new Date();
    return `${timenow.toLocaleDateString().replaceAll(" ", "").replaceAll("/", ":")}:${timenow.toLocaleTimeString().replaceAll(" ", "")}`;
}
exports.timeNow = timeNow;
