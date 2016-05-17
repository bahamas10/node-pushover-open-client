var assert = require('assert');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var WebSocket = require('ws');
var vasync = require('vasync');

var request = require('request');

var PUSHOVER_BASE_URI ='https://api.pushover.net/1';
var PUSHOVER_WEBSOCKET_URI = 'wss://client.pushover.net/push';

module.exports = PushoverOpenClient;

function PushoverOpenClient(opts) {
  var self = this;

  EventEmitter.call(this);

  this.email = opts.email;
  this.password = opts.password;
  this.secret = opts.secret;
  this.device_id = opts.device_id;

  this.q = vasync.queue(function (_, cb) {
    self.fetchAndDeleteMessages(function (err, messages) {
      if (err) {
        self.emit('error', err);
        cb(err);
        return;
      }
      messages.forEach(function (message) {
        self.emit('message', message);
      });

      cb();
    });
  }, 1);
}
util.inherits(PushoverOpenClient, EventEmitter);

PushoverOpenClient.prototype.request = function _request(opts, cb) {
  opts.baseUrl = PUSHOVER_BASE_URI;
  opts.timeout = opts.timeout || (30 * 1000);
  opts.json = opts.hasOwnProperty('json') ? opts.json : true;

  request(opts, function (err, res, body) {
    if (err) {
      cb(err, body);
      return;
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      err = new Error('bad statusCode: ' + res.statusCode);
      err.statusCode = err.code = res.statusCode;
      cb(err, body);
      return;
    }

    if (body.status !== 1) {
      err = new Error('bad status from api: ', body.status);
      err.status = err.code = body.status;
      cb(err, body);
      return;
    }

    cb(null, body);
  });
};

PushoverOpenClient.prototype.login = function login(cb) {
  var form = {
    email: this.email,
    password: this.password
  };
  var opts = {
    uri: '/users/login.json',
    method: 'POST',
    form: form
  };
  this.request(opts, function (err, body) {
    if (err) {
      cb(err, body);
      return;
    }

    this.secret = body.secret;
    cb(null, body);
  });
};

PushoverOpenClient.prototype.register = function register(device, cb) {
  var form = {
    secret: this.secret,
    name: device,
    os: 'O'
  };
  var opts = {
    uri: '/devices.json',
    method: 'POST',
    form: form
  };
  this.request(opts, function (err, body) {
    if (err) {
      cb(err, body);
      return;
    }

    this.device_id = body.id;
    cb(null, body);
  });
};

PushoverOpenClient.prototype.fetchMessages = function fetchMessages(cb) {
  var data = {
    device_id: this.device_id,
    secret: this.secret
  };
  var opts = {
    uri: '/messages.json',
    qs: data,
    method: 'GET'
  };
  this.request(opts, cb);
};

PushoverOpenClient.prototype.updateHighestMessage = function updateHighestMessage(id, cb) {
  var data = {
    secret: this.secret,
    message: id
  };
  var opts = {
    uri: '/devices/' + encodeURIComponent(this.device_id) + '/update_highest_message.json',
    method: 'POST',
    qs: data
  };
  this.request(opts, cb);
};

PushoverOpenClient.prototype.fetchAndDeleteMessages = function fetchEmitDeleteMessages(cb) {
  var self = this;

  self.fetchMessages(function (err, body) {
    if (err) {
      cb(err);
      return;
    }

    var messages = [];
    var highest;
    body.messages.forEach(function (message) {
      if (highest === undefined)
        highest = message.id;
      else
        highest = Math.max(message.id, highest);
      messages.push(message);
    });

    if (highest === undefined) {
      cb(null, messages);
      return;
    }

    self.updateHighestMessage(highest, function (err, _) {
      cb(err, messages);
    });
  });
};

PushoverOpenClient.prototype.startWatcher = function startWatcher(cb) {
  var self = this;
  cb = cb || function () {};

  assert(!this.ws, 'stream already started');

  this.ws = new WebSocket(PUSHOVER_WEBSOCKET_URI);
  this.ws.on('open', function () {
    self.ws.send(util.format('login:%s:%s\n', self.device_id, self.secret));
    cb();
  });
  this.ws.on('message', function (data, flags) {
    assert.equal(data.length, 1, 'bad frame sent from pushover');

    var c = data.toString();
    self.emit('data', c);

    switch (c) {
      case '#':
        // Keep-alive packet, no response needed.
        break;
      case '!':
        // A new message has arrived; you should perform a sync.
        self.q.push(null);
        break;
      case 'R':
        // Reload request; you should drop your connection and re-connect.
        self.stopWatcher();
        self.startWatcher();
        break;
      case 'E':
        // Error; a permanent problem occured and you should not automatically
        // re-connect. Prompt the user to login again or re-enable the device.
        self.stopWatcher();
        self.emit('error', new Error('permanent error received from pushover'));
        break;
      default:
        // unknown
        break;
    }
  });
  this.ws.on('close', function () {
  });
};
