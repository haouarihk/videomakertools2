
import Ffmpeg from "fluent-ffmpeg";
import path from "path";
import { getFormat, getName, timeNow } from "./utils";
import fs from "fs/promises";
import { randomUUID } from "crypto";
const devPath = "../test/";
const dev = {
    intros: path.join(__dirname, devPath, "intros"),
    clips: path.join(__dirname, devPath, "clips"),
    voices: path.join(__dirname, devPath, "voices"),
    results: path.join(__dirname, devPath, "results"),
}

// temps
const tmpPath = path.join(__dirname, devPath, "tmp");

const tmp = {
    clipWithVoicePath: path.join(tmpPath, "cwv"),
    normalizedPath: path.join(tmpPath, "normalized"),
    tsPath: path.join(tmpPath, "ts"),
    combined: path.join(tmpPath, "combs"),
    audios: path.join(tmpPath, "audios")
}

export async function makeSureRequiredFoldersExist() {
    for (const folder in dev) {
        // @ts-ignore
        await fs.mkdir(dev[folder], {
            recursive: true
        })
    }
    for (const folder in tmp) {
        // @ts-ignore
        await fs.mkdir(tmp[folder], {
            recursive: true
        })
    }
}

export async function clearTmp() {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`cleaning...`);
    await fs.rm(tmpPath, {
        recursive: true,
        force: true
    })
    console.log("done")
    process.stdout.write("\n"); // end the line
}


export async function moveToResults(target: string, customName?: string) {
    await fs.cp(target, path.join(dev.results, getName(customName || target, `.${getFormat(target)}`)))
}


export function takeSoundOffOfVideo(clip: string) {
    const out = path.join(tmp.normalizedPath, getName(clip, ".mp3"))
    return new Promise((s, r) => {
        Ffmpeg()
            .input(clip)
            .noVideo()
            .outputFormat("mp3")
            .output(out)
            .on("end", () => s(out))
            .run()
    })
}

export function normalizeVideo(input: string): Promise<string> {
    const out = path.join(tmp.normalizedPath, getName(input, '.mp4'))
    return new Promise((s, r) => {
        Ffmpeg()
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
    })
}

export async function combineMultipleAudioFiles(inputs: string[]): Promise<string> {
    const out = path.join(tmp.audios, randomUUID() + getName(inputs[0], ".mp3"))

    return new Promise((s, r) => {
        let ff = Ffmpeg()
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
    })
}

export async function removeSoundFromVideo(target: string): Promise<string> {
    const out = path.join(tmp.audios, randomUUID() + getName(target, "." + getFormat(target)))

    return new Promise((s, r) => {
        Ffmpeg()
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
    })
}



export function convertToTS(clip: string, onProgress: (k: { percent: string }) => void): Promise<string> {
    const out = path.join(tmp.tsPath, getName(clip, ".ts").replaceAll("!", "_"))
    return new Promise((s, r) => {
        Ffmpeg()
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
    })
}

export function convertMultipleToTS(clips: string[]): Promise<string[]> {
    return new Promise((s, r) => {
        console.log("----------- converting clips to TS...")
        const newClips: string[] = [];
        clips.forEach(async (clip, i) => {
            newClips.push(await convertToTS(clip, (progress) => {
                process.stdout.clearLine(0);
                process.stdout.cursorTo(0);
                process.stdout.write(`[${i + 1}/${clips.length}] progress ${Math.floor(+progress.percent || 0)}%...`);
            }))
            console.log("done")

            if (newClips.length === clips.length) {
                s(newClips)
            }
        })
    })
}

export async function addAudioToClip(clip: string, voice: string, onProgress: (progress: { percent: string }) => void = () => { console.log("progress clip:" + clip) }): Promise<string> {
    const out = path.join(tmp.clipWithVoicePath, getName(clip, ".mp4"));

    const videoWithNoAudio = await removeSoundFromVideo(clip);

    const videoAudio = await getAudioFromVideo(clip);
    const combinedAudioFile = await combineMultipleAudioFiles([videoAudio, voice])

    // i want to take the audio of the video out, in the tmp/audios
    // normalize them 

    // console.log(out, clipWithVoicePath, getName(clip, ".mp4"))
    return new Promise((solve, reject) => {
        Ffmpeg()
            // .on("start", cmdline => {
            //     console.log(`Command line: ${cmdline}`);
            // })
            .on("progress", onProgress)
            .on("error", reject)
            .on("end", () => {
                process.stdout.clearLine(0);
                process.stdout.cursorTo(0);
                process.stdout.write(`merging audio(${getName(voice)}) to clip (${getName(clip)})...`);
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
            .run()
    })
}


export function addAudiosToClips(clips: string[], voices: string[]): Promise<string[]> {
    return new Promise((s, r) => {
        console.log("----------- adding audios to clips...")
        const newClips: string[] = [];
        clips.forEach(async (clip, i) => {
            const tstart = Date.now();
            newClips.push(await addAudioToClip(clip, voices[i], (progress) => {
                process.stdout.clearLine(0);
                process.stdout.cursorTo(0);
                process.stdout.write(`[${i + 1}/${clips.length}] progress ${Math.floor(+progress.percent || 0)}%...`);
            }))
            console.log(`done(${Math.floor(Date.now() / 1000)}s)`)

            if (newClips.length === clips.length) {
                s(newClips)
            }
        })
    })
}


export async function getAudioFromVideo(target: string): Promise<string> {
    const out = path.join(tmp.audios, randomUUID() + getName(target, ".mp3"));
    return new Promise((s, r) => {
        Ffmpeg()
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
                s(out)
            })

            .input(target)
            .output(out)
            .run()
    })
}


export async function combine(files: string[], outputTarget?: string): Promise<string> {
    const tstart = Date.now();
    console.log("----------- combining clips...");
    const out = outputTarget || path.join(tmp.combined, `${timeNow()}_${getName(files[0], ".mp4")}`);

    return new Promise((solve, reject) => {
        Ffmpeg()
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
                solve(out)
            })
            .input(`concat:${files.join('|')}`)
            // .outputOption('-strict -2')     // I have an issue with experimental codecs, it is a solution
            .outputOption('-bsf:a aac_adtstoasc')
            .videoCodec('copy')
            .save(out);
    })
}



export async function combineOneVideo(intro: string, clips: string[], voices: string[]) {
    try {

        await clearTmp();
        await makeSureRequiredFoldersExist();

        const tstart = Date.now();

        // add voices to clips
        const clipsWithAudio = await addAudiosToClips(clips, voices);


        const clipsTS = await convertMultipleToTS(clipsWithAudio);
        const introTS = await convertToTS(path.join(dev.intros, intro), () => { })


        // console.log(clipsTS);

        // combine everything
        const outputFile = await combine([introTS, ...clipsTS])


        const outie = await normalizeVideo(outputFile);

        await moveToResults(outie)

        // clear temps
        console.log("cleaning temps...")
        await clearTmp();

        console.log(`done(${Math.floor((Date.now() - tstart) / 1000)}s):`, outputFile);
    } catch (err) {
        console.error(err)
    }
}
