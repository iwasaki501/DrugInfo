function scrape(url) {
  var response = UrlFetchApp.fetch(url);
  var content = response.getContentText("UTF-8");

  // Get type_str
  var breadcrumbs = content.match(/<ul class\="breadcrumbs" data-atlas-trackable="breadcrumbs">[\s\S]*?<\/ul>/);
  var li = breadcrumbs[0].match(/<li>.*?<\/li>/gi);
  var li_length = li.length;
  var type_str = li[li_length - 2].match(/title="(.*?)"/)[1];
  if (type_str === '処方薬事典TOP') type_str = 'なし';

  // Get general name
  var general_name_match = content.match(/（一般名：(.*?)）/);
  var general_name_str = general_name_match[1];

  // Get side_effect_str
  var side_effect_match = content.match(/<div class="drugdic-title">注意すべき副作用<\/div>.*?\n.*?<div class="drugdic-subheading">\n([\s\S]*?)<\/div>/);
  var side_effect_str;
  if (side_effect_match === null) {
    side_effect_str = '';
  } else {
    var side_effect = side_effect_match[1];
    var splitted = side_effect.replace(/[ 、]/g, '').split('\n');
    var side_effect_str = "";
    var exclude_list = ["ショック", "アナフィラキシー", "呼吸困難", "発疹"];
    for (var i = 0; i < splitted.length - 1; i++) {
      if (!exclude_list.includes(splitted[i])) {
        side_effect_str += splitted[i] + '、';
      }
    }
  }

  return [type_str, general_name_str, side_effect_str];
}

function search(word) {
  var url = 'https://nmospr.nikkeibp.co.jp/parts/drugdic/search/cntfrt021201_searchResult?words=' + word;
  var response = UrlFetchApp.fetch(url);
  var content = response.getContentText("UTF-8");
  var match = content.match(/\/inc\/all\/drugdic\/prd\/.*<\/a>/g);
  return match;
}

function fillValues(sheet, row_i, results, url) {
  sheet.getRange(row_i, 2).setValue(results[0]);
  sheet.getRange(row_i, 3).setValue(results[1]);
  sheet.getRange(row_i, 4).setValue(results[2]);
  sheet.getRange(row_i, 5).setValue(url);
}

function createPullDownList(match) {
  var pull_down_list = []
  for (var i = 0; i < match.length; i++) {
    var html = match[i];
    var url = 'https://medical.nikkeibp.co.jp/' + html.match(/^.*?html/);
    var name = html.match(/<\/i>(.*?)</)[1];
    pull_down_list.push(name + ': ' + url);
  }
  return pull_down_list;
}

function scrapeAndFill(sheet, cell, val) {
  cell.setDataValidation(null);
  var splitted = val.split(': ');
  var name = splitted[0];
  var url = splitted[1];
  cell.setValue(name);
  var results = scrape(url);
  fillValues(sheet, cell.getRow(), results, url);
}

function run() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  var cell = sheet.getActiveCell();
  if (cell.getColumn() !== 1 | cell.getValue() === '' | cell.getValue() === '薬剤名') return;
  var rule = cell.getDataValidation();

  // If no validation is set, create drug name list
  if (rule === null) { 
    var results = search(cell.getValue());
    // If nothing was found, display the message and exit
    if (results === null) {
      cell.setValue('"' +  cell.getValue() + '" was not found');
      return;
    }
    var pull_down_list = createPullDownList(results);
    // If there is only one result, use it
    if (pull_down_list.length === 1) {
      Utilities.sleep(1000);
      scrapeAndFill(sheet, cell, pull_down_list[0]);
      return;
    }
    var new_rule = SpreadsheetApp.newDataValidation().requireValueInList(pull_down_list).build();
    cell.setDataValidation(new_rule);
  } else {
    // Extract name and url from the value
    var val = cell.getValue();
    cell.setDataValidation(null);
    scrapeAndFill(sheet, cell, val);
  }
}
