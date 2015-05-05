#!/usr/bin/env node

var http = require("http")
var https = require("https")
var fs = require("fs")
var ws = require("ws").Server

var watchedFiles = [];
var conns = [];

var args = process.argv

if (args[2] && ( args[2] == "-h" || args[2] == "--help") ) {
	console.log("Usage servjs [index file] [port]")
	return
}

if (!args[2] || args[2] != "--ssl") {
	http.createServer(function(req,res) {
		var url = req.url.substr(1) || args[2] || "index.html"
		url = url.split("..")[0]
		var cT = getMime(url.split(".")[1])
		console.log("Request received for: "+url);
		watchFile(url);
		getFile(url, function(data,err) {
			res.writeHead(err || 200, {'Content-Type': cT});
			res.write(data);
			res.end();
		})
	}).listen(args[3] || 1337, '0.0.0.0');
	console.log('Server running');
} else {
	var options = {
		key: fs.readFileSync(__dirname+'/cert/server.key'),
		cert: fs.readFileSync(__dirname+'/cert/server.crt')
	};
	https.createServer(options, function(req,res) {
		var url = req.url.substr(1) || args[3] || "index.html"
		url = url.split("..")[0]
		var cT = getMime(url.split(".")[1])
		console.log("Request received for: "+url);
		watchFile(url);
		getFile(url, function(data,err) {
			res.writeHead(err || 200, {'Content-Type': cT});
			res.write(data);
			res.end();
		})
	}).listen(args[4] || 1337, '0.0.0.0');
	console.log('Server running over ssl');
}

var watchFile = function(fn) {
	if (watchedFiles.indexOf(fn) < 0) {
		watchedFiles.push(fn);
		fs.watchFile(fn, {persistent: true, interval: 300}, function() {
			fileUpdated(fn);
		})
	}
}

var upServ = new ws({port: ((args[2] && args[2] == "--ssl") ? args[5] : args[4]) || 5556});
upServ.on('connection', function(ws) {
	console.log("received connection");
	conns.push(ws);
	ws.on("close", function() {
		conns.splice(conns.indexOf(ws));
	})
})

var fileUpdated = function(fn) {
	console.log(fn+" was updated");
	for (i in conns) {
		conns[i].send("reload");
	}
	
}

var getFile = function(url,cb) {
	if (url == "debug.js") {
		url = __dirname+"/debug.js";
		console.log(url);
	}	
	fs.readFile(url, function(err, data) {
		if (err || !data) {
			cb("404",404)
			return
		}
		var sp = data.toString().split("<!--debug-->");
		if (sp.length != 1) {
			data = sp.join("<script src='debug.js'></script>");
		}
		cb(data);
	})
}

var getMime = function(str) {
	if (!str) {
		return "text/plain";
	}
	str = str.toLowerCase();
	switch (str) {
		case "html":
			return "text/html"
		case "txt":
			return "text/plain"
		case "js":
		case "min":
		case "json":
			return "application/javascript"
		case "gif":
			return "image/gif"
		case "jpeg":
		case "jpg":
			return "image/jpeg"
		case "png":
		case "bmp":
		case "ico":
			return "image/png"
		case "svg":
			return "image/svg+xml"
		case "css":
			return "text/css"
		case "xml":
			return "text/xml"
		default:
			return "text/html"

	}
}


var debug = "                                                  \
var ws = new WebSocket('ws://localhost:5556');                 \
ws.onmessage = function(data) {                                \
  if (data.data=='reload') {                                   \
    setTimeout(function() {window.location.reload()},500);     \
  } else {                                                     \
    console.log(data);                                         \
  }                                                            \
};                                                             \
"
