var fs = require('fs');
var path = require('path');

var file = path.join(__dirname, 'config.json');

module.exports = loadconfig;

function loadconfig(needed) {
  needed = needed || [];

  var config;
  try {
    config = fs.readFileSync(file, 'utf8');
  } catch (e) {
    console.error('[ERROR] error reading config file, try copying `config.json.dist`');
    throw e;
  }

  try {
    config = JSON.parse(config);
  } catch (e) {
    console.error('[ERROR] failed to parse config file');
    throw e;
  }

  needed.forEach(function (need) {
    if (!config[need]) {
      console.error('[ERROR] necessary config paramater "%s" not found', need);
      process.exit(1);
    }
  });

  return config;
}
