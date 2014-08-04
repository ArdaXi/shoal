
var fs = require('fs');
var express = require('express');
var connect = require('connect');
var bodyParser = require('body-parser');
var http = require('http');
var defaults = require('./../defaults');
var version = JSON.parse(fs.readFileSync(__dirname + '/../../package.json', 'utf8')).version;

var Admin = function(client, options) {
  this._options = options || {};
  this._client = client;
  this._app = express();
  this._app.use(bodyParser.json());
  this._app.use(express.static(__dirname + '/public'));
  this._app.engine('html', require('ejs').renderFile);
  this._routes();
};

Admin.prototype.start = function(options) {
  options = options || {};
  options.port = options.port || defaults.adminPort;
  options.host = options.host || defaults.adminHost;
  http.createServer(this._app).listen(options.port, options.host);
  !options.quiet && console.log('Shoal Admin UI running on http://' + options.host + ':' + options.port)
};

Admin.prototype._status = function(req, res, next) {
  this._client.status(function(err, status) {
    if (err) return this._error(res, 500, err.message);
    if (status == 'ok')
      status = null;
    return res.send({result: status});
  });
};

Admin.prototype._deploy = function(req, res, next) {
  var configuration = req.body;
  this._client.deploy(configuration, function(err, status) {
    if (err) return this._error(res, 500, err.message);
    return res.send({result: status});
  }.bind(this));
};

Admin.prototype._index = function(req, res, next) {
  var adminHtmlFile = __dirname + '/index.html';
  if (this._options.adminHtmlFile) {
    adminHtmlFile = this._options.adminHtmlFile;
  }
  res.render(adminHtmlFile, {
    layout: null, locals: {}
  });
};

Admin.prototype._routes = function() {
  this._app.get('/status', this._status.bind(this));
  this._app.post('/deploy', this._deploy.bind(this));
  this._app.get('/', this._index.bind(this))
};

Admin.prototype._error = function(res, statusCode, message) {
  res.status(statusCode).send({error: {message: message}});
};

module.exports = Admin;