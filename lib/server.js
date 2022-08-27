"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const engine_1 = require("./engine");
const utils_1 = require("./utils");
(async () => {
    const clips = await (0, utils_1.getFilesUsingPatternPath)("./test/clips/*", __dirname);
    const voices = await (0, utils_1.getFilesUsingPatternPath)("./test/voices/*", __dirname);
    await (0, engine_1.combineOneVideo)("i1.mp4", clips, voices);
})();
