
/* 

NODECOMMENTS CLIENT
nodecoments only returns JSON
You need a way to turn that into nodecomments

most of this code is borrowed from coplete.com
*/

var socket,
events = [],
Topics={},
Replies={},
Callback = {},
target = byID('nodecomments');

function initSocket(){
	if(window['WebSocket']){
		var wssURL = "ws://"+document.location.hostname+":"+document.location.port;
		socket = new WebSocket(wssURL);
		socket.onopen = function(){
			console.log('socket opened');
			NodeComments.open();
		};
		socket.onmessage = function(message){
			var data = JSON.parse(message.data);
			console.log("Got: "+JSON.stringify(data));
			if(data.do){
				if(NodeComments[data.do]){
					NodeComments[data.do](data);
				} else {
					console.log("no action for "+data.do)
				}
			}
		};

		socket.onclose = function(data){
			console.log('socket closed')
		};
	} else {
		html({ID:"nodecomments",HTML:"Sorry, your browser is a bit too dated to use this app. We like <a href=\"http://www.google.com/chrome\">Chrome</a>"});
	}
}

var NodeComments = {
	changeState:function(){
		if(document.location.pathname.match('/topic/')){
			NodeComments.view('topic')
		} else {
			NodeComments.view('Main')
		}
	},
	open:function(){
		html({ID:"nodecomments",HTML:""})

		html({ID:'nodecommentsContent',Type:"div",HTML:"Getting Topics",AppendTo:"nodecomments"});
		html({ID:"EventList",Type:"div",Class:"nodeCommentsEvents",AppendTo:"nodecomments"});

		window.onpopstate = NodeComments.changeState;
		NodeComments.changeState();
	},
	view:function(view){
		if(byID('nodecommentsContent').getAttribute('view') != 'view'){
			html({ID:'nodecommentsContent',Attributes:{view:view},HTML:''});
		}
		if(view == 'topic'){

			html({ID:"returnIndex",Type:"a",Text:"< Index",Attributes:{href:"/"},AppendTo:"nodecommentsContent",Click:function(e){
				e.preventDefault();
				window.history.pushState("", "Title", "/");
				NodeComments.view('Main');
			}});

			var TopicIDByURL = document.location.pathname.split('/')[2];

			NodeComments.Form("nodecomments",TopicIDByURL,"");

			Callback.GetTopic = function(Topic){
				html({ID:view+"Topic"+Topic.ID,Type:"header",Class:"nodecomments",Text:Topic.Title+" ["+Topic.Name+"]",AppendTo:"nodecommentsContent"});
				html({ID:view+"Body"+Topic.ID,Type:"section",Class:"nodecomments",Text:Topic.Body,AppendTo:"nodecommentsContent"});
				Callback.GetReply = function(Reply){
					if(Reply.ReplyID){
						var AppendTo = view+"Reply"+Reply.ReplyID.replace("Reply:","");
					} else {
						var AppendTo = "nodecommentsContent";
					}
					console.log(AppendTo);

					html({ID:view+"Reply"+Reply.ID,Type:"section",Class:"nodecomments",Text:Reply.Body,Styles:{"padding-left":"20px"},AppendTo:AppendTo});

					html({ID:view+"ReplyDetail"+Reply.ID,Type:"div",Class:"nodecommentsdetails",Text:Reply.Name+" On "+Reply.Date,AppendTo:view+"Reply"+Reply.ID});
					html({ID:view+"ReplyButton"+Reply.ID,Type:"button",Class:"nodecomments",Text:"Reply",AppendTo:view+"ReplyDetail"+Reply.ID,Click:function(){
						NodeComments.Form(view+"Reply"+Reply.ID,TopicIDByURL,"Reply:"+Reply.ID);
					}})
				}
				NodeComments.send({do:"GetReplies",TopicID:TopicIDByURL});
			}

			NodeComments.send({do:"GetTopic",TopicID:TopicIDByURL});
		} else {
			//default view all topics

			NodeComments.Form("nodecomments","","");

			Callback.GetTopic = function(Topic){
				html({ID:view+"Topic"+Topic.ID,Type:"article",Class:"nodecomments",Text:Topic.Title+" ["+Topic.Name+"]",AppendTo:"nodecommentsContent",Click:function(){
					window.history.pushState("", "Title", "/topic/Topic:"+Topic.ID);
					NodeComments.view('topic');
				}})
			}
			NodeComments.send({do:"GetTopics"});
		}

	},
	send:function(data){
		socket.send(JSON.stringify(data));
		console.log("Sent: "+JSON.stringify(data));
	},
	error:function(data){
		html({ID:"NodeCommentsError",Type:"div",Text:data.message,Class:"nodecommentsError",AppendFirst:'nodecomments',Delay:{func:function(){
			rm("NodeCommentsError");
		},time:2000}});

	},
	Events:function(data){
		events.push(data);
		console.log('events!');
		var EventID = events.length;
		html({ID:"Event"+EventID,Type:"div",Text:'['+data.Event+'] '+data.Message,AppendTo:"EventList"})
		if(data.doAction){
			NodeComments.send(data.doAction);
		}
	},
	GetTopic:function(data){
		if(data.Topic){
			if(data.Topic.ID){
				Topics[data.Topic.ID] = data.Topic;
				if(Callback[data.do]){
					Callback[data.do](data.Topic);
				}
			}
		}
	},
	GetReply:function(data){
		if(data.Reply){
			if(data.Reply.ID){
				Replies[data.Reply.ID] = data.Reply;
				if(Callback[data.do]){
					Callback[data.do](data.Reply);
				}
			}
		}
	},
	Form:function(Into,TopicID,ReplyID){
		html({ID:"newTopicContainer",Type:"div",HTML:"",AppendTo:Into})
		if(!TopicID){
			var PlaceHolderT = "New Topic Title";
			var PlaceHolderB = "New Topic Body";
			var doAction = "NewTopic";
			html({ID:"newTopicTitle",Type:"input",Class:"nodecomments",Attributes:{placeholder:PlaceHolderT},AppendTo:'newTopicContainer'})
		} else {
			var doAction = "NewResponse";
			var PlaceHolderB = "New Response Body";
			html({ID:"newTopicTopicID",Type:"input",Class:"nodecomments",Attributes:{type:"hidden",value:TopicID},AppendTo:'newTopicContainer'})
		}
		html({ID:"newTopicBody",Type:"textarea",Class:"nodecomments",Attributes:{placeholder:PlaceHolderB},AppendTo:'newTopicContainer'})
		html({ID:"newTopicSend",Type:"button",Class:"nodecomments",Text:"Reply",AppendTo:"newTopicContainer",Click:function(){
			var Title = getValue("newTopicTitle"),
			Body = getValue('newTopicBody');
			if(Body){
				var Submission = {do:doAction,Title:Title,TopicID:TopicID,ReplyID:ReplyID,Body:Body}
				NodeComments.send(Submission);
				if(byID("newTopicTitle")){
					byID("newTopicTitle").value = '';
				}
				byID("newTopicBody").value = '';
			} else {
				NodeComments.error({message:"Response must not be blank"})
			}
		}});
	}
}

