
/*
	THIS IS AN EXAMPLE OF A WEB SOCKET ENABLED NODEJS HTTP SERVER USING NODE COMMENTS
*/

var comments = require('./nodecomments'),
ws = require('ws'),
http = require('http');

/*
var wss = ws.Server.WebSocketServer({port: 8080});

ws.on('connection', function(ws) {
    ws.on('message', function(message) {
        console.log('received: %s', message);
    });
    ws.send('something');
});
*/

/* Create an simple page with a div and id=nodecomments to target */
var SimplePage = '<html><body><div id="nodecomments">Loading Comments</div></body></html>';

http.createServer(function(req, res){

	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(SimplePage);


}).listen(8080);

