import { combineOneVideo } from "./engine";
import { getFilesUsingPatternPath, getName } from "./utils";


(async () => {
    const clips = await getFilesUsingPatternPath("./test/clips/*", __dirname)
    const voices = await getFilesUsingPatternPath("./test/voices/*", __dirname)
    await combineOneVideo("i1.mp4", clips, voices);
})()