/* DOM/HTML functions originally written for coplete.com */
function getValue(id){
	item = byID(id);
	if(item){
		if(item.value){ return item.value; }
	}
	return '';
}

function rm(id){
	var toRem = byID(id);
	if(toRem){
		toRem.parentNode.removeChild(toRem);
	}
}
function byID(id){ return document.getElementById(id); }

function DOM(dom,K,html){
	this.dom = dom;
	switch(K){
		case "Styles":
			for(var S in html[K]){
				this.dom.style.setProperty(S,html[K][S]);
			}
			break;
		case "Attributes":
			for(var A in html[K]){
				this.dom.setAttribute(A,html[K][A]);
				if(A == "disabled" || A == "checked"){
					if(html[K][A]){ this.dom[A] = true; } else { this.dom[A] = false; }
				}
			}
			break;
		case "Click":
			this.dom.onclick = html.Click;
			break;
		case "Class":
			this.dom.className = html.Class;
			break;
		case "Delay":
			setTimeout(html.Delay.func,html.Delay.time);
			break;
		case "Input":
			this.dom.oninput = html.Input;
			this.dom.onchange = html.Input;
			break;
		case "Focus":
			this.dom.onfocus = html.Focus;
			break;
		case "Blur":
			this.dom.onblur = html.Blur;
			break;
		case "MouseDown":
			this.dom.onmousedown = html.MouseDown;
			break;
		case "Enter":
			this.dom.addEventListener('keydown', function(e){
				if(e.which == "13"){
					html.Enter();
				}
			});
			break;
		case "SortValue":
			this.dom.setAttribute("sv",html.SortValue);
			break;
		case "AppendSort":
			this.AppendSort = byID(html.AppendSort);
			if(!this.AppendSort.firstChild){
				this.AppendSort.appendChild(this.dom);
			} else {
				placed=false;
				placedFoReal=false;
				r=0;
				while(!placed){
					if(this.AppendSort.childNodes[r]){
						if(html.SortValue > this.AppendSort.childNodes[r].getAttribute("sv")){
							placed=true
							placedFoReal=true;
							this.AppendSort.insertBefore(this.dom,this.AppendSort.childNodes[r]);
						}
					}
					r++;
					if(r >= this.AppendSort.childNodes.length){ placed=true; }
				}
				if(!placedFoReal){
					this.AppendSort.appendChild(this.dom);
				}
			}
			break;
		case "Text":
			if(this.dom.innerText != undefined){ this.dom.innerText = html.Text; } else { this.dom.textContent = html.Text; }
			break;
		case "HTML":
			dom.innerHTML = html.HTML;
			break;
		case "AppendFirst":
			this.AppendFirst = byID(html.AppendFirst);
			if(this.AppendFirst){
				if(this.AppendFirst.firstChild){
					if(this.AppendFirst.firstChild != this.dom){
						this.AppendFirst.insertBefore(this.dom,this.AppendFirst.firstChild);
					}
				} else {
					html.AppendTo = html.AppendFirst;
					DOM(this.dom,"AppendTo",html);
				}
			}
			break;
		case "AppendBefore":
			this.AppendBefore = byID(html.AppendBefore);
			if(this.AppendBefore){
				if(this.AppendBefore){
					this.AppendBefore.parentNode.insertBefore(this.dom,this.AppendBefore);
				}
			}
			break;
		case "AppendTo":
			this.AppendTo = byID(html.AppendTo);
			if(this.AppendTo){
				if(this.dom.parentNode){
					if(this.dom.parentNode.id != this.AppendTo.id){
						this.AppendTo.appendChild(this.dom);
					}
				} else {
					this.AppendTo.appendChild(this.dom);
				}
			}
			break;
		case "Flash":
			if(!DB.FlashTrack[html.Flash.K]){
				DB.FlashTrack[html.Flash.K] = html.Flash.V;
			} else {
				if(html.Flash.V != DB.FlashTrack[html.Flash.K]){
					Flash(html.ID);
					DB.FlashTrack[html.Flash.K] = html.Flash.V;
					if(html.Flash.Kill){
						delete DB.FlashTrack[html.Flash.Kill];
					}
				}
			}
			break;
	}
}
function html(html){
	(function htmlASYNC(html){
		this.dom = byID(html.ID);
		if(!this.dom){
			if(html.Type){
				this.dom = document.createElement(html.Type);
				this.dom.id = html.ID;
			}
		}
		if(this.dom){
			for(var K in html){
				DOM(this.dom,K,html)
			}
		}
	})(html);
}


initSocket();