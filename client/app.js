
	function JTEObject(x,y,w,h,c,r,alpha,attr,cam,v,tags,locked,last,name){
		if(x==undefined){x=0;}
		if(y==undefined){y=0;}
		if(w==undefined){w=10;}
		if(h==undefined){h=10;}
		if(c==undefined){c=[0,0,0];}
		if(r==undefined){r=0;}
		if(alpha==undefined){alpha=1;}
		if(attr==undefined){attr=undefined;}
		if(cam==undefined){cam=true;}
		if(v==undefined){v=jte.view;}
		if(tags==undefined){tags=[""];}
		if(locked==undefined){locked=false;}
		if(last==undefined){last=-1;}
		if(name==undefined){name="Obj"+jte.objects.length;}
		this.x=x;
		this.y=y;
		this.w=w;
		this.h=h;
		this.c=c;
		this.r=r;
		this.alpha=alpha;

		this.attr=attr;

		this.cam=cam;
		this.view=v;
		this.tags=tags;

		this.locked=locked;
		this.last=last;
    
		this.name=name;

	}

	var jte={
		w:800,
		h:640,
		originalW:0,
		originalH:0,
		title:"Tank basic lobbies",
		maximize:true,
		ratio:false,
		socket:true,
		fontSize:20,
		gridUnit:"10",
		path:"",

		objects:[],

		tileLayer:1000,
		tilesets:{},
		tiles:{},
		
		views:["Start","Lobby","Loading","Game"],
		view:"Start",

		bg:[255,255,255,1],

		code:"",

		pR:1,

		initialize:function(){
			var obj=new JTEObject(0,-90,240,70,[0,0,255],0,1,'{"text":"Client","size":64,"font":"Consolas","align":"left"}',true,'','[""]',false,-1,'Client');/*Attributes and methods go here*/
obj.socketId=undefined;

obj.fps=1000/30;

obj.clientObj={name:"",c:[0,0,255],x:0,y:0,score:0,projectiles:[],powerup:"",state:"",time:0,r:0,playing:false,lobby:undefined,host:undefined};
obj.serverObjs={};

obj.lobbies=[];

obj.updated=false;

obj.sent=false;
obj.sent2=false;
obj.inserted=false;

obj.highscores=[];

obj.updateCooldown=0;
obj.updateCooldownMax=2;

obj.started=undefined;
obj.playing=undefined;
obj.inviteSent=undefined;
obj.inviteReceived=undefined;

obj.playings=[];
obj.withs=[];
obj.received=[];
obj.receivedMax=[];

obj.isHost=false;
obj.host=undefined;

obj.index=0;

obj.deads=0;

obj.waitSecond=3;
obj.waitTime=0;

obj.delaySent=false;
obj.delayTime=0;
obj.delay=0;

obj.powerups=[];

obj.checked=false;

obj.checkDead=function(id){
  var index=this.alives.indexOf(id);
  if(index>=0){
   	this.alives.splice(index,1); 
  }
  
 	var max=this.withs.length+1;
  var cpt=0;
  
  if(this.dead){cpt=1;}
  cpt+=this.deads;
  if(cpt>=max-1 && !this.checked){
    this.checked=true;
   //round over, send score to right person and send restart to all
    if(!this.dead){
      console.log("own++");
     	this.clientObj.score++; 
    }else{
      console.log("1other++");
      if(this.alives.length>0){
        console.log("2other++");
      	var alive=this.alives[0];
     	 jt.getObject("Client").socket.emit("addScore",alive);
      }
    }
    
    jt.getObject("Game").endRound(true)
    jt.getObject("Client").socket.emit("endRound",this.clientObj.lobby);
    
  }
}

obj.sendMap=function(){
  jt.getObject("Client").powerups=[];
  jt.getObject("Client").dead=false;  
  jt.getObject("Client").deads=0;  
  jt.getObject("Client").checked=false;  
  jt.getObject("Client").alives=[];  
  for(var i=0;i<jt.getObject("Client").withs.length;i++){
    jt.getObject("Client").alives.push(jt.getObject("Client").withs[i]);
  }
  console.log("map",jt.getObject("Client").withs,jt.getObject("Client").alives)
  
  jt.getObject("Map").generate();
  jt.getObject("Client").socket.emit("map",jt.getObject("Client").clientObj.lobby,jt.getObject("Map").walls,jt.getObject("Map").spawns);
  jt.getObject("Game").restart();
}

obj.socket = {
 	on:function(){
    
  },
  emit:function(){
    
  }
}

obj.connected=false;

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	if(window["io"]!==undefined){
    console.log("io exists");
    this.socket=io();
  }
  
  this.socket.on("connected",function(id,num){
    jt.getObject("Client").connected=true;
    jt.getObject("Client").socketId=id;    
    jt.getObject("Client").clientObj.name="Guest "+num;    
  });
  
  jt.debug(true);
  jt.mute(true);  
  
  this.pause=false;
  
  this.socket.on("getData",function(senderId,serverObj){
   // console.log("serverObjs start")
    jt.getObject("Client").serverObjs[senderId]=serverObj;
    jt.getObject("Client").updated=true;
    jt.getObject("Client").gotAData=true;
  })
  
  this.socket.on("invite",function(senderId){
    jt.getObject("Client").inviteReceived=senderId;
    jt.getObject("Client").accepted=false; 

  })
  
  this.socket.on("cancel",function(senderId){
    jt.getObject("Client").inviteReceived=undefined;
    jt.getObject("Client").delaySent=false;
    jt.getObject("Client").accepted=false;    
  })
  
  this.socket.on("refuse",function(senderId){
    jt.getObject("Client").inviteSent=undefined;
    jt.getObject("Client").delaySent=false;
    jt.getObject("Client").accepted=false; 
  })
  
  this.socket.on("chat message",function(msg,color){
    jt.getObject("Chat").messages.push(msg);
    jt.getObject("Chat").messagesC.push(color);    
  })
  
  this.socket.on("accept",function(senderId){
    //jt.getObject("Client").received=0; 
    //jt.getObject("Client").receivedMax=jt.getObject("Client").withs.length;     
    jt.getObject("Client").accepted=true;     
    jt.getObject("Client").delayTime=0;
    jt.getObject("Client").delaySent=true;
    jt.getObject("Client").waitTime=jt.getObject("Client").waitSecond*60;
    jt.getObject("Client").socket.emit("delay",senderId);
    //console.log("accept");
  })
  
  this.socket.on("start",function(senderId,index){  
    console.log("index",index);
     jt.getObject("Client").host=senderId;
     jt.getObject("Client").index=index;    
    jt.getObject("Client").accepted=true;     
    jt.getObject("Client").delayTime=0;
    jt.getObject("Client").delaySent=true;
    jt.getObject("Client").waitTime=jt.getObject("Client").waitSecond*60;
    jt.getObject("Client").socket.emit("delay",senderId);
    jt.getObject("Client").clientObj.score=0;
    //console.log("accept");
  })
  /*
  this.socket.on("delay",function(senderId,time){
    jt.getObject("Client").started=false; 
    jt.getObject("Client").playing=senderId;     
    jt.getObject("Client").inviteSent=undefined;     
    jt.getObject("Client").inviteReceived=undefined;         
    jt.getObject("Client").accepted=true;     
    jt.getObject("Client").delay=jt.ceil(jt.getObject("Client").delayTime/2);
    jt.getObject("Client").delayTime=0;    
    jt.getObject("Client").delaySent=false;
    jt.getObject("Client").waitTime+=jt.getObject("Client").delay;    
    jt.getObject("Client").socket.emit("delay2",senderId);
    jt.setView("Loading");
    jt.getObject("Client").index=1; 
    jt.getObject("Client").clientObj.score=0;
    
    jt.getObject("Game").restart();
    
    //console.log("delay1",jt.getObject("Client").delay);
  })
  */
  
  /*
  this.socket.on("delay2",function(senderId,time){
    jt.getObject("Client").started=false; 
    jt.getObject("Client").playing=senderId; 
    jt.getObject("Client").inviteSent=undefined;     
    jt.getObject("Client").inviteReceived=undefined;         
    jt.getObject("Client").accepted=true;     
    jt.getObject("Client").delay=jt.ceil(jt.getObject("Client").delayTime/2);
    jt.getObject("Client").delayTime=0;    
    jt.getObject("Client").delaySent=false;
    jt.setView("Loading");
    jt.getObject("Client").index=0;
    jt.getObject("Client").clientObj.score=0;
    
    jt.getObject("Client").received++;    
    if(jt.getObject("Client").received>=jt.getObject("Client").receivedMax){
      jt.getObject("Map").generate();
      jt.getObject("Client").socket.emit("map",senderId,jt.getObject("Map").walls,jt.getObject("Map").spawns);
      jt.getObject("Game").restart();
    }
  })
  */
  
  this.socket.on("delay",function(senderId,time){
    jt.getObject("Client").started=false; 
    jt.getObject("Client").playing=senderId; 
    jt.getObject("Client").inviteSent=undefined;     
    jt.getObject("Client").inviteReceived=undefined;         
    jt.getObject("Client").accepted=true;     
    
    jt.setView("Loading");
    jt.getObject("Client").clientObj.score=0;
    
    jt.getObject("Client").received++;    
    if(jt.getObject("Client").received>=jt.getObject("Client").receivedMax){
       jt.getObject("Client").index=0;
      jt.getObject("Client").delay=jt.ceil(jt.getObject("Client").delayTime/2);
      jt.getObject("Client").delayTime=0;    
      jt.getObject("Client").delaySent=false;
      jt.getObject("Client").waitTime+=jt.getObject("Client").delay; 
      
      jt.getObject("Client").sendMap();
    }
  })
  
  this.socket.on("map",function(senderId,walls,spawns){
    jt.getObject("Client").deads=0; 
        
    jt.getObject("Client").started=false;     
    jt.getObject("Client").playing=senderId;     
    jt.getObject("Client").inviteSent=undefined;     
    jt.getObject("Client").inviteReceived=undefined;         
    jt.getObject("Client").accepted=true;     
    jt.getObject("Client").delay=jt.ceil(jt.getObject("Client").delayTime/2);
    jt.getObject("Client").delayTime=0;    
    jt.getObject("Client").delaySent=false;
    //jt.getObject("Client").waitTime+=jt.getObject("Client").delay;    
    //jt.getObject("Client").socket.emit("delay2",senderId);
    jt.setView("Loading");
    //jt.getObject("Client").clientObj.score=0;
    
    jt.getObject("Map").walls=walls; 
    jt.getObject("Map").spawns=spawns;  
    
    jt.getObject("Game").restart();
  })
  
  /*
  this.socket.on("map",function(senderId,walls,spawns){
    jt.getObject("Map").walls=walls; 
    jt.getObject("Map").spawns=spawns;  
    
    jt.getObject("Game").restart();
  })
  */
  
  this.socket.on("addScore",function(senderId){
    console.log("adding...");
    jt.getObject("Client").clientObj.score++; 
    //jt.getObject("Game").endRound(false)
  })
  
  this.socket.on("endRound",function(senderId){
    jt.getObject("Game").endRound(false)
  })
  
  this.socket.on("deleteProjectile",function(senderId,obj){
    
    var projectiles=jt.getObject("Client").clientObj.projectiles;
    for(var i=0;i<projectiles.length;i++){
      var proj=projectiles[i];
      if(jt.cRect(proj,obj)){
        jt.getObject("Client").clientObj.projectiles.splice(i,1);
       	i--; 
      }
    }
  })
  
  this.socket.on("spawnPowerup",function(powerup){
    var game=jt.getObject("Game");
    game.powerupSpawn=powerup;
    game.powerupSpawnTimer=game.powerupSpawnTimerMax+jt.getObject("Client").delay;
  })
  
  this.socket.on("deletePowerup",function(obj){
    var game=jt.getObject("Game");
    var powerups=jt.getObject("Client").powerups;
    for(var i=0;i<powerups.length;i++){
      var powerup=powerups[i];
      if(jt.cRect(powerup,obj)){
        jt.getObject("Client").powerups.splice(i,1);
       	i--; 
      }
    }
  })
  	
  
  this.socket.on("dead",function(senderId){
    jt.getObject("Client").deads++;
    if(jt.getObject("Client").isHost){
    	jt.getObject("Client").checkDead(senderId);
    }
  })
  
  this.socket.on("refresh",function(lobbies){
    jt.getObject("Client").lobbies=lobbies;
  })
  
  this.socket.on("leave",function(){
    jt.getObject("Client").clientObj.lobby=undefined;
    jt.getObject("Client").clientObj.host=undefined;    
  })
};obj.update=function(){	/*Update runs at the fps specified*/
  if(!this.started){
    if(this.playing!=undefined){
      if(this.waitTime>0){
        this.waitTime--; 
      }else{
       	this.started=true; 
      }
    }
  }
  
  this.socket.on("disconnected",function(senderId){
    /*
    if(app.state=="battle" && app.playing==senderId){
      app.disconnected=senderId;
    }else if(app.state=="menu" && (app.inviteReceived==senderId || app.inviteSent==senderId)){
      app.inviteSent=undefined;
      app.inviteReceived=undefined;

      app.playing=undefined;

      delete serverObjs[senderId];
    }else{
      delete serverObjs[senderId];
    }
    */
    if(jt.getObject("Client").playing==senderId){
     	jt.getObject("Client").playing=undefined; 
      jt.getObject("Client").inviteSent=undefined; 
      jt.getObject("Client").inviteReceived=undefined; 
      //go back to lobby
      jt.setView("Lobby");
    }
    
    if(jt.getObject("Client").inviteSent==senderId){
     	jt.getObject("Client").inviteSent=undefined; 
    }
    
    if(jt.getObject("Client").inviteReceived==senderId){
     	jt.getObject("Client").inviteReceived=undefined; 
    }
    
    delete jt.getObject("Client").serverObjs[senderId];
  })
	
  if(this.updateCooldown<=0){
    
    if(this.connected){
      this.updateCooldown=this.updateCooldownMax;
      this.clientObj.playing=true;
      //console.log("sending")
      this.socket.emit("update",this.clientObj);
    }
  }else{
   	this.updateCooldown--; 
  }
  
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.socketId=undefined;","","obj.fps=1000/30;","","obj.clientObj={name:\"\",c:[0,0,255],x:0,y:0,score:0,projectiles:[],powerup:\"\",state:\"\",time:0,r:0,playing:false,lobby:undefined,host:undefined};","obj.serverObjs={};","","obj.lobbies=[];","","obj.updated=false;","","obj.sent=false;","obj.sent2=false;","obj.inserted=false;","","obj.highscores=[];","","obj.updateCooldown=0;","obj.updateCooldownMax=2;","","obj.started=undefined;","obj.playing=undefined;","obj.inviteSent=undefined;","obj.inviteReceived=undefined;","","obj.playings=[];","obj.withs=[];","obj.received=[];","obj.receivedMax=[];","","obj.isHost=false;","obj.host=undefined;","","obj.index=0;","","obj.deads=0;","","obj.waitSecond=3;","obj.waitTime=0;","","obj.delaySent=false;","obj.delayTime=0;","obj.delay=0;","","obj.powerups=[];","","obj.checked=false;","","obj.checkDead=function(id){","  var index=this.alives.indexOf(id);","  if(index>=0){","   \tthis.alives.splice(index,1); ","  }","  "," \tvar max=this.withs.length+1;","  var cpt=0;","  ","  if(this.dead){cpt=1;}","  cpt+=this.deads;","  if(cpt>=max-1 && !this.checked){","    this.checked=true;","   //round over, send score to right person and send restart to all","    if(!this.dead){","      console.log(\"own++\");","     \tthis.clientObj.score++; ","    }else{","      console.log(\"1other++\");","      if(this.alives.length>0){","        console.log(\"2other++\");","      \tvar alive=this.alives[0];","     \t jt.getObject(\"Client\").socket.emit(\"addScore\",alive);","      }","    }","    ","    jt.getObject(\"Game\").endRound(true)","    jt.getObject(\"Client\").socket.emit(\"endRound\",this.clientObj.lobby);","    ","  }","}","","obj.sendMap=function(){","  jt.getObject(\"Client\").powerups=[];","  jt.getObject(\"Client\").dead=false;  ","  jt.getObject(\"Client\").deads=0;  ","  jt.getObject(\"Client\").checked=false;  ","  jt.getObject(\"Client\").alives=[];  ","  for(var i=0;i<jt.getObject(\"Client\").withs.length;i++){","    jt.getObject(\"Client\").alives.push(jt.getObject(\"Client\").withs[i]);","  }","  console.log(\"map\",jt.getObject(\"Client\").withs,jt.getObject(\"Client\").alives)","  ","  jt.getObject(\"Map\").generate();","  jt.getObject(\"Client\").socket.emit(\"map\",jt.getObject(\"Client\").clientObj.lobby,jt.getObject(\"Map\").walls,jt.getObject(\"Map\").spawns);","  jt.getObject(\"Game\").restart();","}","","obj.socket = {"," \ton:function(){","    ","  },","  emit:function(){","    ","  }","}","","obj.connected=false;",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\tif(window[\"io\"]!==undefined){","    console.log(\"io exists\");","    this.socket=io();","  }","  ","  this.socket.on(\"connected\",function(id,num){","    jt.getObject(\"Client\").connected=true;","    jt.getObject(\"Client\").socketId=id;    ","    jt.getObject(\"Client\").clientObj.name=\"Guest \"+num;    ","  });","  ","  jt.debug(true);","  jt.mute(true);  ","  ","  this.pause=false;","  ","  this.socket.on(\"getData\",function(senderId,serverObj){","   // console.log(\"serverObjs start\")","    jt.getObject(\"Client\").serverObjs[senderId]=serverObj;","    jt.getObject(\"Client\").updated=true;","    jt.getObject(\"Client\").gotAData=true;","  })","  ","  this.socket.on(\"invite\",function(senderId){","    jt.getObject(\"Client\").inviteReceived=senderId;","    jt.getObject(\"Client\").accepted=false; ","","  })","  ","  this.socket.on(\"cancel\",function(senderId){","    jt.getObject(\"Client\").inviteReceived=undefined;","    jt.getObject(\"Client\").delaySent=false;","    jt.getObject(\"Client\").accepted=false;    ","  })","  ","  this.socket.on(\"refuse\",function(senderId){","    jt.getObject(\"Client\").inviteSent=undefined;","    jt.getObject(\"Client\").delaySent=false;","    jt.getObject(\"Client\").accepted=false; ","  })","  ","  this.socket.on(\"chat message\",function(msg,color){","    jt.getObject(\"Chat\").messages.push(msg);","    jt.getObject(\"Chat\").messagesC.push(color);    ","  })","  ","  this.socket.on(\"accept\",function(senderId){","    //jt.getObject(\"Client\").received=0; ","    //jt.getObject(\"Client\").receivedMax=jt.getObject(\"Client\").withs.length;     ","    jt.getObject(\"Client\").accepted=true;     ","    jt.getObject(\"Client\").delayTime=0;","    jt.getObject(\"Client\").delaySent=true;","    jt.getObject(\"Client\").waitTime=jt.getObject(\"Client\").waitSecond*60;","    jt.getObject(\"Client\").socket.emit(\"delay\",senderId);","    //console.log(\"accept\");","  })","  ","  this.socket.on(\"start\",function(senderId,index){  ","    console.log(\"index\",index);","     jt.getObject(\"Client\").host=senderId;","     jt.getObject(\"Client\").index=index;    ","    jt.getObject(\"Client\").accepted=true;     ","    jt.getObject(\"Client\").delayTime=0;","    jt.getObject(\"Client\").delaySent=true;","    jt.getObject(\"Client\").waitTime=jt.getObject(\"Client\").waitSecond*60;","    jt.getObject(\"Client\").socket.emit(\"delay\",senderId);","    jt.getObject(\"Client\").clientObj.score=0;","    //console.log(\"accept\");","  })","  /*","  this.socket.on(\"delay\",function(senderId,time){","    jt.getObject(\"Client\").started=false; ","    jt.getObject(\"Client\").playing=senderId;     ","    jt.getObject(\"Client\").inviteSent=undefined;     ","    jt.getObject(\"Client\").inviteReceived=undefined;         ","    jt.getObject(\"Client\").accepted=true;     ","    jt.getObject(\"Client\").delay=jt.ceil(jt.getObject(\"Client\").delayTime/2);","    jt.getObject(\"Client\").delayTime=0;    ","    jt.getObject(\"Client\").delaySent=false;","    jt.getObject(\"Client\").waitTime+=jt.getObject(\"Client\").delay;    ","    jt.getObject(\"Client\").socket.emit(\"delay2\",senderId);","    jt.setView(\"Loading\");","    jt.getObject(\"Client\").index=1; ","    jt.getObject(\"Client\").clientObj.score=0;","    ","    jt.getObject(\"Game\").restart();","    ","    //console.log(\"delay1\",jt.getObject(\"Client\").delay);","  })","  */","  ","  /*","  this.socket.on(\"delay2\",function(senderId,time){","    jt.getObject(\"Client\").started=false; ","    jt.getObject(\"Client\").playing=senderId; ","    jt.getObject(\"Client\").inviteSent=undefined;     ","    jt.getObject(\"Client\").inviteReceived=undefined;         ","    jt.getObject(\"Client\").accepted=true;     ","    jt.getObject(\"Client\").delay=jt.ceil(jt.getObject(\"Client\").delayTime/2);","    jt.getObject(\"Client\").delayTime=0;    ","    jt.getObject(\"Client\").delaySent=false;","    jt.setView(\"Loading\");","    jt.getObject(\"Client\").index=0;","    jt.getObject(\"Client\").clientObj.score=0;","    ","    jt.getObject(\"Client\").received++;    ","    if(jt.getObject(\"Client\").received>=jt.getObject(\"Client\").receivedMax){","      jt.getObject(\"Map\").generate();","      jt.getObject(\"Client\").socket.emit(\"map\",senderId,jt.getObject(\"Map\").walls,jt.getObject(\"Map\").spawns);","      jt.getObject(\"Game\").restart();","    }","  })","  */","  ","  this.socket.on(\"delay\",function(senderId,time){","    jt.getObject(\"Client\").started=false; ","    jt.getObject(\"Client\").playing=senderId; ","    jt.getObject(\"Client\").inviteSent=undefined;     ","    jt.getObject(\"Client\").inviteReceived=undefined;         ","    jt.getObject(\"Client\").accepted=true;     ","    ","    jt.setView(\"Loading\");","    jt.getObject(\"Client\").clientObj.score=0;","    ","    jt.getObject(\"Client\").received++;    ","    if(jt.getObject(\"Client\").received>=jt.getObject(\"Client\").receivedMax){","       jt.getObject(\"Client\").index=0;","      jt.getObject(\"Client\").delay=jt.ceil(jt.getObject(\"Client\").delayTime/2);","      jt.getObject(\"Client\").delayTime=0;    ","      jt.getObject(\"Client\").delaySent=false;","      jt.getObject(\"Client\").waitTime+=jt.getObject(\"Client\").delay; ","      ","      jt.getObject(\"Client\").sendMap();","    }","  })","  ","  this.socket.on(\"map\",function(senderId,walls,spawns){","    jt.getObject(\"Client\").deads=0; ","        ","    jt.getObject(\"Client\").started=false;     ","    jt.getObject(\"Client\").playing=senderId;     ","    jt.getObject(\"Client\").inviteSent=undefined;     ","    jt.getObject(\"Client\").inviteReceived=undefined;         ","    jt.getObject(\"Client\").accepted=true;     ","    jt.getObject(\"Client\").delay=jt.ceil(jt.getObject(\"Client\").delayTime/2);","    jt.getObject(\"Client\").delayTime=0;    ","    jt.getObject(\"Client\").delaySent=false;","    //jt.getObject(\"Client\").waitTime+=jt.getObject(\"Client\").delay;    ","    //jt.getObject(\"Client\").socket.emit(\"delay2\",senderId);","    jt.setView(\"Loading\");","    //jt.getObject(\"Client\").clientObj.score=0;","    ","    jt.getObject(\"Map\").walls=walls; ","    jt.getObject(\"Map\").spawns=spawns;  ","    ","    jt.getObject(\"Game\").restart();","  })","  ","  /*","  this.socket.on(\"map\",function(senderId,walls,spawns){","    jt.getObject(\"Map\").walls=walls; ","    jt.getObject(\"Map\").spawns=spawns;  ","    ","    jt.getObject(\"Game\").restart();","  })","  */","  ","  this.socket.on(\"addScore\",function(senderId){","    console.log(\"adding...\");","    jt.getObject(\"Client\").clientObj.score++; ","    //jt.getObject(\"Game\").endRound(false)","  })","  ","  this.socket.on(\"endRound\",function(senderId){","    jt.getObject(\"Game\").endRound(false)","  })","  ","  this.socket.on(\"deleteProjectile\",function(senderId,obj){","    ","    var projectiles=jt.getObject(\"Client\").clientObj.projectiles;","    for(var i=0;i<projectiles.length;i++){","      var proj=projectiles[i];","      if(jt.cRect(proj,obj)){","        jt.getObject(\"Client\").clientObj.projectiles.splice(i,1);","       \ti--; ","      }","    }","  })","  ","  this.socket.on(\"spawnPowerup\",function(powerup){","    var game=jt.getObject(\"Game\");","    game.powerupSpawn=powerup;","    game.powerupSpawnTimer=game.powerupSpawnTimerMax+jt.getObject(\"Client\").delay;","  })","  ","  this.socket.on(\"deletePowerup\",function(obj){","    var game=jt.getObject(\"Game\");","    var powerups=jt.getObject(\"Client\").powerups;","    for(var i=0;i<powerups.length;i++){","      var powerup=powerups[i];","      if(jt.cRect(powerup,obj)){","        jt.getObject(\"Client\").powerups.splice(i,1);","       \ti--; ","      }","    }","  })","  \t","  ","  this.socket.on(\"dead\",function(senderId){","    jt.getObject(\"Client\").deads++;","    if(jt.getObject(\"Client\").isHost){","    \tjt.getObject(\"Client\").checkDead(senderId);","    }","  })","  ","  this.socket.on(\"refresh\",function(lobbies){","    jt.getObject(\"Client\").lobbies=lobbies;","  })","  ","  this.socket.on(\"leave\",function(){","    jt.getObject(\"Client\").clientObj.lobby=undefined;","    jt.getObject(\"Client\").clientObj.host=undefined;    ","  })"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  if(!this.started){","    if(this.playing!=undefined){","      if(this.waitTime>0){","        this.waitTime--; ","      }else{","       \tthis.started=true; ","      }","    }","  }","  ","  this.socket.on(\"disconnected\",function(senderId){","    /*","    if(app.state==\"battle\" && app.playing==senderId){","      app.disconnected=senderId;","    }else if(app.state==\"menu\" && (app.inviteReceived==senderId || app.inviteSent==senderId)){","      app.inviteSent=undefined;","      app.inviteReceived=undefined;","","      app.playing=undefined;","","      delete serverObjs[senderId];","    }else{","      delete serverObjs[senderId];","    }","    */","    if(jt.getObject(\"Client\").playing==senderId){","     \tjt.getObject(\"Client\").playing=undefined; ","      jt.getObject(\"Client\").inviteSent=undefined; ","      jt.getObject(\"Client\").inviteReceived=undefined; ","      //go back to lobby","      jt.setView(\"Lobby\");","    }","    ","    if(jt.getObject(\"Client\").inviteSent==senderId){","     \tjt.getObject(\"Client\").inviteSent=undefined; ","    }","    ","    if(jt.getObject(\"Client\").inviteReceived==senderId){","     \tjt.getObject(\"Client\").inviteReceived=undefined; ","    }","    ","    delete jt.getObject(\"Client\").serverObjs[senderId];","  })","\t","  if(this.updateCooldown<=0){","    ","    if(this.connected){","      this.updateCooldown=this.updateCooldownMax;","      this.clientObj.playing=true;","      //console.log(\"sending\")","      this.socket.emit(\"update\",this.clientObj);","    }","  }else{","   \tthis.updateCooldown--; ","  }","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(0,0,800,130,[0,0,0],0,1,'{"text":"Lobbies","size":96,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'ENTER NAME');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	jt.camActive(false);
  
  var inverse=localStorage.getItem("launchInverse");
  if(inverse!=null){
   	if(inverse=="true"){
      jte.getObject("Player").inverse=true;
    }else{
      jte.getObject("Player").inverse=false;
    }
    jte.getObject("inverse").attr.text=!jte.getObject("Player").inverse;
  }
  
  var name=localStorage.getItem("launchName");
  if(name!=null){
   	if(name=="true"){
      jte.getObject("Player").clientObj.name=true;
    }else{
      jte.getObject("Player").clientObj.name=false;
    }
  }
};obj.update=function(){	/*Update runs at the fps specified*/
  //var player={x:64,y:32,c:[0,0,255],r:jt.frames()*6};
  //jt.getObject("Game").drawPlayer(player);  
  
	jt.camActive(true);
  jt.camReset();     
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\tjt.camActive(false);","  ","  var inverse=localStorage.getItem(\"launchInverse\");","  if(inverse!=null){","   \tif(inverse==\"true\"){","      jte.getObject(\"Player\").inverse=true;","    }else{","      jte.getObject(\"Player\").inverse=false;","    }","    jte.getObject(\"inverse\").attr.text=!jte.getObject(\"Player\").inverse;","  }","  ","  var name=localStorage.getItem(\"launchName\");","  if(name!=null){","   \tif(name==\"true\"){","      jte.getObject(\"Player\").clientObj.name=true;","    }else{","      jte.getObject(\"Player\").clientObj.name=false;","    }","  }"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  //var player={x:64,y:32,c:[0,0,255],r:jt.frames()*6};","  //jt.getObject(\"Game\").drawPlayer(player);  ","  ","\tjt.camActive(true);","  jt.camReset();     ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(20,20,400,100,[0,0,0],0,1,'{"text":"Lobby","size":96,"align":"left","font":"Consolas"}',true,'Lobby','[""]',false,-1,'Obj1765');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	jt.camActive(false);
  
  var inverse=localStorage.getItem("launchInverse");
  if(inverse!=null){
   	if(inverse=="true"){
      jte.getObject("Player").inverse=true;
    }else{
      jte.getObject("Player").inverse=false;
    }
    jte.getObject("inverse").attr.text=!jte.getObject("Player").inverse;
  }
  
  var name=localStorage.getItem("launchName");
  if(name!=null){
   	if(name=="true"){
      jte.getObject("Player").clientObj.name=true;
    }else{
      jte.getObject("Player").clientObj.name=false;
    }
  }
};obj.update=function(){	/*Update runs at the fps specified*/
	jt.camActive(true);
  jt.camReset();     
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\tjt.camActive(false);","  ","  var inverse=localStorage.getItem(\"launchInverse\");","  if(inverse!=null){","   \tif(inverse==\"true\"){","      jte.getObject(\"Player\").inverse=true;","    }else{","      jte.getObject(\"Player\").inverse=false;","    }","    jte.getObject(\"inverse\").attr.text=!jte.getObject(\"Player\").inverse;","  }","  ","  var name=localStorage.getItem(\"launchName\");","  if(name!=null){","   \tif(name==\"true\"){","      jte.getObject(\"Player\").clientObj.name=true;","    }else{","      jte.getObject(\"Player\").clientObj.name=false;","    }","  }"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjt.camActive(true);","  jt.camReset();     ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(150,250,480,60,[0,0,0],0,1,'{"text":"Current username:","size":24,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'Name');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	//jt.camActive(false);
  
  
};obj.update=function(){	/*Update runs at the fps specified*/
 	this.attr.text="Current username: "+jt.getObject("Client").clientObj.name;
  jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t//jt.camActive(false);","  ","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/"," \tthis.attr.text=\"Current username: \"+jt.getObject(\"Client\").clientObj.name;","  jte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(280,20,280,60,[0,0,0],0,1,'{"text":"Username","size":24,"align":"center","font":"Consolas"}',true,'Lobby','[""]',false,-1,'Obj1789');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	//jt.camActive(false);
  
  
};obj.update=function(){	/*Update runs at the fps specified*/
 	this.attr.text="Current username: "+jt.getObject("Client").clientObj.name;
  jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t//jt.camActive(false);","  ","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/"," \tthis.attr.text=\"Current username: \"+jt.getObject(\"Client\").clientObj.name;","  jte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(560,20,220,40,[0,0,0],0,1,'{"text":"Color:","size":24,"align":"center","font":"Consolas"}',true,'Lobby','[""]',false,-1,'Color');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	//jt.camActive(false);
  
  
};obj.update=function(){	/*Update runs at the fps specified*/
 	var client=jt.getObject("Client");
  var colors=jt.getObjects(["Color"]);
  for(var i=0;i<colors.length;i++){
    var color=colors[i]; 
    if(jt.mPress(color) || jt.tPress(color)){
     	client.clientObj.c=color.c; 
    }
   	if(color.c[0]==client.clientObj.c[0] && color.c[1]==client.clientObj.c[1] && color.c[2]==client.clientObj.c[2]){
      var padding=5;
      jt.rect(color.x-padding,color.y-padding,color.w+padding*2,color.h+padding*2,"black");
    }
  }
  
  jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t//jt.camActive(false);","  ","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/"," \tvar client=jt.getObject(\"Client\");","  var colors=jt.getObjects([\"Color\"]);","  for(var i=0;i<colors.length;i++){","    var color=colors[i]; ","    if(jt.mPress(color) || jt.tPress(color)){","     \tclient.clientObj.c=color.c; ","    }","   \tif(color.c[0]==client.clientObj.c[0] && color.c[1]==client.clientObj.c[1] && color.c[2]==client.clientObj.c[2]){","      var padding=5;","      jt.rect(color.x-padding,color.y-padding,color.w+padding*2,color.h+padding*2,\"black\");","    }","  }","  ","  jte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(0,420,800,60,[255,0,0],0,1,'{"text":"","size":24,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'Error');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	//jt.camActive(false);
  
  
};obj.update=function(){	/*Update runs at the fps specified*/
 	//this.attr.text="Current username: "+jt.getObject("Client").playerName;
  jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t//jt.camActive(false);","  ","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/"," \t//this.attr.text=\"Current username: \"+jt.getObject(\"Client\").playerName;","  jte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(150,170,480,60,[127,127,127],0,1,'undefined',true,'Start','[""]',false,-1,'BtnChange');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  if(jt.mIn(this)){
   	jte.getObject("BtnChange").c=[200,200,200]
  }else{
    jte.getObject("BtnChange").c=[127,127,127]
  }
  
  var keyboard=jte.getObject("keyboard");
  
  if(keyboard.finished){
    keyboard.finished=false;
     if(keyboard.str.trim()!=""){
    	jte.getObject("Client").clientObj.name=keyboard.str;
    }
  }
  
	if(jt.mPress(this) || jt.tPress(this)){
    keyboard.start("Write your username","");
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  if(jt.mIn(this)){","   \tjte.getObject(\"BtnChange\").c=[200,200,200]","  }else{","    jte.getObject(\"BtnChange\").c=[127,127,127]","  }","  ","  var keyboard=jte.getObject(\"keyboard\");","  ","  if(keyboard.finished){","    keyboard.finished=false;","     if(keyboard.str.trim()!=\"\"){","    \tjte.getObject(\"Client\").clientObj.name=keyboard.str;","    }","  }","  ","\tif(jt.mPress(this) || jt.tPress(this)){","    keyboard.start(\"Write your username\",\"\");","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(300,80,220,40,[127,127,127],0,1,'undefined',true,'Lobby','[""]',false,-1,'BtnChange2');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  if(jt.mIn(this)){
   	jte.getObject("BtnChange2").c=[200,200,200]
  }else{
    jte.getObject("BtnChange2").c=[127,127,127]
  }
  
  var keyboard=jte.getObject("keyboard");
  
  if(keyboard.finished){
    keyboard.finished=false;
    if(keyboard.str.trim()!=""){
    	jte.getObject("Client").clientObj.name=keyboard.str;
    }
     //jt.stopPlay("pick");
  }
  
	if(jt.mPress(this) || jt.tPress(this)){
    keyboard.start("Write your username","");
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  if(jt.mIn(this)){","   \tjte.getObject(\"BtnChange2\").c=[200,200,200]","  }else{","    jte.getObject(\"BtnChange2\").c=[127,127,127]","  }","  ","  var keyboard=jte.getObject(\"keyboard\");","  ","  if(keyboard.finished){","    keyboard.finished=false;","    if(keyboard.str.trim()!=\"\"){","    \tjte.getObject(\"Client\").clientObj.name=keyboard.str;","    }","     //jt.stopPlay(\"pick\");","  }","  ","\tif(jt.mPress(this) || jt.tPress(this)){","    keyboard.start(\"Write your username\",\"\");","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(560,50,40,40,[193,0,0],0,1,'undefined',true,'Lobby','["Color","red"]',false,-1,'Obj26');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(560,110,40,40,[193,0,193],0,1,'undefined',true,'Lobby','["Color","pink"]',false,-1,'Obj30');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(620,50,40,40,[0,127,0],0,1,'undefined',true,'Lobby','["Color","green"]',false,-1,'Obj27');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(620,110,40,40,[0,193,193],0,1,'undefined',true,'Lobby','["Color","cyan"]',false,-1,'Obj31');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(680,50,40,40,[0,0,255],0,1,'undefined',true,'Lobby','["Color","blue"]',false,-1,'Obj28');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(680,110,40,40,[63,0,127],0,1,'undefined',true,'Lobby','["Color","purple"]',false,-1,'Obj32');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(740,50,40,40,[127,127,0],0,1,'undefined',true,'Lobby','["Color","yellow"]',false,-1,'Obj29');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(740,110,40,40,[127,63,0],0,1,'undefined',true,'Lobby','["Color","orange"]',false,-1,'Obj33');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(150,480,480,70,[127,127,127],0,1,'undefined',true,'Start','[""]',false,-1,'BtnConnect');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	if(jt.mIn(this)){
   	jte.getObject("BtnConnect").c=[200,200,200]
  }else{
    jte.getObject("BtnConnect").c=[127,127,127]
  }
	if(jt.mPress(this) || jt.tPress(this)){
    if(jt.getObject("Client").clientObj.name.trim()!=""){
     	jt.setView("Lobby"); 
      jt.getObject("Client").socket.emit("refresh"); 
    }else{
     jt.getObject("Error").attr.text="Username can't be empty !"; 
    }
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tif(jt.mIn(this)){","   \tjte.getObject(\"BtnConnect\").c=[200,200,200]","  }else{","    jte.getObject(\"BtnConnect\").c=[127,127,127]","  }","\tif(jt.mPress(this) || jt.tPress(this)){","    if(jt.getObject(\"Client\").clientObj.name.trim()!=\"\"){","     \tjt.setView(\"Lobby\"); ","      jt.getObject(\"Client\").socket.emit(\"refresh\"); ","    }else{","     jt.getObject(\"Error\").attr.text=\"Username can't be empty !\"; ","    }","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(150,190,480,30,[0,0,0],0,1,'{"text":"Change username","size":24,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'Obj1791');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(300,90,220,40,[0,0,0],0,1,'{"text":"Change username","size":24,"align":"center","font":"Consolas"}',true,'Lobby','[""]',false,-1,'Obj17');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(150,500,480,30,[0,0,0],0,1,'{"text":"Connect","size":24,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'Obj1496');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(280,-90,310,70,[0,0,255],0,1,'{"text":"Loading","size":64,"font":"Consolas","align":"left"}',true,'Loading','[""]',false,-1,'Loading');/*Attributes and methods go here*/


;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  var client=jt.getObject("Client");
  
  if(!client.started){
    var name=client.serverObjs[client.playing].name;
    var c=client.serverObjs[client.playing].c;
    
    
    var second=jt.round(client.waitTime/60,1);
    jt.getObject("WaitText").attr.text="Starting in "+second+"s left";
    
    var delay=jt.round(client.delay/60,3);
    jt.getObject("DelayText").attr.text="Delay: "+delay+"s";    
    
    //Show score
    var player=client.clientObj;
    jt.fontSize(14);
  	jt.text("Your score: "+player.score,5,5,"black","left");
    
  
    //Draw players
    var serverObjs=client.serverObjs;
    var keys=Object.keys(serverObjs);
    var len=Object.keys(serverObjs).length;

    var index=1;
    var vsText="";
    for (var i = 0; i < len; i++) {
      var other = serverObjs[keys[i]];
      if(client.playings.indexOf(keys[i])!=-1){
        if(vsText==""){
         	vsText+=other.name; 
        }else{
          vsText+=", "+other.name;
        }
        
        jt.text("Enemy score: "+other.score,jt.w()-5,5,"black","right");
        
        var text=other.name;
        var textW=jt.textW(text);
        var margin=2;
        jt.rect(other.x+this.playerW/2-textW/2-margin,other.y-jt.fontSize()-margin,textW+margin*2,jt.fontSize()+margin*2,[255,255,255,0.5])
        jt.text(text,other.x+this.playerW/2,other.y-jt.fontSize(),"black","center");
        jt.text(other.name+" score: "+other.score,(index*(jt.w()/5))+5,5,"white","left");

        index++;
        
      }
    }
    
    jt.getObject("VsText").attr.text="Vs "+vsText;
  }else{
   	jt.setView("Game"); 
  }
  
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/","",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  var client=jt.getObject(\"Client\");","  ","  if(!client.started){","    var name=client.serverObjs[client.playing].name;","    var c=client.serverObjs[client.playing].c;","    ","    ","    var second=jt.round(client.waitTime/60,1);","    jt.getObject(\"WaitText\").attr.text=\"Starting in \"+second+\"s left\";","    ","    var delay=jt.round(client.delay/60,3);","    jt.getObject(\"DelayText\").attr.text=\"Delay: \"+delay+\"s\";    ","    ","    //Show score","    var player=client.clientObj;","    jt.fontSize(14);","  \tjt.text(\"Your score: \"+player.score,5,5,\"black\",\"left\");","    ","  ","    //Draw players","    var serverObjs=client.serverObjs;","    var keys=Object.keys(serverObjs);","    var len=Object.keys(serverObjs).length;","","    var index=1;","    var vsText=\"\";","    for (var i = 0; i < len; i++) {","      var other = serverObjs[keys[i]];","      if(client.playings.indexOf(keys[i])!=-1){","        if(vsText==\"\"){","         \tvsText+=other.name; ","        }else{","          vsText+=\", \"+other.name;","        }","        ","        jt.text(\"Enemy score: \"+other.score,jt.w()-5,5,\"black\",\"right\");","        ","        var text=other.name;","        var textW=jt.textW(text);","        var margin=2;","        jt.rect(other.x+this.playerW/2-textW/2-margin,other.y-jt.fontSize()-margin,textW+margin*2,jt.fontSize()+margin*2,[255,255,255,0.5])","        jt.text(text,other.x+this.playerW/2,other.y-jt.fontSize(),\"black\",\"center\");","        jt.text(other.name+\" score: \"+other.score,(index*(jt.w()/5))+5,5,\"white\",\"left\");","","        index++;","        ","      }","    }","    ","    jt.getObject(\"VsText\").attr.text=\"Vs \"+vsText;","  }else{","   \tjt.setView(\"Game\"); ","  }","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(192,320,390,100,[0,0,255],0,1,'{"text":"LobbyList","size":64,"font":"Consolas","align":"center"}',true,'Lobby','[""]',false,-1,'LobbyList');/*Attributes and methods go here*/
obj.page=0;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var client=jt.getObject("Client");
  var serverObjs=client.serverObjs;
  
  //this.attr.text="Players: ";
  var btnMarginX=40;
  var btnMarginY=10;  
  var btnH=40;  
  jt.fontSize(20);
  
  var lobbies=client.lobbies;
  
  if(jt.kPress("r")){
   	client.socket.emit("refresh"); 
  }
  
  var startY=jt.h()*(2/4)+10+jt.fontSize()*3;
  
  //show player online
  var playersText="";
  var players=[];
  var playersC=[];
  var keys=Object.keys(serverObjs);
  var len=Object.keys(serverObjs).length;

  for (var i = 0; i < len; i++) {
    var other = serverObjs[keys[i]];
    if(playersText==""){
     	playersText+=other.name; 
    }else{
      playersText+=", "+other.name; 
    }
    players.push(other.name);
    playersC.push(other.c);
  }
  
  var spacing=(jt.w()/players.length);
  for(var i=0;i<players.length;i++){
    jt.text(players[i],spacing/2+(spacing*i),startY-jt.fontSize()*2,playersC[i],"center");    
  }
  
  jt.text("Online:",jt.w()/2,startY-jt.fontSize()*3,"black","center");
  
  if(client.clientObj.lobby==undefined){
    var keys = Object.keys(serverObjs);
    var len=Object.keys(serverObjs).length;
    var i=0;
    for (var lobby of lobbies) {
      var index=(i%5);
      var btnY=startY+index*(btnH+btnMarginY);
      var btn={x:btnMarginX,y:btnY,w:jt.w()-btnMarginX*2,h:btnH,c:[127,127,127],text:lobby};

      if(client.clientObj.lobby==undefined){
        if(jt.mIn(btn)){
          btn.c=[200,200,200];
        }
        if(jt.mPress(btn) || jt.tPress(btn)){
          client.socket.emit("join",lobby);
          client.clientObj.lobby=lobby;
          client.clientObj.host=undefined; 
          client.isHost=false;
          /*
          client.accepted=true;
          client.inviteSent=keys[i];          
          client.delaySent=false;
          client.delayTime=0;
          client.playing=undefined;
          */
        }
      }

      jt.rect(btn);
      jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),"black","center")
      //this.attr.text+=val.name+" ";
      // use val
      /*
        if(val.name!="" && val.battle==false){
          if((jt.mPress(50,200+(index*50),jt.w()-100,40) || jt.tPress(50,200+(index*50),jt.w()-100,40)) && this.inviteSent==undefined && this.inviteReceived==undefined){
            //send invite to other player
            socket.emit("invite",keys[i]);
            this.inviteSent=keys[i];
            jt.clearPart();
            jt.stopPlay("steal");
          }
        }
        */
      i++;
    }
    
    //Create lobby button
    var btn={x:btnMarginX,y:jt.h()-btnH,w:jt.w()-btnMarginX*2,h:btnH,c:[127,127,127],text:"Create lobby"};

    if(jt.mIn(btn)){
      btn.c=[200,200,200];
    }
    if(jt.mPress(btn) || jt.tPress(btn)){
      var name=client.clientObj.name+"'s lobby";
      client.socket.emit("create",name);
      client.clientObj.lobby=name;
      client.clientObj.host=name;     
      client.isHost=true;
      
    }
    
    jt.rect(btn);
    jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),"black","center")
    
  }else{
    var lobby=client.clientObj.lobby;
    jt.text(lobby,jt.w()/2,startY,"black","center");
    
    //Get all other players
    var keys=Object.keys(serverObjs);
    var len=Object.keys(serverObjs).length;
    var withs=[];
    var withsName=[];    
    var withsC=[];
    var withsText="";

    for (var i = 0; i < len; i++) {
      var other = serverObjs[keys[i]];
      if(lobby==other.lobby){
        var host="";
        if(lobby==other.host){
          host="(Host)";
        }
        withs.push(keys[i]);
        withsName.push(other.name+host);
        withsC.push(other.c)
        if(withsText==""){
        	withsText+=other.name+host
        }else{
          withsText+=", "+other.name+host
        }
      }
    }
    
    client.withs=withs;
    client.playings=withs;    
    
    jt.text("With:",jt.w()/2,startY+jt.fontSize(),"black","center");
    var spacing=(jt.w()/withsName.length);
    for(var i=0;i<withsName.length;i++){
     	 jt.text(withsName[i],spacing/2+(spacing*i),startY+jt.fontSize()*2,withsC[i],"center");    
    }
    
    
    if(client.clientObj.host==lobby && withs.length>0){
      var btn={x:btnMarginX,y:startY+jt.fontSize()*4,w:jt.w()-btnMarginX*2,h:btnH,c:[127,127,127],text:"Start game"};

      if(jt.mIn(btn)){
        btn.c=[200,200,200];
      }
      if(jt.mPress(btn) || jt.tPress(btn)){
        client.waitTime=client.waitSecond*60;
        client.received=0;
        client.receivedMax=withs.length;        
        client.delayTime=0;                
        client.delaySent=true;      
        client.accepted=true; 
        client.index=0;
        client.socket.emit("start",withs);        
        client.playing=undefined;
        //client.inviteReceived=undefined;

      }

      jt.rect(btn);
      jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),"black","center")
    }
    
    
    
    var btn={x:btnMarginX,y:startY+jt.fontSize()*7,w:jt.w()-btnMarginX*2,h:btnH,c:[127,127,127],text:"Leave "+lobby};
    if(client.clientObj.host==lobby){
     	btn.text="Leave and delete "+lobby; 
    }

    if(jt.mIn(btn)){
      btn.c=[200,200,200];
    }
    if(jt.mPress(btn) || jt.tPress(btn)){
      if(client.clientObj.host==lobby){
        client.socket.emit("delete",lobby);
      }else{
      	client.socket.emit("leave",lobby);
      }
      
      client.clientObj.lobby=undefined;
      client.clientObj.host=undefined;  
      client.isHost=false;
      
    }
    
    jt.rect(btn);
    jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),"black","center")
  }
  
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.page=0;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar client=jt.getObject(\"Client\");","  var serverObjs=client.serverObjs;","  ","  //this.attr.text=\"Players: \";","  var btnMarginX=40;","  var btnMarginY=10;  ","  var btnH=40;  ","  jt.fontSize(20);","  ","  var lobbies=client.lobbies;","  ","  if(jt.kPress(\"r\")){","   \tclient.socket.emit(\"refresh\"); ","  }","  ","  var startY=jt.h()*(2/4)+10+jt.fontSize()*3;","  ","  //show player online","  var playersText=\"\";","  var players=[];","  var playersC=[];","  var keys=Object.keys(serverObjs);","  var len=Object.keys(serverObjs).length;","","  for (var i = 0; i < len; i++) {","    var other = serverObjs[keys[i]];","    if(playersText==\"\"){","     \tplayersText+=other.name; ","    }else{","      playersText+=\", \"+other.name; ","    }","    players.push(other.name);","    playersC.push(other.c);","  }","  ","  var spacing=(jt.w()/players.length);","  for(var i=0;i<players.length;i++){","    jt.text(players[i],spacing/2+(spacing*i),startY-jt.fontSize()*2,playersC[i],\"center\");    ","  }","  ","  jt.text(\"Online:\",jt.w()/2,startY-jt.fontSize()*3,\"black\",\"center\");","  ","  if(client.clientObj.lobby==undefined){","    var keys = Object.keys(serverObjs);","    var len=Object.keys(serverObjs).length;","    var i=0;","    for (var lobby of lobbies) {","      var index=(i%5);","      var btnY=startY+index*(btnH+btnMarginY);","      var btn={x:btnMarginX,y:btnY,w:jt.w()-btnMarginX*2,h:btnH,c:[127,127,127],text:lobby};","","      if(client.clientObj.lobby==undefined){","        if(jt.mIn(btn)){","          btn.c=[200,200,200];","        }","        if(jt.mPress(btn) || jt.tPress(btn)){","          client.socket.emit(\"join\",lobby);","          client.clientObj.lobby=lobby;","          client.clientObj.host=undefined; ","          client.isHost=false;","          /*","          client.accepted=true;","          client.inviteSent=keys[i];          ","          client.delaySent=false;","          client.delayTime=0;","          client.playing=undefined;","          */","        }","      }","","      jt.rect(btn);","      jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),\"black\",\"center\")","      //this.attr.text+=val.name+\" \";","      // use val","      /*","        if(val.name!=\"\" && val.battle==false){","          if((jt.mPress(50,200+(index*50),jt.w()-100,40) || jt.tPress(50,200+(index*50),jt.w()-100,40)) && this.inviteSent==undefined && this.inviteReceived==undefined){","            //send invite to other player","            socket.emit(\"invite\",keys[i]);","            this.inviteSent=keys[i];","            jt.clearPart();","            jt.stopPlay(\"steal\");","          }","        }","        */","      i++;","    }","    ","    //Create lobby button","    var btn={x:btnMarginX,y:jt.h()-btnH,w:jt.w()-btnMarginX*2,h:btnH,c:[127,127,127],text:\"Create lobby\"};","","    if(jt.mIn(btn)){","      btn.c=[200,200,200];","    }","    if(jt.mPress(btn) || jt.tPress(btn)){","      var name=client.clientObj.name+\"'s lobby\";","      client.socket.emit(\"create\",name);","      client.clientObj.lobby=name;","      client.clientObj.host=name;     ","      client.isHost=true;","      ","    }","    ","    jt.rect(btn);","    jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),\"black\",\"center\")","    ","  }else{","    var lobby=client.clientObj.lobby;","    jt.text(lobby,jt.w()/2,startY,\"black\",\"center\");","    ","    //Get all other players","    var keys=Object.keys(serverObjs);","    var len=Object.keys(serverObjs).length;","    var withs=[];","    var withsName=[];    ","    var withsC=[];","    var withsText=\"\";","","    for (var i = 0; i < len; i++) {","      var other = serverObjs[keys[i]];","      if(lobby==other.lobby){","        var host=\"\";","        if(lobby==other.host){","          host=\"(Host)\";","        }","        withs.push(keys[i]);","        withsName.push(other.name+host);","        withsC.push(other.c)","        if(withsText==\"\"){","        \twithsText+=other.name+host","        }else{","          withsText+=\", \"+other.name+host","        }","      }","    }","    ","    client.withs=withs;","    client.playings=withs;    ","    ","    jt.text(\"With:\",jt.w()/2,startY+jt.fontSize(),\"black\",\"center\");","    var spacing=(jt.w()/withsName.length);","    for(var i=0;i<withsName.length;i++){","     \t jt.text(withsName[i],spacing/2+(spacing*i),startY+jt.fontSize()*2,withsC[i],\"center\");    ","    }","    ","    ","    if(client.clientObj.host==lobby && withs.length>0){","      var btn={x:btnMarginX,y:startY+jt.fontSize()*4,w:jt.w()-btnMarginX*2,h:btnH,c:[127,127,127],text:\"Start game\"};","","      if(jt.mIn(btn)){","        btn.c=[200,200,200];","      }","      if(jt.mPress(btn) || jt.tPress(btn)){","        client.waitTime=client.waitSecond*60;","        client.received=0;","        client.receivedMax=withs.length;        ","        client.delayTime=0;                ","        client.delaySent=true;      ","        client.accepted=true; ","        client.index=0;","        client.socket.emit(\"start\",withs);        ","        client.playing=undefined;","        //client.inviteReceived=undefined;","","      }","","      jt.rect(btn);","      jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),\"black\",\"center\")","    }","    ","    ","    ","    var btn={x:btnMarginX,y:startY+jt.fontSize()*7,w:jt.w()-btnMarginX*2,h:btnH,c:[127,127,127],text:\"Leave \"+lobby};","    if(client.clientObj.host==lobby){","     \tbtn.text=\"Leave and delete \"+lobby; ","    }","","    if(jt.mIn(btn)){","      btn.c=[200,200,200];","    }","    if(jt.mPress(btn) || jt.tPress(btn)){","      if(client.clientObj.host==lobby){","        client.socket.emit(\"delete\",lobby);","      }else{","      \tclient.socket.emit(\"leave\",lobby);","      }","      ","      client.clientObj.lobby=undefined;","      client.clientObj.host=undefined;  ","      client.isHost=false;","      ","    }","    ","    jt.rect(btn);","    jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),\"black\",\"center\")","  }","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(-416,320,390,100,[0,0,255],0,1,'{"text":"PlayerList","size":64,"font":"Consolas","align":"center"}',true,'Lobby','[""]',false,-1,'Obj24');/*Attributes and methods go here*/
obj.page=0;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  /*
	var client=jt.getObject("Client");
  var serverObjs=client.serverObjs;
  
  //this.attr.text="Players: ";
  var btnMarginX=40;
  var btnMarginY=10;  
  var btnH=40;  
  jt.fontSize(20);
  
  var keys = Object.keys(serverObjs);
  var len=Object.keys(serverObjs).length;
  for (var i = this.page*4; i < (this.page+1)*4; i++) {
    if(i<=len-1){
      var val = serverObjs[keys[i]];
      var index=(i%4);
      var btnY=jt.h()*(2/4)+index*(btnH+btnMarginY)+10;
      var btn={x:btnMarginX,y:btnY,w:jt.w()-btnMarginX*2,h:btnH,c:[127,127,127],text:val.name};
      
      if(client.inviteSent==undefined && client.inviteReceived==undefined){
        if(jt.mIn(btn)){
          btn.c=[200,200,200];
        }
        if(jt.mPress(btn) || jt.tPress(btn)){
            client.socket.emit("invite",keys[i]);
            client.accepted=true;
            client.inviteSent=keys[i];          
          	client.delaySent=false;
          	client.delayTime=0;
          	client.playing=undefined;
        }
      }
      
      jt.rect(btn);
      jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),"black","center")
      //this.attr.text+=val.name+" ";
      // use val
    }else{
      break;
    }
  }
  */
  
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.page=0;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  /*","\tvar client=jt.getObject(\"Client\");","  var serverObjs=client.serverObjs;","  ","  //this.attr.text=\"Players: \";","  var btnMarginX=40;","  var btnMarginY=10;  ","  var btnH=40;  ","  jt.fontSize(20);","  ","  var keys = Object.keys(serverObjs);","  var len=Object.keys(serverObjs).length;","  for (var i = this.page*4; i < (this.page+1)*4; i++) {","    if(i<=len-1){","      var val = serverObjs[keys[i]];","      var index=(i%4);","      var btnY=jt.h()*(2/4)+index*(btnH+btnMarginY)+10;","      var btn={x:btnMarginX,y:btnY,w:jt.w()-btnMarginX*2,h:btnH,c:[127,127,127],text:val.name};","      ","      if(client.inviteSent==undefined && client.inviteReceived==undefined){","        if(jt.mIn(btn)){","          btn.c=[200,200,200];","        }","        if(jt.mPress(btn) || jt.tPress(btn)){","            client.socket.emit(\"invite\",keys[i]);","            client.accepted=true;","            client.inviteSent=keys[i];          ","          \tclient.delaySent=false;","          \tclient.delayTime=0;","          \tclient.playing=undefined;","        }","      }","      ","      jt.rect(btn);","      jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),\"black\",\"center\")","      //this.attr.text+=val.name+\" \";","      // use val","    }else{","      break;","    }","  }","  */","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(210,180,390,100,[0,0,255],0,1,'{"text":"Chat","size":64,"font":"Consolas","align":"center"}',true,'Lobby','[""]',false,-1,'Chat');/*Attributes and methods go here*/
obj.messages=[];
obj.messagesC=[];
obj.message="";

obj.messageMax=50;

obj.backspaceTimer=0;
obj.backspaceTimerMax=15;
obj.backspaceInterval=2;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var client=jt.getObject("Client");
  var serverObjs=client.serverObjs;
  
  jt.fontSize(20);
  
  var margin=20;
  jt.rect(margin,jt.h()*(1/4),jt.w()-margin*2,jt.h()*(1/4),[200,200,200]);
  
  var special=false;
  if(jt.kCheck("shift")){
   	if(jt.kPress("1")){
      this.message+="!"; 
      special=true;
    }else if(jt.kPress("2")){
      this.message+="@";
       special=true;
    }else if(jt.kPress("3")){
      this.message+="#";
       special=true;
    }else if(jt.kPress("4")){
      this.message+="$";
       special=true;
    }else if(jt.kPress("5")){
      this.message+="%";
       special=true;
    }else if(jt.kPress("6")){
      this.message+="?";
       special=true;
    }else if(jt.kPress("7")){
      this.message+="&";
       special=true;
    }else if(jt.kPress("8")){
      this.message+="*"; 
       special=true;
    }
  }
  
  var keys=["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z","0","1","2","3","4","5","6","7","8","9"];
	if(!special){
    for(var key of keys){
      if(jt.kPress(key)){
        if(jt.kCheck("shift")){
          this.message+=key.toUpperCase(); 
        }else{
          this.message+=key; 
        }

      }
    }
  }
  
  if(jt.kPress("backspace")){
    if(this.message.length>0){
      this.message=this.message.slice(0,this.message.length-1);
    }
  }else{
   	if(jt.kCheck("backspace")){
     	this.backspaceTimer++; 
      if(this.backspaceTimer>=this.backspaceTimerMax){
        if(this.backspaceTimer%this.backspaceInterval==0){
          if(this.message.length>0){
          	this.message=this.message.slice(0,this.message.length-1);
          }
        }
      }
    }else{
     	this.backspaceTimer=0; 
    }
  }

	if(jt.kPress("space")){
   	this.message+=" "; 
  }

	if(this.message.trim()!="" && jt.kPress("enter")){
    this.message=client.clientObj.name+": "+this.message;
    client.socket.emit("chat message",this.message,client.clientObj.c);
    this.message=""; 
  }
  
  if(this.message.length>this.messageMax){
    this.message=this.message.slice(0,this.message.length-1);
  }
  
  var message=this.message;
  var messageW=jt.textW("a")*(this.messageMax+1);
  jt.rect(margin+5,jt.h()*(2/4)-jt.fontSize()-5,messageW,jt.fontSize(),"white");
  
  if(message==""){
   	jt.text("Aa",margin+5,jt.h()*(2/4)-jt.fontSize()-5,[127,127,127],"left");
  }else{
    jt.text(message,margin+5,jt.h()*(2/4)-jt.fontSize()-5,client.clientObj.c,"left");
  }
  
  jt.text("Enter to send",jt.w()-margin-5,jt.h()*(2/4)-jt.fontSize()-5,[127,127,127],"right");
  
  //Show messages
  var start=0;
  var max=6;
  if(this.messages.length-max>=0){
   	start=this.messages.length-max;
  }
  var index=0;
  for(var i=start;i<this.messages.length;i++){
    var msg=this.messages[i];
    jt.text(msg,margin+5,jt.h()*(1/4)+5+(jt.fontSize()*(index)),this.messagesC[i],"left");
    if(index>0){
     	jt.rect(margin+5,jt.h()*(1/4)+5+(jt.fontSize()*(index)),jt.w()-margin*2-10,1,[0,0,0,0.5]); 
    }
    index++;
  }
  
  
  //jt.text("Enter to send")  
  
  var keys = Object.keys(serverObjs);
  var len=Object.keys(serverObjs).length;
  
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.messages=[];","obj.messagesC=[];","obj.message=\"\";","","obj.messageMax=50;","","obj.backspaceTimer=0;","obj.backspaceTimerMax=15;","obj.backspaceInterval=2;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar client=jt.getObject(\"Client\");","  var serverObjs=client.serverObjs;","  ","  jt.fontSize(20);","  ","  var margin=20;","  jt.rect(margin,jt.h()*(1/4),jt.w()-margin*2,jt.h()*(1/4),[200,200,200]);","  ","  var special=false;","  if(jt.kCheck(\"shift\")){","   \tif(jt.kPress(\"1\")){","      this.message+=\"!\"; ","      special=true;","    }else if(jt.kPress(\"2\")){","      this.message+=\"@\";","       special=true;","    }else if(jt.kPress(\"3\")){","      this.message+=\"#\";","       special=true;","    }else if(jt.kPress(\"4\")){","      this.message+=\"$\";","       special=true;","    }else if(jt.kPress(\"5\")){","      this.message+=\"%\";","       special=true;","    }else if(jt.kPress(\"6\")){","      this.message+=\"?\";","       special=true;","    }else if(jt.kPress(\"7\")){","      this.message+=\"&\";","       special=true;","    }else if(jt.kPress(\"8\")){","      this.message+=\"*\"; ","       special=true;","    }","  }","  ","  var keys=[\"a\", \"b\", \"c\", \"d\", \"e\", \"f\", \"g\", \"h\", \"i\", \"j\", \"k\", \"l\", \"m\", \"n\", \"o\", \"p\", \"q\", \"r\", \"s\", \"t\", \"u\", \"v\", \"w\", \"x\", \"y\", \"z\",\"0\",\"1\",\"2\",\"3\",\"4\",\"5\",\"6\",\"7\",\"8\",\"9\"];","\tif(!special){","    for(var key of keys){","      if(jt.kPress(key)){","        if(jt.kCheck(\"shift\")){","          this.message+=key.toUpperCase(); ","        }else{","          this.message+=key; ","        }","","      }","    }","  }","  ","  if(jt.kPress(\"backspace\")){","    if(this.message.length>0){","      this.message=this.message.slice(0,this.message.length-1);","    }","  }else{","   \tif(jt.kCheck(\"backspace\")){","     \tthis.backspaceTimer++; ","      if(this.backspaceTimer>=this.backspaceTimerMax){","        if(this.backspaceTimer%this.backspaceInterval==0){","          if(this.message.length>0){","          \tthis.message=this.message.slice(0,this.message.length-1);","          }","        }","      }","    }else{","     \tthis.backspaceTimer=0; ","    }","  }","","\tif(jt.kPress(\"space\")){","   \tthis.message+=\" \"; ","  }","","\tif(this.message.trim()!=\"\" && jt.kPress(\"enter\")){","    this.message=client.clientObj.name+\": \"+this.message;","    client.socket.emit(\"chat message\",this.message,client.clientObj.c);","    this.message=\"\"; ","  }","  ","  if(this.message.length>this.messageMax){","    this.message=this.message.slice(0,this.message.length-1);","  }","  ","  var message=this.message;","  var messageW=jt.textW(\"a\")*(this.messageMax+1);","  jt.rect(margin+5,jt.h()*(2/4)-jt.fontSize()-5,messageW,jt.fontSize(),\"white\");","  ","  if(message==\"\"){","   \tjt.text(\"Aa\",margin+5,jt.h()*(2/4)-jt.fontSize()-5,[127,127,127],\"left\");","  }else{","    jt.text(message,margin+5,jt.h()*(2/4)-jt.fontSize()-5,client.clientObj.c,\"left\");","  }","  ","  jt.text(\"Enter to send\",jt.w()-margin-5,jt.h()*(2/4)-jt.fontSize()-5,[127,127,127],\"right\");","  ","  //Show messages","  var start=0;","  var max=6;","  if(this.messages.length-max>=0){","   \tstart=this.messages.length-max;","  }","  var index=0;","  for(var i=start;i<this.messages.length;i++){","    var msg=this.messages[i];","    jt.text(msg,margin+5,jt.h()*(1/4)+5+(jt.fontSize()*(index)),this.messagesC[i],\"left\");","    if(index>0){","     \tjt.rect(margin+5,jt.h()*(1/4)+5+(jt.fontSize()*(index)),jt.w()-margin*2-10,1,[0,0,0,0.5]); ","    }","    index++;","  }","  ","  ","  //jt.text(\"Enter to send\")  ","  ","  var keys = Object.keys(serverObjs);","  var len=Object.keys(serverObjs).length;","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(-352,480,300,90,[0,0,255],0,1,'{"text":"Invite","size":64,"font":"Consolas","align":"left"}',true,'Lobby','[""]',false,-1,'Invite');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var client=jt.getObject("Client");
  
  var btnMarginX=40;
  var btnMarginY=10;  
  var btnH=40;
  
  jt.fontSize(20);
  /*
  var text="Test";
  if(client.clientObj.lobby!=undefined){
    text=client.clientObj.lobby;
  }
  jt.text(text,jt.w()/2,jt.h()-jt.fontSize(),"black","center");
  
  
  if(client.inviteReceived!=undefined){
   	jt.rect(0,jt.h()-btnH,jt.w(),btnH,[0,0,0]);
    
    var name=client.serverObjs[client.inviteReceived].name;
    var c=client.serverObjs[client.inviteReceived].c;
    jt.text("Invite received from "+name,10,jt.h()-btnH/2-jt.fontSize()/2,"white","left");
    
    //Refuse button
    var btnMargin=20;
    var btnW=80;
    var btnSmallH=30;
    var btn={x:jt.w()-btnMargin-btnW,y:jt.h()-btnH+(btnH-btnSmallH)/2,w:btnW,h:btnSmallH,c:[127,127,127],text:"Refuse"};
    
    if(jt.mIn(btn)){
      btn.c=[200,200,200];
    }
    if(jt.mPress(btn) || jt.tPress(btn)){
      client.socket.emit("refuse",client.inviteReceived);
      client.playing=undefined;
      client.inviteReceived=undefined;
    }
      
    jt.rect(btn);
    jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),"black","center")
    
    //Accept button
    btn={x:jt.w()-btnMargin*2-btnW*2,y:jt.h()-btnH+(btnH-btnSmallH)/2,w:btnW,h:btnSmallH,c:[127,127,127],text:"Accept"};
    
    if(jt.mIn(btn)){
      btn.c=[200,200,200];
    }
    if(jt.mPress(btn) || jt.tPress(btn)){
      client.waitTime=client.waitSecond*60;
      client.delayTime=0;
      client.delaySent=true;      
      client.accepted=true; 
      client.socket.emit("accept",client.inviteReceived);
      client.playing=undefined;
      //client.inviteReceived=undefined;
    }
      
    jt.rect(btn);
    jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),"black","center")
    
  }else if(client.inviteSent!=undefined){
   	jt.rect(0,jt.h()-btnH,jt.w(),btnH,[0,0,0]);
    
    var name=client.serverObjs[client.inviteSent].name;
    var c=client.serverObjs[client.inviteSent].c;
    jt.text("Invite sent to "+name,10,jt.h()-btnH/2-jt.fontSize()/2,"white","left");
    
    var btnMargin=20;
    var btnW=80;
    var btnSmallH=30;
    var btn={x:jt.w()-btnMargin-btnW,y:jt.h()-btnH+(btnH-btnSmallH)/2,w:btnW,h:btnSmallH,c:[127,127,127],text:"Cancel"};
    
    if(jt.mIn(btn)){
      btn.c=[200,200,200];
    }
    if(jt.mPress(btn) || jt.tPress(btn)){
      client.socket.emit("cancel",client.inviteSent);
      client.playing=undefined;
      client.inviteSent=undefined;
    }
      
    jt.rect(btn);
    jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),"black","center")
  }
  */
  
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar client=jt.getObject(\"Client\");","  ","  var btnMarginX=40;","  var btnMarginY=10;  ","  var btnH=40;","  ","  jt.fontSize(20);","  /*","  var text=\"Test\";","  if(client.clientObj.lobby!=undefined){","    text=client.clientObj.lobby;","  }","  jt.text(text,jt.w()/2,jt.h()-jt.fontSize(),\"black\",\"center\");","  ","  ","  if(client.inviteReceived!=undefined){","   \tjt.rect(0,jt.h()-btnH,jt.w(),btnH,[0,0,0]);","    ","    var name=client.serverObjs[client.inviteReceived].name;","    var c=client.serverObjs[client.inviteReceived].c;","    jt.text(\"Invite received from \"+name,10,jt.h()-btnH/2-jt.fontSize()/2,\"white\",\"left\");","    ","    //Refuse button","    var btnMargin=20;","    var btnW=80;","    var btnSmallH=30;","    var btn={x:jt.w()-btnMargin-btnW,y:jt.h()-btnH+(btnH-btnSmallH)/2,w:btnW,h:btnSmallH,c:[127,127,127],text:\"Refuse\"};","    ","    if(jt.mIn(btn)){","      btn.c=[200,200,200];","    }","    if(jt.mPress(btn) || jt.tPress(btn)){","      client.socket.emit(\"refuse\",client.inviteReceived);","      client.playing=undefined;","      client.inviteReceived=undefined;","    }","      ","    jt.rect(btn);","    jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),\"black\",\"center\")","    ","    //Accept button","    btn={x:jt.w()-btnMargin*2-btnW*2,y:jt.h()-btnH+(btnH-btnSmallH)/2,w:btnW,h:btnSmallH,c:[127,127,127],text:\"Accept\"};","    ","    if(jt.mIn(btn)){","      btn.c=[200,200,200];","    }","    if(jt.mPress(btn) || jt.tPress(btn)){","      client.waitTime=client.waitSecond*60;","      client.delayTime=0;","      client.delaySent=true;      ","      client.accepted=true; ","      client.socket.emit(\"accept\",client.inviteReceived);","      client.playing=undefined;","      //client.inviteReceived=undefined;","    }","      ","    jt.rect(btn);","    jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),\"black\",\"center\")","    ","  }else if(client.inviteSent!=undefined){","   \tjt.rect(0,jt.h()-btnH,jt.w(),btnH,[0,0,0]);","    ","    var name=client.serverObjs[client.inviteSent].name;","    var c=client.serverObjs[client.inviteSent].c;","    jt.text(\"Invite sent to \"+name,10,jt.h()-btnH/2-jt.fontSize()/2,\"white\",\"left\");","    ","    var btnMargin=20;","    var btnW=80;","    var btnSmallH=30;","    var btn={x:jt.w()-btnMargin-btnW,y:jt.h()-btnH+(btnH-btnSmallH)/2,w:btnW,h:btnSmallH,c:[127,127,127],text:\"Cancel\"};","    ","    if(jt.mIn(btn)){","      btn.c=[200,200,200];","    }","    if(jt.mPress(btn) || jt.tPress(btn)){","      client.socket.emit(\"cancel\",client.inviteSent);","      client.playing=undefined;","      client.inviteSent=undefined;","    }","      ","    jt.rect(btn);","    jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),\"black\",\"center\")","  }","  */","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(720,0,80,30,[0,0,0],0,1,'{"text":"v0.3","size":23,"font":"Consolas","align":"right"}',true,'Start','[""]',false,-1,'Obj16');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(0,270,800,40,[0,0,0],0,1,'{"text":"WaitText","size":36,"font":"Consolas","align":"center"}',true,'Loading','[""]',false,-1,'WaitText');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  
	
	jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\t","\tjt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(0,320,800,40,[0,0,0],0,1,'{"text":"DelayText","size":24,"font":"Consolas","align":"center"}',true,'Loading','[""]',false,-1,'DelayText');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  
	
	jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\t","\tjt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(0,190,800,40,[0,0,0],0,1,'{"text":"VsText","size":36,"font":"Consolas","align":"center"}',true,'Loading','[""]',false,-1,'VsText');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  
	
	jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\t","\tjt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(960,-100,310,90,[255,0,0],0,1,'{"text":"Keyboard","size":64,"font":"Consolas","align":"left"}',true,'Start','[""]',false,21,'keyboard');/*Attributes and methods go here*/
/* HOW TO USE

Link this script to the html

1: When you want to start the keyboard, call keyboard.start() in your update function
keyboard.start(msg,str,lines,size) has 4 params
msg: you can write the info message
str: you can insert a pre-written string in the input
lines: the max number lines (25 chars per line, 1 by default)
size: the font size (24 by default)

2: In your main update code, before the keyboard.start(), write something like this to get the input which is in keyboard.str:
if(keyboard.finished){
	keyboard.finished=false;
	this.str=keyboar.str;
}

3: At the end of your whole update/draw function call this to put a dark background and help make it pop-up:
if(keyboard.on){
	jt.bg([0,0,0,0.5])
}


*/

obj.on=false;
obj.msg="";
obj.st="";
obj.max=25;
obj.size=20;
obj.sizeDefault=20;
obj.lines=1;
	
obj.shift=false;
obj.shiftHold=false;
obj.num=false;
	
obj.iteration=0;
obj.backspaceTimer=0;
obj.backspaceTimerMax=15;
obj.backspaceInterval=2;
obj.waveI=0;
obj.waveX=0;
obj.waveY=0;
	
obj.frame=0;
obj.fps=60;
obj.interval=undefined;
	
obj.finished=false;
	
obj.start=function(msg,str,lines,size){
		this.finished=false;

		  this.msg=msg;
		  this.str=str;

		  if(this.msg===undefined){this.msg="Write here...";}
		  if(this.str===undefined){this.str="";}

		  this.shift=false;
		  this.num=false;
		  
		  if(lines!=undefined){
			this.lines=lines;
		  }else{
			this.lines=1;
		  }
		  
		  if(size!=undefined){
			this.size=size;
		  }else{
			this.size=this.sizeDefault; 
		  }
		  
		  this.max=25*this.lines;
			
		  this.backspaceTimer=0;
		  this.iteration=0;
		  this.waveI=Math.PI*2/this.fps;
		  this.waveX=0;
		  this.waveY=0;

		  this.on=true;
		  var context=this;
		  jt.pauseJt(true);
		  this.interval=setInterval(context.loop,1000/this.fps,context)
		  jt.camActive(false);
		  
		  jt.kRelease();
		  jt.release();
		  jt.restore();
		  this.update(context);
	}
obj.loop=function(context){
		context.up();
	}
obj.up=function(context){
		var jtFullH=jt.h()+jt.addH();
		jt.camActive(false);
		  if(this.iteration==0){
			jt.bg([0,0,0,0.5])
		  }
		  this.iteration++;
		  this.waveX+=this.waveI;
		  if(this.waveX>this.waveI*this.fps){
			this.waveX=this.waveI;
		  }
		  this.waveY=Math.sin(this.waveX)
		  this.waveYPos=(this.waveY+1)/2

		  //draw keyboard bg
		  var rect={x:0,y:jtFullH*2/3,w:jt.w(),h:jtFullH*1/3,c:[200,200,200]}

		  jt.rect(rect)

		  var keys=[
			["q","w","e","r","t","y","u","i","o","p"],
			["a","s","d","f","g","h","j","k","l"],
			["^","z","x","c","v","b","n","m","<="],
			["123","Space","Enter"],
		  ]

		  var nums=[
			[1,2,3],
			[4,5,6],
			[7,8,9],
			[".",0,"<="],
			["ABC","Space","Enter"]
		  ]

		  //choose the good keyboard
		  var num=false;
		  if(this.num){
			num=true;
		  }

		  if(this.num && jt.kPress(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"])){
			num=false;
		  }else if(!this.num && jt.kCheck([0,1,2,3,4,5,6,7,8,9])){
			num=true;
		  }

		  if(num){
			keys=[];
			keys=nums;
			this.num=true;
		  }else{
			this.num=false;
		  }

		  //get spacing and width/height of the keyboard
		  var spacingW=jt.w()/100;
		  var spacingH=(jtFullH/100)*jt.ratio();
		  var keyboardW=jt.w();
		  var keyboardH=(jtFullH*1/3);
		  var startX=0;
		  var startY=jtFullH*2/3;

		  var kCheck=jt.kCheck();
		  var kPress=jt.kPress();

		  if(!jt.check()){
			this.backspaceTimer=0; 
		  }
		  
		  //Draw all keys
		  jt.font("Consolas",this.size);
		  var h=(keyboardH)/keys.length;
		  for(var y=0;y<keys.length;y++){
			var w=(keyboardW)/keys[y].length;
			for(var x=0;x<keys[y].length;x++){
			  var ww=w-spacingW*2;
			  var hh=h-spacingH*2;
			  var xx=startX+spacingW+x*w;
			  var yy=startY+spacingH+y*h;
			  var c=[255,255,255];
			  var btn={x:startX+x*w,y:startY+y*h,w:w,h:h};

			  if(jt.check(btn) || kCheck){
				if(kCheck){
				  var key=keys[y][x];
				  if(jt.kCheck(key)){
					c=[127,127,127];
				  }else{
					if(key=="^" && jt.kCheck("shift")){
					  c=[127,127,127];
					}else if(key=="<=" && jt.kCheck("backspace")){
					  c=[127,127,127];
					}else if(key=="123" && jt.kCheck([0,1,2,3,4,5,6,7,8,9])){
					  c=[127,127,127];
					}else if(key=="ABC" && jt.kCheck(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"])){
					  c=[127,127,127];
					}else if(key=="Space" && jt.kCheck("space")){
					  c=[127,127,127];
					}else if(key=="Enter" && jt.kCheck("enter")){
					  c=[127,127,127];
					}
				  }
				}else{
				  c=[127,127,127];
				}

				if(jt.press(btn) || kPress || (jt.check(btn) && keys[y][x]=="<=")){
				  var key=keys[y][x];
				  var valid=true;
				  if(kPress){
					valid=false;
					if(jt.kPress(key)){
					  valid=true;
					}else{
					  if(key=="^" && jt.kPress("shift")){
						valid=true;
					  }else if(key=="<=" && jt.kPress("backspace")){
						valid=true;
					  }else if(key=="123" && jt.kPress([0,1,2,3,4,5,6,7,8,9])){
						valid=true;
					  }else if(key=="ABC" && jt.kPress(["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"])){
						valid=true;
					  }else if(key=="Space" && jt.kPress("space")){
						valid=true;
					  }else if(key=="Enter" && jt.kPress("enter")){
						valid=true;
					  }
					}
				  }
				  
				  
				  if(key!="^" && key!="<=" && key!="ABC" && key!="123" && key!="Space" && key!="Enter" && valid){
					var k=key;
					if(this.shift){
					  this.shift=false;
					  if(typeof k=="string"){
						k=k.toUpperCase();
					  }
					  
					}
					this.str+=k;
				  }else if(valid){
					if(key=="^"){
					  this.shift=!this.shift;
					}else if(key=="<="){
					  var checkInterval=false;
					  if(jt.check(btn)){
						this.backspaceTimer++;
						if(this.backspaceTimer>=this.backspaceTimerMax){
						  if(this.iteration%this.backspaceInterval==0){
							checkInterval=true;
						  }
						}
					  }else{
						this.backspaceTimer=0;
					  }
					  if(jt.press(btn) || kPress || checkInterval){
						 if(this.str.length>0){
						  this.str=this.str.slice(0,this.str.length-1);
						}
					  }
					 
					}else if(key=="123"){
					  this.num=true;
					}else if(key=="ABC"){
					  this.num=false;
					}else if(key=="Space"){
					  this.str+=" ";
					}else if(key=="Enter"){
					  this.finished=true;
					}
				  }
				  if(this.str.length>this.max){this.str=this.str.slice(0,this.max)}
				  if(valid){
					/*jt.mRelease();
					jt.tRelease();
					jt.release();*/
					jt.kRelease();
				  }
				}
			  }

			  if(keys[y][x]=="^"){
				if(this.shift){
				  c=[127,127,127];
				}
			  }

			  if(this.shift && keys[y][x]!="Space" && keys[y][x]!="Enter"){
				if(typeof keys[y][x]=="string"){
					keys[y][x]=keys[y][x].toUpperCase();
				}
			  }
			  jt.rect(xx,yy,ww,hh,c)
			  jt.text(keys[y][x],xx+ww/2,yy+hh/2-jt.fontSize()/2,"black","center")
			}
		  }

		  //show text
		  var textW=jt.w();
		  var textH=jt.fontSize()*4+10;
		  textH+=(jt.fontSize()+5)*(this.lines-1)
		  var textX=jt.w()/6;
		  var textY=jtFullH*(1/3)-textH/2;
		  jt.rectB(textX,textY,textW-textX*2,textH,[0,0,0],0,5)
		  jt.rect(textX,textY,textW-textX*2,textH,[200,200,200])
		  var writingH=((jt.fontSize()+5)*this.lines);
		  jt.rect(textX+spacingW,textY+textH-writingH-5,textW-spacingW*2-textX*2,writingH,[255,255,255])

		  jt.font("Consolas",this.size);
		  jt.text(this.msg,textX+spacingW*2,textY+10,"black","left",jt.fontSize(),0,36,jt.fontSize());
		  jt.text(this.str.slice(0,25),textX+spacingW*2,textY+textH-writingH,"black","left");
		  var lineH=0;
		  var strW=jt.textW(this.str.slice(0,25));
		  if(this.str.length>25){
			jt.text(this.str.slice(25,50),textX+spacingW*2,textY+textH-writingH+jt.fontSize(),"black","left");
			lineH=jt.fontSize();
			strW=jt.textW(this.str.slice(25,50));
		  }
		  if(this.str.length>50){
			jt.text(this.str.slice(50,75),textX+spacingW*2,textY+textH-writingH+jt.fontSize()*2,"black","left");
			lineH=jt.fontSize()*2;
			strW=jt.textW(this.str.slice(50,75));
		  }
		  if(this.str.length>75){
			jt.text(this.str.slice(75,100),textX+spacingW*2,textY+textH-writingH+jt.fontSize()*3,"black","left");
			lineH=jt.fontSize()*3;
			strW=jt.textW(this.str.slice(75,100));
		  }
		  
		  jt.alpha(this.waveYPos);
		  jt.rect(textX+spacingW*2+strW,textY+textH-writingH+(lineH),spacingW/2,jt.fontSize())
		  jt.alpha(1);
		  
		  if(jt.press()){
			if(!jt.press(textX,textY,textW,textH) && !jt.press(startX,startY,keyboardW,keyboardH)){
			  this.finished=true;
			  jt.release();
			}
		  }
		  
		  //remove mouse press
		  jt.mouse.press=[false,false,false,false,false]

		  //remove touch press
		  if(jt.touch.press==true){
			jt.touch.press=false;
		  }

		  
		  
		  if(jt.kPress("enter")){
			this.finished=true; 
		  }

		  if(this.finished){
			jt.mRelease();
			jt.tRelease();
			jt.release();
			clearInterval(this.interval);
			jt.pauseJt(false);
			this.on=false;
			return this.str;
		  }
		
	}
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	if(this.on){
    jt.bg([0,0,0,0.5])
  }
};obj.JTEcode=["/*Attributes and methods go here*/","/* HOW TO USE","","Link this script to the html","","1: When you want to start the keyboard, call keyboard.start() in your update function","keyboard.start(msg,str,lines,size) has 4 params","msg: you can write the info message","str: you can insert a pre-written string in the input","lines: the max number lines (25 chars per line, 1 by default)","size: the font size (24 by default)","","2: In your main update code, before the keyboard.start(), write something like this to get the input which is in keyboard.str:","if(keyboard.finished){","\tkeyboard.finished=false;","\tthis.str=keyboar.str;","}","","3: At the end of your whole update/draw function call this to put a dark background and help make it pop-up:","if(keyboard.on){","\tjt.bg([0,0,0,0.5])","}","","","*/","","obj.on=false;","obj.msg=\"\";","obj.st=\"\";","obj.max=25;","obj.size=20;","obj.sizeDefault=20;","obj.lines=1;","\t","obj.shift=false;","obj.shiftHold=false;","obj.num=false;","\t","obj.iteration=0;","obj.backspaceTimer=0;","obj.backspaceTimerMax=15;","obj.backspaceInterval=2;","obj.waveI=0;","obj.waveX=0;","obj.waveY=0;","\t","obj.frame=0;","obj.fps=60;","obj.interval=undefined;","\t","obj.finished=false;","\t","obj.start=function(msg,str,lines,size){","\t\tthis.finished=false;","","\t\t  this.msg=msg;","\t\t  this.str=str;","","\t\t  if(this.msg===undefined){this.msg=\"Write here...\";}","\t\t  if(this.str===undefined){this.str=\"\";}","","\t\t  this.shift=false;","\t\t  this.num=false;","\t\t  ","\t\t  if(lines!=undefined){","\t\t\tthis.lines=lines;","\t\t  }else{","\t\t\tthis.lines=1;","\t\t  }","\t\t  ","\t\t  if(size!=undefined){","\t\t\tthis.size=size;","\t\t  }else{","\t\t\tthis.size=this.sizeDefault; ","\t\t  }","\t\t  ","\t\t  this.max=25*this.lines;","\t\t\t","\t\t  this.backspaceTimer=0;","\t\t  this.iteration=0;","\t\t  this.waveI=Math.PI*2/this.fps;","\t\t  this.waveX=0;","\t\t  this.waveY=0;","","\t\t  this.on=true;","\t\t  var context=this;","\t\t  jt.pauseJt(true);","\t\t  this.interval=setInterval(context.loop,1000/this.fps,context)","\t\t  jt.camActive(false);","\t\t  ","\t\t  jt.kRelease();","\t\t  jt.release();","\t\t  jt.restore();","\t\t  this.update(context);","\t}","obj.loop=function(context){","\t\tcontext.up();","\t}","obj.up=function(context){","\t\tvar jtFullH=jt.h()+jt.addH();","\t\tjt.camActive(false);","\t\t  if(this.iteration==0){","\t\t\tjt.bg([0,0,0,0.5])","\t\t  }","\t\t  this.iteration++;","\t\t  this.waveX+=this.waveI;","\t\t  if(this.waveX>this.waveI*this.fps){","\t\t\tthis.waveX=this.waveI;","\t\t  }","\t\t  this.waveY=Math.sin(this.waveX)","\t\t  this.waveYPos=(this.waveY+1)/2","","\t\t  //draw keyboard bg","\t\t  var rect={x:0,y:jtFullH*2/3,w:jt.w(),h:jtFullH*1/3,c:[200,200,200]}","","\t\t  jt.rect(rect)","","\t\t  var keys=[","\t\t\t[\"q\",\"w\",\"e\",\"r\",\"t\",\"y\",\"u\",\"i\",\"o\",\"p\"],","\t\t\t[\"a\",\"s\",\"d\",\"f\",\"g\",\"h\",\"j\",\"k\",\"l\"],","\t\t\t[\"^\",\"z\",\"x\",\"c\",\"v\",\"b\",\"n\",\"m\",\"<=\"],","\t\t\t[\"123\",\"Space\",\"Enter\"],","\t\t  ]","","\t\t  var nums=[","\t\t\t[1,2,3],","\t\t\t[4,5,6],","\t\t\t[7,8,9],","\t\t\t[\".\",0,\"<=\"],","\t\t\t[\"ABC\",\"Space\",\"Enter\"]","\t\t  ]","","\t\t  //choose the good keyboard","\t\t  var num=false;","\t\t  if(this.num){","\t\t\tnum=true;","\t\t  }","","\t\t  if(this.num && jt.kPress([\"a\", \"b\", \"c\", \"d\", \"e\", \"f\", \"g\", \"h\", \"i\", \"j\", \"k\", \"l\", \"m\", \"n\", \"o\", \"p\", \"q\", \"r\", \"s\", \"t\", \"u\", \"v\", \"w\", \"x\", \"y\", \"z\"])){","\t\t\tnum=false;","\t\t  }else if(!this.num && jt.kCheck([0,1,2,3,4,5,6,7,8,9])){","\t\t\tnum=true;","\t\t  }","","\t\t  if(num){","\t\t\tkeys=[];","\t\t\tkeys=nums;","\t\t\tthis.num=true;","\t\t  }else{","\t\t\tthis.num=false;","\t\t  }","","\t\t  //get spacing and width/height of the keyboard","\t\t  var spacingW=jt.w()/100;","\t\t  var spacingH=(jtFullH/100)*jt.ratio();","\t\t  var keyboardW=jt.w();","\t\t  var keyboardH=(jtFullH*1/3);","\t\t  var startX=0;","\t\t  var startY=jtFullH*2/3;","","\t\t  var kCheck=jt.kCheck();","\t\t  var kPress=jt.kPress();","","\t\t  if(!jt.check()){","\t\t\tthis.backspaceTimer=0; ","\t\t  }","\t\t  ","\t\t  //Draw all keys","\t\t  jt.font(\"Consolas\",this.size);","\t\t  var h=(keyboardH)/keys.length;","\t\t  for(var y=0;y<keys.length;y++){","\t\t\tvar w=(keyboardW)/keys[y].length;","\t\t\tfor(var x=0;x<keys[y].length;x++){","\t\t\t  var ww=w-spacingW*2;","\t\t\t  var hh=h-spacingH*2;","\t\t\t  var xx=startX+spacingW+x*w;","\t\t\t  var yy=startY+spacingH+y*h;","\t\t\t  var c=[255,255,255];","\t\t\t  var btn={x:startX+x*w,y:startY+y*h,w:w,h:h};","","\t\t\t  if(jt.check(btn) || kCheck){","\t\t\t\tif(kCheck){","\t\t\t\t  var key=keys[y][x];","\t\t\t\t  if(jt.kCheck(key)){","\t\t\t\t\tc=[127,127,127];","\t\t\t\t  }else{","\t\t\t\t\tif(key==\"^\" && jt.kCheck(\"shift\")){","\t\t\t\t\t  c=[127,127,127];","\t\t\t\t\t}else if(key==\"<=\" && jt.kCheck(\"backspace\")){","\t\t\t\t\t  c=[127,127,127];","\t\t\t\t\t}else if(key==\"123\" && jt.kCheck([0,1,2,3,4,5,6,7,8,9])){","\t\t\t\t\t  c=[127,127,127];","\t\t\t\t\t}else if(key==\"ABC\" && jt.kCheck([\"a\", \"b\", \"c\", \"d\", \"e\", \"f\", \"g\", \"h\", \"i\", \"j\", \"k\", \"l\", \"m\", \"n\", \"o\", \"p\", \"q\", \"r\", \"s\", \"t\", \"u\", \"v\", \"w\", \"x\", \"y\", \"z\"])){","\t\t\t\t\t  c=[127,127,127];","\t\t\t\t\t}else if(key==\"Space\" && jt.kCheck(\"space\")){","\t\t\t\t\t  c=[127,127,127];","\t\t\t\t\t}else if(key==\"Enter\" && jt.kCheck(\"enter\")){","\t\t\t\t\t  c=[127,127,127];","\t\t\t\t\t}","\t\t\t\t  }","\t\t\t\t}else{","\t\t\t\t  c=[127,127,127];","\t\t\t\t}","","\t\t\t\tif(jt.press(btn) || kPress || (jt.check(btn) && keys[y][x]==\"<=\")){","\t\t\t\t  var key=keys[y][x];","\t\t\t\t  var valid=true;","\t\t\t\t  if(kPress){","\t\t\t\t\tvalid=false;","\t\t\t\t\tif(jt.kPress(key)){","\t\t\t\t\t  valid=true;","\t\t\t\t\t}else{","\t\t\t\t\t  if(key==\"^\" && jt.kPress(\"shift\")){","\t\t\t\t\t\tvalid=true;","\t\t\t\t\t  }else if(key==\"<=\" && jt.kPress(\"backspace\")){","\t\t\t\t\t\tvalid=true;","\t\t\t\t\t  }else if(key==\"123\" && jt.kPress([0,1,2,3,4,5,6,7,8,9])){","\t\t\t\t\t\tvalid=true;","\t\t\t\t\t  }else if(key==\"ABC\" && jt.kPress([\"a\", \"b\", \"c\", \"d\", \"e\", \"f\", \"g\", \"h\", \"i\", \"j\", \"k\", \"l\", \"m\", \"n\", \"o\", \"p\", \"q\", \"r\", \"s\", \"t\", \"u\", \"v\", \"w\", \"x\", \"y\", \"z\"])){","\t\t\t\t\t\tvalid=true;","\t\t\t\t\t  }else if(key==\"Space\" && jt.kPress(\"space\")){","\t\t\t\t\t\tvalid=true;","\t\t\t\t\t  }else if(key==\"Enter\" && jt.kPress(\"enter\")){","\t\t\t\t\t\tvalid=true;","\t\t\t\t\t  }","\t\t\t\t\t}","\t\t\t\t  }","\t\t\t\t  ","\t\t\t\t  ","\t\t\t\t  if(key!=\"^\" && key!=\"<=\" && key!=\"ABC\" && key!=\"123\" && key!=\"Space\" && key!=\"Enter\" && valid){","\t\t\t\t\tvar k=key;","\t\t\t\t\tif(this.shift){","\t\t\t\t\t  this.shift=false;","\t\t\t\t\t  if(typeof k==\"string\"){","\t\t\t\t\t\tk=k.toUpperCase();","\t\t\t\t\t  }","\t\t\t\t\t  ","\t\t\t\t\t}","\t\t\t\t\tthis.str+=k;","\t\t\t\t  }else if(valid){","\t\t\t\t\tif(key==\"^\"){","\t\t\t\t\t  this.shift=!this.shift;","\t\t\t\t\t}else if(key==\"<=\"){","\t\t\t\t\t  var checkInterval=false;","\t\t\t\t\t  if(jt.check(btn)){","\t\t\t\t\t\tthis.backspaceTimer++;","\t\t\t\t\t\tif(this.backspaceTimer>=this.backspaceTimerMax){","\t\t\t\t\t\t  if(this.iteration%this.backspaceInterval==0){","\t\t\t\t\t\t\tcheckInterval=true;","\t\t\t\t\t\t  }","\t\t\t\t\t\t}","\t\t\t\t\t  }else{","\t\t\t\t\t\tthis.backspaceTimer=0;","\t\t\t\t\t  }","\t\t\t\t\t  if(jt.press(btn) || kPress || checkInterval){","\t\t\t\t\t\t if(this.str.length>0){","\t\t\t\t\t\t  this.str=this.str.slice(0,this.str.length-1);","\t\t\t\t\t\t}","\t\t\t\t\t  }","\t\t\t\t\t ","\t\t\t\t\t}else if(key==\"123\"){","\t\t\t\t\t  this.num=true;","\t\t\t\t\t}else if(key==\"ABC\"){","\t\t\t\t\t  this.num=false;","\t\t\t\t\t}else if(key==\"Space\"){","\t\t\t\t\t  this.str+=\" \";","\t\t\t\t\t}else if(key==\"Enter\"){","\t\t\t\t\t  this.finished=true;","\t\t\t\t\t}","\t\t\t\t  }","\t\t\t\t  if(this.str.length>this.max){this.str=this.str.slice(0,this.max)}","\t\t\t\t  if(valid){","\t\t\t\t\t/*jt.mRelease();","\t\t\t\t\tjt.tRelease();","\t\t\t\t\tjt.release();*/","\t\t\t\t\tjt.kRelease();","\t\t\t\t  }","\t\t\t\t}","\t\t\t  }","","\t\t\t  if(keys[y][x]==\"^\"){","\t\t\t\tif(this.shift){","\t\t\t\t  c=[127,127,127];","\t\t\t\t}","\t\t\t  }","","\t\t\t  if(this.shift && keys[y][x]!=\"Space\" && keys[y][x]!=\"Enter\"){","\t\t\t\tif(typeof keys[y][x]==\"string\"){","\t\t\t\t\tkeys[y][x]=keys[y][x].toUpperCase();","\t\t\t\t}","\t\t\t  }","\t\t\t  jt.rect(xx,yy,ww,hh,c)","\t\t\t  jt.text(keys[y][x],xx+ww/2,yy+hh/2-jt.fontSize()/2,\"black\",\"center\")","\t\t\t}","\t\t  }","","\t\t  //show text","\t\t  var textW=jt.w();","\t\t  var textH=jt.fontSize()*4+10;","\t\t  textH+=(jt.fontSize()+5)*(this.lines-1)","\t\t  var textX=jt.w()/6;","\t\t  var textY=jtFullH*(1/3)-textH/2;","\t\t  jt.rectB(textX,textY,textW-textX*2,textH,[0,0,0],0,5)","\t\t  jt.rect(textX,textY,textW-textX*2,textH,[200,200,200])","\t\t  var writingH=((jt.fontSize()+5)*this.lines);","\t\t  jt.rect(textX+spacingW,textY+textH-writingH-5,textW-spacingW*2-textX*2,writingH,[255,255,255])","","\t\t  jt.font(\"Consolas\",this.size);","\t\t  jt.text(this.msg,textX+spacingW*2,textY+10,\"black\",\"left\",jt.fontSize(),0,36,jt.fontSize());","\t\t  jt.text(this.str.slice(0,25),textX+spacingW*2,textY+textH-writingH,\"black\",\"left\");","\t\t  var lineH=0;","\t\t  var strW=jt.textW(this.str.slice(0,25));","\t\t  if(this.str.length>25){","\t\t\tjt.text(this.str.slice(25,50),textX+spacingW*2,textY+textH-writingH+jt.fontSize(),\"black\",\"left\");","\t\t\tlineH=jt.fontSize();","\t\t\tstrW=jt.textW(this.str.slice(25,50));","\t\t  }","\t\t  if(this.str.length>50){","\t\t\tjt.text(this.str.slice(50,75),textX+spacingW*2,textY+textH-writingH+jt.fontSize()*2,\"black\",\"left\");","\t\t\tlineH=jt.fontSize()*2;","\t\t\tstrW=jt.textW(this.str.slice(50,75));","\t\t  }","\t\t  if(this.str.length>75){","\t\t\tjt.text(this.str.slice(75,100),textX+spacingW*2,textY+textH-writingH+jt.fontSize()*3,\"black\",\"left\");","\t\t\tlineH=jt.fontSize()*3;","\t\t\tstrW=jt.textW(this.str.slice(75,100));","\t\t  }","\t\t  ","\t\t  jt.alpha(this.waveYPos);","\t\t  jt.rect(textX+spacingW*2+strW,textY+textH-writingH+(lineH),spacingW/2,jt.fontSize())","\t\t  jt.alpha(1);","\t\t  ","\t\t  if(jt.press()){","\t\t\tif(!jt.press(textX,textY,textW,textH) && !jt.press(startX,startY,keyboardW,keyboardH)){","\t\t\t  this.finished=true;","\t\t\t  jt.release();","\t\t\t}","\t\t  }","\t\t  ","\t\t  //remove mouse press","\t\t  jt.mouse.press=[false,false,false,false,false]","","\t\t  //remove touch press","\t\t  if(jt.touch.press==true){","\t\t\tjt.touch.press=false;","\t\t  }","","\t\t  ","\t\t  ","\t\t  if(jt.kPress(\"enter\")){","\t\t\tthis.finished=true; ","\t\t  }","","\t\t  if(this.finished){","\t\t\tjt.mRelease();","\t\t\tjt.tRelease();","\t\t\tjt.release();","\t\t\tclearInterval(this.interval);","\t\t\tjt.pauseJt(false);","\t\t\tthis.on=false;","\t\t\treturn this.str;","\t\t  }","\t\t","\t}"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tif(this.on){","    jt.bg([0,0,0,0.5])","  }"];jte.objects.push(obj);var obj=new JTEObject(256,-128,310,110,[255,0,0],0,1,'{"text":"Game","size":128,"font":"Consolas","align":"left"}',true,'Game','[""]',false,31,'Game');/*Attributes and methods go here*/
obj.playerInvincibility=15;
obj.playerInvincibilityMax=15;

obj.playerW=16;
obj.playerH=16;

obj.drawW=16;
obj.drawH=20;

obj.playerMod=1;
obj.playerTurn=3;
obj.playerSpeed=1.5;
obj.playerSpeedBack=1;
obj.bulletSpeed=3;

obj.bulletTime=300;
obj.bulletTimeBuffer=10;

obj.bulletOffset=2;

obj.bulletW=8;
obj.bulletH=8;

obj.bulletWHRate=0;

obj.endRoundWait=60;

obj.lastDelay=false;

obj.powerupTimer=0;
obj.powerupTimerMax=360;

obj.powerupWaitTimer=0;
obj.powerupWaitTimerMax=360;

obj.powerupSpawn=undefined;
obj.powerupSpawnTimer=0;
obj.powerupSpawnTimerMax=60;

obj.restart=function(){
  this.powerupTimer=0;
  this.powerupWaitTimer=0;  
  var client=jt.getObject("Client");
  //client.clientObj.score=0;
  client.clientObj.projectiles=[];  
  this.respawn();
 	
}

obj.respawn=function(){
  this.powerupTimer=0;
  this.powerupWaitTimer=0;  
  var client=jt.getObject("Client");
  var map=jt.getObject("Map");  
  
  client.clientObj.x=map.spawns[client.index].x+map.ts/2-this.playerW/2;
  client.clientObj.y=map.spawns[client.index].y+map.ts/2-this.playerH/2;
  
  if(client.index==0){
   	client.clientObj.r=135; 
  }else if(client.index==1){
    client.clientObj.r=315; 
  }else if(client.index==2){
    client.clientObj.r=225; 
  }else if(client.index==3){
    client.clientObj.r=45; 
  }else if(client.index==4){
    client.clientObj.r=180; 
  }else if(client.index==5){
    client.clientObj.r=0; 
  }else if(client.index==6){
    client.clientObj.r=90; 
  }else if(client.index==7){
    client.clientObj.r=270; 
  }
  
  this.playerInvincibility=this.playerInvincibilityMax;
}

obj.shoot=function(){
 	this.powerupTimer=0;
  
  var client=jt.getObject("Client");
  var player=client.clientObj;
  player.projectiles=[];
  var projectile={};
  var startX=player.x+player.w/2-this.bulletW/2;
  var startY=player.y+player.h/2-this.bulletH/2; 
  
  var angle=player.r;
  var max=1;
  if(this.tripleShot){max=3;angle-=15;}
  
  for(var i=0;i<max;i++){
    projectile.vX=jt.angleX(angle)*this.bulletSpeed;
    projectile.vY=jt.angleY(angle)*this.bulletSpeed;

    projectile.x=startX+projectile.vX*2;
    projectile.y=startY+projectile.vY*2;

    projectile.w=this.bulletW;    
    projectile.h=this.bulletH;  

    projectile.frames=this.bulletTime;


    player.projectiles.push(projectile);
    angle+=15;
  }
}

obj.rainbowFrame=0;
obj.rainbowFrameMax=60;

obj.getRainbow=function(ratio){
  var r=jt.waveYPos(ratio);
  var g=jt.waveYPos(ratio+0.33);
  var b=jt.waveYPos(ratio+0.66);
  return [255*r,255*g,255*b,0.5];
}

obj.drawPlayer=function(player,self,powerup){
  if(self==undefined){self=true;}
  if(powerup==undefined){powerup="";}  
  
  if(powerup=="invisible"){
    if(self){
      jt.alpha(0.5);
    }else{
      jt.alpha(0);
    }
  }
  
  var diffW=this.drawW-this.playerW;
  var diffH=this.drawH-this.playerH;  
 	jt.rect(player.x-diffW/2,player.y-diffH/2,this.drawW,this.drawH,player.c,player.r);
  
  //draw cannon
  var cannonW=8;
  var cannonH=16;
  jt.rotate(player.r,player.x+this.playerW/2-1,player.y+this.playerH/2-1,2,2);
  jt.rect(player.x+this.playerW/2-cannonW/2,player.y+this.playerH/2-cannonH,cannonW,cannonH,player.c);
  jt.rectB(player.x+this.playerW/2-cannonW/2,player.y+this.playerH/2-cannonH,cannonW,cannonH,"black",0,2);  
  jt.rotate(-player.r,player.x+this.playerW/2-1,player.y+this.playerH/2-1,2,2);
  
  //draw top circle
  var circleD=12;
  jt.circle(player.x+this.playerW/2-circleD/2,player.y+this.playerH/2-circleD/2,circleD,player.c,);  
  jt.circleB(player.x+this.playerW/2-circleD/2,player.y+this.playerH/2-circleD/2,circleD,"black",2);
  
  jt.alpha(1)
}

obj.endRound=function(delay){
  var client=jt.getObject("Client");
  this.lastDelay=delay;
  
  
  client.waitTime=client.waitSecond*60; 
  if(delay){
  	client.waitTime+=client.delay; 
  }
  
  jt.alarm("changeRound",this.endRoundWait);
}

obj.changeRound=function(){
  var client=jt.getObject("Client");
 	client.started=false; 
  jt.setView("Loading"); 
  
  if(client.index==0){
    	//jt.getObject("Map").generate();
      jt.getObject("Client").sendMap();
  }
}

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  if(jt.checkAlarm("changeRound",true)){
    this.changeRound();
  }
  
  var client=jt.getObject("Client");
  var serverObjs=client.serverObjs;
  
  var map=jt.getObject("Map");
  var walls=map.walls;
  
  if(client.isHost){
   	this.powerupWaitTimer++;
    if(this.powerupWaitTimer>this.powerupWaitTimerMax){
     	this.powerupWaitTimer=0;
      //Spawn powerup
      var ranY=jt.random(2,map.map.length-2,2)-1;
  		var ranX=jt.random(2,map.map[0].length-2,2)-1; 
      
      var text=jt.choose(["i","s"])
      
      var powerup={x:ranX*map.ts,y:ranY*map.ts,w:map.ts,h:map.ts,text:text};
      
      client.socket.emit("spawnPowerup",client.clientObj.lobby,powerup); 
      
      this.powerupSpawn=powerup;
      this.powerupSpawnTimer=this.powerupSpawnTimerMax+client.delay;
    }
  }
  
  if(this.powerupSpawnTimer>0){
    this.powerupWaitTimer=0;
   	this.powerupSpawnTimer--;
    if(this.powerupSpawnTimer<=0){
     	//spawn powerup
      client.powerups.push(this.powerupSpawn);
    }
  }
  
  var playerSpeedMod=1;
  this.tripleShot=false;
  
  if(this.powerupTimer>0){
   	this.powerupTimer--; 
    if(client.clientObj.powerup=="speed"){
     	 playerSpeedMod=2;
    }
    if(client.clientObj.powerup=="triple"){
     	 this.tripleShot=true;
    }
  }else{
   	client.clientObj.powerup=""; 
  }
  
  //Rainbow
  this.rainbowFrame++;
  if(this.rainbowFrame>=this.rainbowFrameMax){
   	this.rainbowFrame=0; 
  }
  var rainbowRatio=this.rainbowFrame/this.rainbowFrameMax;
  var rainbow=this.getRainbow(rainbowRatio);
  
  //Draw powerup
  /*
  var ranY=jt.random(2,map.map.length-2,2)-1;
  var ranX=jt.random(2,map.map[0].length-2,2)-1; 
  jt.rect(ranX*map.ts,ranY*map.ts,map.ts,map.ts,"red");
  
  */
  
	//Update player
  var temp={x:client.clientObj.x,y:client.clientObj.y,w:this.playerW,h:this.playerH};
  var moveX=0;
  var moveY=0;  
  
  
  
  
  if(jt.kCheck("left")){client.clientObj.r-=this.playerTurn*playerSpeedMod;}
  if(jt.kCheck("right")){client.clientObj.r+=this.playerTurn*playerSpeedMod;}  
  client.clientObj.r=jt.wrap(client.clientObj.r,0,359)
  
 	var angleX=jt.angleX(client.clientObj.r);
 	var angleY=jt.angleY(client.clientObj.r);
  
  if(jt.kCheck("up")){
    moveX=angleX*this.playerSpeed*playerSpeedMod;
    moveY=angleY*this.playerSpeed*playerSpeedMod;    
  }
  if(jt.kCheck("down")){
   	moveX=-angleX*this.playerSpeedBack*playerSpeedMod;
    moveY=-angleY*this.playerSpeedBack*playerSpeedMod; 
  } 
  
  //Col X
  var col=false;
  temp.x=temp.x+moveX;
  for(var i=0;i<walls.length;i++){
   	var wall=walls[i];
    if(jt.cRect(temp,wall)){
      if(temp.x+temp.w/2>wall.x+wall.w/2){
       	temp.x=wall.x+wall.w; 
      }else{
        temp.x=wall.x-this.playerW;
      }
      col=true;
     	break; 
    }
  }
  
  client.clientObj.x=temp.x;     
  
  
  col=false;
  temp.y=temp.y+moveY;
  for(var i=0;i<walls.length;i++){
   	var wall=walls[i];
    if(jt.cRect(temp,wall)){
      if(temp.y+temp.h/2>wall.y+wall.h/2){
       	temp.y=wall.y+wall.h; 
      }else{
        temp.y=wall.y-this.playerH;
      }
      col=true;
     	break; 
    }
  }
  
  client.clientObj.y=temp.y;  
  
  if(this.playerInvincibility>0){
  	this.playerInvincibility--;
  }
  
  var player=client.clientObj;
  player.w=this.playerW;
  player.h=this.playerH;  
  
  if(jt.kPress("space") && client.clientObj.projectiles.length<=0){
    this.shoot();
  }
  
  //Draw walls
  for(var i=0;i<walls.length;i++){
    var wall=walls[i];
    jt.rect(wall.x,wall.y,wall.w,wall.h,wall.c);
  }
  
  //Draw spawns
  for(var i=0;i<map.spawns.length;i++){
    var spawn=map.spawns[i];
    jt.rect(spawn.x,spawn.y,map.ts,map.ts,"lightblue");
  }
  
  
  //Check powerup col
  for(var i=0;i<client.powerups.length;i++){
    var powerup=client.powerups[i];
    if(jt.cRect(player,powerup)){
      	var padding=0;
       var obj={x:player.x-padding,y:player.y-padding,w:player.w+padding*2,h:player.h+padding*2}
       
       //get powerup
       this.powerupTimer=this.powerupTimerMax;
      if(powerup.text=="i"){
      	client.clientObj.powerup="invisible";
      }else if(powerup.text=="s"){
        client.clientObj.powerup="speed";
      }else if(powerup.text=="t"){
        client.clientObj.powerup="triple";
      }
       
     	 client.socket.emit("deletePowerup",client.clientObj.lobby,obj);
      client.powerups.splice(i,1);
      i--;
    }
  }
  
  jt.fontSize(24);
  //Draw powerups
  for(var i=0;i<client.powerups.length;i++){
    var powerup=client.powerups[i];
    jt.rect(powerup.x,powerup.y,powerup.w,powerup.h,rainbow);
    jt.text(powerup.text,powerup.x+powerup.w/2,powerup.y+powerup.h/2-jt.fontSize()/2,"black","center");
  }
  
  //Bullets
 	col=false;
  for(var i=0;i<player.projectiles.length;i++){
   	var proj=player.projectiles[i];
    
    player.projectiles[i].frames--;
    if(player.projectiles[i].frames>0){



      proj.w+=this.bulletWHRate;
      proj.h+=this.bulletWHRate;
      proj.x-=this.bulletWHRate/2;
      proj.y-=this.bulletWHRate/2;    

      proj.x+=proj.vX;
      for(var j=0;j<walls.length;j++){
        var wall=walls[j];
        if(jt.cRect(proj,wall)){
          //col=true;
          proj.vX*=-1
          proj.x+=proj.vX;
          break; 
        }
      }

      proj.y+=proj.vY; 
      for(var j=0;j<walls.length;j++){
        var wall=walls[j];
        if(jt.cRect(proj,wall)){
          //col=true;
          proj.vY*=-1
          proj.y+=proj.vY; 
          break; 
        }
      }

      jt.circle(proj.x-this.bulletOffset,proj.y-this.bulletOffset,proj.w+this.bulletOffset*2,"black");

      client.clientObj.projectiles[i]=proj;

      if(jt.cRect(player,proj) && player.projectiles[i].frames<this.bulletTime-this.bulletTimeBuffer && this.playerInvincibility<=0){
        this.respawn();
        
        client.clientObj.projectiles=[];
        //this.endRound(true); 
        client.dead=true;
        if(client.isHost){
         	client.checkDead(); 
        }else{
        	client.socket.emit("dead",client.host);  
        }
        
        client.clientObj.x=jt.w()/2+((client.index*2)-1)*999
        
        break;
      }
    }else{
     	col=true; 
    }
  }
  
  if(col){
  	client.clientObj.projectiles=[];
  }
  
  //Draw player
  this.drawPlayer(player,true,client.clientObj.powerup);
  
  jt.fontSize(14);
  
  jt.text("Your score: "+player.score,5,5,"white","left");
    
  
  //Draw players
  var keys=Object.keys(serverObjs);
  var len=Object.keys(serverObjs).length;
  var index=1;
  
  for (var i = 0; i < len; i++) {
    var other = serverObjs[keys[i]];
    if(client.withs.indexOf(keys[i])!=-1){
      
      //Bullets
      for(var j=0;j<other.projectiles.length;j++){
        var proj=other.projectiles[j];       

        var col=false;
        if(jt.cRect(player,proj)){
          col=true;
        }else{
        	proj.x+=proj.vX;
        	proj.y+=proj.vY; 
          if(jt.cRect(player,proj)){
           	col=true; 
          }
          proj.x-=proj.vX;
        	proj.y-=proj.vY; 
        }

      	jt.circle(proj.x-this.bulletOffset,proj.y-this.bulletOffset,proj.w+this.bulletOffset*2,"black");
        
        if(col && this.playerInvincibility<=0){
          var padding=8;
          var obj={x:player.x-padding,y:player.y-padding,w:player.w+padding*2,h:player.h+padding*2}
          
          client.socket.emit("deleteProjectile",keys[i],obj);    
          
         	this.respawn();
          
          client.dead=true;
          if(client.isHost){
            client.checkDead(); 
          }else{
            client.socket.emit("dead",client.host);  
          }
          
                
          //this.endRound(true);
          
          client.clientObj.x=jt.w()/2+((client.index*2)-1)*999
          
        }
      }
      
      this.drawPlayer(other,false,other.powerup);
      
      var text=other.name;
      var textW=jt.textW(text);
      var margin=2;
      if(other.powerup!="invisible"){
      	jt.rect(other.x+this.playerW/2-textW/2-margin,other.y-jt.fontSize()-margin,textW+margin*2,jt.fontSize()+margin*2,[255,255,255,0.5])
      	jt.text(text,other.x+this.playerW/2,other.y-jt.fontSize(),"black","center");
      }
      jt.text(other.name+" score: "+other.score,(index*(jt.w()/5))+5,5,"white","left");
              
      index++;
    }
  }
  
	jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.playerInvincibility=15;","obj.playerInvincibilityMax=15;","","obj.playerW=16;","obj.playerH=16;","","obj.drawW=16;","obj.drawH=20;","","obj.playerMod=1;","obj.playerTurn=3;","obj.playerSpeed=1.5;","obj.playerSpeedBack=1;","obj.bulletSpeed=3;","","obj.bulletTime=300;","obj.bulletTimeBuffer=10;","","obj.bulletOffset=2;","","obj.bulletW=8;","obj.bulletH=8;","","obj.bulletWHRate=0;","","obj.endRoundWait=60;","","obj.lastDelay=false;","","obj.powerupTimer=0;","obj.powerupTimerMax=360;","","obj.powerupWaitTimer=0;","obj.powerupWaitTimerMax=360;","","obj.powerupSpawn=undefined;","obj.powerupSpawnTimer=0;","obj.powerupSpawnTimerMax=60;","","obj.restart=function(){","  this.powerupTimer=0;","  this.powerupWaitTimer=0;  ","  var client=jt.getObject(\"Client\");","  //client.clientObj.score=0;","  client.clientObj.projectiles=[];  ","  this.respawn();"," \t","}","","obj.respawn=function(){","  this.powerupTimer=0;","  this.powerupWaitTimer=0;  ","  var client=jt.getObject(\"Client\");","  var map=jt.getObject(\"Map\");  ","  ","  client.clientObj.x=map.spawns[client.index].x+map.ts/2-this.playerW/2;","  client.clientObj.y=map.spawns[client.index].y+map.ts/2-this.playerH/2;","  ","  if(client.index==0){","   \tclient.clientObj.r=135; ","  }else if(client.index==1){","    client.clientObj.r=315; ","  }else if(client.index==2){","    client.clientObj.r=225; ","  }else if(client.index==3){","    client.clientObj.r=45; ","  }else if(client.index==4){","    client.clientObj.r=180; ","  }else if(client.index==5){","    client.clientObj.r=0; ","  }else if(client.index==6){","    client.clientObj.r=90; ","  }else if(client.index==7){","    client.clientObj.r=270; ","  }","  ","  this.playerInvincibility=this.playerInvincibilityMax;","}","","obj.shoot=function(){"," \tthis.powerupTimer=0;","  ","  var client=jt.getObject(\"Client\");","  var player=client.clientObj;","  player.projectiles=[];","  var projectile={};","  var startX=player.x+player.w/2-this.bulletW/2;","  var startY=player.y+player.h/2-this.bulletH/2; ","  ","  var angle=player.r;","  var max=1;","  if(this.tripleShot){max=3;angle-=15;}","  ","  for(var i=0;i<max;i++){","    projectile.vX=jt.angleX(angle)*this.bulletSpeed;","    projectile.vY=jt.angleY(angle)*this.bulletSpeed;","","    projectile.x=startX+projectile.vX*2;","    projectile.y=startY+projectile.vY*2;","","    projectile.w=this.bulletW;    ","    projectile.h=this.bulletH;  ","","    projectile.frames=this.bulletTime;","","","    player.projectiles.push(projectile);","    angle+=15;","  }","}","","obj.rainbowFrame=0;","obj.rainbowFrameMax=60;","","obj.getRainbow=function(ratio){","  var r=jt.waveYPos(ratio);","  var g=jt.waveYPos(ratio+0.33);","  var b=jt.waveYPos(ratio+0.66);","  return [255*r,255*g,255*b,0.5];","}","","obj.drawPlayer=function(player,self,powerup){","  if(self==undefined){self=true;}","  if(powerup==undefined){powerup=\"\";}  ","  ","  if(powerup==\"invisible\"){","    if(self){","      jt.alpha(0.5);","    }else{","      jt.alpha(0);","    }","  }","  ","  var diffW=this.drawW-this.playerW;","  var diffH=this.drawH-this.playerH;  "," \tjt.rect(player.x-diffW/2,player.y-diffH/2,this.drawW,this.drawH,player.c,player.r);","  ","  //draw cannon","  var cannonW=8;","  var cannonH=16;","  jt.rotate(player.r,player.x+this.playerW/2-1,player.y+this.playerH/2-1,2,2);","  jt.rect(player.x+this.playerW/2-cannonW/2,player.y+this.playerH/2-cannonH,cannonW,cannonH,player.c);","  jt.rectB(player.x+this.playerW/2-cannonW/2,player.y+this.playerH/2-cannonH,cannonW,cannonH,\"black\",0,2);  ","  jt.rotate(-player.r,player.x+this.playerW/2-1,player.y+this.playerH/2-1,2,2);","  ","  //draw top circle","  var circleD=12;","  jt.circle(player.x+this.playerW/2-circleD/2,player.y+this.playerH/2-circleD/2,circleD,player.c,);  ","  jt.circleB(player.x+this.playerW/2-circleD/2,player.y+this.playerH/2-circleD/2,circleD,\"black\",2);","  ","  jt.alpha(1)","}","","obj.endRound=function(delay){","  var client=jt.getObject(\"Client\");","  this.lastDelay=delay;","  ","  ","  client.waitTime=client.waitSecond*60; ","  if(delay){","  \tclient.waitTime+=client.delay; ","  }","  ","  jt.alarm(\"changeRound\",this.endRoundWait);","}","","obj.changeRound=function(){","  var client=jt.getObject(\"Client\");"," \tclient.started=false; ","  jt.setView(\"Loading\"); ","  ","  if(client.index==0){","    \t//jt.getObject(\"Map\").generate();","      jt.getObject(\"Client\").sendMap();","  }","}",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  if(jt.checkAlarm(\"changeRound\",true)){","    this.changeRound();","  }","  ","  var client=jt.getObject(\"Client\");","  var serverObjs=client.serverObjs;","  ","  var map=jt.getObject(\"Map\");","  var walls=map.walls;","  ","  if(client.isHost){","   \tthis.powerupWaitTimer++;","    if(this.powerupWaitTimer>this.powerupWaitTimerMax){","     \tthis.powerupWaitTimer=0;","      //Spawn powerup","      var ranY=jt.random(2,map.map.length-2,2)-1;","  \t\tvar ranX=jt.random(2,map.map[0].length-2,2)-1; ","      ","      var text=jt.choose([\"i\",\"s\"])","      ","      var powerup={x:ranX*map.ts,y:ranY*map.ts,w:map.ts,h:map.ts,text:text};","      ","      client.socket.emit(\"spawnPowerup\",client.clientObj.lobby,powerup); ","      ","      this.powerupSpawn=powerup;","      this.powerupSpawnTimer=this.powerupSpawnTimerMax+client.delay;","    }","  }","  ","  if(this.powerupSpawnTimer>0){","    this.powerupWaitTimer=0;","   \tthis.powerupSpawnTimer--;","    if(this.powerupSpawnTimer<=0){","     \t//spawn powerup","      client.powerups.push(this.powerupSpawn);","    }","  }","  ","  var playerSpeedMod=1;","  this.tripleShot=false;","  ","  if(this.powerupTimer>0){","   \tthis.powerupTimer--; ","    if(client.clientObj.powerup==\"speed\"){","     \t playerSpeedMod=2;","    }","    if(client.clientObj.powerup==\"triple\"){","     \t this.tripleShot=true;","    }","  }else{","   \tclient.clientObj.powerup=\"\"; ","  }","  ","  //Rainbow","  this.rainbowFrame++;","  if(this.rainbowFrame>=this.rainbowFrameMax){","   \tthis.rainbowFrame=0; ","  }","  var rainbowRatio=this.rainbowFrame/this.rainbowFrameMax;","  var rainbow=this.getRainbow(rainbowRatio);","  ","  //Draw powerup","  /*","  var ranY=jt.random(2,map.map.length-2,2)-1;","  var ranX=jt.random(2,map.map[0].length-2,2)-1; ","  jt.rect(ranX*map.ts,ranY*map.ts,map.ts,map.ts,\"red\");","  ","  */","  ","\t//Update player","  var temp={x:client.clientObj.x,y:client.clientObj.y,w:this.playerW,h:this.playerH};","  var moveX=0;","  var moveY=0;  ","  ","  ","  ","  ","  if(jt.kCheck(\"left\")){client.clientObj.r-=this.playerTurn*playerSpeedMod;}","  if(jt.kCheck(\"right\")){client.clientObj.r+=this.playerTurn*playerSpeedMod;}  ","  client.clientObj.r=jt.wrap(client.clientObj.r,0,359)","  "," \tvar angleX=jt.angleX(client.clientObj.r);"," \tvar angleY=jt.angleY(client.clientObj.r);","  ","  if(jt.kCheck(\"up\")){","    moveX=angleX*this.playerSpeed*playerSpeedMod;","    moveY=angleY*this.playerSpeed*playerSpeedMod;    ","  }","  if(jt.kCheck(\"down\")){","   \tmoveX=-angleX*this.playerSpeedBack*playerSpeedMod;","    moveY=-angleY*this.playerSpeedBack*playerSpeedMod; ","  } ","  ","  //Col X","  var col=false;","  temp.x=temp.x+moveX;","  for(var i=0;i<walls.length;i++){","   \tvar wall=walls[i];","    if(jt.cRect(temp,wall)){","      if(temp.x+temp.w/2>wall.x+wall.w/2){","       \ttemp.x=wall.x+wall.w; ","      }else{","        temp.x=wall.x-this.playerW;","      }","      col=true;","     \tbreak; ","    }","  }","  ","  client.clientObj.x=temp.x;     ","  ","  ","  col=false;","  temp.y=temp.y+moveY;","  for(var i=0;i<walls.length;i++){","   \tvar wall=walls[i];","    if(jt.cRect(temp,wall)){","      if(temp.y+temp.h/2>wall.y+wall.h/2){","       \ttemp.y=wall.y+wall.h; ","      }else{","        temp.y=wall.y-this.playerH;","      }","      col=true;","     \tbreak; ","    }","  }","  ","  client.clientObj.y=temp.y;  ","  ","  if(this.playerInvincibility>0){","  \tthis.playerInvincibility--;","  }","  ","  var player=client.clientObj;","  player.w=this.playerW;","  player.h=this.playerH;  ","  ","  if(jt.kPress(\"space\") && client.clientObj.projectiles.length<=0){","    this.shoot();","  }","  ","  //Draw walls","  for(var i=0;i<walls.length;i++){","    var wall=walls[i];","    jt.rect(wall.x,wall.y,wall.w,wall.h,wall.c);","  }","  ","  //Draw spawns","  for(var i=0;i<map.spawns.length;i++){","    var spawn=map.spawns[i];","    jt.rect(spawn.x,spawn.y,map.ts,map.ts,\"lightblue\");","  }","  ","  ","  //Check powerup col","  for(var i=0;i<client.powerups.length;i++){","    var powerup=client.powerups[i];","    if(jt.cRect(player,powerup)){","      \tvar padding=0;","       var obj={x:player.x-padding,y:player.y-padding,w:player.w+padding*2,h:player.h+padding*2}","       ","       //get powerup","       this.powerupTimer=this.powerupTimerMax;","      if(powerup.text==\"i\"){","      \tclient.clientObj.powerup=\"invisible\";","      }else if(powerup.text==\"s\"){","        client.clientObj.powerup=\"speed\";","      }else if(powerup.text==\"t\"){","        client.clientObj.powerup=\"triple\";","      }","       ","     \t client.socket.emit(\"deletePowerup\",client.clientObj.lobby,obj);","      client.powerups.splice(i,1);","      i--;","    }","  }","  ","  jt.fontSize(24);","  //Draw powerups","  for(var i=0;i<client.powerups.length;i++){","    var powerup=client.powerups[i];","    jt.rect(powerup.x,powerup.y,powerup.w,powerup.h,rainbow);","    jt.text(powerup.text,powerup.x+powerup.w/2,powerup.y+powerup.h/2-jt.fontSize()/2,\"black\",\"center\");","  }","  ","  //Bullets"," \tcol=false;","  for(var i=0;i<player.projectiles.length;i++){","   \tvar proj=player.projectiles[i];","    ","    player.projectiles[i].frames--;","    if(player.projectiles[i].frames>0){","","","","      proj.w+=this.bulletWHRate;","      proj.h+=this.bulletWHRate;","      proj.x-=this.bulletWHRate/2;","      proj.y-=this.bulletWHRate/2;    ","","      proj.x+=proj.vX;","      for(var j=0;j<walls.length;j++){","        var wall=walls[j];","        if(jt.cRect(proj,wall)){","          //col=true;","          proj.vX*=-1","          proj.x+=proj.vX;","          break; ","        }","      }","","      proj.y+=proj.vY; ","      for(var j=0;j<walls.length;j++){","        var wall=walls[j];","        if(jt.cRect(proj,wall)){","          //col=true;","          proj.vY*=-1","          proj.y+=proj.vY; ","          break; ","        }","      }","","      jt.circle(proj.x-this.bulletOffset,proj.y-this.bulletOffset,proj.w+this.bulletOffset*2,\"black\");","","      client.clientObj.projectiles[i]=proj;","","      if(jt.cRect(player,proj) && player.projectiles[i].frames<this.bulletTime-this.bulletTimeBuffer && this.playerInvincibility<=0){","        this.respawn();","        ","        client.clientObj.projectiles=[];","        //this.endRound(true); ","        client.dead=true;","        if(client.isHost){","         \tclient.checkDead(); ","        }else{","        \tclient.socket.emit(\"dead\",client.host);  ","        }","        ","        client.clientObj.x=jt.w()/2+((client.index*2)-1)*999","        ","        break;","      }","    }else{","     \tcol=true; ","    }","  }","  ","  if(col){","  \tclient.clientObj.projectiles=[];","  }","  ","  //Draw player","  this.drawPlayer(player,true,client.clientObj.powerup);","  ","  jt.fontSize(14);","  ","  jt.text(\"Your score: \"+player.score,5,5,\"white\",\"left\");","    ","  ","  //Draw players","  var keys=Object.keys(serverObjs);","  var len=Object.keys(serverObjs).length;","  var index=1;","  ","  for (var i = 0; i < len; i++) {","    var other = serverObjs[keys[i]];","    if(client.withs.indexOf(keys[i])!=-1){","      ","      //Bullets","      for(var j=0;j<other.projectiles.length;j++){","        var proj=other.projectiles[j];       ","","        var col=false;","        if(jt.cRect(player,proj)){","          col=true;","        }else{","        \tproj.x+=proj.vX;","        \tproj.y+=proj.vY; ","          if(jt.cRect(player,proj)){","           \tcol=true; ","          }","          proj.x-=proj.vX;","        \tproj.y-=proj.vY; ","        }","","      \tjt.circle(proj.x-this.bulletOffset,proj.y-this.bulletOffset,proj.w+this.bulletOffset*2,\"black\");","        ","        if(col && this.playerInvincibility<=0){","          var padding=8;","          var obj={x:player.x-padding,y:player.y-padding,w:player.w+padding*2,h:player.h+padding*2}","          ","          client.socket.emit(\"deleteProjectile\",keys[i],obj);    ","          ","         \tthis.respawn();","          ","          client.dead=true;","          if(client.isHost){","            client.checkDead(); ","          }else{","            client.socket.emit(\"dead\",client.host);  ","          }","          ","                ","          //this.endRound(true);","          ","          client.clientObj.x=jt.w()/2+((client.index*2)-1)*999","          ","        }","      }","      ","      this.drawPlayer(other,false,other.powerup);","      ","      var text=other.name;","      var textW=jt.textW(text);","      var margin=2;","      if(other.powerup!=\"invisible\"){","      \tjt.rect(other.x+this.playerW/2-textW/2-margin,other.y-jt.fontSize()-margin,textW+margin*2,jt.fontSize()+margin*2,[255,255,255,0.5])","      \tjt.text(text,other.x+this.playerW/2,other.y-jt.fontSize(),\"black\",\"center\");","      }","      jt.text(other.name+\" score: \"+other.score,(index*(jt.w()/5))+5,5,\"white\",\"left\");","              ","      index++;","    }","  }","  ","\tjt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(610,-130,310,110,[255,127,0],0,1,'{"text":"Map","size":128,"font":"Consolas","align":"left"}',true,'Game','[""]',false,32,'Map');/*Attributes and methods go here*/
obj.map=undefined;
obj.divides=[];
obj.walls=[];

obj.ts=32;
obj.wallWH=4;

obj.spawns=[{x:0,y:0},{x:1,y:1},{x:2,y:2},{x:3,y:3},{x:0,y:0},{x:1,y:1},{x:2,y:2},{x:3,y:3}];

obj.generate=function(){
  var ts=this.ts;
  
  var mapW=jt.floor(jt.w()/ts);
  var mapH=jt.floor(jt.h()/ts); 
  
  var remW=0;
  var remH=0;  
  
  if(mapW%2==0){mapW--;remW=1;}
  if(mapH%2==0){mapH--;remH=1;}  
  
  this.map=jt.matrix(mapW,mapH,0);
  
  //Add dividers / edges
  for(var y=0;y<this.map.length;y++){
    for(var x=0;x<this.map[y].length;x++){
      if((x==this.map[y].length-1 || y==this.map.length-1) || (x%2==0 || y%2==0)){
        this.map[y][x]=1;
        if(!(x%2==0 && y%2==0) && x>0 && x<this.map[y].length-1 && y>0 && y<this.map.length-1){
          this.divides.push([x,y])
        }
      }
    }
  }
  
  //Get spawns
  var broke=false;
  this.spawns=[];
  
  //top left
  var ranY=1;
  var ranX=1;  
  this.spawns.push({x:ranX*ts,y:ranY*ts})
  
  //bottom right
  var ranY=1+8*2;
  var ranX=1+11*2; 
  this.spawns.push({x:ranX*ts,y:ranY*ts})
  
  //top right
  var ranY=1;
  var ranX=1+11*2; 
  this.spawns.push({x:ranX*ts,y:ranY*ts})
  
  //bottom left
  var ranY=1+8*2;
  var ranX=1; 
  this.spawns.push({x:ranX*ts,y:ranY*ts})
  
  //top (5+ players)
  var ranY=1;
  var ranX=1+5*2;  
  this.spawns.push({x:ranX*ts,y:ranY*ts})
  
  //bottom
  var ranY=1+8*2;
  var ranX=1+5*2+2;  
  this.spawns.push({x:ranX*ts,y:ranY*ts})
  
  //left
  var ranY=1+4*2;
  var ranX=1;  
  this.spawns.push({x:ranX*ts,y:ranY*ts})
  
  //right
  var ranY=1+4*2+2;
  var ranX=1+11*2;  
  this.spawns.push({x:ranX*ts,y:ranY*ts})
  
  //Add sets
  var sets=2;
  for(var y=0;y<this.map.length;y++){
    for(var x=0;x<this.map[y].length;x++){
      if(this.map[y][x]==0){
        this.map[y][x]=sets;
        sets++;
      }
    }
  }
  
  
  //Generate
  var step=999;
  var finished=false;
  var index=0;

  while(!finished){
    var x=-1;
    var y=-1;
    var randomIndex=-1;
    var randomWall=undefined;

    if(this.divides.length>0){
      //choose a starting spot
      randomIndex=jt.random(this.divides.length-1);
      randomWall=this.divides[randomIndex];

      x=randomWall[0];
      y=randomWall[1];
    }else{
      finished=true;

      //console.log("thinning walls");

      //Remove dividers for walls
      var ts=this.ts;
      var wh=this.wallWH;
      var mg=(ts-wh)/2;

      this.walls=[];
      this.addWall(0,0,jt.w(),ts);
      this.addWall(0,0,ts,jt.h());
      this.addWall(jt.w()-ts-remW*ts,0,ts+remW*ts,jt.h());
      this.addWall(0,jt.h()-ts-remH*ts,jt.w(),ts+remH*ts);
      
      //remove random walls
      var removeWalls=jt.random(0,8);
      console.log(removeWalls);
      for(var i=0;i<removeWalls;i++){
        var ranY=jt.random(2,this.map.length-4,2);
        var ranX=jt.random(2,this.map[0].length-4,2);     
        
      	if(this.map[ranY][ranX]==1){
         	this.map[ranY][ranX]=0; 
         	this.map[ranY-1][ranX]=0;           
         	this.map[ranY+1][ranX]=0;                     
         	this.map[ranY][ranX-1]=0;                               
         	this.map[ranY][ranX+1]=0;                                         
          
         	//this.map[ranY][ranX+1]=0;                     
         	//this.map[ranY+1][ranX+1]=0;                               
        }
      }
      
      
      for(var y=0;y<this.map.length;y++){
        for(var x=0;x<this.map[y].length;x++){
          if(this.map[y][x]==1 && x>0 && x<this.map[0].length-1 && y>0 && y<this.map.length-1){
            var left=this.isXY(x-1,y,1);
            var right=this.isXY(x+1,y,1);
            var up=this.isXY(x,y-1,1);
            var down=this.isXY(x,y+1,1);

            if(!left && !up & !right && !down){
              //no wall
            }else{
              //check all cases
              if(left){
                this.addWall(x*ts,y*ts+mg,ts/2+wh/2,wh);
              }

              if(right){
                this.addWall(x*ts+ts/2-wh/2,y*ts+mg,ts/2+wh/2,wh);
              }

              if(up){
                this.addWall(x*ts+mg,y*ts,wh,ts/2+wh/2);
              }

              if(down){
                this.addWall(x*ts+mg,y*ts+ts/2-wh/2,wh,ts/2+wh/2);
              }
            }
          }
        }
      }
    }

    if(randomWall!=undefined){
      var left=this.getXY(x-1,y);
      var right=this.getXY(x+1,y);
      var up=this.getXY(x,y-1);
      var down=this.getXY(x,y+1);

      var dirs=[left,up,right,down];

      //check horizontal/vertical priority
      var del=false;
      if(jt.random(0,1)==0){
        if(left>1 && right>1){
          if(left!=right){
            this.map[y][x]=left;
            this.changeSet(right,left);
            this.divides.splice(randomIndex,1);
            del=true;
          }
        }
        if(!del){
          if(up>1 && down>1){
            if(up!=down){
              this.map[y][x]=up;
              this.changeSet(down,up);
              this.divides.splice(randomIndex,1);
              del=true;
            }
          }
        }
      }else{
        if(up>1 && down>1){
          if(up!=down){
            this.map[y][x]=up;
            this.changeSet(down,up);
            this.divides.splice(randomIndex,1);
            del=true;
          }
        }
        if(!del){
          if(left>1 && right>1){
            if(left!=right){
              this.map[y][x]=left;
              this.changeSet(right,left);
              this.divides.splice(randomIndex,1);
              del=true;
            }
          }

        }
      }

      if(!del){
        this.divides.splice(randomIndex,1);
      }

    }

    index++;
    if(index>step){
      finished=true;
    }
  }
}

obj.findWall=function(x,y){
  var found=-1;
  for(var i=0;i<this.divides.length;i++){
    var wall=this.divides[i];
    if(wall[0]==x && wall[1]==y){
      found=i;
      break;
    }
  }
  return found;
}

obj.changeSet=function(oldSet,newSet){
  for(var y=0;y<this.map.length;y++){
    for(var x=0;x<this.map[y].length;x++){
      if(this.map[y][x]==oldSet){
        this.map[y][x]=newSet;
      }
    }
  }
}

obj.getXY=function(x,y){
  if(x>0 && x<this.map[0].length-1 && y>0 && y<this.map.length-1){
    return this.map[y][x];
  }else{
    return -1;
  }
}

obj.isXY=function(x,y,val){
  if(this.map[y][x]==val){
    return true;
  }else{
    return false;
  }
}

obj.addWall=function(x,y,w,h,c){
  if(c==undefined){
    c="black";
  }
  this.walls.push({x:x,y:y,w:w,h:h,c:c});
}

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/

	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.map=undefined;","obj.divides=[];","obj.walls=[];","","obj.ts=32;","obj.wallWH=4;","","obj.spawns=[{x:0,y:0},{x:1,y:1},{x:2,y:2},{x:3,y:3},{x:0,y:0},{x:1,y:1},{x:2,y:2},{x:3,y:3}];","","obj.generate=function(){","  var ts=this.ts;","  ","  var mapW=jt.floor(jt.w()/ts);","  var mapH=jt.floor(jt.h()/ts); ","  ","  var remW=0;","  var remH=0;  ","  ","  if(mapW%2==0){mapW--;remW=1;}","  if(mapH%2==0){mapH--;remH=1;}  ","  ","  this.map=jt.matrix(mapW,mapH,0);","  ","  //Add dividers / edges","  for(var y=0;y<this.map.length;y++){","    for(var x=0;x<this.map[y].length;x++){","      if((x==this.map[y].length-1 || y==this.map.length-1) || (x%2==0 || y%2==0)){","        this.map[y][x]=1;","        if(!(x%2==0 && y%2==0) && x>0 && x<this.map[y].length-1 && y>0 && y<this.map.length-1){","          this.divides.push([x,y])","        }","      }","    }","  }","  ","  //Get spawns","  var broke=false;","  this.spawns=[];","  ","  //top left","  var ranY=1;","  var ranX=1;  ","  this.spawns.push({x:ranX*ts,y:ranY*ts})","  ","  //bottom right","  var ranY=1+8*2;","  var ranX=1+11*2; ","  this.spawns.push({x:ranX*ts,y:ranY*ts})","  ","  //top right","  var ranY=1;","  var ranX=1+11*2; ","  this.spawns.push({x:ranX*ts,y:ranY*ts})","  ","  //bottom left","  var ranY=1+8*2;","  var ranX=1; ","  this.spawns.push({x:ranX*ts,y:ranY*ts})","  ","  //top (5+ players)","  var ranY=1;","  var ranX=1+5*2;  ","  this.spawns.push({x:ranX*ts,y:ranY*ts})","  ","  //bottom","  var ranY=1+8*2;","  var ranX=1+5*2+2;  ","  this.spawns.push({x:ranX*ts,y:ranY*ts})","  ","  //left","  var ranY=1+4*2;","  var ranX=1;  ","  this.spawns.push({x:ranX*ts,y:ranY*ts})","  ","  //right","  var ranY=1+4*2+2;","  var ranX=1+11*2;  ","  this.spawns.push({x:ranX*ts,y:ranY*ts})","  ","  //Add sets","  var sets=2;","  for(var y=0;y<this.map.length;y++){","    for(var x=0;x<this.map[y].length;x++){","      if(this.map[y][x]==0){","        this.map[y][x]=sets;","        sets++;","      }","    }","  }","  ","  ","  //Generate","  var step=999;","  var finished=false;","  var index=0;","","  while(!finished){","    var x=-1;","    var y=-1;","    var randomIndex=-1;","    var randomWall=undefined;","","    if(this.divides.length>0){","      //choose a starting spot","      randomIndex=jt.random(this.divides.length-1);","      randomWall=this.divides[randomIndex];","","      x=randomWall[0];","      y=randomWall[1];","    }else{","      finished=true;","","      //console.log(\"thinning walls\");","","      //Remove dividers for walls","      var ts=this.ts;","      var wh=this.wallWH;","      var mg=(ts-wh)/2;","","      this.walls=[];","      this.addWall(0,0,jt.w(),ts);","      this.addWall(0,0,ts,jt.h());","      this.addWall(jt.w()-ts-remW*ts,0,ts+remW*ts,jt.h());","      this.addWall(0,jt.h()-ts-remH*ts,jt.w(),ts+remH*ts);","      ","      //remove random walls","      var removeWalls=jt.random(0,8);","      console.log(removeWalls);","      for(var i=0;i<removeWalls;i++){","        var ranY=jt.random(2,this.map.length-4,2);","        var ranX=jt.random(2,this.map[0].length-4,2);     ","        ","      \tif(this.map[ranY][ranX]==1){","         \tthis.map[ranY][ranX]=0; ","         \tthis.map[ranY-1][ranX]=0;           ","         \tthis.map[ranY+1][ranX]=0;                     ","         \tthis.map[ranY][ranX-1]=0;                               ","         \tthis.map[ranY][ranX+1]=0;                                         ","          ","         \t//this.map[ranY][ranX+1]=0;                     ","         \t//this.map[ranY+1][ranX+1]=0;                               ","        }","      }","      ","      ","      for(var y=0;y<this.map.length;y++){","        for(var x=0;x<this.map[y].length;x++){","          if(this.map[y][x]==1 && x>0 && x<this.map[0].length-1 && y>0 && y<this.map.length-1){","            var left=this.isXY(x-1,y,1);","            var right=this.isXY(x+1,y,1);","            var up=this.isXY(x,y-1,1);","            var down=this.isXY(x,y+1,1);","","            if(!left && !up & !right && !down){","              //no wall","            }else{","              //check all cases","              if(left){","                this.addWall(x*ts,y*ts+mg,ts/2+wh/2,wh);","              }","","              if(right){","                this.addWall(x*ts+ts/2-wh/2,y*ts+mg,ts/2+wh/2,wh);","              }","","              if(up){","                this.addWall(x*ts+mg,y*ts,wh,ts/2+wh/2);","              }","","              if(down){","                this.addWall(x*ts+mg,y*ts+ts/2-wh/2,wh,ts/2+wh/2);","              }","            }","          }","        }","      }","    }","","    if(randomWall!=undefined){","      var left=this.getXY(x-1,y);","      var right=this.getXY(x+1,y);","      var up=this.getXY(x,y-1);","      var down=this.getXY(x,y+1);","","      var dirs=[left,up,right,down];","","      //check horizontal/vertical priority","      var del=false;","      if(jt.random(0,1)==0){","        if(left>1 && right>1){","          if(left!=right){","            this.map[y][x]=left;","            this.changeSet(right,left);","            this.divides.splice(randomIndex,1);","            del=true;","          }","        }","        if(!del){","          if(up>1 && down>1){","            if(up!=down){","              this.map[y][x]=up;","              this.changeSet(down,up);","              this.divides.splice(randomIndex,1);","              del=true;","            }","          }","        }","      }else{","        if(up>1 && down>1){","          if(up!=down){","            this.map[y][x]=up;","            this.changeSet(down,up);","            this.divides.splice(randomIndex,1);","            del=true;","          }","        }","        if(!del){","          if(left>1 && right>1){","            if(left!=right){","              this.map[y][x]=left;","              this.changeSet(right,left);","              this.divides.splice(randomIndex,1);","              del=true;","            }","          }","","        }","      }","","      if(!del){","        this.divides.splice(randomIndex,1);","      }","","    }","","    index++;","    if(index>step){","      finished=true;","    }","  }","}","","obj.findWall=function(x,y){","  var found=-1;","  for(var i=0;i<this.divides.length;i++){","    var wall=this.divides[i];","    if(wall[0]==x && wall[1]==y){","      found=i;","      break;","    }","  }","  return found;","}","","obj.changeSet=function(oldSet,newSet){","  for(var y=0;y<this.map.length;y++){","    for(var x=0;x<this.map[y].length;x++){","      if(this.map[y][x]==oldSet){","        this.map[y][x]=newSet;","      }","    }","  }","}","","obj.getXY=function(x,y){","  if(x>0 && x<this.map[0].length-1 && y>0 && y<this.map.length-1){","    return this.map[y][x];","  }else{","    return -1;","  }","}","","obj.isXY=function(x,y,val){","  if(this.map[y][x]==val){","    return true;","  }else{","    return false;","  }","}","","obj.addWall=function(x,y,w,h,c){","  if(c==undefined){","    c=\"black\";","  }","  this.walls.push({x:x,y:y,w:w,h:h,c:c});","}",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","","\t//jt.drawObject(this);"];jte.objects.push(obj);
			for(var i=0;i<this.objects.length;i++){
				if(this.objects[i].attr!='undefined'){
					this.objects[i].attr=JSON.parse(this.objects[i].attr);
				}else{
					this.objects[i].attr=undefined;
				}
				this.objects[i].tags=JSON.parse(this.objects[i].tags);
				//this.objects[i].setup();
			}
		},

		//setup is called when the game has finished loading
		setup:function(){
			this.originalW=this.w;
			this.originalH=this.h;
			//jt.fullscreen();
			jt.baseline("hanging");
			jt.pixelRate(this.pR);

			if(this.title!=""){document.title=this.title;}

			jt.resize(this.w*this.pR,this.h*this.pR);
			//can.style.width=this.w;
			//can.style.height=this.h;
			jt.canvas.ctx.scale(this.pR,this.pR);

			jt.cam().w=this.w*this.pR;
			jt.cam().h=this.h*this.pR;

			jt.smoothing(false);

			//eval codes
			if(this.code!=undefined){
				eval(this.code);
			}
			
			this.initialize();

			this.setups();
		},
		setups:function(){
			for(var i=0;i<this.objects.length;i++){
				if(this.objects[i].setup!=undefined){
					this.objects[i].setup();
				}
			}
		},
		//update is called every frame
		update:function(){
			jt.bg(this.bg);
			if(this.tileLayer<this.objects.length){
				for(var i=0;i<this.tileLayer;i++){
					if(this.objects[i].view==jte.view || this.objects[i].view==""){
						if(this.objects[i].update!=undefined){
							this.objects[i].update();
						}
					}
				}
			}else{
				for(var i=0;i<this.objects.length;i++){
					if(this.objects[i].view==jte.view || this.objects[i].view==""){
						if(this.objects[i].update!=undefined){
							this.objects[i].update();
						}
					}
				}
			}
			
			//Draw tiles
			if(this.tiles[jte.view]!=undefined){
				jt.camactive(true);
				
				//Draw only close chunks
				var chunkX=Math.floor(jt.cam().x/jte.w)*jte.w;
				var chunkY=Math.floor(jt.cam().y/jte.h)*jte.h;
				
				var chunkX2=Math.ceil((jt.cam().x+jt.cam().w)/jte.w)*jte.w;
				var chunkY2=Math.ceil((jt.cam().y+jt.cam().h)/jte.h)*jte.h;
				
				var chunkW=(chunkX2-chunkX)/jte.w;
				var chunkH=(chunkY2-chunkY)/jte.h;
				
				var chunkXs=[];
				var chunkYs=[];
				
				for(var yy=0;yy<chunkH;yy++){
					for(var xx=0;xx<chunkW;xx++){
						chunkXs.push(chunkX+(xx*jte.w));
						chunkYs.push(chunkY+(yy*jte.h));
					}
				}
				for(var chunkIndex in this.tiles[this.view]){
					if(chunkXs.indexOf(this.tiles[this.view][chunkIndex].x)!=-1 && chunkYs.indexOf(this.tiles[this.view][chunkIndex].y)!=-1){
						var tilesets=this.tiles[this.view][chunkIndex].tilesets;
						for(var tilesetIndex in tilesets){
							//Tileset individual params
							var tileset=tilesets[tilesetIndex];
							var img=tileset.img;
							var unit=tileset.unit;
							
							//Tileset 
							var tileW=this.tilesets[img].tileW
							var tileH=this.tilesets[img].tileH
							var tileOffX=this.tilesets[img].tileOffX
							var tileOffY=this.tilesets[img].tileOffY
							
							//Draw all tiles
							var tiles=tileset.tiles;
							for(var tileIndex in tiles){
								var tile=tiles[tileIndex];
								jt.image(img,tile[0],tile[1],unit,unit,0,tile[2]*tileW+tileOffX,tile[3]*tileH+tileOffY,tileW,tileH);
							}
						}
					}
				}
			}
			
			//Objects on top
			if(this.tileLayer<this.objects.length){
				for(var i=this.tileLayer;i<this.objects.length;i++){
					if(this.objects[i].view==jte.view || this.objects[i].view==""){
						if(this.objects[i].update!=undefined){
							this.objects[i].update();
						}
					}
				}
			}
		},

		//getObject
		getObject:function(name,view){
			var found=undefined;
			if(view==undefined){
				for(var i=0;i<this.objects.length;i++){
					if(this.objects[i].name==name){
						found=this.objects[i];
						break;
					}
				}
			}else{
				for(var i=0;i<this.objects.length;i++){
					if(this.objects[i].name==name && this.objects[i].view==view){
						found=this.objects[i];
						break;
					}
				}
			}
			return found;
		},

		//getObjects
		getObjects:function(tags,view,and){
			var found=[];
			if(tags==undefined){
				if(view==undefined){
					for(var i=0;i<this.objects.length;i++){
						found.push(this.objects[i]);
					}
				}else{
					for(var i=0;i<this.objects.length;i++){
						if(this.objects[i].view==view){
							found.push(this.objects[i]);
						}
					}
				}
				return found;
			}else{
				if(view==undefined){
					for(var i=0;i<this.objects.length;i++){
						for(var j=0;j<this.objects[i].tags.length;j++){
							if(tags.indexOf(this.objects[i].tags[j])!=-1){
								found.push(this.objects[i]);
								break;
							}
						}
					}
				}else{
					if(and==undefined || and==false){
						for(var i=0;i<this.objects.length;i++){
							for(var j=0;j<this.objects[i].tags.length;j++){
								if(this.objects[i].view==view){
									if(tags.indexOf(this.objects[i].tags[j])!=-1){
										found.push(this.objects[i]);
										break;
									}
								}
							}
						}
					}else if(and==true){
						for(var i=0;i<this.objects.length;i++){
							var tag=0;
							for(var j=0;j<this.objects[i].tags.length;j++){
								if(this.objects[i].view==view){
									if(tags.indexOf(this.objects[i].tags[j])!=-1){
										tag++;
										if(tag==tags.length){
											found.push(this.objects[i]);
											break;
										}
									}else{
										break;
									}
								}else{
									break;
								}
							}
						}
					}
				}
				return found;
			}
		},

		//delObject
		delObject:function(name,view){
			var found=false;
			if(view==undefined){
				for(var i=0;i<this.objects.length;i++){
					if(this.objects[i].name==name){
						found=true;
						if(i<=this.tileLayer){this.tileLayer--;}
						this.objects.splice(i,1);
						break;
					}
				}
			}else{
				for(var i=0;i<this.objects.length;i++){
					if(this.objects[i].name==name && this.objects[i].view==view){
						found=true;
						if(i<=this.tileLayer){this.tileLayer--;}
						this.objects.splice(i,1);
						break;
					}
				}
			}
			return found;
		},
		
		
		//delObjects
		delObjects:function(tags,view,and){
			var found=[];
			if(tags==undefined){
				if(view==undefined){
					for(var i=0;i<this.objects.length;i++){
						found.push(this.objects[i].name);
					}
				}else{
					for(var i=0;i<this.objects.length;i++){
						if(this.objects[i].view==view){
							found.push(this.objects[i].name);
						}
					}
				}
			}else{
				if(view==undefined){
					for(var i=0;i<this.objects.length;i++){
						for(var j=0;j<this.objects[i].tags.length;j++){
							if(tags.indexOf(this.objects[i].tags[j])!=-1){
								found.push(this.objects[i].name);
								break;
							}
						}
					}
				}else{
					if(and==undefined || and==false){
						for(var i=0;i<this.objects.length;i++){
							for(var j=0;j<this.objects[i].tags.length;j++){
								if(this.objects[i].view==view){
									if(tags.indexOf(this.objects[i].tags[j])!=-1){
										found.push(this.objects[i].name);
										break;
									}
								}
							}
						}
					}else if(and==true){
						for(var i=0;i<this.objects.length;i++){
							var tag=0;
							for(var j=0;j<this.objects[i].tags.length;j++){
								if(this.objects[i].view==view){
									if(tags.indexOf(this.objects[i].tags[j])!=-1){
										tag++;
										if(tag==tags.length){
											found.push(this.objects[i].name);
											break;
										}
									}else{
										break;
									}
								}else{
									break;
								}
							}
						}
					}
				}
			}
			for(var i=0;i<found.length;i++){
				this.delObject(found[i]);
			}
		},

		//x,y,w,h,c,alpha,attr,cam,v,name
		//newObject
		newObject:function(x,y,w,h,c,r,alpha,attr,cam,view,tags,name){
			var n="";
			if(typeof x === 'object' && x !== null){
				if(x.name==undefined){
					x.name="Obj"+jte.objects.length;
					n=x.name;
				}else{
					n=x.name;
				}
				jte.objects.push(new JTEObject(x.x,x.y,x.w,x.h,x.c,x.r,x.alpha,x.attr,x.cam,x.view,x.tags,false,false,n))
			}else if(typeof x === 'number'){
				if(name==undefined){
					name="Obj"+jte.objects.length;
				}
				n=name;
				jte.objects.push(new JTEObject(x,y,w,h,c,r,alpha,attr,cam,view,tags,false,false,n))
			}
			return jte.getObject(n);
		},

		//setView
		setView:function(name){
			if(jte.views.indexOf(name)!=-1){
				jte.view=name;
			}
		},

		//getView
		getView:function(index){
			if(index==undefined){
				return jte.view;
			}else{
				if(typeof index=="number"){
					return jte.views[index];
				}else{
					if(jte.views.indexOf(index)!=-1){
						return jte.views.indexOf(index);
					}
				}
			}
		},

		//getViews
		getViews:function(){
			return jte.views;
		},

		//draw objects
		draw:function(o){
			if(o.view=="" || o.view==this.view){
				var outline=false;
				var c=o.c;
				var r=o.r;
				var obj={x:o.x,y:o.y,w:o.w,h:o.h,attr:o.attr,selected:o.selected,alpha:o.alpha};

				var draw=true;
				
				var cam=jt.camactive();
				if(o.cam==false){
					jt.camactive(false);
					if(obj.x+obj.w<-jt.w()){draw=false};
					if(obj.x>jt.w()*2){draw=false};
					if(obj.y+obj.h<-jt.h()){draw=false};
					if(obj.y>jt.h()*2){draw=false};
				}else{
					jt.camactive(true);
					if(obj.x+obj.w<jt.cam().x-jt.cam().w){draw=false};
					if(obj.x>jt.cam().x+jt.cam().w*2){draw=false};
					if(obj.y+obj.h<jt.cam().y-jt.cam().h){draw=false};
					if(obj.y>jt.cam().y+jt.cam().h*2){draw=false};
				}
				
				if(draw){
				
					//change alpha
					var changeAlpha=false;
					if(obj.alpha!=1){
						changeAlpha=true;
						jt.alpha(o.alpha);
					}

					if(obj.attr!=undefined){
						if(obj.attr.text!=undefined){
							jt.baseline("top");
							var t=obj.attr.text;
							var fS=jte.fontSize;
							var font="Consolas";
							var align="left";
							var alwaysShow=true
							var offset=0;

							if(obj.attr.size!=undefined){fS=obj.attr.size}
							if(obj.attr.font!=undefined){font=obj.attr.font}
							if(obj.attr.align!=undefined){align=obj.attr.align}
							if(obj.attr.alwaysShow!=undefined){alwaysShow=obj.attr.alwaysShow}

							var ratioCam=jt.w()/jt.cam().w;
							var divider=1;
							if(o.cam==true){
								fS*=ratioCam;
								divider=ratioCam
							}

							if(align=="center"){
								offset=obj.w/2;
							}

							if(align=="right"){
								offset=obj.w;
							}

							jt.font(font,fS);
							var w=jt.textW(t)/divider;
							var w1=jt.textW("a")/divider;
							var h=jt.textH(t)/divider;
							var maxChars=Math.ceil(obj.w/w1)

							if((w<=obj.w && h<=obj.h) || alwaysShow){
								jt.text(t,obj.x+offset,obj.y,c,align,fS,r,maxChars,fS/ratioCam);
							}else{
								if(h>obj.h){
									//too small
								}else{
									if(w>obj.w){
										if(w1>obj.w){
											//too small
										}else{
											//line breaks
											var maxLen=1;
											for(var j=1;j<t.length;j++){
												if(w1*j>obj.w){
													break;
												}else{
													maxLen=j;
												}
											}
											var numLines=Math.ceil(t.length/maxLen);
											var maxLines=1;
											for(var j=1;j<=numLines;j++){
												if(h*j>obj.h){
													break;
												}else{
													maxLines=j;
												}
											}
											//draw all lines
											for(var j=0;j<maxLines;j++){
												var str=t.substr(j*maxLen,maxLen);
												jt.text(str,obj.x+offset,obj.y+(h*j),c,align,fS,r);
											}
										}
									}
								}
							}


						}else if(obj.attr.img!=undefined){
							if(jt.assets.images[obj.attr.img]!=undefined){
								jt.image(obj.attr.img,obj.x,obj.y,obj.w,obj.h,r,obj.attr.sX,obj.attr.sY,obj.attr.sW,obj.attr.sH);
							}else{
								jt.rect(obj.x,obj.y,obj.w,obj.h,"black",r);
							}
						}else if(obj.attr.anim!=undefined){
							if(jt.assets.images[obj.attr.anim]!=undefined){
								jt.anim(obj.attr.anim,obj.x,obj.y,obj.w,obj.h,r);
							}else{
								jt.rect(obj.x,obj.y,obj.w,obj.h,"black",r);
							}
						}else if(obj.attr.shape!=undefined){
							if(obj.attr.shape=="circle"){
								var biggest=obj.w;
								if(obj.h>obj.w){
									biggest=obj.h;
								}
								jt.circle(obj.x,obj.y,biggest,c)
							}else if(obj.attr.shape=="ellipse"){
								jt.ellipse(obj.x,obj.y,obj.w,obj.h,c,r)
							}else if(obj.attr.shape=="line"){
								var x=obj.x;
								var y=obj.y;
								var w=obj.x+obj.w;
								var h=obj.y+obj.h;
								if(obj.attr.dirX==-1){
									x=obj.x+obj.w
									w=obj.x;
								}
								if(obj.attr.dirY==-1){
									y=obj.y+obj.h
									h=obj.y;
								}
								jt.line(x,y,w,h,obj.attr.lineW,c,r)
							}
						}
					}else{
						jt.rect(obj.x,obj.y,obj.w,obj.h,c,r);
					}
					if(changeAlpha){
						jt.alpha(1)
					}
					if(obj.selected && outline){
						jt.rectB(obj.x,obj.y,obj.w,obj.h,[0,0,0,0.75],r,2);
					}
				}
				jt.camactive(cam);
			}
		}
	}

	//define the jt object on a global scale
	var jt=undefined;

	var interval=undefined;

	var loadEval=[];

	function loadAssets(arr){
		for(var i=0;i<arr.length;i++){
			if(arr[i].type=="image"){
				loadEval.push("jt.loadImage('"+arr[i].path+"','"+arr[i].name+"');")
			}else if(arr[i].type=="audio"){
				loadEval.push("jt.loadSound('"+arr[i].path+"','"+arr[i].name+"',"+arr[i].repeat+","+arr[i].volume+");")
			}else if(arr[i].type=="anim"){
				loadEval.push("jt.loadAnim('"+arr[i].path+"','"+arr[i].name+"',"+arr[i].frames+","+arr[i].speed+");")
			}
		}
	}


	function loadJt(){
		clearInterval(interval);
		//parameters of the JT object:
		//id of the canvas
		//width
		//height
		//frames per second
		//setup function name
		//update function name
		//name of the object which has the setup and update functions
		//fullScreen button on mobile

		jt=new JT("jeuCanvas",jte.w,jte.h,60,'setup','update','jte',jte.maximize);

		jt.getObject=function(name,view){return jte.getObject(name,view)};
		jt.get=function(name,view){return jte.getObject(name,view)};
		jt.getObjects=function(tags,view,and){return jte.getObjects(tags,view,and)};
		jt.gets=function(tags,view,and){return jte.getObjects(tags,view,and)};
		jt.delObject=function(name,view){return jte.delObject(name,view)};
		jt.delObjects=function(tags,view,and){return jte.delObjects(tags,view,and)};
		jt.newObject=function(x,y,w,h,c,r,alpha,attr,cam,view,tags,name){return jte.newObject(x,y,w,h,c,r,alpha,attr,cam,view,tags,name)};
		jt.setView=function(view){return jte.setView(view)};
		jt.getView=function(index){return jte.getView(index)};
		jt.getViews=function(){return jte.getViews()};
		jt.drawObject=function(obj){return jte.draw(obj)};

		for(var i=0;i<loadEval.length;i++){
			eval(loadEval[i])
		}
		//jt.loadImage("image.png","name")
		//jt.loadSound("sound.mp3","name")
		//jt.loadAnim("src.png","name",number of frames,fps);
	}
	


	//you can also use $(document).ready(function(){}); with jQuery
	$(document).ready(function(){
		if(jte.code!=undefined){
			loadJt();
		}else{
			interval=setInterval(function(){if(jte.code!=undefined){
			loadJt();}},10);
		}
	});


	