var PushoverOpenClient = require('../');

var config = require('./loadconfig')(['secret']);
var poc = new PushoverOpenClient(config);

var name = process.argv[2];
if (!name) {
  console.error('[ERROR] device name must be specified as the first argument');
  process.exit(1);
}

poc.register(name, function (err, body) {
  console.log(JSON.stringify(body, null, 2));
  if (err)
    throw err;
});
