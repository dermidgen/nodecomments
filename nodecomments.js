
var fs = require('fs'),
config = JSON.parse(fs.readFileSync('config.json','utf8'));

var main = {

	NewTopic:function(){
		//Creates a new topic
	},

	NewResponse:function(){
		//Creates a response
	},

	GetTopics:function(){
		//Fetches and sends topics
	}

}

exports.comments = module.exports = main;
