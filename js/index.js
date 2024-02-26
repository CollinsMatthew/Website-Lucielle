const palettes = {
    "Catppuccin": {
        "Latte": {
            "base": "#EFF1F5",
            "mantle": "#E6E9EF",
            "crust": "#DCE0E8",

            "text": "#4C4F69",

            "pink": "#EA76CB",
            "purple": "#8839EF",
            "red": "#D20F39",
            "light_red": "#E64553",
            "orange": "#FE640B",
            "yellow": "#DF8E1D",
            "green": "#40A02B",
            "light_green": "#179299",
            "blue": "#1E66F5",
            "light_blue": "#7287FD"
        },
        "Frappe": {
            "base": "#303446",
            "mantle": "#292C3C",
            "crust": "#232634",

            "text": "#C6D0F5",

            "pink": "#F4B8E4",
            "purple": "#CA9EE6",
            "red": "#E78284",
            "light_red": "#EA999C",
            "orange": "#EF9F76",
            "yellow": "#E5C890",
            "green": "#A6D189",
            "light_green": "#81C8BE",
            "blue": "#8CAAEE",
            "light_blue": "#85C1DC"
        },
        "Macchiato": {
            "base": "#24273A",
            "mantle": "#1E2030",
            "crust": "#181926",

            "text": "#CAD3F5",

            "pink": "#F5bDE6",
            "purple": "#C6A0F6",
            "red": "#ED8796",
            "light_red": "#EE99A0",
            "orange": "#F5A97F",
            "yellow": "#EED49F",
            "green": "#A6DA95",
            "light_green": "#8BD5CA",
            "blue": "#8AADF4",
            "light_blue": "#7DC4E4"
        },
        "Mocha": {
            "base": "#1E1E2E",
            "mantle": "#181825",
            "crust": "#11111b",

            "text": "#CDD6F4",

            "pink": "#F5C2E7",
            "purple": "#CBA6F7",
            "red": "#F38BA8",
            "light_red": "#EBA0AC",
            "orange": "#FAB387",
            "yellow": "#F9E2AF",
            "green": "#A6E3A1",
            "light_green": "#94E2D5",
            "blue": "#89B4FA",
            "light_blue": "#74C7EC"
        },
    },
    "Arc": {
        "Dark": {
            "base": "#282C34",
            "mantle": "#333842",
            "crust": "#2C313A",
            
            "text": "#ABB2BF",
            
            "pink": "#FF6AC1",
            "purple": "#D38AEA",
            "red": "#E06C75",
            "light_red": "#BE5046",
            "orange": "#DA8548",
            "yellow": "#E5D07b",
            "green": "#98C379",
            "light_green": "#87BF70",
            "blue": "#61AFEF",
            "light_blue": "#4DB5BD"
        },
        
        "Light": {
            "base": "#FAFAFA",
            "mantle": "#EFF0EB",
            "crust": "#F2F3F7",
            "text": "#545862",
            "pink": "#FF75A0",
            "purple": "#BF9EEE",
            "red": "#F47067",
            "light_red": "#F47067",
            "orange": "#FF9F50",
            "yellow": "#F7BB47",
            "green": "#6BC46D",
            "light_green": "#42B983",
            "blue": "#58A6FF",
            "light_blue": "#73D0FF"
        }
    }
}

let currentPalette = palettes["Catppuccin"]["Mocha"]

const userId = "330710628907876354"
const cardUser = {
    name: "Lucielle R. H.",
    username: "_vergessene",
    avatar: "./assets/imgs/icons/logo.svg",
    accent: "#000000",
    status: "offline",
    banner: {
        "url": null,
        "color": null
    }
}

function hexToRgb(hex) {
    const
        red = parseInt(hex.slice(1, 3), 16),
        green = parseInt(hex.slice(3, 5), 16),
        blue = parseInt(hex.slice(5, 7), 16);
    return {
        red: red,
        green: green,
        blue: blue,
        rgb: `${red}, ${green}, ${blue}`,
        hex: hex
    }
}

