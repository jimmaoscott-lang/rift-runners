// Google Apps Script web app that serves the all-in-one game file.
// The file named "index" in this Apps Script project is dist/apps-script/index.html from the repo.
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Wordbound')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
