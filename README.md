Node Pushover Open Client
=========================

Pushover Open Client

Installation
------------

    npm install pushover-open-client

Usage
-----

See pushover documentation here https://pushover.net/api/client

### 1. login

The first step is to login to to Pushover.  This will give a `secret` that will be used
for all subsequent requests.

``` js
var PushoverOpenClient = require('pushover-open-client');
var poc = new PushoverOpenClient({
  email: 'user@domain.com',
  password: 'something secure'
});

poc.login(function (err, body) {
  if (err)
    throw err;
  console.log(body);
});
```

will yield something like (data changed for privacy reasons)

``` json
{
  "status": 1,
  "id": "...",
  "secret": "1234",
  "request": "..."
}

```

### 2. register device

The next step is to use the `secret` to register a new Pushover client.  This
module will automatically store the secret retrieved during `.login()` to be
used during subsequent requests.  You may also pass the `secret` in as part
of the constructor to skip the login step in the future.

``` js
poc.register('my-new-device', function (err, body) {
  if (err)
    throw err;
  console.log(body);
});
```

will yield something like this:


``` json
{
  "id": "5678",
  "status": 1,
  "request": "..."
}
```

`id` in the above payload represents the new `device_id`.  Like the `secret`
during `.login()`, this parameter will be stored for subsequent requests.  You
may also pass it in to the constructor to skip the `.register()` step in the
future.

### 3. fetch and delete queued messages

This will download all pending notifications, and also delete them from the
server (signifying you have seen them)

``` js
poc.fetchAndDeleteMessages(function (err, messages) {
  if (err)
    throw err;
  console.log(messages);
});
```

will yield something like this

``` json
[
  {
    "id": 2,
    "message": "This device (my-new-device) is now able to receive notifications and your 7-day trial has started.\n\nVisit https://pushover.net/apps to view apps, plugins, and services to use with Pushover just by supplying your user key:\n\n...",
    "app": "Pushover",
    "aid": 1,
    "icon": "pushover",
    "date": 1463500372,
    "priority": 0,
    "acked": 0,
    "umid": 4460,
    "title": "Welcome to Pushover!"
  }
]
```

### 4. watch for new notifications

This will start an EventEmitter that will watch for new notifications to fetch and delete
automatically for 5 seconds.

``` js
poc.on('message', function (message) {
  console.log(message);
});
poc.startWatcher();
setTimeout(function () {
  poc.stopWatcher();
}, 5 * 1000);
```

will yield something like this

``` json
{
  "id": 4,
  "message": "hello node!",
  "app": "Pushover",
  "aid": 1,
  "icon": "pushover",
  "date": 1463501187,
  "priority": 0,
  "acked": 0,
  "umid": 4464,
  "title": "test"
}
```

License
-------

MIT License
