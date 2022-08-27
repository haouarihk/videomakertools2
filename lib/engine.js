"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineOneVideo = exports.combine = exports.getAudioFromVideo = exports.addAudiosToClips = exports.addAudioToClip = exports.convertMultipleToTS = exports.convertToTS = exports.removeSoundFromVideo = exports.combineMultipleAudioFiles = exports.normalizeVideo = exports.takeSoundOffOfVideo = exports.moveToResults = exports.clearTmp = exports.makeSureRequiredFoldersExist = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
const promises_1 = __importDefault(require("fs/promises"));
const crypto_1 = require("crypto");
const devPath = "../test/";
const dev = {
    intros: path_1.default.join(__dirname, devPath, "intros"),
    clips: path_1.default.join(__dirname, devPath, "clips"),
    voices: path_1.default.join(__dirname, devPath, "voices"),
    results: path_1.default.join(__dirname, devPath, "results"),
};
// temps
const tmpPath = path_1.default.join(__dirname, devPath, "tmp");
const tmp = {
    clipWithVoicePath: path_1.default.join(tmpPath, "cwv"),
    normalizedPath: path_1.default.join(tmpPath, "normalized"),
    tsPath: path_1.default.join(tmpPath, "ts"),
    combined: path_1.default.join(tmpPath, "combs"),
    audios: path_1.default.join(tmpPath, "audios")
};
async function makeSureRequiredFoldersExist() {
    for (const folder in dev) {
        // @ts-ignore
        await promises_1.default.mkdir(dev[folder], {
            recursive: true
        });
    }
    for (const folder in tmp) {
        // @ts-ignore
        await promises_1.default.mkdir(tmp[folder], {
            recursive: true
        });
    }
}
exports.makeSureRequiredFoldersExist = makeSureRequiredFoldersExist;
async function clearTmp() {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`cleaning...`);
    await promises_1.default.rm(tmpPath, {
        recursive: true,
        force: true
    });
    console.log("done");
    process.stdout.write("\n"); // end the line
}
exports.clearTmp = clearTmp;
async function moveToResults(target, customName) {
    await promises_1.default.cp(target, path_1.default.join(dev.results, (0, utils_1.getName)(customName || target, `.${(0, utils_1.getFormat)(target)}`)));
}
exports.moveToResults = moveToResults;
function takeSoundOffOfVideo(clip) {
    const out = path_1.default.join(tmp.normalizedPath, (0, utils_1.getName)(clip, ".mp3"));
    return new Promise((s, r) => {
        (0, fluent_ffmpeg_1.default)()
            .input(clip)
            .noVideo()
            .outputFormat("mp3")
            .output(out)
            .on("end", () => s(out))
            .run();
    });
}
exports.takeSoundOffOfVideo = takeSoundOffOfVideo;
function normalizeVideo(input) {
    const out = path_1.default.join(tmp.normalizedPath, (0, utils_1.getName)(input, '.mp4'));
    return new Promise((s, r) => {
        (0, fluent_ffmpeg_1.default)()
            // .on("progress", onProgress)
            // .on("start", cmdline => {
            //     // console.log(`Command line: ${cmdline}`);
            // })
            .on("progress", (progress) => {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(`normalizing progress ${Math.floor(+progress.percent || 0)}%...`);
        })
            .on("error", r)
            .on("end", () => {
            s(out);
        })
            .input(input)
            .videoCodec("copy")
            .outputOptions(["-af loudnorm=I=-16:LRA=1:TP=-1.5"])
            .output(out)
            .run();
    });
}
exports.normalizeVideo = normalizeVideo;
async function combineMultipleAudioFiles(inputs) {
    const out = path_1.default.join(tmp.audios, (0, crypto_1.randomUUID)() + (0, utils_1.getName)(inputs[0], ".mp3"));
    return new Promise((s, r) => {
        let ff = (0, fluent_ffmpeg_1.default)()
            // .on("start", cmdline => {
            //     // console.log(`Command line: ${cmdline}`);
            // })
            .on("error", r)
            .on("end", () => {
            s(out);
        });
        inputs.forEach(e => ff = ff.input(e));
        ff.output(out)
            .complexFilter("[1:a]volume=4,apad[A];[0:a][A]amerge[out]")
            // .map("0:v")
            .map("out")
            .noVideo()
            .run();
    });
}
exports.combineMultipleAudioFiles = combineMultipleAudioFiles;
async function removeSoundFromVideo(target) {
    const out = path_1.default.join(tmp.audios, (0, crypto_1.randomUUID)() + (0, utils_1.getName)(target, "." + (0, utils_1.getFormat)(target)));
    return new Promise((s, r) => {
        (0, fluent_ffmpeg_1.default)()
            // .on("start", cmdline => {
            //     // console.log(`Command line: ${cmdline}`);
            // })
            .on("error", r)
            .on("end", () => {
            s(out);
        })
            .input(target)
            .videoCodec("copy")
            .noAudio()
            .output(out)
            .run();
    });
}
exports.removeSoundFromVideo = removeSoundFromVideo;
function convertToTS(clip, onProgress) {
    const out = path_1.default.join(tmp.tsPath, (0, utils_1.getName)(clip, ".ts").replaceAll("!", "_"));
    return new Promise((s, r) => {
        (0, fluent_ffmpeg_1.default)()
            .input(clip)
            .on("progress", onProgress)
            // .on("start", cmdline => {
            //     // console.log(`Command line: ${cmdline}`);
            // })
            .on("error", r)
            .on("end", () => {
            s(out);
        })
            .videoCodec("copy")
            .outputOption(["-bsf:v h264_mp4toannexb"])
            .format("mpegts")
            .output(out)
            .run();
    });
}
exports.convertToTS = convertToTS;
function convertMultipleToTS(clips) {
    return new Promise((s, r) => {
        console.log("----------- converting clips to TS...");
        const newClips = [];
        clips.forEach(async (clip, i) => {
            newClips.push(await convertToTS(clip, (progress) => {
                process.stdout.clearLine(0);
                process.stdout.cursorTo(0);
                process.stdout.write(`[${i + 1}/${clips.length}] progress ${Math.floor(+progress.percent || 0)}%...`);
            }));
            console.log("done");
            if (newClips.length === clips.length) {
                s(newClips);
            }
        });
    });
}
exports.convertMultipleToTS = convertMultipleToTS;
async function addAudioToClip(clip, voice, onProgress = () => { console.log("progress clip:" + clip); }) {
    const out = path_1.default.join(tmp.clipWithVoicePath, (0, utils_1.getName)(clip, ".mp4"));
    const videoWithNoAudio = await removeSoundFromVideo(clip);
    const videoAudio = await getAudioFromVideo(clip);
    const combinedAudioFile = await combineMultipleAudioFiles([videoAudio, voice]);
    // i want to take the audio of the video out, in the tmp/audios
    // normalize them 
    // console.log(out, clipWithVoicePath, getName(clip, ".mp4"))
    return new Promise((solve, reject) => {
        (0, fluent_ffmpeg_1.default)()
            // .on("start", cmdline => {
            //     console.log(`Command line: ${cmdline}`);
            // })
            .on("progress", onProgress)
            .on("error", reject)
            .on("end", () => {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(`merging audio(${(0, utils_1.getName)(voice)}) to clip (${(0, utils_1.getName)(clip)})...`);
            // process.stdout.write("\n"); // end the line
            solve(out);
        })
            .input(videoWithNoAudio)
            .input(combinedAudioFile)
            // .complexFilter("[0:v]scale=-2:720,format=yuv420p[v];[1:a]apad[a1];[0:a][a1]amerge=inputs=2[a]")
            // .map("v")
            // .map("a")
            .videoCodec("copy")
            // .audioCodec("aac")
            .output(out)
            .run();
    });
}
exports.addAudioToClip = addAudioToClip;
function addAudiosToClips(clips, voices) {
    return new Promise((s, r) => {
        console.log("----------- adding audios to clips...");
        const newClips = [];
        clips.forEach(async (clip, i) => {
            const tstart = Date.now();
            newClips.push(await addAudioToClip(clip, voices[i], (progress) => {
                process.stdout.clearLine(0);
                process.stdout.cursorTo(0);
                process.stdout.write(`[${i + 1}/${clips.length}] progress ${Math.floor(+progress.percent || 0)}%...`);
            }));
            console.log(`done(${Math.floor(Date.now() / 1000)}s)`);
            if (newClips.length === clips.length) {
                s(newClips);
            }
        });
    });
}
exports.addAudiosToClips = addAudiosToClips;
async function getAudioFromVideo(target) {
    const out = path_1.default.join(tmp.audios, (0, crypto_1.randomUUID)() + (0, utils_1.getName)(target, ".mp3"));
    return new Promise((s, r) => {
        (0, fluent_ffmpeg_1.default)()
            // .on("start", cmdline => {
            //     // console.log(`Command line: ${cmdline}`);
            // })
            .on("error", r)
            // .on("progress", (progress) => {
            //     process.stdout.clearLine(0);
            //     process.stdout.cursorTo(0);
            //     process.stdout.write(`combining progress ${Math.floor(+progress.percent || 0)}%...`);
            // })
            .on("end", () => {
            // console.log(`done(${Math.floor((Date.now() - tstart) / 1000)}s)`);
            s(out);
        })
            .input(target)
            .output(out)
            .run();
    });
}
exports.getAudioFromVideo = getAudioFromVideo;
async function combine(files, outputTarget) {
    const tstart = Date.now();
    console.log("----------- combining clips...");
    const out = outputTarget || path_1.default.join(tmp.combined, `${(0, utils_1.timeNow)()}_${(0, utils_1.getName)(files[0], ".mp4")}`);
    return new Promise((solve, reject) => {
        (0, fluent_ffmpeg_1.default)()
            // .on("start", cmdline => {
            //     // console.log(`Command line: ${cmdline}`);
            // })
            .on("error", reject)
            .on("progress", (progress) => {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(`combining progress ${Math.floor(+progress.percent || 0)}%...`);
        })
            .on("end", () => {
            console.log(`done(${Math.floor((Date.now() - tstart) / 1000)}s)`);
            solve(out);
        })
            .input(`concat:${files.join('|')}`)
            // .outputOption('-strict -2')     // I have an issue with experimental codecs, it is a solution
            .outputOption('-bsf:a aac_adtstoasc')
            .videoCodec('copy')
            .save(out);
    });
}
exports.combine = combine;
async function combineOneVideo(intro, clips, voices) {
    try {
        await clearTmp();
        await makeSureRequiredFoldersExist();
        const tstart = Date.now();
        // add voices to clips
        const clipsWithAudio = await addAudiosToClips(clips, voices);
        const clipsTS = await convertMultipleToTS(clipsWithAudio);
        const introTS = await convertToTS(path_1.default.join(dev.intros, intro), () => { });
        // console.log(clipsTS);
        // combine everything
        const outputFile = await combine([introTS, ...clipsTS]);
        const outie = await normalizeVideo(outputFile);
        await moveToResults(outie);
        // clear temps
        console.log("cleaning temps...");
        await clearTmp();
        console.log(`done(${Math.floor((Date.now() - tstart) / 1000)}s):`, outputFile);
    }
    catch (err) {
        console.error(err);
    }
}
exports.combineOneVideo = combineOneVideo;
