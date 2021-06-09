function openSidebar() {
  var ui = SpreadsheetApp.getUi();
  var html = HtmlService.createTemplateFromFile("index").evaluate();
  // var html = HtmlService.createTemplateFromFile("index2").evaluate()
                    // .setTitle('データ作成').setSandboxMode(HtmlService.SandboxMode.IFRAME);
  ui.showSidebar(html);
}

function logTest(data){
  Logger.log('★' + data);
}

function scrape(url) {
  var response = UrlFetchApp.fetch(url);
  var content = response.getContentText("UTF-8");

  // get type_str
  var breadcrumbs = content.match(/<ul class\="breadcrumbs" data-atlas-trackable="breadcrumbs">[\s\S]*?<\/ul>/);
  var li = breadcrumbs[0].match(/<li>.*?<\/li>/gi);
  Logger.log(li);
  var li_length = li.length;
  var type_str = li[li_length - 2].match(/title=".*?"/)[0].replace("title=", '').replace(/"/g, '');
  Logger.log(type_str);
  // get side_effect_str
  var side_effect_match = content.match(/<div class="drugdic-title">注意すべき副作用<\/div>[\s\S]*?<\/div>/);
  var side_effect_str;
  if (side_effect_match === null) {
    side_effect_str = '';
  } else {
    var side_effect = side_effect_match[0];
    var splitted = side_effect.replace(/ /g, '').split('\n');
    Logger.log(splitted);
    var side_effect_str = "";
    for (var i = 2; i < splitted.length - 1; i++) {
      side_effect_str += splitted[i];
    }
  }
  Logger.log(side_effect);
  return [type_str, side_effect_str];
}

function tmp() {
  scrape("https://medical.nikkeibp.co.jp/inc/all/drugdic/prd/61/6113001B1119.html");
}

function process(url, row_i) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  var result = scrape(url);
  fillValues(sheet, row_i, result[0], result[1].replace('ショック、アナフィラキシー、呼吸困難、', ''), url);
}

function transform_to_button(html, row_i) {
  var url = 'https://medical.nikkeibp.co.jp/' + html.match(/^.*?html/);
  var name = html.match(/<\/i>.*<\/a>/)[0].replace('</i>', '').replace('</a>', '');
  return '<button onclick="sendToGas(' + "'" + url + "'," + row_i + ')">' + name + '</button>'
}

function create_sidebar_html(match, row_i) {
  var header = '<!DOCTYPE html><html><head><base target="_top"><?!= HtmlService.createHtmlOutputFromFile("css").getContent(); ?></head><body><div class="sidebar">\n'
  var footer = '</div><?!= HtmlService.createHtmlOutputFromFile("js").getContent(); ?></body></html>\n'

  var button_str = "";
  for (var i = 0; i < match.length; i++) {
    button_str += transform_to_button(match[i], row_i) + '\n';
  }
  // Logger.log(button_str);
  return header + button_str + footer;
}

function create_prompt_text(match) {
  var button_str = "";
  for (var i = 0; i < match.length; i++) {
    var html = match[i];
    var url = 'https://medical.nikkeibp.co.jp/' + html.match(/^.*?html/);
    var name = html.match(/<\/i>.*?</)[0].replace('</i>', '').replace('<', '');
    button_str += '・' + name + '\n' + url + '\n\n';
  }
  return button_str;
}

function create_sidebar(sidebar_html, row_i) {
  var ui = SpreadsheetApp.getUi();
  var html = HtmlService.createTemplate(sidebar_html).evaluate();
  // var html = HtmlService.createTemplateFromFile("index2").evaluate()
                    // .setTitle('データ作成').setSandboxMode(HtmlService.SandboxMode.IFRAME);
  var response = ui.prompt('TEST', sidebar_html, ui.ButtonSet.OK_CANCEL);
  process(response.getResponseText, row_i);
  // ui.showSidebar(html);
  // ui.showModalDialog(html, 'test');
}

function search2(word, row_i) {
  var url = 'https://nmospr.nikkeibp.co.jp/parts/drugdic/search/cntfrt021201_searchResult?words=' + word;
  var response = UrlFetchApp.fetch(url);
  var content = response.getContentText("UTF-8");
  var match = content.match(/\/inc\/all\/drugdic\/prd\/.*<\/a>/g);
  if (match === null) {
    Browser.msgBox(word + ' was not found');
    return;
  }

  // var sidebar_html = create_sidebar_html(match, row_i);
  var prompt_text = create_prompt_text(match);
  Logger.log(prompt_text);
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(word, prompt_text, ui.ButtonSet.OK_CANCEL).getResponseText();
  process(response, row_i);
  // create_sidebar(sidebar_html, row_i);
}

function search(word) {
  var url = 'https://nmospr.nikkeibp.co.jp/parts/drugdic/search/cntfrt021201_searchResult?words=' + word;
  var response = UrlFetchApp.fetch(url);
  var content = response.getContentText("UTF-8");
  var match = content.match(/\/inc\/all\/drugdic\/prd\/.*<\/a>/g);
  return match;
}

function fillValues(sheet, row_i, type_str, side_effect_str, url) {
  sheet.getRange(row_i, 2).setValue(type_str);
  sheet.getRange(row_i, 3).setValue(side_effect_str);
  sheet.getRange(row_i, 4).setValue(url);
}

function createPullDownList(match) {
  var pull_down_list = []
  for (var i = 0; i < match.length; i++) {
    var html = match[i];
    var url = 'https://medical.nikkeibp.co.jp/' + html.match(/^.*?html/);
    var name = html.match(/<\/i>.*?</)[0].replace('</i>', '').replace('<', '');
    pull_down_list.push(name + ': ' + url);
  }
  return pull_down_list;
}

function run() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  var cell = sheet.getActiveCell();
  if (cell.getColumn() !== 1 | cell.getValue() === '') return;

  var rule = cell.getDataValidation();
  if (rule === null) {
    var match = search(cell.getValue());
    if (match === null) {
      cell.setValue('"' +  cell.getValue() + '" was not found');
      return;
    }
    var pull_down_list = createPullDownList(match);
    Logger.log(pull_down_list);
    var new_rule = SpreadsheetApp.newDataValidation().requireValueInList(pull_down_list).build();
    cell.setDataValidation(new_rule);
  } else {
    var val = cell.getValue();
    cell.setDataValidation(null);
    var splitted = val.split(': ');
    var name = splitted[0];
    var url = splitted[1];
    cell.setValue(name);
    var results = scrape(url);
    fillValues(sheet, cell.getRow(), results[0], results[1].replace('ショック、アナフィラキシー、呼吸困難、', ''), url);
  }

  // Logger.log(cell.getColumn() + ', ' + cell.getRow() + ', ' + cell.getValue() + ', ' +   cell.getValues());
  // Logger.log(sheet.getName());

  // var rule = cell.getDataValidation();
  // if (rule != null) {
  //   var criteria = rule.getCriteriaType();
  //   var args = rule.getCriteriaValues();
  //   Logger.log('The data validation rule is %s %s', criteria, args);
  // } else {
  //   Logger.log('The cell does not have a data validation rule.')
  // }

  // var row_i = 2;
  // while (1) {
  //   var drug = sheet.getRange(row_i, 1).getValue();
  //   if (drug === '') break;
  //   if (sheet.getRange(row_i, 2).getValue() !== '') {
  //     row_i++;
  //     continue;
  //   }
  //   Logger.log(drug);
  //   search(drug, row_i);
  //   row_i++;
  //   Utilities.sleep(1000);
  // }
}
