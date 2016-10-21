var moduleNameLine = /npm ERR! 404 no such package available : (.+)/;
var moduleNameIndex = 'npm ERR! 404 no such package available : ';


function outParser(data) {

}

function errParser(data) {
  var dataString = data.toString();

  if (moduleNameLine.test(dataString)) {
    var moduleName = moduleNameLine.exec(dataString);
    return moduleName;
  } else {
    process.stdout.clearLine();
  } 
}

module.exports = {
  errParser: errParser
}
