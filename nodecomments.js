
var fs = require('fs'),
config = JSON.parse(fs.readFileSync('config.json','utf8')),
redis = require('redis').createClient(config.redisPort,config.redisHost),
pubsub = require('redis').createClient(config.redisPort,config.redisHost);

if(config.redisPassword){ redis.auth(config.redisPassword); }
if(config.redisPassword){ pubsub.auth(config.redisPassword); }

pubsub.subscribe("Events");

var main = {

	init:function(uid,callback){
		pubsub.subscribe("Events");
		pubsub.on("message",function(channel,message){
			if(channel == "Events"){
				callback(message)
			}
		});

		main.SetEvent(uid,{do:"Events",Event:"Connected"})
	},

	NewTopic:function(uid,data,callback){
		//Creates a new topic and then publishes the event to pubsub
		if(!data){ data = {}; }
		if(!data.Title){
			main.SendError(uid,{do:"error",message:"Topic must not be blank"},callback);
			return false;
		}
		if(!data.Body){ data.Body = ''; }

		redis.incr("Topic",function(err,TopicID){
			var Topic = {
				uid:uid,
				Title:data.Title,
				Body:data.Body,
				Date:new Date().toString()
			}
			redis.set("Topic:"+TopicID,JSON.stringify(Topic));
			redis.zadd("Topics",0,"Topic:"+TopicID);

			main.SetEvent(uid,{do:"Events",Event:"Started New Topic"})

		});
	},

	NewResponse:function(uid,data,callback){
		//Creates a response
	},

	GetTopics:function(uid,data,callback){
		//Fetches and sends topics
	},

	SendError:function(uid,data,callback){
		callback({do:"error",message:data.message})
	},

	SetEvent:function(uid,data){
		//publish
		pubsub.publish("Events",JSON.stringify(data));
	}

}

exports.comments = module.exports = main;
