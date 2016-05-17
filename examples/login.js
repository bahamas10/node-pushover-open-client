var PushoverOpenClient = require('../');

var config = require('./loadconfig')(['email', 'password']);
var poc = new PushoverOpenClient(config);

poc.login(function (err, body) {
  console.log(JSON.stringify(body, null, 2));
  if (err)
    throw err;
});
