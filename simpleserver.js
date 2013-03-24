
/*
THIS IS AN EXAMPLE OF A WEB SOCKET ENABLED NODEJS HTTP SERVER USING NODE COMMENTS
*/

var nodecomments = require('./nodecomments'),
fs = require('fs'),
ws = require('ws').Server,
http = require('http');

/* Create an simple page with a div and id=nodecomments to target */

var SimpleClient = fs.readFileSync('simpleclient.js','utf8');
var SimpleClientCSS = fs.readFileSync('simpleclient.css','utf8');
var SimplePage = '<html><head><script>'+SimpleClient+'</script><style>'+SimpleClientCSS+'</style><body><div id="nodecomments">Loading NodeComments</div></body></html>';

var httpServer = http.createServer(function(req, res){

	res.writeHead(200, {'Content-Type': 'text/html'});

	//an example user object, most critical element to pass to nodecomments is the user's unique ID
	res.end(SimplePage);


}).listen(8080);

server = new ws({server: httpServer});
server.on('connection', function (socket){
	console.log("client connected");

	//your server should figure out the user in your own way, for now we will just mimic a user. Most important element is the unique ID

	var User = {uid:1001,name:"John Doe"};
	socket.User = User;

	Socket.onOpen(User.uid,socket);

	socket.on('message', function(data){ Socket.onData(socket,data); });
	socket.on('close', function(data){ Socket.onClose(socket,data); });
});

var Socket = {
	onOpen:function(uid,socket){
		nodecomments.init(uid,function(data){
			socket.send(JSON.stringify(data));
		})
	},
	onData:function(socket,data){
		console.log("received");
		console.dir(data);
		var data = JSON.parse(data);
		if(data.do){
			if(nodecomments[data.do]){
				nodecomments[data.do](socket.User.uid,data,function(data){
					socket.send(JSON.stringify(data));
				});
			}
		}
	},
	onClose:function(socket,data){
		console.log("closing");
		console.dir(data)
	}
}
