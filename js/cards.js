import {current as theme} from "./themes.js"
import { insertContentIn } from "./util.js";

const constants = {
    user: {
        id: "330710628907876354",
        name: "Lucielle R. H.",
        username: "_vergessene",
        avatar: "./assets/imgs/icons/logo.svg",
        accent: "#000000",
        status: "offline",
        bio: "",
        banner: {
            "url": null,
            "color": null
        }
    }
};

export async function init() {
    fetch(`https://dcdn.dstn.to/profile/${constants.user.id}`)
        .then(response => response.json())
        .then(json => {
            constants.user.name = json.user.global_name;
            constants.user.username = json.user.username;
            constants.user.avatar = `https://cdn.discordapp.com/avatars/${constants.user.id}/${json.user.avatar}?size=4096`;
            constants.user.accent = json.user.accent_color;
            constants.user.banner = {
                "url": `https://cdn.discordapp.com/banners/${constants.user.id}/${json.user.banner}?size=4096`,
                "color": json.user.banner_color
            };
            constants.user.bio = `<p>${json.user.bio.replaceAll("\n", "<br>").replaceAll("\\", "")}</p>`;
        })
        .catch(error => console.error(error))
        .then(_ => update());
    fetch(`https://api.lanyard.rest/v1/users/${constants.user.id}`)
        .then(response => response.json())
        .then(json => {
            const data = json.data;
            constants.user.name = data.discord_user.display_name;
            constants.user.username = data.username;
            constants.user.avatar = `https://cdn.discordapp.com/avatars/${constants.user.id}/${data.discord_user.avatar}?size=4096`;
            constants.user.status = data.discord_status;
        })
        .catch(error => console.error(error))
        .then(_ => update());
}

export function update() {
    dcprofile();
    //activities()
}

export function dcprofile() {
    const svgNS = "http://www.w3.org/2000/svg";
    const cardWidth = 320;
    const cardHeight = 80;

    // Create SVG element
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("version", "1.1");
    svg.setAttribute("id", "profile-card");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("xmlns:xlink", svgNS);
    svg.setAttribute("width", cardWidth);
    svg.setAttribute("height", cardHeight);
    svg.setAttribute("viewBox", `0 0 ${cardWidth} ${cardHeight}`);
    svg.setAttribute("xml:space", "preserve");

    // defs
    // const defs = document.createElementNS(svgNS, "defs");
    // svg.appendChild(defs);

    // Background rectangle
    const background = document.createElementNS(svgNS, "rect");
    background.setAttribute("width", "100%");
    background.setAttribute("height", "100%");
    background.setAttribute("fill", constants.user.color);
    svg.appendChild(background);

    const bannerExists = constants.user.banner.url != null;
    if (bannerExists) {
        const banner = document.createElementNS(svgNS, "image");
        banner.setAttribute("x", cardHeight - 1.0);
        banner.setAttribute("y", 1.0);
        banner.setAttribute("x1", "100%");
        banner.setAttribute("y1", cardHeight - 1.0);
        banner.setAttribute("width", cardWidth - cardHeight);
        banner.setAttribute("href", constants.user.banner.url);
        svg.appendChild(banner);
    }

    // Profile Image
    const image = document.createElementNS(svgNS, "image");
    image.setAttribute("href", constants.user.avatar);
    image.setAttribute("x", 1.0);
    image.setAttribute("y", 1.0);
    image.setAttribute("width", cardHeight - 2.0);
    image.setAttribute("height", cardHeight - 2.0);
    svg.appendChild(image);

    // Name text
    const nameText = document.createElementNS(svgNS, "text");
    nameText.textContent = constants.user.name;
    nameText.setAttribute("x", cardHeight + 10.0);
    nameText.setAttribute("y", 20.0);
    nameText.setAttribute("font-size", "20");
    nameText.setAttribute("fill", "#FFFFFF");
    svg.appendChild(nameText);

    // Title text
    const titleText = document.createElementNS(svgNS, "text");
    titleText.textContent = constants.user.status;
    titleText.setAttribute("x", cardHeight + 10.0);
    titleText.setAttribute("y", 38.0);
    titleText.setAttribute("font-size", "14");
    let statusColor;
    switch (titleText.textContent) {
        case "online":
            statusColor = theme.green;
            break;
        case "idle":
            statusColor = theme.yellow;
            break;
        case "dnd":
            statusColor = theme.red;
            break;
        default:
            statusColor = theme.text;
            break;
    };
    titleText.setAttribute("fill", statusColor);
    svg.appendChild(titleText);

    // console.info(constants.user.bio);
    insertContentIn("profile-bio", constants.user.bio);

    const element = document.getElementById("profile-card");
    if (element.children.hasOwnProperty("profile-card")) element.replaceChildren(svg);
    else element.appendChild(svg);
}

// TODO: ...
export function activities() {
    const svgNS = "http://www.w3.org/2000/svg";
    const cardWidth = 320;
    const cardHeight = 80;

    // Create SVG element
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("version", "1.1");
    svg.setAttribute("id", "profile-card");
    svg.setAttribute("xmlns", svgNS);
    svg.setAttribute("xmlns:xlink", svgNS);
    svg.setAttribute("width", cardWidth);
    svg.setAttribute("height", cardHeight);
    svg.setAttribute("viewBox", `0 0 ${cardWidth} ${cardHeight}`);
    svg.setAttribute("xml:space", "preserve");

    const element = document.getElementById("activities-cards");
    if (element.children.hasOwnProperty("activities-cards")) element.replaceChildren(svg);
    else element.appendChild(svg);
}
