// import { insertFileContentIn } from "./util.js";
import * as themes from "./themes.js";
import * as shaders from "./shaders.js";
import * as cards from "./cards.js";

async function init() {
    document.documentElement.style.setProperty("--background-color", "#000000");

    await themes.init();
    shaders.init();
    cards.init();

    // insertFileContentIn("content", "home");
}

init();