function updateCss() {
    for (let key in currentPalette) {
        console.log(key, hexToRgb(currentPalette[key]).rgb);
        document.documentElement.style.setProperty(`--${key}`, hexToRgb(currentPalette[key]).rgb);
    }
}

async function init() {
    await updateCss()
    insertFileContentIn('content', 'home').then();
    document.documentElement.style.setProperty('--background-color', '#FFFFFF');
    await fetch(`https://discordlookup.mesavirep.xyz/v1/user/${userId}`)
        .then(response => response.json())
        .then(json => {
            cardUser.name = json.global_name;
            cardUser.username = json.username;
            cardUser.avatar = json.avatar.link;
            cardUser.accent = json.accent_color;
            cardUser.banner = {
                "url": json.banner.link,
                "color": json.banner.color
            }
        })
        .catch(error => console.error(error))
        .then(_ => updateProfileCard())
    fetch(`https://api.lanyard.rest/v1/users/${userId}`)
        .then(response => response.json())
        .then(json => {
            const data = json.data;
            cardUser.name = data.discord_user.display_name;
            cardUser.username = data.username;
            cardUser.avatar = `https://cdn.discordapp.com/avatars/${userId}/${data.discord_user.avatar}?size=4096`;
            cardUser.status = data.discord_status;
        })
        .catch(error => console.error(error))
        .then(_ => updateProfileCard())
}

async function insertContentIn(destination, content) {
    document.getElementById(destination).innerHTML = content;
}

async function insertFileContentIn(destination, htmlFile) {
    fetch(`./router/${htmlFile}.html`)
        .then(response => response.text())
        .then(text => insertContentIn(destination, text))
        .catch(error => console.error(error));
}

function updateProfileCard() {
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
    background.setAttribute("fill", cardUser.color);
    svg.appendChild(background);

    const bannerExists = cardUser.banner.url != null;
    if (bannerExists) {
        const banner = document.createElementNS(svgNS, "image");
        banner.setAttribute("x", cardHeight - 1.0);
        banner.setAttribute("y", 1.0);
        banner.setAttribute("x1", "100%");
        banner.setAttribute("y1", cardHeight - 1.0);
        banner.setAttribute("width", cardWidth - cardHeight);
        banner.setAttribute("href", cardUser.banner.url);
        svg.appendChild(banner);
    }

    // Profile Image
    const image = document.createElementNS(svgNS, "image");
    image.setAttribute("href", cardUser.avatar);
    image.setAttribute("x", 1.0);
    image.setAttribute("y", 1.0);
    image.setAttribute("width", cardHeight - 2.0);
    image.setAttribute("height", cardHeight - 2.0);
    svg.appendChild(image);

    // Name text
    const nameText = document.createElementNS(svgNS, "text");
    nameText.textContent = cardUser.name;
    nameText.setAttribute("x", cardHeight + 10.0);
    nameText.setAttribute("y", 20.0);
    nameText.setAttribute("font-size", "20");
    nameText.setAttribute("fill", "#FFFFFF");
    svg.appendChild(nameText);

    // Title text
    const titleText = document.createElementNS(svgNS, "text");
    titleText.textContent = cardUser.status;
    titleText.setAttribute("x", cardHeight + 10.0);
    titleText.setAttribute("y", 38.0);
    titleText.setAttribute("font-size", "14");
    let statusColor;
    switch (titleText.textContent) {
        case "online":
            statusColor = currentPalette.green;
            break;
        case "idle":
            statusColor = currentPalette.yellow;
            break;
        case "dnd":
            statusColor = currentPalette.red;
            break;
        default:
            statusColor = currentPalette.text;
            break;
    }
    console.info(statusColor);
    titleText.setAttribute("fill", statusColor);
    svg.appendChild(titleText);

    const element = document.getElementById("profile-card")
    if (element.children.hasOwnProperty("profile-card")) element.replaceChildren(svg)
    else element.appendChild(svg);
}

init()
