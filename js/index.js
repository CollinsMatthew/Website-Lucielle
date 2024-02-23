const palettes = new Map([
    ["Catppuccin", [
        ["Latte", []],
        ["Frappe", []],
        ["Macchiato", []],
        ["Mocha", []]
    ]],
])

const cardUser = {
    name: "Lucielle R. H.",
    username: "_vergessene",
    avatar: "./assets/imgs/icons/logo.svg",
    accent: "#000000",
    status: "offline!",
    banner: {
        "url": null,
        "color": null
    }
}

async function init() {
    insertFileContentIn('content', 'home').then()
    fetch("https://discordlookup.mesavirep.xyz/v1/user/330710628907876354")
        .then(response => response.json())
        .then(data => {
            console.log(data)
            cardUser.name = data.global_name;
            cardUser.username = data.username;
            cardUser.avatar = data.avatar.link;
            cardUser.accent = data.accent_color;
            cardUser.status = "online"
            cardUser.banner = {
                "url": data.banner.link,
                "color": data.banner.color
            }
        })
        .catch(error => console.error(error))
        .then(_ => document.getElementById("profile-card").appendChild(createProfileCard(cardUser)));
    
}

async function insertContentIn(destination, content) {
    document.getElementById(destination).innerHTML = content
}

async function insertFileContentIn(destination, htmlFile) {
    fetch(`./router/${htmlFile}.html`)
        .then(response => response.text())
        .then(text => insertContentIn(destination, text))
        .catch(error => console.error(error))
}

function createProfileCard(cardUser) {
    const svgNS = "http://www.w3.org/2000/svg";
    const cardWidth = 320;
    const cardHeight = 80;
    
    // Create SVG element
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", cardWidth);
    svg.setAttribute("height", cardHeight);
    svg.setAttribute("version", "1.1");
    svg.setAttribute("xmlns", svgNS);

    // defs
    const defs = document.createElementNS(svgNS, "defs");
    // defs.appendChild(bgGradient);
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
        banner.setAttribute("x", cardHeight - 1);
        banner.setAttribute("y", 1);
        banner.setAttribute("x1", "100%");
        banner.setAttribute("y1", cardHeight - 1);
        banner.setAttribute("width", cardWidth - cardHeight);
        banner.setAttribute("href", cardUser.banner.url);
        svg.appendChild(banner);
    }

    // Profile Image
    const image = document.createElementNS(svgNS, "image");
    image.setAttribute("href", cardUser.avatar);
    image.setAttribute("x", 1);
    image.setAttribute("y", 1);
    image.setAttribute("width", cardHeight - 2);
    image.setAttribute("height", cardHeight - 2);
    svg.appendChild(image);

    // Name text
    const nameText = document.createElementNS(svgNS, "text");
    nameText.textContent = cardUser.name;
    nameText.setAttribute("x", cardHeight + 10);
    nameText.setAttribute("y", 20);
    nameText.setAttribute("font-size", "20");
    nameText.setAttribute("fill", "#FFFFFF");
    svg.appendChild(nameText);

    // Title text
    const titleText = document.createElementNS(svgNS, "text");
    titleText.textContent = cardUser.status;
    titleText.setAttribute("x", cardHeight + 10);
    titleText.setAttribute("y", 38);
    titleText.setAttribute("font-size", "14");
    titleText.setAttribute("fill", titleText.textContent === "online" ? "#A6E3A1" : "#F38BA8");
    svg.appendChild(titleText);

    return svg;
}

init()
