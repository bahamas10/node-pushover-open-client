var PushoverOpenClient = require('../');

var config = require('./loadconfig')(['secret', 'device_id']);
var poc = new PushoverOpenClient(config);

poc.fetchAndDeleteMessages(function (err, messages) {
  if (err)
    throw err;

  console.error('begin queued messages');
  console.log(JSON.stringify(messages, null, 2));
  console.error('end queued messages');

  poc.on('message', function (message) {
    console.log(JSON.stringify(message, null, 2));
  });
  poc.startWatcher();
});
