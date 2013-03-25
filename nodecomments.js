
var fs = require('fs'),
config = JSON.parse(fs.readFileSync('config.json','utf8')),
redis = require('redis').createClient(config.redisPort,config.redisHost),
pubsub = require('redis').createClient(config.redisPort,config.redisHost);

if(config.redisPassword){ redis.auth(config.redisPassword); }
if(config.redisPassword){ pubsub.auth(config.redisPassword); }

pubsub.subscribe("Events");

var main = {

	Broadcast:function(callback){
		pubsub.subscribe("Events");
		pubsub.on("message",function(channel,message){
			callback(message)
		});
	},

	InitUser:function(User){
		main.SetEvent(User,{do:"Events",Event:"Connected",Message:User.name+" Connected"})
	},

	NewTopic:function(User,data,callback){
		//Creates a new topic and then publishes the event to pubsub
		if(!data){ data = {}; }
		if(!data.Title){
			main.SendError(User,{do:"error",message:"Topic must not be blank"},callback);
			return false;
		}
		if(!data.Body){ data.Body = ''; }

		redis.incr("Topic",function(err,TopicID){
			var Topic = {
				ID:TopicID,
				Title:data.Title,
				Body:data.Body,
				User:User.uid,
				Date:new Date().toString()
			}
			redis.set("Topic:"+TopicID,JSON.stringify(Topic));
			redis.zadd("Topics",0,"Topic:"+TopicID);
			redis.rpush("AllTopics","Topic:"+TopicID);

			main.SetEvent(User,{do:"Events",Event:"New Topic",doAction:{do:"GetTopic",TopicID:Topic.ID},Message:User.name+" Started Topic: "+Topic.Title})

		});
	},

	NewResponse:function(User,data,callback){
		//Creates a response
	},

	GetTopics:function(User,data,callback){
		//Fetches and sends topics
		redis.zrevrange("Topics",0,-1,function(err,res){
			//callback({do:data.do,Topics:res})
			if(res){
				res.forEach(function(TopicID){
					main.GetTopic(User,{TopicID:TopicID},function(data){
						callback({do:"GetTopic",Topic:data.Topic})
					})
				})
			}
		})
	},

	GetTopic:function(User,data,callback){
		redis.get(data.TopicID,function(err,res){
			callback({do:"GetTopic",TopicID:data.TopicID,Topic:JSON.parse(res)})
		})
	},

	SendError:function(User,data,callback){
		callback({do:"error",message:data.message})
	},

	SetEvent:function(User,data){
		//publish
		redis.publish("Events",JSON.stringify(data));
	}

}

exports.comments = module.exports = main;
