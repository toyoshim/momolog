/*
 * Copyright (c) 2015 Takashi Toyoshima<toyoshim@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions * are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE FOUNDATION OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

'use strict'

module.exports = momolog

var mongodb = require('mongodb')
var morgan = require('morgan')
var stream = require('stream')
var util = require('util')

morgan.format('momolog', [
    '{"format": 1, "date": ":date[iso]", "referrer": ":referrer"',
    ', "request": {"method": ":method", "host": ":req[host]", "url": ":url"',
        ', "protocol": "HTTP/:http-version"',
        ', "acceptLanguage": ":req[accept-language]"}',
    ', "response": {"status": :status, "contentLength": ":res[content-length]"',
    ', "responseTime": :response-time}',
    ', "remote": {"addr": ":remote-addr", "user": ":remote-user"',
    ', "userAgent": ":user-agent"}}'].join(''));

function momolog() {
  return new MongoDBStream();
}

// MongoDBStream for logging.
function MongoDBStream() {
  stream.Writable.call(this);
  this._db = null;
  this._collection = null;
  this._morgan = morgan('momolog', {stream: this});
}

util.inherits(MongoDBStream, stream.Writable);

MongoDBStream.prototype._write = function(chunk, encoding, callback) {
  var log = JSON.parse(chunk);
  log.response.contentLength = Number(log.response.contentLength) || -1;

  var cb = callback || function(e) { e && console.log(e); };
  if (this._collection) {
    this._collection.insertOne(log).then(() => {
      cb(null);
    }, (e, db) => {
      cb(e);
    });
  } else {
    console.log(JSON.stringify(log));
    cb(null);
  }
};

MongoDBStream.prototype.connect = function(url, collection) {
  return new Promise((resolve, reject) => {
    mongodb.MongoClient.connect(url, (err, db) => {
      if (err)
        return reject(err);
      this._db = db;
      this._collection = db.collection(collection);
      resolve();
    });
  });
};

MongoDBStream.prototype.morgan = function() {
  return this._morgan;
};