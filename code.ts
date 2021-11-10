// figma.showUI(__html__)

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).
// const defaultFontSize = 16
// const defaultFontName = { family: 'Roboto', style: 'Regular' }
const defaultDelimiter = 'none'
const delimiter = { lineBreak: '\n', space: ' ', none: ''}
const storageKey = 'settingsData'
const defaultSettingsData = { delimiter: defaultDelimiter }
var settingsData = JSON.parse(JSON.stringify(defaultSettingsData));
var textObjectLength = 0


function extractTexts(nodeObjectsArray){
  let texts = ''
  for (let i = 0; i < nodeObjectsArray.length; i++) {
    if(nodeObjectsArray[i].type == 'TEXT'){
      if (textObjectLength > 0){
        let delimiterKey = settingsData.delimiter ? settingsData.delimiter : defaultSettingsData.delimiter
        texts += delimiter[delimiterKey]
      }
      texts += nodeObjectsArray[i].characters
      textObjectLength++
    } else if (nodeObjectsArray[i].type == 'GROUP' || nodeObjectsArray[i].type == 'FRAME' || nodeObjectsArray[i].type == 'COMPONENT' || nodeObjectsArray[i].type == 'INSTANCE'){
      texts += extractTexts(nodeObjectsArray[i].children)
    }
  }
  return texts
}

function truncate(str, len){
  return str.length <= len ? str: (str.substr(0, len)+"…");
}


function init(){
    let selectedItems = figma.currentPage.selection
    if (selectedItems.length == 0){
      return figma.closePlugin('No object selected!')
    }
    let copiedText = extractTexts(selectedItems)
    if (copiedText){
      figma.ui.postMessage({ copiedText : copiedText })
      // return figma.closePlugin('Yesssss!')
      // figma.closePlugin('Copied: ' + truncate(copiedText, 100))
    } else {
      return figma.closePlugin('No text object selected.')
    }

}

init()