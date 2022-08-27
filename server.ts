import { combineOneVideo } from "./src/engine";
import { getFilesUsingPatternPath, getName } from "./src/utils";


(async () => {
    const clips = await getFilesUsingPatternPath("./test/clips/*", __dirname)
    const voices = await getFilesUsingPatternPath("./test/voices/*", __dirname)
    combineOneVideo("i1.mp4", clips, voices)
})()