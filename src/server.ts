import { combineOneVideo } from "./engine";
import { getFilesUsingPatternPath, getName } from "./utils";

/** the quantity of clips and voices to use */
const quantity = 5;




const clappy = (arr: any[]) => arr.sort(_ => Math.random() - .5).slice(0, quantity);

(async () => {
    const clips = await getFilesUsingPatternPath("./test/clips/*", __dirname)
    const voices = await getFilesUsingPatternPath("./test/voices/*", __dirname)
    await combineOneVideo("i1.mp4", clappy(clips), clappy(voices));
})()