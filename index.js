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

const mongodb = require('mongodb')
const onfinished = require('on-finished')

module.exports = {
  connect: function (url, collection) {
    return new Promise((resolve, reject) => {
      mongodb.MongoClient.connect(url, (err, db) => {
        if (err)
          return reject(err);

        const c = db.collection(collection);

        resolve((req, res, next) => {
          // Records the start time.
          const date = new Date().toISOString();
          const start = process.hrtime();

          // Runs logging after finishing the actual handler finished.
          onfinished(res, () => {
            // Calculates duration time in msec.
            const duration = process.hrtime(start);
            const ms = duration[0] * 1e3 + duration[1] * 1e-6;

            // Finds a right remote host IP address. If there is proxies in the
            // middle, the original host IP should appear in the last place of
            // the x-forwarded-for header.
            let raddr = req.ip ||
                        req._remoteAddress ||
                        (req.connection && req.connection.remoteAddress);
            if (req.headers['x-forwarded-for']) {
              const forwarded = req.headers['x-forwarded-for'].split(',');
              raddr = forwarded[forwarded.length - 1];
            }

            // Writes to MongoDB.
            c.insertOne({
              format: 2,
              date: date,
              referrer: req.headers['referer'] || req.headers['referrer'] || "",
              request: {
                method: req.method,
                host: req.hostname,
                url: req.originalUrl || req.url,
                protocol: 'HTTP/' + req.httpVersionMajor + '.' +
                    req.httpVersionMinor,
                acceptLanguage: req.headers['accept-language']
              },
              response: {
                status: res._header ? res.statusCode : undefined,
                contentLength: res._headers['content-length'] || -1,
                responseTime: ms
              },
              remote: {
                addr: raddr,
                user: '-',
                userAgent: req.headers['user-agent']
              }
            });
          }); // onfinished

          next();
        }); // resolve
      });
    });
  }  // connect:
}  // module.exports
