

// <t\:[0-9]+(?:\:[?TtDdFfR])*>
// TODO: ... | add export function for discord-date-type conversion >:(

/*
let epochTimestamp = 1617186000; // Example Epoch timestamp

// Convert to UTC
let utcDate = new Date(epochTimestamp * 1000); // Multiply by 1000 to convert from seconds to milliseconds

// Format the UTC date as a string
let utcString = utcDate.toUTCString();

console.log(utcString);
*/

const constants = {
    regexes: {
        dcTime: /<t\:[0-9]+(?:\:[?TtDdFfR])*>/g,
        dcTimeType: /(?:\:[?TtDdFfR])+>/
    }
};

export function dcTimesFromString(string) {
    return constants.regexes.dcTime.exec(string);
};

export function dcTimeToDate(timeString) {
    let epoch = timeString.split(":");
    epoch = epoch.substring(0, epoch.length - 1);
    return new Date(epoch * 1000);
};

// https://gist.github.com/LeviSnoot/d9147767abeef2f770e9ddcd91eb85aa
export function dcTimeToHuman(timeString) {
    const date = dcTimeToDate(timeString);
    const is24Hour = !(date.toLocaleTimeString.match(/am|pm/i) || date.toString().match(/am|pm/i));
    /*
    Default 	<t:1543392060> 	November 28, 2018 9:01 AM 	28 November 2018 09:01
    Short Time 	<t:1543392060:t> 	9:01 AM 	09:01
    Long Time 	<t:1543392060:T> 	9:01:00 AM 	09:01:00
    Short Date 	<t:1543392060:d> 	11/28/2018 	28/11/2018
    Long Date 	<t:1543392060:D> 	November 28, 2018 	28 November 2018
    Short Date/Time 	<t:1543392060:f> 	November 28, 2018 9:01 AM 	28 November 2018 09:01
    Long Date/Time 	<t:1543392060:F> 	Wednesday, November 28, 2018 9:01 AM 	Wednesday, 28 November 2018 09:01
    Relative Time 	<t:1543392060:R> 	3 years ago 	3 years ago
    */

    let epoch = timeString.split(":");
    epoch = epoch.substring(0, epoch.length - 1);

    switch(constants.regexes.dcTimeType.test(timeString) ? "default" : constants.regexes.dcTimeType.exec(timeString)[0].charAt(1)) {
        case "default": {
            return is24Hour ?
            `` :
            `${date.getMonth()} ${date.getDay()}, ${date.getFullYear()} ${date.getHours() % 12}:${date.getMinutes} ${date.getHours() >= 12 ? "pm" : "am"}`;
        }
    }
    return date;
};

function dateToAMPM(date) {
    const minutes = date.getMinutes();
    let hours = date.getHours() % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes < 10 ? `0${minutes}` : minutes} ${hours >= 12 ? "pm" : "am"}`;
};

export function insertByRegex(input, regex, translate) {
    let translatedInput = input;

    let match = regex.exec(input);
    do {
        let translatedString = translate(match[0]);
        translatedInput = `${translatedInput.slice(0, match.index)}${translatedString}${translatedInput.slice(match.index + match[0].length)}`;
        regex.lastIndex = match.index + translatedString.length;
    } while((match = regex.exec(input)) !== null);
    regex.lastIndex = 0;

    return translatedInput;
};

export async function insertContentIn(destination, content) {
    document.getElementById(destination).innerHTML = content;
};

export async function insertFileContentIn(destination, htmlFile) {
    fetch(`./router/${htmlFile}.html`)
        .then(response => response.text())
        .then(text => insertContentIn(destination, text))
        .catch(error => console.error(error));
};

export function hexToRgb(hex) {
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
    };
};

export function hexToRgba(hex) {
    const
        red = parseInt(hex.slice(1, 3), 16),
        green = parseInt(hex.slice(3, 5), 16),
        blue = parseInt(hex.slice(5, 7), 16),
        alpha = parseInt(hex.slice(7, 9), 16);
    return {
        red: red,
        green: green,
        blue: blue,
        alpha: alpha,
        rgb: `${red}, ${green}, ${blue}`,
        rgba: `${red}, ${green}, ${blue}, ${alpha}`,
        hex: hex
    };
};
