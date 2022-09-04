
import Path from "path";
import fs from "fs/promises";
import glob from "glob"

export function randomInt(max = 10, min = 0) {
    return Math.floor(Math.random() * max) + 1 + min;
}

export function directoryC(dir: any) {
    const _dir = dir
    if (_dir[_dir.length - 1] == "/") {
        return _dir
    }
    _dir[_dir.length] = "/";
    return _dir;
}


export function getName(path: string, ex?: string) {
    return Path.basename(path, getFormat(path)) + (ex || "")
}

export function getFormat(file: string) {
    return Path.extname(file)
}

export function putter(path: string, fileName: string, format: string) {
    return directoryC(path) + fileName + format
}

export function tsPutter(path: string, fileName: string) {
    return putter(path, fileName, ".ts")
}

export async function getFiles(source: string, isdirectory = false, extname = "") {
    return (await fs.readdir(source, { withFileTypes: true }))
        .filter(dirent => isdirectory ? dirent.isDirectory() : !dirent.isDirectory())
        .map(dirent => source + dirent.name)
        .filter(file => extname == "" ? true : Path.extname(file) == extname)
}


type PatternPath = string;

export function getFilesUsingPatternPath(path: PatternPath, rootDir?: string): Promise<string[]> {
    return new Promise((s, r) => {
        glob(Path.join(rootDir || "", path), (err, files) => {
            if (err) r(err);
            s(files);
        })
    })
}


export function timeNow() {
    const timenow = new Date();
    return `${timenow.toLocaleDateString().replaceAll(" ", "").replaceAll("/", ":")}:${timenow.toLocaleTimeString().replaceAll(" ", "")}`
}

export const clappy = (arr: any[], quantity: number = arr.length - 1) => arr.sort(_ => Math.random() - .5).slice(0, quantity);


export function getRandomItem<T extends unknown>(arr: T[]): T {
    return (arr || []).sort(_ => Math.random() - 0.5)[0];
}
