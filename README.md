# momolog
MongoDB backed Node Express logger

## How to use?
```json
{
  ...
  "dependencies": {
    "express": "4.13.3",
    "momolog": "0.1.0"
  },
  ...
}
```

```node
var express = require('express')
var momolog = require('momolog')

var app = express();
var log = momolog();
// Call connect() with MongoDB URI and collection name.
log.connect(process.env.MONGOLAB_URI, 'log').then(() => {
  // Connected.
  app.use(log.morgan());  // Install as a logger

  // Other configurations.

  app.listen(process.env.PORT, () => {
    // Started.
  });
});
```

## Log format example
```json
{
    "_id": {
        "$oid": "567a4cceeeba20030010b8a8"
    },
    "format": 1,
    "date": "2015-12-23T07:27:10.260Z",
    "referrer": "http://jsrun.it/toyoshim/miIs",
    "request": {
        "method": "GET",
        "host": "chime.herokuapp.com",
        "url": "/dist/chime-0.1.min.js",
        "protocol": "HTTP/1.1",
        "acceptLanguage": "ja,en-US;q=0.8,en;q=0.6"
    },
    "response": {
        "status": 200,
        "contentLength": 36985,
        "responseTime": 38.044
    },
    "remote": {
        "addr": "::ffff:*.*.*.*",
        "user": "-",
        "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36"
    }
}
```
