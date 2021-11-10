var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
figma.showUI(__html__);
figma.ui.resize(0, 0);
// figma.ui.hide()
// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).
// const defaultFontSize = 16
// const defaultFontName = { family: 'Roboto', style: 'Regular' }
const defaultDelimiter = 'none';
const delimiter = { lineBreak: '\n', space: ' ', none: '' };
const storageKey = 'settingsData';
const defaultSettingsData = { delimiter: defaultDelimiter };
var settingsData = JSON.parse(JSON.stringify(defaultSettingsData));
var textObjectLength = 0;
// ===================================================
Array.prototype["swapItems"] = function (a, b) {
    this[a] = this.splice(b, 1, this[a])[0];
    return this;
};
function isParabicLTR(character) {
    return character.match(/[\u06f0-\u06f9]|[\u0660-\u0669]/g);
}
function isParabic(character) {
    return character.match(/(?!\u0020)[\u0600-\u08bd\s]|[\ufe70-\ufefc]/g);
}
function isSpecial(character) {
    return character.match(/[\u064b-\u065f]|[\u06D4-\u06DC]|[\u06DF-\u06E8]|[\u06EA-\u06ED]/g);
}
function textLayers(selection) {
    return selection.filter((node) => node.type === "TEXT");
}
function swapSpecialChars(line) {
    let result = line;
    result.forEach((char, index) => {
        if (isSpecial(char)) {
            result.swapItems(index, index - 1);
        }
    });
    return result;
}
function prepareForWrap(string, tempNode) {
    tempNode["textAutoResize"] = "HEIGHT";
    tempNode["characters"] = tempNode["characters"].split(" ")[0];
    let tempNodeInitialHeight = tempNode["height"];
    tempNode["characters"] = "";
    return string
        .split("\n")
        .map(line => line
        .replace(/\u0020+$/g, "")
        .replace(/\r?\n|\r/g, " ")
        .split(" ")
        .reduce((res, word) => {
        const nWord = word.replace(/\u00A0+$/, " ");
        const currentLine = res.lastIndexOf("\n") > -1 ? res.slice(res.lastIndexOf("\n") + 1) : res;
        tempNode["characters"] = [...currentLine, ...(currentLine.length ? [" "] : []), nWord].join("");
        if (tempNode.height > tempNodeInitialHeight) {
            tempNode["characters"] = nWord;
            return [...res.filter((w, i) => !(w === "\n" && i + 1 === res.length)), "\n", nWord];
        }
        return [...res, ...(res.length ? [" "] : []), nWord];
    }, [])
        .join("")
        .replace(/\u0020\n/g, "\n"))
        .join("\n");
}
function revertText(string) {
    let lines = string.split("\n").map(line => swapSpecialChars(line.split(""))
        .join("")
        .split(" ")
        .reduce((res, word) => {
        const lastItem = res[res.length - 1];
        const revertedCurrent = word
            .split("")
            .reverse()
            .join("");
        if (isParabic(word.trim()) && !isParabicLTR(word.trim())) {
            return [...res, revertedCurrent];
        }
        else {
            if (!lastItem) {
                return [...res, word];
            }
            else if (!isParabic(lastItem) || isParabicLTR(lastItem)) {
                return [...res.slice(0, res.length - 1), lastItem + " " + word];
            }
            return [...res, word];
        }
    }, [])
        .reverse()
        .join(" "));
    return lines.join("\n");
}
function setLayerText(node, text) {
    return __awaiter(this, void 0, void 0, function* () {
        yield loadFonts(node);
        if (node["characters"] && isParabic(node["characters"][0]) && node["textAlignHorizontal"] === "LEFT")
            node["textAlignHorizontal"] = "RIGHT";
        node["characters"] = text;
        return text;
    });
}
function loadFonts(node) {
    return __awaiter(this, void 0, void 0, function* () {
        if (node["fontName"] === figma["mixed"]) {
            let len = node["characters"]["length"];
            for (let i = 0; i < len; i++) {
                yield figma.loadFontAsync(node["getRangeFontName"](i, i + 1));
            }
        }
        else {
            yield figma.loadFontAsync(node["fontName"]);
        }
    });
}
function revert(close = true) {
    for (const node of figma.currentPage.selection) {
        if (node.type === "TEXT") {
            let payload = node["characters"];
            node.setPluginData("originalText", payload);
            if (node["textAutoResize"] === "WIDTH_AND_HEIGHT") {
                setLayerText(node, revertText(payload));
            }
            else {
                let tempNode = node.clone();
                tempNode["opacity"] = 0;
                setLayerText(tempNode, payload.split("")[0]).then(() => {
                    let lines = prepareForWrap(payload, tempNode);
                    node["characters"] = revertText(lines);
                    tempNode.remove();
                });
            }
            try {
                node.setRelaunchData(Object.assign({ ui: "", reset: "" }, (node["textAutoResize"] !== "WIDTH_AND_HEIGHT" ? { wrap: "" } : {})));
            }
            catch (e) { }
        }
    }
    if (close) {
        if (textLayers(figma.currentPage.selection)) {
            figma.closePlugin("Layer" + (figma.currentPage.selection.filter((n) => n.type === "TEXT").length > 1 ? "s " : " ") + "Updated");
        }
        figma.closePlugin("");
    }
}
// ===================================================
function extractTexts(nodeObjectsArray) {
    let texts = '';
    for (let i = 0; i < nodeObjectsArray.length; i++) {
        if (nodeObjectsArray[i].type == 'TEXT') {
            if (textObjectLength > 0) {
                let delimiterKey = settingsData.delimiter ? settingsData.delimiter : defaultSettingsData.delimiter;
                texts += delimiter[delimiterKey];
            }
            texts += nodeObjectsArray[i].characters;
            textObjectLength++;
        }
        else if (nodeObjectsArray[i].type == 'GROUP' || nodeObjectsArray[i].type == 'FRAME' || nodeObjectsArray[i].type == 'COMPONENT' || nodeObjectsArray[i].type == 'INSTANCE') {
            texts += extractTexts(nodeObjectsArray[i].children);
        }
    }
    return texts;
}
function truncate(str, len) {
    return str.length <= len ? str : (str.substr(0, len) + "…");
}
function init() {
    let selectedItems = figma.currentPage.selection;
    // var names: any = []
    // selectedItems.map((layer) => { names.push(layer.name) })
    // console.log(names[0])
    if (selectedItems.length == 0) {
        return figma.closePlugin('No object selected.');
    }
    let copiedText = extractTexts(selectedItems);
    if (copiedText) {
        console.log(copiedText);
        copiedText = revertText(copiedText);
        console.log(copiedText);
        figma.ui.postMessage({ copiedText: copiedText });
    }
    else {
        return figma.closePlugin('No text object selected.');
    }
    figma.ui.onmessage = message => {
        if (message.quit) {
            figma.closePlugin('Copied: ' + truncate(message.text, 100));
        }
    };
}
init();
