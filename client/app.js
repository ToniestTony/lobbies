
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
		title:"Tank lobbies v0.85",
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
		
		views:["Start","Lobby","Loading","Game","Controls"],
		view:"Start",

		bg:[255,255,255,1],

		code:"",

		pR:1,

		initialize:function(){
			var obj=new JTEObject(0,-90,240,70,[0,0,255],0,1,'{"text":"Client","size":64,"font":"Consolas","align":"left"}',true,'','[""]',false,-1,'Client');/*Attributes and methods go here*/
obj.socketId=undefined;

obj.fps=1000/30;

obj.clientObj={name:"",c:[0,0,255],x:0,y:0,toxic:0,score:0,projectiles:[],powerupTimer:0,powerup:"",state:"",time:0,r:0,playing:false,lobby:undefined,host:undefined};
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

obj.shot=false;

obj.wonId=undefined;

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
     	//this.clientObj.score++; 
      console.log("send1",this.socketId);
      jt.getObject("Client").socket.emit("addScore",this.clientObj.lobby,this.socketId);
    }else{
      if(this.alives.length>0){
      	var alive=this.alives[0];
        console.log("send2",alive);
     	 jt.getObject("Client").socket.emit("addScore",this.clientObj.lobby,alive);
      }
    }
    
    jt.getObject("Game").endRound(true)
    jt.getObject("Client").socket.emit("endRound",this.clientObj.lobby);
    
  }
}

obj.sendMap=function(){
  //var client=jt.getObject("Client");
  jt.getObject("Client").powerups=[];
  jt.getObject("Client").dead=false;  
  jt.getObject("Client").deads=0;  
  jt.getObject("Client").checked=false;  
  jt.getObject("Client").alives=[];  
  for(var i=0;i<jt.getObject("Client").withs.length;i++){
    jt.getObject("Client").alives.push(jt.getObject("Client").withs[i]);
  }
  
  var map=jt.getObject("Map");
  
  map.generate();
  jt.getObject("Client").socket.emit("map",jt.getObject("Client").clientObj.lobby,map.walls,map.spawns,map.size);
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
    //console.log("io exists");
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
    //console.log("wt1");
  })
  
  this.socket.on("start",function(senderId,index){  
     jt.getObject("Client").host=senderId;
     jt.getObject("Client").index=index;    
    jt.getObject("Client").accepted=true;     
    jt.getObject("Client").delayTime=0;
    jt.getObject("Client").delaySent=true;
    jt.getObject("Client").waitTime=jt.getObject("Client").waitSecond*60;
    jt.getObject("Client").socket.emit("delay",senderId);
    jt.getObject("Client").clientObj.score=0;
    //console.log("wt2");
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
      //console.log("wt1");
      
      jt.getObject("Client").sendMap();
    }
  })
  
  this.socket.on("map",function(senderId,walls,spawns,size){
    jt.getObject("Client").deads=0; 
        
    jt.getObject("Client").started=false;     
    jt.getObject("Client").playing=senderId;     
    jt.getObject("Client").inviteSent=undefined;     
    jt.getObject("Client").inviteReceived=undefined;         
    jt.getObject("Client").accepted=true;    
    if(jt.getObject("Client").delaySent){
      jt.getObject("Client").delay=jt.ceil(jt.getObject("Client").delayTime/2);
      jt.getObject("Client").delayTime=0;    
      jt.getObject("Client").delaySent=false;
    }
    //jt.getObject("Client").waitTime+=jt.getObject("Client").delay;    
    //jt.getObject("Client").socket.emit("delay2",senderId);
    //jt.setView("Loading");
    //jt.getObject("Client").clientObj.score=0;
    
    if(jt.getView()!="Game"){
     	jt.setView("Loading"); 
    }
    
    jt.getObject("Map").walls=walls; 
    jt.getObject("Map").spawns=spawns;  
    jt.getObject("Map").size=size;      
    
    jt.getObject("Game").restart();
  })
  
  /*
  this.socket.on("map",function(senderId,walls,spawns){
    jt.getObject("Map").walls=walls; 
    jt.getObject("Map").spawns=spawns;  
    
    jt.getObject("Game").restart();
  })
  */
  
  this.socket.on("addScore",function(id,senderId){
    console.log("received",id,jt.getObject("Client").socketId);
    if(jt.getObject("Client").socketId==id){
    	jt.getObject("Client").clientObj.score++;
    }
    jt.getObject("Client").wonId=id;
    //jt.getObject("Game").endRound(false)
  })
  
  this.socket.on("endRound",function(senderId){
    jt.getObject("Game").endRound(false)
  })
  
  this.socket.on("deleteProjectile",function(senderId,obj){
    
    var projectiles=jt.getObject("Client").clientObj.projectiles;
    var add=undefined;
    for(var i=0;i<projectiles.length;i++){
      var proj=projectiles[i];
      if(jt.cCircle(proj,obj)){
        if(proj.powerup=="teleport"){
          jt.getObject("Client").clientObj.powerup="";
          jt.getObject("Game").powerupTimer=0;   
        }
        
        if(proj.powerup=="bazooka"){
         	//Spawn explosion       
          
          var explosion=jt.getObject("Game").getExplosion(proj)
          add=explosion;
          
          jt.getObject("Client").clientObj.projectiles.splice(i,1);
       		i--; 
          
        }else{
        	jt.getObject("Client").clientObj.projectiles.splice(i,1);
       		i--; 
        }
      }
    }
    
    if(add!=undefined){
     	jt.getObject("Client").clientObj.projectiles.push(add);  
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
      if(jt.cCircle(powerup,obj)){
        jt.getObject("Client").powerups.splice(i,1);
       	i--; 
      }
    }
  })
  
  this.socket.on("deleteWall",function(obj){
    var game=jt.getObject("Game");
    var map=jt.getObject("Map");
    var walls=map.walls; 
    
    for(var i=0;i<walls.length;i++){
      var powerup=walls[i];
      if(jt.cRectCircle(walls[i],obj) && !walls[i].invincible){
        jt.getObject("Map").walls.splice(i,1);
       	i--; 
        //break;
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
      this.socket.emit("update",this.clientObj);
    }
  }else{
   	this.updateCooldown--; 
  }
  
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.socketId=undefined;","","obj.fps=1000/30;","","obj.clientObj={name:\"\",c:[0,0,255],x:0,y:0,toxic:0,score:0,projectiles:[],powerupTimer:0,powerup:\"\",state:\"\",time:0,r:0,playing:false,lobby:undefined,host:undefined};","obj.serverObjs={};","","obj.lobbies=[];","","obj.updated=false;","","obj.sent=false;","obj.sent2=false;","obj.inserted=false;","","obj.highscores=[];","","obj.updateCooldown=0;","obj.updateCooldownMax=2;","","obj.started=undefined;","obj.playing=undefined;","obj.inviteSent=undefined;","obj.inviteReceived=undefined;","","obj.playings=[];","obj.withs=[];","obj.received=[];","obj.receivedMax=[];","","obj.isHost=false;","obj.host=undefined;","","obj.index=0;","","obj.deads=0;","","obj.waitSecond=3;","obj.waitTime=0;","","obj.delaySent=false;","obj.delayTime=0;","obj.delay=0;","","obj.powerups=[];","","obj.checked=false;","","obj.shot=false;","","obj.wonId=undefined;","","obj.checkDead=function(id){","  var index=this.alives.indexOf(id);","  if(index>=0){","   \tthis.alives.splice(index,1); ","  }","  "," \tvar max=this.withs.length+1;","  var cpt=0;","  ","  if(this.dead){cpt=1;}","  cpt+=this.deads;","  if(cpt>=max-1 && !this.checked){","    this.checked=true;","   //round over, send score to right person and send restart to all","    if(!this.dead){","     \t//this.clientObj.score++; ","      console.log(\"send1\",this.socketId);","      jt.getObject(\"Client\").socket.emit(\"addScore\",this.clientObj.lobby,this.socketId);","    }else{","      if(this.alives.length>0){","      \tvar alive=this.alives[0];","        console.log(\"send2\",alive);","     \t jt.getObject(\"Client\").socket.emit(\"addScore\",this.clientObj.lobby,alive);","      }","    }","    ","    jt.getObject(\"Game\").endRound(true)","    jt.getObject(\"Client\").socket.emit(\"endRound\",this.clientObj.lobby);","    ","  }","}","","obj.sendMap=function(){","  //var client=jt.getObject(\"Client\");","  jt.getObject(\"Client\").powerups=[];","  jt.getObject(\"Client\").dead=false;  ","  jt.getObject(\"Client\").deads=0;  ","  jt.getObject(\"Client\").checked=false;  ","  jt.getObject(\"Client\").alives=[];  ","  for(var i=0;i<jt.getObject(\"Client\").withs.length;i++){","    jt.getObject(\"Client\").alives.push(jt.getObject(\"Client\").withs[i]);","  }","  ","  var map=jt.getObject(\"Map\");","  ","  map.generate();","  jt.getObject(\"Client\").socket.emit(\"map\",jt.getObject(\"Client\").clientObj.lobby,map.walls,map.spawns,map.size);","  jt.getObject(\"Game\").restart();","}","","obj.socket = {"," \ton:function(){","    ","  },","  emit:function(){","    ","  }","}","","obj.connected=false;",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\tif(window[\"io\"]!==undefined){","    //console.log(\"io exists\");","    this.socket=io();","  }","  ","  this.socket.on(\"connected\",function(id,num){","    jt.getObject(\"Client\").connected=true;","    jt.getObject(\"Client\").socketId=id;    ","    jt.getObject(\"Client\").clientObj.name=\"Guest \"+num;    ","  });","  ","  jt.debug(true);","  jt.mute(true);  ","  ","  this.pause=false;","  ","  this.socket.on(\"getData\",function(senderId,serverObj){","    jt.getObject(\"Client\").serverObjs[senderId]=serverObj;","    jt.getObject(\"Client\").updated=true;","    jt.getObject(\"Client\").gotAData=true;","  })","  ","  this.socket.on(\"invite\",function(senderId){","    jt.getObject(\"Client\").inviteReceived=senderId;","    jt.getObject(\"Client\").accepted=false; ","","  })","  ","  this.socket.on(\"cancel\",function(senderId){","    jt.getObject(\"Client\").inviteReceived=undefined;","    jt.getObject(\"Client\").delaySent=false;","    jt.getObject(\"Client\").accepted=false;    ","  })","  ","  this.socket.on(\"refuse\",function(senderId){","    jt.getObject(\"Client\").inviteSent=undefined;","    jt.getObject(\"Client\").delaySent=false;","    jt.getObject(\"Client\").accepted=false; ","  })","  ","  this.socket.on(\"chat message\",function(msg,color){","    jt.getObject(\"Chat\").messages.push(msg);","    jt.getObject(\"Chat\").messagesC.push(color);    ","  })","  ","  this.socket.on(\"accept\",function(senderId){","    //jt.getObject(\"Client\").received=0; ","    //jt.getObject(\"Client\").receivedMax=jt.getObject(\"Client\").withs.length;     ","    jt.getObject(\"Client\").accepted=true;     ","    jt.getObject(\"Client\").delayTime=0;","    jt.getObject(\"Client\").delaySent=true;","    jt.getObject(\"Client\").waitTime=jt.getObject(\"Client\").waitSecond*60;","    jt.getObject(\"Client\").socket.emit(\"delay\",senderId);","    //console.log(\"wt1\");","  })","  ","  this.socket.on(\"start\",function(senderId,index){  ","     jt.getObject(\"Client\").host=senderId;","     jt.getObject(\"Client\").index=index;    ","    jt.getObject(\"Client\").accepted=true;     ","    jt.getObject(\"Client\").delayTime=0;","    jt.getObject(\"Client\").delaySent=true;","    jt.getObject(\"Client\").waitTime=jt.getObject(\"Client\").waitSecond*60;","    jt.getObject(\"Client\").socket.emit(\"delay\",senderId);","    jt.getObject(\"Client\").clientObj.score=0;","    //console.log(\"wt2\");","  })","  /*","  this.socket.on(\"delay\",function(senderId,time){","    jt.getObject(\"Client\").started=false; ","    jt.getObject(\"Client\").playing=senderId;     ","    jt.getObject(\"Client\").inviteSent=undefined;     ","    jt.getObject(\"Client\").inviteReceived=undefined;         ","    jt.getObject(\"Client\").accepted=true;     ","    jt.getObject(\"Client\").delay=jt.ceil(jt.getObject(\"Client\").delayTime/2);","    jt.getObject(\"Client\").delayTime=0;    ","    jt.getObject(\"Client\").delaySent=false;","    jt.getObject(\"Client\").waitTime+=jt.getObject(\"Client\").delay;    ","    jt.getObject(\"Client\").socket.emit(\"delay2\",senderId);","    jt.setView(\"Loading\");","    jt.getObject(\"Client\").index=1; ","    jt.getObject(\"Client\").clientObj.score=0;","    ","    jt.getObject(\"Game\").restart();","    ","  })","  */","  ","  /*","  this.socket.on(\"delay2\",function(senderId,time){","    jt.getObject(\"Client\").started=false; ","    jt.getObject(\"Client\").playing=senderId; ","    jt.getObject(\"Client\").inviteSent=undefined;     ","    jt.getObject(\"Client\").inviteReceived=undefined;         ","    jt.getObject(\"Client\").accepted=true;     ","    jt.getObject(\"Client\").delay=jt.ceil(jt.getObject(\"Client\").delayTime/2);","    jt.getObject(\"Client\").delayTime=0;    ","    jt.getObject(\"Client\").delaySent=false;","    jt.setView(\"Loading\");","    jt.getObject(\"Client\").index=0;","    jt.getObject(\"Client\").clientObj.score=0;","    ","    jt.getObject(\"Client\").received++;    ","    if(jt.getObject(\"Client\").received>=jt.getObject(\"Client\").receivedMax){","      jt.getObject(\"Map\").generate();","      jt.getObject(\"Client\").socket.emit(\"map\",senderId,jt.getObject(\"Map\").walls,jt.getObject(\"Map\").spawns);","      jt.getObject(\"Game\").restart();","    }","  })","  */","  ","  this.socket.on(\"delay\",function(senderId,time){","    jt.getObject(\"Client\").started=false; ","    jt.getObject(\"Client\").playing=senderId; ","    jt.getObject(\"Client\").inviteSent=undefined;     ","    jt.getObject(\"Client\").inviteReceived=undefined;         ","    jt.getObject(\"Client\").accepted=true;     ","    ","    jt.setView(\"Loading\");","    jt.getObject(\"Client\").clientObj.score=0;","    ","    jt.getObject(\"Client\").received++;    ","    if(jt.getObject(\"Client\").received>=jt.getObject(\"Client\").receivedMax){","       jt.getObject(\"Client\").index=0;","      jt.getObject(\"Client\").delay=jt.ceil(jt.getObject(\"Client\").delayTime/2);","      jt.getObject(\"Client\").delayTime=0;    ","      jt.getObject(\"Client\").delaySent=false;","      jt.getObject(\"Client\").waitTime+=jt.getObject(\"Client\").delay; ","      //console.log(\"wt1\");","      ","      jt.getObject(\"Client\").sendMap();","    }","  })","  ","  this.socket.on(\"map\",function(senderId,walls,spawns,size){","    jt.getObject(\"Client\").deads=0; ","        ","    jt.getObject(\"Client\").started=false;     ","    jt.getObject(\"Client\").playing=senderId;     ","    jt.getObject(\"Client\").inviteSent=undefined;     ","    jt.getObject(\"Client\").inviteReceived=undefined;         ","    jt.getObject(\"Client\").accepted=true;    ","    if(jt.getObject(\"Client\").delaySent){","      jt.getObject(\"Client\").delay=jt.ceil(jt.getObject(\"Client\").delayTime/2);","      jt.getObject(\"Client\").delayTime=0;    ","      jt.getObject(\"Client\").delaySent=false;","    }","    //jt.getObject(\"Client\").waitTime+=jt.getObject(\"Client\").delay;    ","    //jt.getObject(\"Client\").socket.emit(\"delay2\",senderId);","    //jt.setView(\"Loading\");","    //jt.getObject(\"Client\").clientObj.score=0;","    ","    if(jt.getView()!=\"Game\"){","     \tjt.setView(\"Loading\"); ","    }","    ","    jt.getObject(\"Map\").walls=walls; ","    jt.getObject(\"Map\").spawns=spawns;  ","    jt.getObject(\"Map\").size=size;      ","    ","    jt.getObject(\"Game\").restart();","  })","  ","  /*","  this.socket.on(\"map\",function(senderId,walls,spawns){","    jt.getObject(\"Map\").walls=walls; ","    jt.getObject(\"Map\").spawns=spawns;  ","    ","    jt.getObject(\"Game\").restart();","  })","  */","  ","  this.socket.on(\"addScore\",function(id,senderId){","    console.log(\"received\",id,jt.getObject(\"Client\").socketId);","    if(jt.getObject(\"Client\").socketId==id){","    \tjt.getObject(\"Client\").clientObj.score++;","    }","    jt.getObject(\"Client\").wonId=id;","    //jt.getObject(\"Game\").endRound(false)","  })","  ","  this.socket.on(\"endRound\",function(senderId){","    jt.getObject(\"Game\").endRound(false)","  })","  ","  this.socket.on(\"deleteProjectile\",function(senderId,obj){","    ","    var projectiles=jt.getObject(\"Client\").clientObj.projectiles;","    var add=undefined;","    for(var i=0;i<projectiles.length;i++){","      var proj=projectiles[i];","      if(jt.cCircle(proj,obj)){","        if(proj.powerup==\"teleport\"){","          jt.getObject(\"Client\").clientObj.powerup=\"\";","          jt.getObject(\"Game\").powerupTimer=0;   ","        }","        ","        if(proj.powerup==\"bazooka\"){","         \t//Spawn explosion       ","          ","          var explosion=jt.getObject(\"Game\").getExplosion(proj)","          add=explosion;","          ","          jt.getObject(\"Client\").clientObj.projectiles.splice(i,1);","       \t\ti--; ","          ","        }else{","        \tjt.getObject(\"Client\").clientObj.projectiles.splice(i,1);","       \t\ti--; ","        }","      }","    }","    ","    if(add!=undefined){","     \tjt.getObject(\"Client\").clientObj.projectiles.push(add);  ","    }","  })","  ","  this.socket.on(\"spawnPowerup\",function(powerup){","    var game=jt.getObject(\"Game\");","    game.powerupSpawn=powerup;","    game.powerupSpawnTimer=game.powerupSpawnTimerMax+jt.getObject(\"Client\").delay;","  })","  ","  this.socket.on(\"deletePowerup\",function(obj){","    var game=jt.getObject(\"Game\");","    var powerups=jt.getObject(\"Client\").powerups;","    for(var i=0;i<powerups.length;i++){","      var powerup=powerups[i];","      if(jt.cCircle(powerup,obj)){","        jt.getObject(\"Client\").powerups.splice(i,1);","       \ti--; ","      }","    }","  })","  ","  this.socket.on(\"deleteWall\",function(obj){","    var game=jt.getObject(\"Game\");","    var map=jt.getObject(\"Map\");","    var walls=map.walls; ","    ","    for(var i=0;i<walls.length;i++){","      var powerup=walls[i];","      if(jt.cRectCircle(walls[i],obj) && !walls[i].invincible){","        jt.getObject(\"Map\").walls.splice(i,1);","       \ti--; ","        //break;","      }","    }","  })","  \t","  ","  this.socket.on(\"dead\",function(senderId){","    jt.getObject(\"Client\").deads++;","    if(jt.getObject(\"Client\").isHost){","    \tjt.getObject(\"Client\").checkDead(senderId);","    }","  })","  ","  this.socket.on(\"refresh\",function(lobbies){","    jt.getObject(\"Client\").lobbies=lobbies;","  })","  ","  this.socket.on(\"leave\",function(){","    jt.getObject(\"Client\").clientObj.lobby=undefined;","    jt.getObject(\"Client\").clientObj.host=undefined;    ","  })"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  if(!this.started){","    if(this.playing!=undefined){","      if(this.waitTime>0){","        this.waitTime--; ","      }else{","       \tthis.started=true; ","      }","    }","  }","  ","  this.socket.on(\"disconnected\",function(senderId){","    /*","    if(app.state==\"battle\" && app.playing==senderId){","      app.disconnected=senderId;","    }else if(app.state==\"menu\" && (app.inviteReceived==senderId || app.inviteSent==senderId)){","      app.inviteSent=undefined;","      app.inviteReceived=undefined;","","      app.playing=undefined;","","      delete serverObjs[senderId];","    }else{","      delete serverObjs[senderId];","    }","    */","    if(jt.getObject(\"Client\").playing==senderId){","     \tjt.getObject(\"Client\").playing=undefined; ","      jt.getObject(\"Client\").inviteSent=undefined; ","      jt.getObject(\"Client\").inviteReceived=undefined; ","      //go back to lobby","      jt.setView(\"Lobby\");","    }","    ","    if(jt.getObject(\"Client\").inviteSent==senderId){","     \tjt.getObject(\"Client\").inviteSent=undefined; ","    }","    ","    if(jt.getObject(\"Client\").inviteReceived==senderId){","     \tjt.getObject(\"Client\").inviteReceived=undefined; ","    }","    ","    delete jt.getObject(\"Client\").serverObjs[senderId];","  })","\t","  if(this.updateCooldown<=0){","    ","    if(this.connected){","      this.updateCooldown=this.updateCooldownMax;","      this.clientObj.playing=true;","      this.socket.emit(\"update\",this.clientObj);","    }","  }else{","   \tthis.updateCooldown--; ","  }","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(0,0,800,70,[0,0,0],0,1,'{"text":"TANKS BUT NO THANKS","size":64,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'ENTER NAME');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  //var player={x:64,y:32,c:[0,0,255],r:jt.frames()*6};
  //jt.getObject("Game").drawPlayer(player);  
  
	jt.camActive(true);
  jt.camReset();     
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  //var player={x:64,y:32,c:[0,0,255],r:jt.frames()*6};","  //jt.getObject(\"Game\").drawPlayer(player);  ","  ","\tjt.camActive(true);","  jt.camReset();     ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(10,90,170,20,[0,0,0],0,1,'{"text":"Name","size":24,"align":"center","font":"Consolas"}',true,'Controls','["ControlsName"]',false,-1,'Obj45');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(210,90,170,20,[0,0,0],0,1,'{"text":"Name","size":24,"align":"center","font":"Consolas"}',true,'Controls','["ControlsName"]',false,-1,'Obj66');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(410,90,170,20,[0,0,0],0,1,'{"text":"Name","size":24,"align":"center","font":"Consolas"}',true,'Controls','["ControlsName"]',false,-1,'Obj83');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(610,90,170,20,[0,0,0],0,1,'{"text":"Name","size":24,"align":"center","font":"Consolas"}',true,'Controls','["ControlsName"]',false,-1,'Obj98');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(10,340,170,20,[0,0,0],0,1,'{"text":"Name","size":24,"align":"center","font":"Consolas"}',true,'Controls','["ControlsName"]',false,-1,'Obj113');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(210,340,170,20,[0,0,0],0,1,'{"text":"Name","size":24,"align":"center","font":"Consolas"}',true,'Controls','["ControlsName"]',false,-1,'Obj128');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(410,340,170,20,[0,0,0],0,1,'{"text":"Name","size":24,"align":"center","font":"Consolas"}',true,'Controls','["ControlsName"]',false,-1,'Obj143');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(610,340,170,20,[0,0,0],0,1,'{"text":"Name","size":24,"align":"center","font":"Consolas"}',true,'Controls','["ControlsName"]',false,-1,'Obj158');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(50,170,90,20,[0,0,0],0,1,'{"text":"Keyboard:","size":12,"align":"center","font":"Consolas"}',true,'Controls','["ControlsInput"]',false,-1,'Obj69');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(250,170,90,20,[0,0,0],0,1,'{"text":"Keyboard:","size":12,"align":"center","font":"Consolas"}',true,'Controls','["ControlsInput"]',false,-1,'Obj67');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(450,170,90,20,[0,0,0],0,1,'{"text":"Keyboard:","size":12,"align":"center","font":"Consolas"}',true,'Controls','["ControlsInput"]',false,-1,'Obj84');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(650,170,90,20,[0,0,0],0,1,'{"text":"Keyboard:","size":12,"align":"center","font":"Consolas"}',true,'Controls','["ControlsInput"]',false,-1,'Obj99');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(50,420,90,20,[0,0,0],0,1,'{"text":"Keyboard:","size":12,"align":"center","font":"Consolas"}',true,'Controls','["ControlsInput"]',false,-1,'Obj114');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(250,420,90,20,[0,0,0],0,1,'{"text":"Keyboard:","size":12,"align":"center","font":"Consolas"}',true,'Controls','["ControlsInput"]',false,-1,'Obj129');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(450,420,90,20,[0,0,0],0,1,'{"text":"Keyboard:","size":12,"align":"center","font":"Consolas"}',true,'Controls','["ControlsInput"]',false,-1,'Obj144');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(650,420,90,20,[0,0,0],0,1,'{"text":"Keyboard:","size":12,"align":"center","font":"Consolas"}',true,'Controls','["ControlsInput"]',false,-1,'Obj159');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(0,150,390,70,[0,0,0],0,1,'{"text":"Local","size":48,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'Obj38');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  //var player={x:64,y:32,c:[0,0,255],r:jt.frames()*6};
  //jt.getObject("Game").drawPlayer(player);  
  
	jt.camActive(true);
  jt.camReset();     
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  //var player={x:64,y:32,c:[0,0,255],r:jt.frames()*6};","  //jt.getObject(\"Game\").drawPlayer(player);  ","  ","\tjt.camActive(true);","  jt.camReset();     ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(410,150,390,70,[0,0,0],0,1,'{"text":"Online","size":48,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'Obj39');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  //var player={x:64,y:32,c:[0,0,255],r:jt.frames()*6};
  //jt.getObject("Game").drawPlayer(player);  
  
	jt.camActive(true);
  jt.camReset();     
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  //var player={x:64,y:32,c:[0,0,255],r:jt.frames()*6};","  //jt.getObject(\"Game\").drawPlayer(player);  ","  ","\tjt.camActive(true);","  jt.camReset();     ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(20,20,400,100,[0,0,0],0,1,'{"text":"Lobby","size":96,"align":"left","font":"Consolas"}',true,'Lobby','[""]',false,-1,'Obj1765');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
	jt.camActive(true);
  jt.camReset();     
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjt.camActive(true);","  jt.camReset();     ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(410,400,390,40,[0,0,0],0,1,'{"text":"Current username:","size":24,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'Name');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	//jt.camActive(false);
  
  
};obj.update=function(){	/*Update runs at the fps specified*/
 	this.attr.text="Current username: "+jt.getObject("Client").clientObj.name;
  jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t//jt.camActive(false);","  ","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/"," \tthis.attr.text=\"Current username: \"+jt.getObject(\"Client\").clientObj.name;","  jte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(20,490,350,40,[0,0,0],0,1,'{"text":"Players:","size":24,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'Obj36');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	//jt.camActive(false);
  jt.getObject("Game").localChange(1);
  jt.getObject("Game").localChange(1);  
  
};obj.update=function(){	/*Update runs at the fps specified*/
  if(jt.kPress("left")){jt.getObject("Game").localChange(-1);}
  if(jt.kPress("right")){jt.getObject("Game").localChange(1);}  
  
 	this.attr.text="Players: "+jt.getObject("Game").locals.length;
  jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t//jt.camActive(false);","  jt.getObject(\"Game\").localChange(1);","  jt.getObject(\"Game\").localChange(1);  ","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  if(jt.kPress(\"left\")){jt.getObject(\"Game\").localChange(-1);}","  if(jt.kPress(\"right\")){jt.getObject(\"Game\").localChange(1);}  ","  "," \tthis.attr.text=\"Players: \"+jt.getObject(\"Game\").locals.length;","  jte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(280,20,280,60,[0,0,0],0,1,'{"text":"Username","size":24,"align":"center","font":"Consolas"}',true,'Lobby','[""]',false,-1,'Obj1789');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	//jt.camActive(false);
  
  
};obj.update=function(){	/*Update runs at the fps specified*/
  var client=jt.getObject("Client");
  this.c=client.clientObj.c;
 	this.attr.text="Current username: "+jt.getObject("Client").clientObj.name;
  jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t//jt.camActive(false);","  ","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  var client=jt.getObject(\"Client\");","  this.c=client.clientObj.c;"," \tthis.attr.text=\"Current username: \"+jt.getObject(\"Client\").clientObj.name;","  jte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(560,20,220,40,[0,0,0],0,1,'{"text":"Color:","size":24,"align":"center","font":"Consolas"}',true,'Lobby','[""]',false,-1,'Color');/*Attributes and methods go here*/

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
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t//jt.camActive(false);","  ","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/"," \tvar client=jt.getObject(\"Client\");","  var colors=jt.getObjects([\"Color\"]);","  for(var i=0;i<colors.length;i++){","    var color=colors[i]; ","    if(jt.mPress(color) || jt.tPress(color)){","     \tclient.clientObj.c=color.c; ","    }","   \tif(color.c[0]==client.clientObj.c[0] && color.c[1]==client.clientObj.c[1] && color.c[2]==client.clientObj.c[2]){","      var padding=5;","      jt.rect(color.x-padding,color.y-padding,color.w+padding*2,color.h+padding*2,\"black\");","    }","  }","  ","  jte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(410,510,390,40,[255,0,0],0,1,'{"text":"","size":24,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'Error');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	//jt.camActive(false);
  
  
};obj.update=function(){	/*Update runs at the fps specified*/
 	//this.attr.text="Current username: "+jt.getObject("Client").playerName;
  jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t//jt.camActive(false);","  ","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/"," \t//this.attr.text=\"Current username: \"+jt.getObject(\"Client\").playerName;","  jte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(430,440,350,60,[127,127,127],0,1,'undefined',true,'Start','[""]',false,-1,'BtnChange');/*Attributes and methods go here*/

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
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  if(jt.mIn(this)){","   \tjte.getObject(\"BtnChange2\").c=[200,200,200]","  }else{","    jte.getObject(\"BtnChange2\").c=[127,127,127]","  }","  ","  var keyboard=jte.getObject(\"keyboard\");","  ","  if(keyboard.finished){","    keyboard.finished=false;","    if(keyboard.str.trim()!=\"\"){","    \tjte.getObject(\"Client\").clientObj.name=keyboard.str;","    }","     //jt.stopPlay(\"pick\");","  }","  ","\tif(jt.mPress(this) || jt.tPress(this)){","    keyboard.start(\"Write your username\",\"\");","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(620,50,40,40,[193,0,0],0,1,'undefined',true,'Lobby','["Color","red"]',false,-1,'Obj26');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(620,110,40,40,[193,0,193],0,1,'undefined',true,'Lobby','["Color","pink"]',false,-1,'Obj30');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(680,50,40,40,[0,127,0],0,1,'undefined',true,'Lobby','["Color","green"]',false,-1,'Obj27');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(680,110,40,40,[0,193,193],0,1,'undefined',true,'Lobby','["Color","cyan"]',false,-1,'Obj31');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(560,50,40,40,[0,0,255],0,1,'undefined',true,'Lobby','["Color","blue"]',false,-1,'Obj28');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(560,110,40,40,[63,0,127],0,1,'undefined',true,'Lobby','["Color","purple"]',false,-1,'Obj32');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(740,110,40,40,[193,193,0],0,1,'undefined',true,'Lobby','["Color","yellow"]',false,-1,'Obj29');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(740,50,40,40,[127,63,0],0,1,'undefined',true,'Lobby','["Color","orange"]',false,-1,'Obj33');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(430,550,350,70,[127,127,127],0,1,'undefined',true,'Start','[""]',false,-1,'BtnConnect');/*Attributes and methods go here*/

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
      jte.getObject("Game").local=false;
     	jt.setView("Lobby"); 
      jt.getObject("Client").socket.emit("refresh"); 
    }else{
     jt.getObject("Error").attr.text="Username can't be empty !"; 
    }
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tif(jt.mIn(this)){","   \tjte.getObject(\"BtnConnect\").c=[200,200,200]","  }else{","    jte.getObject(\"BtnConnect\").c=[127,127,127]","  }","\tif(jt.mPress(this) || jt.tPress(this)){","    if(jt.getObject(\"Client\").clientObj.name.trim()!=\"\"){","      jte.getObject(\"Game\").local=false;","     \tjt.setView(\"Lobby\"); ","      jt.getObject(\"Client\").socket.emit(\"refresh\"); ","    }else{","     jt.getObject(\"Error\").attr.text=\"Username can't be empty !\"; ","    }","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(20,550,350,70,[127,127,127],0,1,'undefined',true,'Start','[""]',false,-1,'BtnLocal');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	if(jt.mIn(this)){
   	jte.getObject("BtnLocal").c=[200,200,200]
  }else{
    jte.getObject("BtnLocal").c=[127,127,127]
  }
	if(jt.mPress(this) || jt.tPress(this)){
    jt.setView("Controls"); 
    jt.mRelease();
    //jt.setView("Game");
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tif(jt.mIn(this)){","   \tjte.getObject(\"BtnLocal\").c=[200,200,200]","  }else{","    jte.getObject(\"BtnLocal\").c=[127,127,127]","  }","\tif(jt.mPress(this) || jt.tPress(this)){","    jt.setView(\"Controls\"); ","    jt.mRelease();","    //jt.setView(\"Game\");","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(220,610,350,30,[127,127,127],0,1,'undefined',true,'Controls','[""]',false,-1,'BtnStart');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	if(jt.mIn(this)){
   	jte.getObject("BtnStart").c=[200,200,200]
  }else{
    jte.getObject("BtnStart").c=[127,127,127]
  }
	if(jt.mPress(this) || jt.tPress(this)){
    jte.getObject("Game").local=true;
    jte.getObject("Map").generate();
    jte.getObject("Game").restart();
    jte.getObject("Client").started=false;    
    jte.getObject("Client").playing="P1";        
    jte.getObject("Client").waitTime=jte.getObject("Client").waitSecond*60;
    jt.setView("Loading"); 
    //jt.setView("Game");
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tif(jt.mIn(this)){","   \tjte.getObject(\"BtnStart\").c=[200,200,200]","  }else{","    jte.getObject(\"BtnStart\").c=[127,127,127]","  }","\tif(jt.mPress(this) || jt.tPress(this)){","    jte.getObject(\"Game\").local=true;","    jte.getObject(\"Map\").generate();","    jte.getObject(\"Game\").restart();","    jte.getObject(\"Client\").started=false;    ","    jte.getObject(\"Client\").playing=\"P1\";        ","    jte.getObject(\"Client\").waitTime=jte.getObject(\"Client\").waitSecond*60;","    jt.setView(\"Loading\"); ","    //jt.setView(\"Game\");","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(20,470,80,70,[127,127,127],0,1,'undefined',true,'Start','[""]',false,-1,'BtnLeft');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	if(jt.mIn(this)){
   	jte.getObject("BtnLeft").c=[200,200,200]
  }else{
    jte.getObject("BtnLeft").c=[127,127,127]
  }
	if(jt.mPress(this) || jt.tPress(this)){
    jte.getObject("Game").localChange(-1);
  }
  
  if(jte.getObject("Game").locals.length<=2){
   	jt.getObject("BtnLeft").alpha=0; 
   	jt.getObject("BtnLeft2").alpha=0;     
  }else{
   	jt.getObject("BtnLeft").alpha=1; 
   	jt.getObject("BtnLeft2").alpha=1;     
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tif(jt.mIn(this)){","   \tjte.getObject(\"BtnLeft\").c=[200,200,200]","  }else{","    jte.getObject(\"BtnLeft\").c=[127,127,127]","  }","\tif(jt.mPress(this) || jt.tPress(this)){","    jte.getObject(\"Game\").localChange(-1);","  }","  ","  if(jte.getObject(\"Game\").locals.length<=2){","   \tjt.getObject(\"BtnLeft\").alpha=0; ","   \tjt.getObject(\"BtnLeft2\").alpha=0;     ","  }else{","   \tjt.getObject(\"BtnLeft\").alpha=1; ","   \tjt.getObject(\"BtnLeft2\").alpha=1;     ","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(290,470,80,70,[127,127,127],0,1,'undefined',true,'Start','[""]',false,-1,'BtnRight');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	if(jt.mIn(this)){
   	jte.getObject("BtnRight").c=[200,200,200]
  }else{
    jte.getObject("BtnRight").c=[127,127,127]
  }
	if(jt.mPress(this) || jt.tPress(this)){
    jte.getObject("Game").localChange(1);
  }
  
  if(jte.getObject("Game").locals.length>=8){
   	jt.getObject("BtnRight").alpha=0; 
   	jt.getObject("BtnRight2").alpha=0;     
  }else{
    jt.getObject("BtnRight").alpha=1; 
   	jt.getObject("BtnRight2").alpha=1;     
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tif(jt.mIn(this)){","   \tjte.getObject(\"BtnRight\").c=[200,200,200]","  }else{","    jte.getObject(\"BtnRight\").c=[127,127,127]","  }","\tif(jt.mPress(this) || jt.tPress(this)){","    jte.getObject(\"Game\").localChange(1);","  }","  ","  if(jte.getObject(\"Game\").locals.length>=8){","   \tjt.getObject(\"BtnRight\").alpha=0; ","   \tjt.getObject(\"BtnRight2\").alpha=0;     ","  }else{","    jt.getObject(\"BtnRight\").alpha=1; ","   \tjt.getObject(\"BtnRight2\").alpha=1;     ","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(10,270,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonLeft",0]',false,-1,'Obj49');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(210,270,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonLeft",1]',false,-1,'Obj70');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(410,270,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonLeft",2]',false,-1,'Obj85');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(610,270,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonLeft",3]',false,-1,'Obj100');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(10,520,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonLeft",4]',false,-1,'Obj115');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(210,520,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonLeft",5]',false,-1,'Obj130');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(410,520,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonLeft",6]',false,-1,'Obj145');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(610,520,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonLeft",7]',false,-1,'Obj160');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(10,210,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonShoot",0]',false,-1,'Obj63');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(210,210,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonShoot",1]',false,-1,'Obj71');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(410,210,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonShoot",2]',false,-1,'Obj86');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(610,210,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonShoot",3]',false,-1,'Obj101');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(10,460,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonShoot",4]',false,-1,'Obj116');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(210,460,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonShoot",5]',false,-1,'Obj131');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(410,460,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonShoot",6]',false,-1,'Obj146');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(610,460,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonShoot",7]',false,-1,'Obj161');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(70,210,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonUp",0]',false,-1,'Obj53');/*Attributes and methods go here*/

obj.highlight=false;

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","","obj.highlight=false;",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(270,210,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonUp",1]',false,-1,'Obj72');/*Attributes and methods go here*/

obj.highlight=false;

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","","obj.highlight=false;",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(470,210,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonUp",2]',false,-1,'Obj87');/*Attributes and methods go here*/

obj.highlight=false;

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","","obj.highlight=false;",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(670,210,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonUp",3]',false,-1,'Obj102');/*Attributes and methods go here*/

obj.highlight=false;

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","","obj.highlight=false;",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(70,460,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonUp",4]',false,-1,'Obj117');/*Attributes and methods go here*/

obj.highlight=false;

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","","obj.highlight=false;",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(270,460,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonUp",5]',false,-1,'Obj132');/*Attributes and methods go here*/

obj.highlight=false;

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","","obj.highlight=false;",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(470,460,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonUp",6]',false,-1,'Obj147');/*Attributes and methods go here*/

obj.highlight=false;

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","","obj.highlight=false;",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(670,460,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonUp",7]',false,-1,'Obj162');/*Attributes and methods go here*/

obj.highlight=false;

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","","obj.highlight=false;",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(130,270,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonRight",0]',false,-1,'Obj51');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(330,270,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonRight",1]',false,-1,'Obj73');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(530,270,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonRight",2]',false,-1,'Obj88');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(730,270,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonRight",3]',false,-1,'Obj103');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(130,520,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonRight",4]',false,-1,'Obj118');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(330,520,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonRight",5]',false,-1,'Obj133');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(530,520,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonRight",6]',false,-1,'Obj148');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(730,520,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonRight",7]',false,-1,'Obj163');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(130,210,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonAlt",0]',false,-1,'Obj64');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(330,210,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonAlt",1]',false,-1,'Obj74');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(530,210,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonAlt",2]',false,-1,'Obj89');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(730,210,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonAlt",3]',false,-1,'Obj104');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(130,460,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonAlt",4]',false,-1,'Obj119');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(330,460,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonAlt",5]',false,-1,'Obj134');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(530,460,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonAlt",6]',false,-1,'Obj149');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(730,460,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonAlt",7]',false,-1,'Obj164');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(70,270,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonDown",0]',false,-1,'Obj54');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(270,270,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonDown",1]',false,-1,'Obj75');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(470,270,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonDown",2]',false,-1,'Obj90');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(670,270,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonDown",3]',false,-1,'Obj105');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(70,520,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonDown",4]',false,-1,'Obj120');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(270,520,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonDown",5]',false,-1,'Obj135');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(470,520,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonDown",6]',false,-1,'Obj150');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(670,520,50,40,[127,127,127],0,1,'undefined',true,'Controls','["ControlsButtonDown",7]',false,-1,'Obj165');/*Attributes and methods go here*/
obj.highlight=false;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	var tag=this.tags[0];
	var index=this.tags[1];  
  if(jt.mIn(this)){
    if(this.highlight){
      jte.getObjects([tag])[index].c=[255,200,200]
    }else{
      jte.getObjects([tag])[index].c=[200,200,200]
    }
   	
  }else if(this.highlight){
    jte.getObjects([tag])[index].c=[255,127,127]
  }else{
    jte.getObjects([tag])[index].c=[127,127,127]
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.highlight=false;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar tag=this.tags[0];","\tvar index=this.tags[1];  ","  if(jt.mIn(this)){","    if(this.highlight){","      jte.getObjects([tag])[index].c=[255,200,200]","    }else{","      jte.getObjects([tag])[index].c=[200,200,200]","    }","   \t","  }else if(this.highlight){","    jte.getObjects([tag])[index].c=[255,127,127]","  }else{","    jte.getObjects([tag])[index].c=[127,127,127]","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(430,460,350,30,[0,0,0],0,1,'{"text":"Change username","size":24,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'Obj1791');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(300,90,220,40,[0,0,0],0,1,'{"text":"Change username","size":24,"align":"center","font":"Consolas"}',true,'Lobby','[""]',false,-1,'Obj17');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(430,570,350,30,[0,0,0],0,1,'{"text":"Connect online","size":24,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'Obj1496');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(20,570,350,30,[0,0,0],0,1,'{"text":"Local multiplayer","size":24,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'Obj35');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(240,610,310,30,[0,0,0],0,1,'{"text":"Start","size":24,"align":"center","font":"Consolas"}',true,'Controls','[""]',false,-1,'Obj48');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(20,490,80,30,[0,0,0],0,1,'{"text":"<","size":24,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'BtnLeft2');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(290,490,80,30,[0,0,0],0,1,'{"text":">","size":24,"align":"center","font":"Consolas"}',true,'Start','[""]',false,-1,'BtnRight2');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(70,190,50,20,[0,0,0],0,1,'{"text":"Up","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonUpLabel"]',false,-1,'Obj55');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(270,190,50,20,[0,0,0],0,1,'{"text":"Up","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonUpLabel"]',false,-1,'Obj76');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(470,190,50,20,[0,0,0],0,1,'{"text":"Up","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonUpLabel"]',false,-1,'Obj91');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(670,190,50,20,[0,0,0],0,1,'{"text":"Up","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonUpLabel"]',false,-1,'Obj106');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(70,440,50,20,[0,0,0],0,1,'{"text":"Up","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonUpLabel"]',false,-1,'Obj121');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(270,440,50,20,[0,0,0],0,1,'{"text":"Up","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonUpLabel"]',false,-1,'Obj136');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(470,440,50,20,[0,0,0],0,1,'{"text":"Up","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonUpLabel"]',false,-1,'Obj151');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(670,440,50,20,[0,0,0],0,1,'{"text":"Up","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonUpLabel"]',false,-1,'Obj166');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(10,250,50,20,[0,0,0],0,1,'{"text":"Left","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonLeftLabel"]',false,-1,'Obj61');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(210,250,50,20,[0,0,0],0,1,'{"text":"Left","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonLeftLabel"]',false,-1,'Obj77');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(410,250,50,20,[0,0,0],0,1,'{"text":"Left","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonLeftLabel"]',false,-1,'Obj92');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(610,250,50,20,[0,0,0],0,1,'{"text":"Left","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonLeftLabel"]',false,-1,'Obj107');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(10,500,50,20,[0,0,0],0,1,'{"text":"Left","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonLeftLabel"]',false,-1,'Obj122');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(210,500,50,20,[0,0,0],0,1,'{"text":"Left","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonLeftLabel"]',false,-1,'Obj137');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(410,500,50,20,[0,0,0],0,1,'{"text":"Left","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonLeftLabel"]',false,-1,'Obj152');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(610,500,50,20,[0,0,0],0,1,'{"text":"Left","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonLeftLabel"]',false,-1,'Obj167');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(10,190,50,20,[0,0,0],0,1,'{"text":"Shoot","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonShootLabel"]',false,-1,'Obj65');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(210,190,50,20,[0,0,0],0,1,'{"text":"Shoot","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonShootLabel"]',false,-1,'Obj78');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(410,190,50,20,[0,0,0],0,1,'{"text":"Shoot","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonShootLabel"]',false,-1,'Obj93');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(610,190,50,20,[0,0,0],0,1,'{"text":"Shoot","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonShootLabel"]',false,-1,'Obj108');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(10,440,50,20,[0,0,0],0,1,'{"text":"Shoot","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonShootLabel"]',false,-1,'Obj123');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(210,440,50,20,[0,0,0],0,1,'{"text":"Shoot","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonShootLabel"]',false,-1,'Obj138');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(410,440,50,20,[0,0,0],0,1,'{"text":"Shoot","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonShootLabel"]',false,-1,'Obj153');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(610,440,50,20,[0,0,0],0,1,'{"text":"Shoot","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonShootLabel"]',false,-1,'Obj168');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(70,250,50,20,[0,0,0],0,1,'{"text":"Down","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonDownLabel"]',false,-1,'Obj56');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(270,250,50,20,[0,0,0],0,1,'{"text":"Down","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonDownLabel"]',false,-1,'Obj79');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(470,250,50,20,[0,0,0],0,1,'{"text":"Down","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonDownLabel"]',false,-1,'Obj94');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(670,250,50,20,[0,0,0],0,1,'{"text":"Down","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonDownLabel"]',false,-1,'Obj109');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(70,500,50,20,[0,0,0],0,1,'{"text":"Down","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonDownLabel"]',false,-1,'Obj124');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(270,500,50,20,[0,0,0],0,1,'{"text":"Down","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonDownLabel"]',false,-1,'Obj139');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(470,500,50,20,[0,0,0],0,1,'{"text":"Down","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonDownLabel"]',false,-1,'Obj154');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(670,500,50,20,[0,0,0],0,1,'{"text":"Down","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonDownLabel"]',false,-1,'Obj169');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(130,250,50,20,[0,0,0],0,1,'{"text":"Right","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonRightLabel"]',false,-1,'Obj62');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(330,250,50,20,[0,0,0],0,1,'{"text":"Right","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonRightLabel"]',false,-1,'Obj80');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(530,250,50,20,[0,0,0],0,1,'{"text":"Right","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonRightLabel"]',false,-1,'Obj95');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(730,250,50,20,[0,0,0],0,1,'{"text":"Right","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonRightLabel"]',false,-1,'Obj110');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(130,500,50,20,[0,0,0],0,1,'{"text":"Right","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonRightLabel"]',false,-1,'Obj125');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(330,500,50,20,[0,0,0],0,1,'{"text":"Right","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonRightLabel"]',false,-1,'Obj140');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(530,500,50,20,[0,0,0],0,1,'{"text":"Right","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonRightLabel"]',false,-1,'Obj155');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(730,500,50,20,[0,0,0],0,1,'{"text":"Right","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonRightLabel"]',false,-1,'Obj170');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(130,190,50,20,[0,0,0],0,1,'{"text":"Shoot2","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonAltLabel"]',false,-1,'Obj68');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(330,190,50,20,[0,0,0],0,1,'{"text":"Shoot2","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonAltLabel"]',false,-1,'Obj81');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(530,190,50,20,[0,0,0],0,1,'{"text":"Shoot2","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonAltLabel"]',false,-1,'Obj96');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(730,190,50,20,[0,0,0],0,1,'{"text":"Shoot2","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonAltLabel"]',false,-1,'Obj111');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(130,440,50,20,[0,0,0],0,1,'{"text":"Shoot2","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonAltLabel"]',false,-1,'Obj126');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(330,440,50,20,[0,0,0],0,1,'{"text":"Shoot2","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonAltLabel"]',false,-1,'Obj141');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(530,440,50,20,[0,0,0],0,1,'{"text":"Shoot2","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonAltLabel"]',false,-1,'Obj156');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(730,440,50,20,[0,0,0],0,1,'{"text":"Shoot2","size":18,"align":"center","font":"Consolas"}',true,'Controls','["ControlsButtonAltLabel"]',false,-1,'Obj171');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(280,-90,310,70,[0,0,255],0,1,'{"text":"Loading","size":64,"font":"Consolas","align":"left"}',true,'Loading','[""]',false,-1,'Loading');/*Attributes and methods go here*/


;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  jt.camActive(false);
  var client=jt.getObject("Client");
  var game=jt.getObject("Game");  
  //console.log("cs",client.started);
  
  if(!client.started){
    var name="";
    var c="black";
    if(game.local){
      
    }else{
      name=client.serverObjs[client.playing].name;
      c=client.serverObjs[client.playing].c;
    }
    
    
    var second=jt.round(client.waitTime/60,1);
    jt.getObject("WaitText").attr.text="Starting in "+second+"s left";
    
    var delay=jt.round(client.delay/60,3);
    jt.getObject("DelayText").attr.text="Delay: "+delay+"s";    
    
    //Show score
    var player=client.clientObj;
    jt.fontSize(14);
    if(game.local){
      for(var i=0;i<game.locals.length;i++){
        var local=game.locals[i];
        var player=local.clientObj;
        var y=2;
        var x=(i*(jt.w()/4))+5;
        if(i>=4){
          x=((i-4)*(jt.w()/4))+5;
         	 y=2+jt.fontSize();
        }
        
        var flashing=false;
        if(game.wonId==i){
          if(jt.floor(jt.frames()/10)%2==0){
            flashing=true; 
          }
        }
        
        if(!flashing){
        	jt.text(player.name+": "+player.score,x,y,"black","left");
        }
      }
  		
    }else{
      var y=2;
      var x=(0*(jt.w()/4))+5;
      
      var flashing=false;
      if(client.wonId==client.socketId){
        if(jt.floor(jt.frames()/10)%2==0){
         	flashing=true; 
        }
      }
      
      if(!flashing){
      	jt.text(player.name+": "+player.score,x,y,"black","left");
      }
    }
  
    //Draw players
    var serverObjs={};
    if(game.local){
     	serverObjs=game.localServerObjs();
    }else{
      serverObjs=client.serverObjs;
    }
    var keys=Object.keys(serverObjs);
    var len=Object.keys(serverObjs).length;

    var index=1;
    var vsText="";
    if(!game.local){
      for (var i = 0; i < len; i++) {
        var other = serverObjs[keys[i]];
        if(client.playings.indexOf(keys[i])!=-1){
          if(vsText==""){
            vsText+=other.name; 
          }else{
            vsText+=", "+other.name;
          }

          //jt.text("Enemy score: "+other.score,jt.w()-5,5,"black","right");

          var index=i+1;
          var text=other.name;
          var textW=jt.textW(text);
          var margin=2;
          var y=2;
          var x=(index*(jt.w()/4))+5;
          if(index>=4){
            x=((index-4)*(jt.w()/4))+5;
             y=2+jt.fontSize();
          }
          //jt.rect(other.x+this.playerW/2-textW/2-margin,other.y-jt.fontSize()-margin,textW+margin*2,jt.fontSize()+margin*2,[255,255,255,0.5])
          //jt.text(text,other.x+this.playerW/2,other.y-jt.fontSize(),"black","center");
          var flashing=false;
          if(client.wonId==keys[i]){
            if(jt.floor(jt.frames()/10)%2==0){
              flashing=true; 
            }
          }
          
          if(!flashing){
          	jt.text(other.name+": "+other.score,x,y,"black","left");
          }

          index++;

        }
      }
      jt.getObject("VsText").attr.text="Vs "+vsText;
    }else{
      jt.getObject("VsText").attr.text="Local multiplayer";
    }
    
    
  }else{
    client.wonId=undefined;
    game.wonId=undefined;
   	jt.setView("Game"); 
  }
  jt.camActive(true);
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/","",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  jt.camActive(false);","  var client=jt.getObject(\"Client\");","  var game=jt.getObject(\"Game\");  ","  //console.log(\"cs\",client.started);","  ","  if(!client.started){","    var name=\"\";","    var c=\"black\";","    if(game.local){","      ","    }else{","      name=client.serverObjs[client.playing].name;","      c=client.serverObjs[client.playing].c;","    }","    ","    ","    var second=jt.round(client.waitTime/60,1);","    jt.getObject(\"WaitText\").attr.text=\"Starting in \"+second+\"s left\";","    ","    var delay=jt.round(client.delay/60,3);","    jt.getObject(\"DelayText\").attr.text=\"Delay: \"+delay+\"s\";    ","    ","    //Show score","    var player=client.clientObj;","    jt.fontSize(14);","    if(game.local){","      for(var i=0;i<game.locals.length;i++){","        var local=game.locals[i];","        var player=local.clientObj;","        var y=2;","        var x=(i*(jt.w()/4))+5;","        if(i>=4){","          x=((i-4)*(jt.w()/4))+5;","         \t y=2+jt.fontSize();","        }","        ","        var flashing=false;","        if(game.wonId==i){","          if(jt.floor(jt.frames()/10)%2==0){","            flashing=true; ","          }","        }","        ","        if(!flashing){","        \tjt.text(player.name+\": \"+player.score,x,y,\"black\",\"left\");","        }","      }","  \t\t","    }else{","      var y=2;","      var x=(0*(jt.w()/4))+5;","      ","      var flashing=false;","      if(client.wonId==client.socketId){","        if(jt.floor(jt.frames()/10)%2==0){","         \tflashing=true; ","        }","      }","      ","      if(!flashing){","      \tjt.text(player.name+\": \"+player.score,x,y,\"black\",\"left\");","      }","    }","  ","    //Draw players","    var serverObjs={};","    if(game.local){","     \tserverObjs=game.localServerObjs();","    }else{","      serverObjs=client.serverObjs;","    }","    var keys=Object.keys(serverObjs);","    var len=Object.keys(serverObjs).length;","","    var index=1;","    var vsText=\"\";","    if(!game.local){","      for (var i = 0; i < len; i++) {","        var other = serverObjs[keys[i]];","        if(client.playings.indexOf(keys[i])!=-1){","          if(vsText==\"\"){","            vsText+=other.name; ","          }else{","            vsText+=\", \"+other.name;","          }","","          //jt.text(\"Enemy score: \"+other.score,jt.w()-5,5,\"black\",\"right\");","","          var index=i+1;","          var text=other.name;","          var textW=jt.textW(text);","          var margin=2;","          var y=2;","          var x=(index*(jt.w()/4))+5;","          if(index>=4){","            x=((index-4)*(jt.w()/4))+5;","             y=2+jt.fontSize();","          }","          //jt.rect(other.x+this.playerW/2-textW/2-margin,other.y-jt.fontSize()-margin,textW+margin*2,jt.fontSize()+margin*2,[255,255,255,0.5])","          //jt.text(text,other.x+this.playerW/2,other.y-jt.fontSize(),\"black\",\"center\");","          var flashing=false;","          if(client.wonId==keys[i]){","            if(jt.floor(jt.frames()/10)%2==0){","              flashing=true; ","            }","          }","          ","          if(!flashing){","          \tjt.text(other.name+\": \"+other.score,x,y,\"black\",\"left\");","          }","","          index++;","","        }","      }","      jt.getObject(\"VsText\").attr.text=\"Vs \"+vsText;","    }else{","      jt.getObject(\"VsText\").attr.text=\"Local multiplayer\";","    }","    ","    ","  }else{","    client.wonId=undefined;","    game.wonId=undefined;","   \tjt.setView(\"Game\"); ","  }","  jt.camActive(true);","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(192,320,390,100,[0,0,255],0,1,'{"text":"LobbyList","size":64,"font":"Consolas","align":"center"}',true,'Lobby','[""]',false,-1,'LobbyList');/*Attributes and methods go here*/
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
    
    var lobbyC="black";
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
          lobbyC=other.c;
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
    
    if(client.clientObj.host!=undefined){
     	lobbyC=client.clientObj.c; 
    }
    
    jt.text(lobby,jt.w()/2,startY,lobbyC,"center");
    
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
};obj.JTEcode=["/*Attributes and methods go here*/","obj.page=0;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar client=jt.getObject(\"Client\");","  var serverObjs=client.serverObjs;","  ","  //this.attr.text=\"Players: \";","  var btnMarginX=40;","  var btnMarginY=10;  ","  var btnH=40;  ","  jt.fontSize(20);","  ","  var lobbies=client.lobbies;","  ","  if(jt.kPress(\"r\")){","   \tclient.socket.emit(\"refresh\"); ","  }","  ","  var startY=jt.h()*(2/4)+10+jt.fontSize()*3;","  ","  //show player online","  var playersText=\"\";","  var players=[];","  var playersC=[];","  var keys=Object.keys(serverObjs);","  var len=Object.keys(serverObjs).length;","","  for (var i = 0; i < len; i++) {","    var other = serverObjs[keys[i]];","    if(playersText==\"\"){","     \tplayersText+=other.name; ","    }else{","      playersText+=\", \"+other.name; ","    }","    players.push(other.name);","    playersC.push(other.c);","  }","  ","  var spacing=(jt.w()/players.length);","  for(var i=0;i<players.length;i++){","    jt.text(players[i],spacing/2+(spacing*i),startY-jt.fontSize()*2,playersC[i],\"center\");    ","  }","  ","  jt.text(\"Online:\",jt.w()/2,startY-jt.fontSize()*3,\"black\",\"center\");","  ","  if(client.clientObj.lobby==undefined){","    var keys = Object.keys(serverObjs);","    var len=Object.keys(serverObjs).length;","    var i=0;","    for (var lobby of lobbies) {","      var index=(i%5);","      var btnY=startY+index*(btnH+btnMarginY);","      var btn={x:btnMarginX,y:btnY,w:jt.w()-btnMarginX*2,h:btnH,c:[127,127,127],text:lobby};","","      if(client.clientObj.lobby==undefined){","        if(jt.mIn(btn)){","          btn.c=[200,200,200];","        }","        if(jt.mPress(btn) || jt.tPress(btn)){","          client.socket.emit(\"join\",lobby);","          client.clientObj.lobby=lobby;","          client.clientObj.host=undefined; ","          client.isHost=false;","          /*","          client.accepted=true;","          client.inviteSent=keys[i];          ","          client.delaySent=false;","          client.delayTime=0;","          client.playing=undefined;","          */","        }","      }","","      jt.rect(btn);","      jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),\"black\",\"center\")","      //this.attr.text+=val.name+\" \";","      // use val","      /*","        if(val.name!=\"\" && val.battle==false){","          if((jt.mPress(50,200+(index*50),jt.w()-100,40) || jt.tPress(50,200+(index*50),jt.w()-100,40)) && this.inviteSent==undefined && this.inviteReceived==undefined){","            //send invite to other player","            socket.emit(\"invite\",keys[i]);","            this.inviteSent=keys[i];","            jt.clearPart();","            jt.stopPlay(\"steal\");","          }","        }","        */","      i++;","    }","    ","    //Create lobby button","    var btn={x:btnMarginX,y:jt.h()-btnH,w:jt.w()-btnMarginX*2,h:btnH,c:[127,127,127],text:\"Create lobby\"};","","    if(jt.mIn(btn)){","      btn.c=[200,200,200];","    }","    if(jt.mPress(btn) || jt.tPress(btn)){","      var name=client.clientObj.name+\"'s lobby\";","      client.socket.emit(\"create\",name);","      client.clientObj.lobby=name;","      client.clientObj.host=name;     ","      client.isHost=true;","      ","    }","    ","    jt.rect(btn);","    jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),\"black\",\"center\")","    ","  }else{","    var lobby=client.clientObj.lobby;","    ","    var lobbyC=\"black\";","    //Get all other players","    var keys=Object.keys(serverObjs);","    var len=Object.keys(serverObjs).length;","    var withs=[];","    var withsName=[];    ","    var withsC=[];","    var withsText=\"\";","","    for (var i = 0; i < len; i++) {","      var other = serverObjs[keys[i]];","      if(lobby==other.lobby){","        var host=\"\";","        if(lobby==other.host){","          host=\"(Host)\";","          lobbyC=other.c;","        }","        withs.push(keys[i]);","        withsName.push(other.name+host);","        withsC.push(other.c)","        if(withsText==\"\"){","        \twithsText+=other.name+host","        }else{","          withsText+=\", \"+other.name+host","        }","      }","    }","    ","    if(client.clientObj.host!=undefined){","     \tlobbyC=client.clientObj.c; ","    }","    ","    jt.text(lobby,jt.w()/2,startY,lobbyC,\"center\");","    ","    client.withs=withs;","    client.playings=withs;    ","    ","    jt.text(\"With:\",jt.w()/2,startY+jt.fontSize(),\"black\",\"center\");","    var spacing=(jt.w()/withsName.length);","    for(var i=0;i<withsName.length;i++){","     \t jt.text(withsName[i],spacing/2+(spacing*i),startY+jt.fontSize()*2,withsC[i],\"center\");    ","    }","    ","    ","    if(client.clientObj.host==lobby && withs.length>0){","      var btn={x:btnMarginX,y:startY+jt.fontSize()*4,w:jt.w()-btnMarginX*2,h:btnH,c:[127,127,127],text:\"Start game\"};","","      if(jt.mIn(btn)){","        btn.c=[200,200,200];","      }","      if(jt.mPress(btn) || jt.tPress(btn)){","        client.waitTime=client.waitSecond*60;","        client.received=0;","        client.receivedMax=withs.length;        ","        client.delayTime=0;                ","        client.delaySent=true;      ","        client.accepted=true; ","        client.index=0;","        client.socket.emit(\"start\",withs);        ","        client.playing=undefined;","        //client.inviteReceived=undefined;","","      }","","      jt.rect(btn);","      jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),\"black\",\"center\")","    }","    ","    ","    ","    var btn={x:btnMarginX,y:startY+jt.fontSize()*7,w:jt.w()-btnMarginX*2,h:btnH,c:[127,127,127],text:\"Leave \"+lobby};","    if(client.clientObj.host==lobby){","     \tbtn.text=\"Leave and delete \"+lobby; ","    }","","    if(jt.mIn(btn)){","      btn.c=[200,200,200];","    }","    if(jt.mPress(btn) || jt.tPress(btn)){","      if(client.clientObj.host==lobby){","        client.socket.emit(\"delete\",lobby);","      }else{","      \tclient.socket.emit(\"leave\",lobby);","      }","      ","      client.clientObj.lobby=undefined;","      client.clientObj.host=undefined;  ","      client.isHost=false;","      ","    }","    ","    jt.rect(btn);","    jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),\"black\",\"center\")","  }","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(-416,320,390,100,[0,0,255],0,1,'{"text":"PlayerList","size":64,"font":"Consolas","align":"center"}',true,'Lobby','[""]',false,-1,'Obj24');/*Attributes and methods go here*/
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
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\tvar client=jt.getObject(\"Client\");","  ","  var btnMarginX=40;","  var btnMarginY=10;  ","  var btnH=40;","  ","  jt.fontSize(20);","  /*","  var text=\"Test\";","  if(client.clientObj.lobby!=undefined){","    text=client.clientObj.lobby;","  }","  jt.text(text,jt.w()/2,jt.h()-jt.fontSize(),\"black\",\"center\");","  ","  ","  if(client.inviteReceived!=undefined){","   \tjt.rect(0,jt.h()-btnH,jt.w(),btnH,[0,0,0]);","    ","    var name=client.serverObjs[client.inviteReceived].name;","    var c=client.serverObjs[client.inviteReceived].c;","    jt.text(\"Invite received from \"+name,10,jt.h()-btnH/2-jt.fontSize()/2,\"white\",\"left\");","    ","    //Refuse button","    var btnMargin=20;","    var btnW=80;","    var btnSmallH=30;","    var btn={x:jt.w()-btnMargin-btnW,y:jt.h()-btnH+(btnH-btnSmallH)/2,w:btnW,h:btnSmallH,c:[127,127,127],text:\"Refuse\"};","    ","    if(jt.mIn(btn)){","      btn.c=[200,200,200];","    }","    if(jt.mPress(btn) || jt.tPress(btn)){","      client.socket.emit(\"refuse\",client.inviteReceived);","      client.playing=undefined;","      client.inviteReceived=undefined;","    }","      ","    jt.rect(btn);","    jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),\"black\",\"center\")","    ","    //Accept button","    btn={x:jt.w()-btnMargin*2-btnW*2,y:jt.h()-btnH+(btnH-btnSmallH)/2,w:btnW,h:btnSmallH,c:[127,127,127],text:\"Accept\"};","    ","    if(jt.mIn(btn)){","      btn.c=[200,200,200];","    }","    if(jt.mPress(btn) || jt.tPress(btn)){","      client.waitTime=client.waitSecond*60;","      client.delayTime=0;","      client.delaySent=true;      ","      client.accepted=true; ","      client.socket.emit(\"accept\",client.inviteReceived);","      client.playing=undefined;","      //client.inviteReceived=undefined;","    }","      ","    jt.rect(btn);","    jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),\"black\",\"center\")","    ","  }else if(client.inviteSent!=undefined){","   \tjt.rect(0,jt.h()-btnH,jt.w(),btnH,[0,0,0]);","    ","    var name=client.serverObjs[client.inviteSent].name;","    var c=client.serverObjs[client.inviteSent].c;","    jt.text(\"Invite sent to \"+name,10,jt.h()-btnH/2-jt.fontSize()/2,\"white\",\"left\");","    ","    var btnMargin=20;","    var btnW=80;","    var btnSmallH=30;","    var btn={x:jt.w()-btnMargin-btnW,y:jt.h()-btnH+(btnH-btnSmallH)/2,w:btnW,h:btnSmallH,c:[127,127,127],text:\"Cancel\"};","    ","    if(jt.mIn(btn)){","      btn.c=[200,200,200];","    }","    if(jt.mPress(btn) || jt.tPress(btn)){","      client.socket.emit(\"cancel\",client.inviteSent);","      client.playing=undefined;","      client.inviteSent=undefined;","    }","      ","    jt.rect(btn);","    jt.text(btn.text,btn.x+btn.w/2,btn.y+(btn.h/2-jt.fontSize()/2),\"black\",\"center\")","  }","  */","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(720,0,80,30,[0,0,0],0,1,'{"text":"v0.85","size":23,"font":"Consolas","align":"right"}',true,'Start','[""]',false,-1,'Obj16');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(0,270,800,40,[0,0,0],0,1,'{"text":"WaitText","size":36,"font":"Consolas","align":"center"}',false,'Loading','[""]',false,-1,'WaitText');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  
	
	jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\t","\tjt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(0,320,800,40,[0,0,0],0,1,'{"text":"DelayText","size":24,"font":"Consolas","align":"center"}',false,'Loading','[""]',false,-1,'DelayText');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  
	
	jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\t","\tjt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(0,190,800,40,[0,0,0],0,1,'{"text":"VsText","size":36,"font":"Consolas","align":"center"}',false,'Loading','[""]',false,-1,'VsText');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  
	
	jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\t","\tjt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(395,150,10,490,[0,0,0],0,1,'undefined',true,'Start','[""]',false,-1,'Obj37');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
	
	jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tjt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(80,130,30,30,[0,0,0],0,1,'undefined',true,'Controls','["ControlsTank"]',false,-1,'Obj46');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(280,130,30,30,[0,0,0],0,1,'undefined',true,'Controls','["ControlsTank"]',false,-1,'Obj82');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(480,130,30,30,[0,0,0],0,1,'undefined',true,'Controls','["ControlsTank"]',false,-1,'Obj97');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(680,130,30,30,[0,0,0],0,1,'undefined',true,'Controls','["ControlsTank"]',false,-1,'Obj112');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(80,380,30,30,[0,0,0],0,1,'undefined',true,'Controls','["ControlsTank"]',false,-1,'Obj127');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(280,380,30,30,[0,0,0],0,1,'undefined',true,'Controls','["ControlsTank"]',false,-1,'Obj142');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(480,380,30,30,[0,0,0],0,1,'undefined',true,'Controls','["ControlsTank"]',false,-1,'Obj157');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(680,380,30,30,[0,0,0],0,1,'undefined',true,'Controls','["ControlsTank"]',false,-1,'Obj172');/*Attributes and methods go here*/

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	
};obj.update=function(){	/*Update runs at the fps specified*/
  
	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","\t//jt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(-10,-190,800,30,[0,0,0],0,1,'{"text":"Bonne fete Max !!!","size":32,"font":"Consolas","align":"center"}',true,'Start','[""]',false,-1,'Obj173');/*Attributes and methods go here*/
obj.startY=0;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
	this.attr.text="Bonne fête Max !!!";
  this.startY=this.y;
};obj.update=function(){	/*Update runs at the fps specified*/
  
  var size=32+jt.waveY()*16;
  this.attr.size=size;
  this.y=this.startY-(jt.waveY()*8)
	
	jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.startY=0;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\tthis.attr.text=\"Bonne fête Max !!!\";","  this.startY=this.y;"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  ","  var size=32+jt.waveY()*16;","  this.attr.size=size;","  this.y=this.startY-(jt.waveY()*8)","\t","\tjt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(0,0,800,40,[0,0,0],0,1,'{"text":"Controls","size":48,"align":"center","font":"Consolas"}',true,'Controls','[""]',false,2,'Controls');/*Attributes and methods go here*/
obj.checking=false;
obj.checkingBtn=undefined;
obj.checkingIndex=0;
obj.checkingControl=undefined;
;
obj.setup=function(){	/*Setup runs once when the game starts*/
  
};obj.update=function(){	/*Update runs at the fps specified*/
  var game=jt.getObject("Game");
  
  
  //Draw names
  var names=jt.getObjects(["ControlsName"]);
  for(var i=0;i<names.length;i++){
    if(i<=game.locals.length-1){
    	var name=names[i];
   		name.attr.text=game.locals[i].clientObj.name; 
    }
  }
  
  //Hide all
  for(var i=0;i<names.length;i++){
    if(i>=game.locals.length){
   	 	jt.getObjects(["ControlsName"])[i].alpha=0;
   	 	jt.getObjects(["ControlsTank"])[i].alpha=0;      
   	 	jt.getObjects(["ControlsInput"])[i].alpha=0;     
      
   	 	jt.getObjects(["ControlsButtonLeft"])[i].alpha=0;                  
   	 	jt.getObjects(["ControlsButtonRight"])[i].alpha=0;                        
   	 	jt.getObjects(["ControlsButtonUp"])[i].alpha=0;                              
   	 	jt.getObjects(["ControlsButtonDown"])[i].alpha=0;                                    
   	 	jt.getObjects(["ControlsButtonShoot"])[i].alpha=0;                                          
   	 	jt.getObjects(["ControlsButtonAlt"])[i].alpha=0;    
      
      jt.getObjects(["ControlsButtonLeftLabel"])[i].alpha=0;                  
   	 	jt.getObjects(["ControlsButtonRightLabel"])[i].alpha=0;                        
   	 	jt.getObjects(["ControlsButtonUpLabel"])[i].alpha=0;                              
   	 	jt.getObjects(["ControlsButtonDownLabel"])[i].alpha=0;                                    
   	 	jt.getObjects(["ControlsButtonShootLabel"])[i].alpha=0;                                          
   	 	jt.getObjects(["ControlsButtonAltLabel"])[i].alpha=0;  
    }
  }
  
  //Draw players
  var tanks=jt.getObjects(["ControlsTank"]);
  for(var i=0;i<tanks.length;i++){
    if(i<=game.locals.length-1){
    	var tank=tanks[i];
   		game.drawPlayer(game.locals[i].clientObj,true,i,tank.x,tank.y,tank.w,tank.h);
    }
  }
  
  //Highlight buttons
  var btns=["left","right","up","down","shoot","shoot2"];
  var tags=["Left","Right","Up","Down","Shoot","Alt"];
  for(var i=0;i<game.locals.length;i++){
   	var local=game.locals[i];
    if(i<=jt.getObjects(["ControlsButtonLeft"]).length-1){
      if(game.controls[i].input=="keyboard"){
        jt.getObjects(["ControlsInput"])[i].attr.text="Keyboard:";
         for(var j=0;j<btns.length;j++){
           var btn=btns[j];
           var tag=tags[j];
           var actualBtn=game.controls[i][btn];
          if(jt.kCheck(actualBtn)){
            jt.getObjects(["ControlsButton"+tag])[i].highlight=true;
          }else{
            jt.getObjects(["ControlsButton"+tag])[i].highlight=false;
          }
         }
      }else{
        jt.getObjects(["ControlsInput"])[i].attr.text="Gamepad ("+game.controls[i].inputIndex+"):";
        if(jt.pConnected(game.controls[i].inputIndex)){
          for(var j=0;j<btns.length;j++){
             var btn=btns[j];
             var tag=tags[j];
            	var actualBtn=game.controls[i][btn];
              if(jt.gamepad.buttons[actualBtn]!=undefined){
                if(jt.pCheck(actualBtn,game.controls[i].inputIndex)){
                  jt.getObjects(["ControlsButton"+tag])[i].highlight=true;
                }else{
                  jt.getObjects(["ControlsButton"+tag])[i].highlight=false;
                }
              }
            
           }
        }
      }
    }
  }
  
  
  //Press buttons
  jt.fontSize(12);
  for(var i=0;i<game.locals.length;i++){
   	var local=game.locals[i];
    if(i<=jt.getObjects(["ControlsButtonLeft"]).length-1){
      for(var j=0;j<tags.length;j++){
       	var tag=tags[j];
        var btnName=btns[j];
        var btn=jt.getObjects(["ControlsButton"+tag])[i];
        //Draw text
        jt.text(game.controls[i][btnName],btn.x+btn.w/2,btn.y+btn.h/2-jt.fontSize()/2,"black","center");
        //console.log(game.controls[i][btnName]);
        if(jt.mPress(btn)){
         	this.checking=true;
          this.checkingBtn=jt.getObjects(["ControlsButton"+tag])[i];          
          this.checkingIndex=i;    
          this.checkingControl=btnName;
        }
      }
    }
  }
  
  if(this.checking){
    //Get pressed buttons controllers
    var pressed=undefined;
    var controller=0;
    for(var i=0;i<8;i++){
     	if(jt.pConnected(i)){
       	var buttons=jt.getButtons(0)
        if(buttons.length>=1){
          var button=buttons[0];
          pressed=jt.buttonName(button.button);
          controller=i;
        }
      }
    }
    
    if(pressed!=undefined){
      //Add button
      game.controls[this.checkingIndex].input="gamepad";
      game.controls[this.checkingIndex].inputIndex=controller;      
      game.controls[this.checkingIndex][this.checkingControl]=pressed;
      
      //Change text
     	//this.checkingBtn 
      this.checking=false;
    }
    
    //Get pressed keys
    var keys=jt.keys();
    var keyName=undefined;
    for(var i=0;i<keys.length;i++){
        var keyName=jt.keyName(keys[i].key);
        break;
    }
    
    if(keyName!=undefined){
      game.controls[this.checkingIndex].input="keyboard";
      game.controls[this.checkingIndex].inputIndex=controller;      
      game.controls[this.checkingIndex][this.checkingControl]=keyName;
      
      this.checking=false;
    }
    
   	jt.bg([0,0,0,0.5])
    jt.fontSize(48);
    jt.text("Press a button !",jt.w()/2,jt.h()/2-jt.fontSize()/2,"white","center");
  }
  
	jte.draw(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.checking=false;","obj.checkingBtn=undefined;","obj.checkingIndex=0;","obj.checkingControl=undefined;"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  var game=jt.getObject(\"Game\");","  ","  ","  //Draw names","  var names=jt.getObjects([\"ControlsName\"]);","  for(var i=0;i<names.length;i++){","    if(i<=game.locals.length-1){","    \tvar name=names[i];","   \t\tname.attr.text=game.locals[i].clientObj.name; ","    }","  }","  ","  //Hide all","  for(var i=0;i<names.length;i++){","    if(i>=game.locals.length){","   \t \tjt.getObjects([\"ControlsName\"])[i].alpha=0;","   \t \tjt.getObjects([\"ControlsTank\"])[i].alpha=0;      ","   \t \tjt.getObjects([\"ControlsInput\"])[i].alpha=0;     ","      ","   \t \tjt.getObjects([\"ControlsButtonLeft\"])[i].alpha=0;                  ","   \t \tjt.getObjects([\"ControlsButtonRight\"])[i].alpha=0;                        ","   \t \tjt.getObjects([\"ControlsButtonUp\"])[i].alpha=0;                              ","   \t \tjt.getObjects([\"ControlsButtonDown\"])[i].alpha=0;                                    ","   \t \tjt.getObjects([\"ControlsButtonShoot\"])[i].alpha=0;                                          ","   \t \tjt.getObjects([\"ControlsButtonAlt\"])[i].alpha=0;    ","      ","      jt.getObjects([\"ControlsButtonLeftLabel\"])[i].alpha=0;                  ","   \t \tjt.getObjects([\"ControlsButtonRightLabel\"])[i].alpha=0;                        ","   \t \tjt.getObjects([\"ControlsButtonUpLabel\"])[i].alpha=0;                              ","   \t \tjt.getObjects([\"ControlsButtonDownLabel\"])[i].alpha=0;                                    ","   \t \tjt.getObjects([\"ControlsButtonShootLabel\"])[i].alpha=0;                                          ","   \t \tjt.getObjects([\"ControlsButtonAltLabel\"])[i].alpha=0;  ","    }","  }","  ","  //Draw players","  var tanks=jt.getObjects([\"ControlsTank\"]);","  for(var i=0;i<tanks.length;i++){","    if(i<=game.locals.length-1){","    \tvar tank=tanks[i];","   \t\tgame.drawPlayer(game.locals[i].clientObj,true,i,tank.x,tank.y,tank.w,tank.h);","    }","  }","  ","  //Highlight buttons","  var btns=[\"left\",\"right\",\"up\",\"down\",\"shoot\",\"shoot2\"];","  var tags=[\"Left\",\"Right\",\"Up\",\"Down\",\"Shoot\",\"Alt\"];","  for(var i=0;i<game.locals.length;i++){","   \tvar local=game.locals[i];","    if(i<=jt.getObjects([\"ControlsButtonLeft\"]).length-1){","      if(game.controls[i].input==\"keyboard\"){","        jt.getObjects([\"ControlsInput\"])[i].attr.text=\"Keyboard:\";","         for(var j=0;j<btns.length;j++){","           var btn=btns[j];","           var tag=tags[j];","           var actualBtn=game.controls[i][btn];","          if(jt.kCheck(actualBtn)){","            jt.getObjects([\"ControlsButton\"+tag])[i].highlight=true;","          }else{","            jt.getObjects([\"ControlsButton\"+tag])[i].highlight=false;","          }","         }","      }else{","        jt.getObjects([\"ControlsInput\"])[i].attr.text=\"Gamepad (\"+game.controls[i].inputIndex+\"):\";","        if(jt.pConnected(game.controls[i].inputIndex)){","          for(var j=0;j<btns.length;j++){","             var btn=btns[j];","             var tag=tags[j];","            \tvar actualBtn=game.controls[i][btn];","              if(jt.gamepad.buttons[actualBtn]!=undefined){","                if(jt.pCheck(actualBtn,game.controls[i].inputIndex)){","                  jt.getObjects([\"ControlsButton\"+tag])[i].highlight=true;","                }else{","                  jt.getObjects([\"ControlsButton\"+tag])[i].highlight=false;","                }","              }","            ","           }","        }","      }","    }","  }","  ","  ","  //Press buttons","  jt.fontSize(12);","  for(var i=0;i<game.locals.length;i++){","   \tvar local=game.locals[i];","    if(i<=jt.getObjects([\"ControlsButtonLeft\"]).length-1){","      for(var j=0;j<tags.length;j++){","       \tvar tag=tags[j];","        var btnName=btns[j];","        var btn=jt.getObjects([\"ControlsButton\"+tag])[i];","        //Draw text","        jt.text(game.controls[i][btnName],btn.x+btn.w/2,btn.y+btn.h/2-jt.fontSize()/2,\"black\",\"center\");","        //console.log(game.controls[i][btnName]);","        if(jt.mPress(btn)){","         \tthis.checking=true;","          this.checkingBtn=jt.getObjects([\"ControlsButton\"+tag])[i];          ","          this.checkingIndex=i;    ","          this.checkingControl=btnName;","        }","      }","    }","  }","  ","  if(this.checking){","    //Get pressed buttons controllers","    var pressed=undefined;","    var controller=0;","    for(var i=0;i<8;i++){","     \tif(jt.pConnected(i)){","       \tvar buttons=jt.getButtons(0)","        if(buttons.length>=1){","          var button=buttons[0];","          pressed=jt.buttonName(button.button);","          controller=i;","        }","      }","    }","    ","    if(pressed!=undefined){","      //Add button","      game.controls[this.checkingIndex].input=\"gamepad\";","      game.controls[this.checkingIndex].inputIndex=controller;      ","      game.controls[this.checkingIndex][this.checkingControl]=pressed;","      ","      //Change text","     \t//this.checkingBtn ","      this.checking=false;","    }","    ","    //Get pressed keys","    var keys=jt.keys();","    var keyName=undefined;","    for(var i=0;i<keys.length;i++){","        var keyName=jt.keyName(keys[i].key);","        break;","    }","    ","    if(keyName!=undefined){","      game.controls[this.checkingIndex].input=\"keyboard\";","      game.controls[this.checkingIndex].inputIndex=controller;      ","      game.controls[this.checkingIndex][this.checkingControl]=keyName;","      ","      this.checking=false;","    }","    ","   \tjt.bg([0,0,0,0.5])","    jt.fontSize(48);","    jt.text(\"Press a button !\",jt.w()/2,jt.h()/2-jt.fontSize()/2,\"white\",\"center\");","  }","  ","\tjte.draw(this);"];jte.objects.push(obj);var obj=new JTEObject(960,-100,310,90,[255,0,0],0,1,'{"text":"Keyboard","size":64,"font":"Consolas","align":"left"}',true,'Start','[""]',false,145,'keyboard');/*Attributes and methods go here*/
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
};obj.JTEcode=["/*Attributes and methods go here*/","/* HOW TO USE","","Link this script to the html","","1: When you want to start the keyboard, call keyboard.start() in your update function","keyboard.start(msg,str,lines,size) has 4 params","msg: you can write the info message","str: you can insert a pre-written string in the input","lines: the max number lines (25 chars per line, 1 by default)","size: the font size (24 by default)","","2: In your main update code, before the keyboard.start(), write something like this to get the input which is in keyboard.str:","if(keyboard.finished){","\tkeyboard.finished=false;","\tthis.str=keyboar.str;","}","","3: At the end of your whole update/draw function call this to put a dark background and help make it pop-up:","if(keyboard.on){","\tjt.bg([0,0,0,0.5])","}","","","*/","","obj.on=false;","obj.msg=\"\";","obj.st=\"\";","obj.max=25;","obj.size=20;","obj.sizeDefault=20;","obj.lines=1;","\t","obj.shift=false;","obj.shiftHold=false;","obj.num=false;","\t","obj.iteration=0;","obj.backspaceTimer=0;","obj.backspaceTimerMax=15;","obj.backspaceInterval=2;","obj.waveI=0;","obj.waveX=0;","obj.waveY=0;","\t","obj.frame=0;","obj.fps=60;","obj.interval=undefined;","\t","obj.finished=false;","\t","obj.start=function(msg,str,lines,size){","\t\tthis.finished=false;","","\t\t  this.msg=msg;","\t\t  this.str=str;","","\t\t  if(this.msg===undefined){this.msg=\"Write here...\";}","\t\t  if(this.str===undefined){this.str=\"\";}","","\t\t  this.shift=false;","\t\t  this.num=false;","\t\t  ","\t\t  if(lines!=undefined){","\t\t\tthis.lines=lines;","\t\t  }else{","\t\t\tthis.lines=1;","\t\t  }","\t\t  ","\t\t  if(size!=undefined){","\t\t\tthis.size=size;","\t\t  }else{","\t\t\tthis.size=this.sizeDefault; ","\t\t  }","\t\t  ","\t\t  this.max=25*this.lines;","\t\t\t","\t\t  this.backspaceTimer=0;","\t\t  this.iteration=0;","\t\t  this.waveI=Math.PI*2/this.fps;","\t\t  this.waveX=0;","\t\t  this.waveY=0;","","\t\t  this.on=true;","\t\t  var context=this;","\t\t  jt.pauseJt(true);","\t\t  this.interval=setInterval(context.loop,1000/this.fps,context)","\t\t  jt.camActive(false);","\t\t  ","\t\t  jt.kRelease();","\t\t  jt.release();","\t\t  jt.restore();","\t\t  this.update(context);","\t}","obj.loop=function(context){","\t\tcontext.up();","\t}","obj.up=function(context){","\t\tvar jtFullH=jt.h()+jt.addH();","\t\tjt.camActive(false);","\t\t  if(this.iteration==0){","\t\t\tjt.bg([0,0,0,0.5])","\t\t  }","\t\t  this.iteration++;","\t\t  this.waveX+=this.waveI;","\t\t  if(this.waveX>this.waveI*this.fps){","\t\t\tthis.waveX=this.waveI;","\t\t  }","\t\t  this.waveY=Math.sin(this.waveX)","\t\t  this.waveYPos=(this.waveY+1)/2","","\t\t  //draw keyboard bg","\t\t  var rect={x:0,y:jtFullH*2/3,w:jt.w(),h:jtFullH*1/3,c:[200,200,200]}","","\t\t  jt.rect(rect)","","\t\t  var keys=[","\t\t\t[\"q\",\"w\",\"e\",\"r\",\"t\",\"y\",\"u\",\"i\",\"o\",\"p\"],","\t\t\t[\"a\",\"s\",\"d\",\"f\",\"g\",\"h\",\"j\",\"k\",\"l\"],","\t\t\t[\"^\",\"z\",\"x\",\"c\",\"v\",\"b\",\"n\",\"m\",\"<=\"],","\t\t\t[\"123\",\"Space\",\"Enter\"],","\t\t  ]","","\t\t  var nums=[","\t\t\t[1,2,3],","\t\t\t[4,5,6],","\t\t\t[7,8,9],","\t\t\t[\".\",0,\"<=\"],","\t\t\t[\"ABC\",\"Space\",\"Enter\"]","\t\t  ]","","\t\t  //choose the good keyboard","\t\t  var num=false;","\t\t  if(this.num){","\t\t\tnum=true;","\t\t  }","","\t\t  if(this.num && jt.kPress([\"a\", \"b\", \"c\", \"d\", \"e\", \"f\", \"g\", \"h\", \"i\", \"j\", \"k\", \"l\", \"m\", \"n\", \"o\", \"p\", \"q\", \"r\", \"s\", \"t\", \"u\", \"v\", \"w\", \"x\", \"y\", \"z\"])){","\t\t\tnum=false;","\t\t  }else if(!this.num && jt.kCheck([0,1,2,3,4,5,6,7,8,9])){","\t\t\tnum=true;","\t\t  }","","\t\t  if(num){","\t\t\tkeys=[];","\t\t\tkeys=nums;","\t\t\tthis.num=true;","\t\t  }else{","\t\t\tthis.num=false;","\t\t  }","","\t\t  //get spacing and width/height of the keyboard","\t\t  var spacingW=jt.w()/100;","\t\t  var spacingH=(jtFullH/100)*jt.ratio();","\t\t  var keyboardW=jt.w();","\t\t  var keyboardH=(jtFullH*1/3);","\t\t  var startX=0;","\t\t  var startY=jtFullH*2/3;","","\t\t  var kCheck=jt.kCheck();","\t\t  var kPress=jt.kPress();","","\t\t  if(!jt.check()){","\t\t\tthis.backspaceTimer=0; ","\t\t  }","\t\t  ","\t\t  //Draw all keys","\t\t  jt.font(\"Consolas\",this.size);","\t\t  var h=(keyboardH)/keys.length;","\t\t  for(var y=0;y<keys.length;y++){","\t\t\tvar w=(keyboardW)/keys[y].length;","\t\t\tfor(var x=0;x<keys[y].length;x++){","\t\t\t  var ww=w-spacingW*2;","\t\t\t  var hh=h-spacingH*2;","\t\t\t  var xx=startX+spacingW+x*w;","\t\t\t  var yy=startY+spacingH+y*h;","\t\t\t  var c=[255,255,255];","\t\t\t  var btn={x:startX+x*w,y:startY+y*h,w:w,h:h};","","\t\t\t  if(jt.check(btn) || kCheck){","\t\t\t\tif(kCheck){","\t\t\t\t  var key=keys[y][x];","\t\t\t\t  if(jt.kCheck(key)){","\t\t\t\t\tc=[127,127,127];","\t\t\t\t  }else{","\t\t\t\t\tif(key==\"^\" && jt.kCheck(\"shift\")){","\t\t\t\t\t  c=[127,127,127];","\t\t\t\t\t}else if(key==\"<=\" && jt.kCheck(\"backspace\")){","\t\t\t\t\t  c=[127,127,127];","\t\t\t\t\t}else if(key==\"123\" && jt.kCheck([0,1,2,3,4,5,6,7,8,9])){","\t\t\t\t\t  c=[127,127,127];","\t\t\t\t\t}else if(key==\"ABC\" && jt.kCheck([\"a\", \"b\", \"c\", \"d\", \"e\", \"f\", \"g\", \"h\", \"i\", \"j\", \"k\", \"l\", \"m\", \"n\", \"o\", \"p\", \"q\", \"r\", \"s\", \"t\", \"u\", \"v\", \"w\", \"x\", \"y\", \"z\"])){","\t\t\t\t\t  c=[127,127,127];","\t\t\t\t\t}else if(key==\"Space\" && jt.kCheck(\"space\")){","\t\t\t\t\t  c=[127,127,127];","\t\t\t\t\t}else if(key==\"Enter\" && jt.kCheck(\"enter\")){","\t\t\t\t\t  c=[127,127,127];","\t\t\t\t\t}","\t\t\t\t  }","\t\t\t\t}else{","\t\t\t\t  c=[127,127,127];","\t\t\t\t}","","\t\t\t\tif(jt.press(btn) || kPress || (jt.check(btn) && keys[y][x]==\"<=\")){","\t\t\t\t  var key=keys[y][x];","\t\t\t\t  var valid=true;","\t\t\t\t  if(kPress){","\t\t\t\t\tvalid=false;","\t\t\t\t\tif(jt.kPress(key)){","\t\t\t\t\t  valid=true;","\t\t\t\t\t}else{","\t\t\t\t\t  if(key==\"^\" && jt.kPress(\"shift\")){","\t\t\t\t\t\tvalid=true;","\t\t\t\t\t  }else if(key==\"<=\" && jt.kPress(\"backspace\")){","\t\t\t\t\t\tvalid=true;","\t\t\t\t\t  }else if(key==\"123\" && jt.kPress([0,1,2,3,4,5,6,7,8,9])){","\t\t\t\t\t\tvalid=true;","\t\t\t\t\t  }else if(key==\"ABC\" && jt.kPress([\"a\", \"b\", \"c\", \"d\", \"e\", \"f\", \"g\", \"h\", \"i\", \"j\", \"k\", \"l\", \"m\", \"n\", \"o\", \"p\", \"q\", \"r\", \"s\", \"t\", \"u\", \"v\", \"w\", \"x\", \"y\", \"z\"])){","\t\t\t\t\t\tvalid=true;","\t\t\t\t\t  }else if(key==\"Space\" && jt.kPress(\"space\")){","\t\t\t\t\t\tvalid=true;","\t\t\t\t\t  }else if(key==\"Enter\" && jt.kPress(\"enter\")){","\t\t\t\t\t\tvalid=true;","\t\t\t\t\t  }","\t\t\t\t\t}","\t\t\t\t  }","\t\t\t\t  ","\t\t\t\t  ","\t\t\t\t  if(key!=\"^\" && key!=\"<=\" && key!=\"ABC\" && key!=\"123\" && key!=\"Space\" && key!=\"Enter\" && valid){","\t\t\t\t\tvar k=key;","\t\t\t\t\tif(this.shift){","\t\t\t\t\t  this.shift=false;","\t\t\t\t\t  if(typeof k==\"string\"){","\t\t\t\t\t\tk=k.toUpperCase();","\t\t\t\t\t  }","\t\t\t\t\t  ","\t\t\t\t\t}","\t\t\t\t\tthis.str+=k;","\t\t\t\t  }else if(valid){","\t\t\t\t\tif(key==\"^\"){","\t\t\t\t\t  this.shift=!this.shift;","\t\t\t\t\t}else if(key==\"<=\"){","\t\t\t\t\t  var checkInterval=false;","\t\t\t\t\t  if(jt.check(btn)){","\t\t\t\t\t\tthis.backspaceTimer++;","\t\t\t\t\t\tif(this.backspaceTimer>=this.backspaceTimerMax){","\t\t\t\t\t\t  if(this.iteration%this.backspaceInterval==0){","\t\t\t\t\t\t\tcheckInterval=true;","\t\t\t\t\t\t  }","\t\t\t\t\t\t}","\t\t\t\t\t  }else{","\t\t\t\t\t\tthis.backspaceTimer=0;","\t\t\t\t\t  }","\t\t\t\t\t  if(jt.press(btn) || kPress || checkInterval){","\t\t\t\t\t\t if(this.str.length>0){","\t\t\t\t\t\t  this.str=this.str.slice(0,this.str.length-1);","\t\t\t\t\t\t}","\t\t\t\t\t  }","\t\t\t\t\t ","\t\t\t\t\t}else if(key==\"123\"){","\t\t\t\t\t  this.num=true;","\t\t\t\t\t}else if(key==\"ABC\"){","\t\t\t\t\t  this.num=false;","\t\t\t\t\t}else if(key==\"Space\"){","\t\t\t\t\t  this.str+=\" \";","\t\t\t\t\t}else if(key==\"Enter\"){","\t\t\t\t\t  this.finished=true;","\t\t\t\t\t}","\t\t\t\t  }","\t\t\t\t  if(this.str.length>this.max){this.str=this.str.slice(0,this.max)}","\t\t\t\t  if(valid){","\t\t\t\t\t/*jt.mRelease();","\t\t\t\t\tjt.tRelease();","\t\t\t\t\tjt.release();*/","\t\t\t\t\tjt.kRelease();","\t\t\t\t  }","\t\t\t\t}","\t\t\t  }","","\t\t\t  if(keys[y][x]==\"^\"){","\t\t\t\tif(this.shift){","\t\t\t\t  c=[127,127,127];","\t\t\t\t}","\t\t\t  }","","\t\t\t  if(this.shift && keys[y][x]!=\"Space\" && keys[y][x]!=\"Enter\"){","\t\t\t\tif(typeof keys[y][x]==\"string\"){","\t\t\t\t\tkeys[y][x]=keys[y][x].toUpperCase();","\t\t\t\t}","\t\t\t  }","\t\t\t  jt.rect(xx,yy,ww,hh,c)","\t\t\t  jt.text(keys[y][x],xx+ww/2,yy+hh/2-jt.fontSize()/2,\"black\",\"center\")","\t\t\t}","\t\t  }","","\t\t  //show text","\t\t  var textW=jt.w();","\t\t  var textH=jt.fontSize()*4+10;","\t\t  textH+=(jt.fontSize()+5)*(this.lines-1)","\t\t  var textX=jt.w()/6;","\t\t  var textY=jtFullH*(1/3)-textH/2;","\t\t  jt.rectB(textX,textY,textW-textX*2,textH,[0,0,0],0,5)","\t\t  jt.rect(textX,textY,textW-textX*2,textH,[200,200,200])","\t\t  var writingH=((jt.fontSize()+5)*this.lines);","\t\t  jt.rect(textX+spacingW,textY+textH-writingH-5,textW-spacingW*2-textX*2,writingH,[255,255,255])","","\t\t  jt.font(\"Consolas\",this.size);","\t\t  jt.text(this.msg,textX+spacingW*2,textY+10,\"black\",\"left\",jt.fontSize(),0,36,jt.fontSize());","\t\t  jt.text(this.str.slice(0,25),textX+spacingW*2,textY+textH-writingH,\"black\",\"left\");","\t\t  var lineH=0;","\t\t  var strW=jt.textW(this.str.slice(0,25));","\t\t  if(this.str.length>25){","\t\t\tjt.text(this.str.slice(25,50),textX+spacingW*2,textY+textH-writingH+jt.fontSize(),\"black\",\"left\");","\t\t\tlineH=jt.fontSize();","\t\t\tstrW=jt.textW(this.str.slice(25,50));","\t\t  }","\t\t  if(this.str.length>50){","\t\t\tjt.text(this.str.slice(50,75),textX+spacingW*2,textY+textH-writingH+jt.fontSize()*2,\"black\",\"left\");","\t\t\tlineH=jt.fontSize()*2;","\t\t\tstrW=jt.textW(this.str.slice(50,75));","\t\t  }","\t\t  if(this.str.length>75){","\t\t\tjt.text(this.str.slice(75,100),textX+spacingW*2,textY+textH-writingH+jt.fontSize()*3,\"black\",\"left\");","\t\t\tlineH=jt.fontSize()*3;","\t\t\tstrW=jt.textW(this.str.slice(75,100));","\t\t  }","\t\t  ","\t\t  jt.alpha(this.waveYPos);","\t\t  jt.rect(textX+spacingW*2+strW,textY+textH-writingH+(lineH),spacingW/2,jt.fontSize())","\t\t  jt.alpha(1);","\t\t  ","\t\t  if(jt.press()){","\t\t\tif(!jt.press(textX,textY,textW,textH) && !jt.press(startX,startY,keyboardW,keyboardH)){","\t\t\t  this.finished=true;","\t\t\t  jt.release();","\t\t\t}","\t\t  }","\t\t  ","\t\t  //remove mouse press","\t\t  jt.mouse.press=[false,false,false,false,false]","","\t\t  //remove touch press","\t\t  if(jt.touch.press==true){","\t\t\tjt.touch.press=false;","\t\t  }","","\t\t  ","\t\t  ","\t\t  if(jt.kPress(\"enter\")){","\t\t\tthis.finished=true; ","\t\t  }","","\t\t  if(this.finished){","\t\t\tjt.mRelease();","\t\t\tjt.tRelease();","\t\t\tjt.release();","\t\t\tclearInterval(this.interval);","\t\t\tjt.pauseJt(false);","\t\t\tthis.on=false;","\t\t\treturn this.str;","\t\t  }","\t\t","\t}"];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","\t","\tif(this.on){","    jt.bg([0,0,0,0.5])","  }"];jte.objects.push(obj);var obj=new JTEObject(260,-130,310,110,[255,0,0],0,1,'{"text":"Game","size":128,"font":"Consolas","align":"left"}',true,'Game','[""]',false,155,'Game');/*Attributes and methods go here*/
obj.local=false;
obj.locals=[];
obj.alives=[];

obj.wonId=undefined;

obj.texts=[];

obj.debug=function(){
 	jt.debug(true); 
}

obj.addText=function(text,x,y){
  this.texts.push({text:text,x:x,y:y,alpha:1})
}


obj.localServerObjs=function(index){
 	var arr={};
  for(var i=0;i<this.locals.length;i++){
    if(i!=index){
     	arr[this.locals[i].clientObj.name]=this.locals[i]; 
    }
  }
  return arr;
}

obj.localChange=function(mod){
  var clientObj={name:"",c:[0,0,255],x:0,y:0,score:0,projectiles:[],powerupTimer:0,powerup:"",state:"",toxic:0,time:0,r:0,playing:false,lobby:undefined,host:undefined};
  var client={clientObj:clientObj,isHost:false,powerups:[],withs:[],delay:0,modX:0,modY:0,shot:false};
  var colors=jt.getObjects(["Color"],"Lobby");
  var len=this.locals.length;
  var color=[127,127,127];
  if(len<=colors.length-1){
   	color=colors[len].c; 
  }
  var name="P"+(len+1)
  client.clientObj.name=name;
  client.index=len;
  
  if(client.index==0){client.isHost=true;}
  
  client.clientObj.c=color;
  
  if(mod==1 && this.locals.length<8){
    this.locals.push(client);
  }else if(mod==-1 && this.locals.length>2){
    this.locals.splice(this.locals.length-1,1);
  }
}


obj.playerInvincibility=15;
obj.playerInvincibilityMax=15;

obj.playerW=16;
obj.playerH=16;
obj.playerD=16;

obj.cannonW=8;
obj.cannonH=16;

obj.drawW=16;
obj.drawH=20;

obj.playerMod=1;
obj.playerTurn=3;
obj.playerSpeed=1.5;
obj.playerSpeedBack=1;
obj.bulletSpeed=3;

obj.bulletTime=300;
obj.bulletTimeBuffer=12;

obj.bulletOffset=2;
obj.laserOffset=2;
obj.teleportOffset=0;
obj.explosionOffset=8;

obj.ghostWHRate=1;

obj.bulletW=8;
obj.bulletH=8;

obj.bulletWHRate=0;
obj.laserWHRate=0;

obj.endRoundWait=60;

obj.lastDelay=false;

//obj.powerupTimer=0;
obj.powerupTimerMax=480;

obj.powerupWaitTimer=0;
obj.powerupWaitTimerMax=300;//360
obj.powerupWaitTimerRetry=5;

obj.powerupSpawn=undefined;
obj.powerupSpawnTimer=0;
obj.powerupSpawnTimerMax=60;

obj.modMax=4;

obj.toxicMax=30;

obj.restart=function(){
  this.texts=[];
  this.powerupTimer=0;
  this.powerupWaitTimer=0;  
  var client=jt.getObject("Client");
  
  client.powerups=[];
  client.clientObj.projectiles=[];  
  if(this.local){
    for(var i=0;i<this.locals.length;i++){
     	this.respawn(false,i); 
      this.locals[i].clientObj.projectiles=[];
      this.locals[i].clientObj.powerupTimer=0;
    }
  }else{
    this.respawn();
    client.clientObj.projectiles=[];
    client.clientObj.powerupTimer=0;
  }
  
  
  //Change cam w and h
  var map=jt.getObject("Map");
  
  this.alives=[];
  for(var i=0;i<this.locals.length;i++){
   	this.alives.push(this.locals[i].clientObj.name); 
  }
  
  map.ww=jt.w()*map.size;
  map.hh=jt.h()*map.size; 
  
  jt.cam().w=map.ww;
  jt.cam().h=map.hh;  
 	jt.camActive(true);
  
  this.playerW=16;
	this.playerH=16;
	this.playerD=16;
}

obj.respawn=function(dead,localIndex){
  //this.powerupTimer=0;
  if(dead==undefined){dead=false;}
  this.powerupWaitTimer=0;  
  var client=jt.getObject("Client");
  var map=jt.getObject("Map");  
  if(localIndex!=undefined){client=this.locals[localIndex];}
  
  client.powerups=[];
  
  client.clientObj.toxic=0;
  
  if(dead){
   	//spawn explosion on player     
    var explosion=this.getExplosion(client.clientObj);

    client.clientObj.projectiles.push(explosion);
  }
  
  
  client.clientObj.x=map.spawns[client.index].x+map.ts/2-this.playerW/2; 
  
  client.clientObj.y=map.spawns[client.index].y+map.ts/2-this.playerH/2;
  
  client.clientObj.r=map.spawns[client.index].r;
  
  /*
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
  */
  
  this.playerInvincibility=this.playerInvincibilityMax;
  
  this.playerW=16;
	this.playerH=16;
	this.playerD=16;
}

obj.laserSpeedMod=2;
obj.laserTimeMod=0.67;
obj.laserMax=4;
obj.laserW=2;
obj.laserH=2;

obj.minigunTimerSub=30;

obj.ghostSpeedMod=0.5;
obj.ghostTimeMod=3;

obj.teleportW=16;
obj.teleportH=16;

obj.teleportSpeedMod=0.75;

obj.getBullet=function(powerup,localIndex){
  var client=jt.getObject("Client");
  if(localIndex!=undefined){client=this.locals[localIndex];}
  var player=client.clientObj;
 	for(var i=0;i<player.projectiles.length;i++){
   	var proj=player.projectiles[i];
    if(proj.powerup==powerup){
     	return proj; 
    }
  }
  return undefined;
}

obj.getAllBullet=function(powerup,localIndex){
  var client=jt.getObject("Client");
  if(localIndex!=undefined){client=this.locals[localIndex];}
  var player=client.clientObj;
 	for(var i=0;i<player.projectiles.length;i++){
   	var proj=player.projectiles[i];
    if(proj.powerup!=powerup){
     	return false; 
    }
  }
  return true;
}

obj.getBulletIndex=function(powerup,localIndex){
  var client=jt.getObject("Client");
  if(localIndex!=undefined){client=this.locals[localIndex];}
  var player=client.clientObj;
 	for(var i=0;i<player.projectiles.length;i++){
   	var proj=player.projectiles[i];
    if(proj.powerup==powerup){
     	return i; 
    }
  }
  return undefined;
}

obj.getExplosion=function(proj){
  var explosionW=64;
  var explosionH=64; 
  var explosionFrames=16;
  var explosion={x:proj.x+proj.w/2-explosionW/2,y:proj.y+proj.h/2-explosionH/2,w:explosionW,h:explosionH,d:explosionH,c:"red",powerup:"explosion",frames:explosionFrames,framesMax:explosionFrames,vX:0,vY:0};
	return explosion;
}

obj.shoot=function(localIndex){
  
  var client=jt.getObject("Client");
  var player=client.clientObj;
  if(localIndex!=undefined){client=this.locals[localIndex];player=client.clientObj}
  var canShoot=false;
  if(player.projectiles.length<=0 || player.powerup=="minigun"){
   	canShoot=true; 
  }
  
  if(player.powerup=="teleport"){
    if(this.getBullet("teleport",localIndex)==undefined && player.projectiles.length<=0 && !client.shot){
     	canShoot=true; 
      //this.powerupTimer=this.bulletTime+1;
      player.powerupTimer=this.bulletTime+1;      
    }else if(this.getBullet("teleport",localIndex)!=undefined && player.projectiles.length<=1){
     	//teleport 
      var proj=player.projectiles[0];
      player.x=proj.x+proj.w/2-player.w/2;
      player.y=proj.y+proj.h/2-player.h/2; 
      
      player.projectiles=[];
      player.powerupTimer=0;      
    }
  }
  
  if(player.powerup=="bazooka"){
    if(this.getBullet("bazooka",localIndex)==undefined){
     	canShoot=true; 
       //this.powerupTimer=this.bulletTime+1;
       player.powerupTimer=this.bulletTime+1;      
    }else{
      //explode
     	canShoot=false;
      //get bullet
      var bazooka=this.getBullet("bazooka",localIndex);
      var bazookaIndex=this.getBulletIndex("bazooka",localIndex);      
      var explosion=this.getExplosion(bazooka);
      
      client.clientObj.projectiles.splice(bazookaIndex,1);
      
      client.clientObj.projectiles.push(explosion);
    }
  }
  
  if(player.powerup=="toxic" && this.getAllBullet("smoke",localIndex)){
    canShoot=true;
  }
  
  if(player.powerup=="drill"){
   	canShoot=false; 
  }
  
  if(canShoot){
    var bulletW=this.bulletW;
    var bulletH=this.bulletH;    
  
    if(player.powerup=="minigun"){
			//this.powerupTimer-=this.minigunTimerSub;
			player.powerupTimer-=this.minigunTimerSub;      
    }else if(player.powerup=="teleport" && !client.shot){
      //nothing for first bullet
      client.shot=true;
    }else if(player.powerup=="bazooka"){
      //nothing for first bullet
    }else{
      player.projectiles=[];
      //this.powerupTimer=0;
      player.powerupTimer=0;      
    }
    
    if(player.powerup=="laser"){
     	bulletW=this.laserW; 
     	bulletH=this.laserH;       
    }
    
    if(player.powerup=="teleport"){
     	bulletW=this.teleportW; 
     	bulletH=this.teleportH;       
    }
    
    var angle=player.r;
    
    var cannonX=this.cannonH/2*jt.angleX(angle);
    var cannonY=this.cannonH/2*jt.angleY(angle);    

    var startX=player.x+player.w/2-bulletW/2+cannonX;
    var startY=player.y+player.h/2-bulletH/2+cannonY; 
    
    var angleAdd=5;
    var move=0;  
    var max=1;
    var speedMod=1;
    var timeMod=1;
    var c=[0,0,0];

    if(player.powerup=="shotgun"){max=5;angle-=angleAdd*(jt.floor(max/2));}
    if(player.powerup=="laser"){speedMod=this.laserSpeedMod;timeMod=this.laserTimeMod;c=[255,0,0];angleAdd=0;max=this.laserMax;move=1}
    if(player.powerup=="toxic"){speedMod=this.ghostSpeedMod;c=[150,175,25,0.5];timeMod=this.ghostTimeMod}    
    if(player.powerup=="teleport"){speedMod=this.teleportSpeedMod;c=player.c;}        
    if(player.powerup=="bazooka"){c=[255,0,0];}            

    for(var i=0;i<max;i++){
      var projectile={};
      projectile.vX=jt.angleX(angle)*this.bulletSpeed*speedMod;
      projectile.vY=jt.angleY(angle)*this.bulletSpeed*speedMod;
      
      var projX=startX+projectile.vX;
      var projY=startY+projectile.vY;  

      projectile.x=projX+(move*i*projectile.vX);
      projectile.y=projY+(move*i*projectile.vY);

      projectile.w=bulletW;    
      projectile.h=bulletH;  
      projectile.d=bulletW;        
      
      projectile.c=c;
      
      projectile.powerup=undefined
      if(player.powerup!=""){
       	projectile.powerup=player.powerup;
      }

      projectile.frames=jt.floor(this.bulletTime*timeMod);
      projectile.framesMax=projectile.frames;  


      player.projectiles.push(projectile);
      angle+=angleAdd;
    }
  }
}

obj.rainbowFrame=0;
obj.rainbowFrameMax=60;

obj.getRainbow=function(ratio,alpha){
  if(alpha==undefined){alpha=1;}
  var r=jt.waveYPos(ratio);
  var g=jt.waveYPos(ratio+0.33);
  var b=jt.waveYPos(ratio+0.66);
  return [255*r,255*g,255*b,alpha];
}

obj.drawPlayer=function(player,self,localIndex,drawX,drawY,newW,newH){ 
  if(drawX!=undefined){player.x=drawX;}
  if(drawY!=undefined){player.y=drawY;}
  
  var playerW=this.playerW;
  var playerH=this.playerH;  
  var playerD=this.playerD;    
  
  var drawW=this.drawW;
  var drawH=this.drawH;
  
  var cannonW=this.cannonW;
  var cannonH=this.cannonH;
  
  var ratioWH=1;
  
  if(newW!=undefined){
    ratioWH=newW/this.playerW;
    
    playerW*=ratioWH;
    playerH*=ratioWH;    
    playerD*=ratioWH;
    
    drawW*=ratioWH;            
    drawH*=ratioWH;    
    
    cannonW*=ratioWH;            
    cannonH*=ratioWH;
  }
  
  if(self==undefined){self=true;}
  var powerup=player.powerup; 
  
  if(powerup=="invisible"){
    if(self && !this.local){
      jt.alpha(0.25);
    }else{
      if(this.local){
        //Draw random dots
        var map=jt.getObject("Map");
        var wh=4;
        jt.alpha(0.25);
        
        var modX=this.locals[localIndex].modX;
        var modY=this.locals[localIndex].modY;        
        
        var oX=player.x%map.ts+playerW/2;
        var oY=player.y%map.ts+playerH/2;  
        
        //v1
        for(var y=1;y<map.map.length-1;y++){
          for(var x=1;x<map.map[0].length-1;x++){
            //jt.rotate((player.r),x*map.ts-wh/2+oX-1,y*map.ts-wh/2+oY-1,2,2);
            //jt.clipRect(x*map.ts-wh/2+oX,y*map.ts-wh/2+oY-wh/2,wh,wh)
          	jt.rect(x*map.ts-wh/2+oX,y*map.ts-wh/2+oY-wh/2,wh,wh*2,player.c,player.r);
            //jt.unclip();
            //jt.rotate(-(player.r),x*map.ts-wh/2+oX-1,y*map.ts-wh/2+oY-1,2,2);
        	}
        }
        
        /*
        //v2
        console.log(player.x,map.ts,this.playerW/2,modX,modY);
        for(var y=-this.modMax;y<=this.modMax;y++){
          for(var x=-this.modMax;x<=this.modMax;x++){
            var xx=player.x+x*map.ts+this.playerW/2+modX*map.ts;
            var yy=player.y+y*map.ts+this.playerH/2+modY*map.ts; 
            
          	jt.rect(xx-wh/2,yy-wh/2,wh,wh,player.c,player.r);
        	}
        }
        */
        
        jt.alpha(1);
      }
      
      return undefined;
      jt.alpha(0);
    }
  }
  
  if(player.toxic>0){
    var ratio=(player.toxic/this.toxicMax);
   	jt.blur(ratio*20) 
    var rev=1-ratio;
    //jt.alpha(rev)
  }
  
  var diffW=drawW-playerW;
  var diffH=drawH-playerH;  
 	jt.rect(player.x-diffW/2,player.y-diffH/2,drawW,drawH,player.c,player.r);
  
  
  //Draw drill
  if(powerup=="drill"){
   	jt.rotate(player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);
    
    jt.rotate(45,player.x+playerW/2-1,player.y-playerH/2-1,2,2);
    
    jt.rect(player.x,player.y-playerH,playerW,playerW,player.c);
    
    jt.clipRect(player.x,player.y-playerH,playerW,playerH)
    
    var mult=3;
    var waveX=((jt.frames()*mult)/jt.fps())%mult;
    var ratio=jt.waveX(waveX);
    var num=2;
    var lineW=2;
    var h=(playerH/num)
    var offset=((playerH)*ratio)/num;
    for(var i=-3;i<num;i++){
    	jt.line(player.x,player.y-playerH+offset+(h*i),player.x+playerW,player.y-playerH+offset+(h*i),lineW,"black");
    }
    
    jt.unclip();
    
    jt.rotate(-45,player.x+playerW/2-1,player.y-playerH/2-1,2,2);
    
    jt.rotate(-player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);
  }else if(powerup=="minigun"){
    //draw cannon
    jt.rotate(player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);
    jt.rect(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,player.c);
    
    
    jt.clipRect(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH)
    
    var mult=2;
    var waveX=((jt.frames()*mult)/jt.fps())%mult;
    var ratio=jt.waveX(waveX);
    var num=2;
    var lineW=2;
    var w=(cannonW/num)
    var offset=(cannonW*ratio)/num;
    for(var i=-1;i<num;i++){
      //+offset+(w*i)
    	jt.line(player.x+playerW/2-cannonW/2+offset+(w*i),player.y+playerH/2-cannonH,player.x+playerW/2-cannonW/2+offset+(w*i),player.y+playerH/2,lineW,"black");
    }
    //console.log(player.x+this.playerW/2-cannonW/2,player.x+this.playerW/2-cannonW/2,player.y+this.playerH/2-cannonH,player.y+this.playerH/2,lineW,"orange")
    
    jt.unclip();
    
    
    jt.rectB(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,"black",0,2);  
    jt.rotate(-player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);
  }else if(powerup=="shotgun"){
    //draw cannon
    jt.rotate(player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);
    
    for(var i=-3;i<=3;i++){
      jt.rotate(i*5,player.x+playerW/2-1,player.y+playerH/2-1,2,2);
      
    	jt.rect(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,player.c);
      if(i==-2){
    		jt.rectB(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,"black",0,2);
      }else{
       	//Draw only top, buttom and right part 
        jt.rectB(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,0,"black",0,2);
        jt.rectB(player.x+playerW/2-cannonW/2,player.y+playerH/2,cannonW,0,"black",0,2);  
        jt.rectB(player.x+playerW/2+cannonW/2,player.y+playerH/2-cannonH,0,cannonH,"black",0,2);
      }
      
      jt.rotate(-i*5,player.x+playerW/2-1,player.y+playerH/2-1,2,2);
    }
    
    jt.rotate(-player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);
  }else if(powerup=="bazooka"){
    //draw cannon
    jt.rotate(player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);
    
    //bazooka
    var bulletW=this.bulletW+this.bulletOffset;
    var bulletH=this.bulletH+this.bulletOffset;    
    jt.rect(player.x+playerW/2-bulletW/2,player.y+playerH/2-cannonH-bulletH/2,bulletW,bulletH,[255,0,0],45);
    
    jt.rect(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,player.c);    
    jt.rectB(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,"black",0,2);  
    jt.rotate(-player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);
  }else{
  
    //draw cannon
    jt.rotate(player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);
    jt.rect(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,player.c);
    jt.rectB(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,"black",0,2);  
    jt.rotate(-player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);
  }
  
  //draw top circle
  var circleD=12*ratioWH;
  jt.circle(player.x+playerW/2-circleD/2,player.y+playerH/2-circleD/2,circleD,player.c,);  
  jt.circleB(player.x+playerW/2-circleD/2,player.y+playerH/2-circleD/2,circleD,"black",2);
  
  //Draw poweruptimer on top circle
  jt.fontSize(14);

  //Draw powerup info
  if(player.powerup!=""){
    //Get powerup info
    var powerupInfo=this.getPowerup(player.powerup);

    var startX=player.x+playerW/2;
    var startY=player.y+playerH/2;

    //Draw timer
    var max=60;

    var framesPer=this.powerupTimerMax/max;
    var powerupTimer=player.powerupTimer;
    if(powerupTimer<0){powerupTimer=0;}
    var timePer=jt.ceil(player.powerupTimer/framesPer)

    var angled=360/max;

    var distMin=0;
    var distMax=circleD/2-1;

    var lineW=2;

    for(var i=0;i<max;i++){
      if(i<timePer){
        var angle=angled*i; 
        var angleX=jt.angleX(angle);
        var angleY=jt.angleY(angle);
        jt.line(startX+angleX*distMin,startY+angleY*distMin,startX+angleX*distMax,startY+angleY*distMax,lineW,"white")
      }
    }

    //jt.circle(startX,startY,circleD,rainbow);
    //jt.text(powerupInfo.text,startX,startY-jt.fontSize()/2,"black","center");
  }
  
  //Redraw preview of teleport
  if(self && powerup=="teleport" && player.projectiles.length>0 && this.getBullet("teleport",localIndex)){
    jt.alpha(0.25)
    var proj=player.projectiles[0];
    
    var diffW=drawW-playerW;
    var diffH=drawH-playerH;  
    jt.rect(proj.x-diffW/2,proj.y-diffH/2,drawW,drawH,player.c,player.r);

    //draw cannon
    jt.rotate(player.r,proj.x+playerW/2-1,proj.y+playerH/2-1,2,2);
    jt.rect(proj.x+playerW/2-cannonW/2,proj.y+playerH/2-cannonH,cannonW,cannonH,player.c);
    jt.rectB(proj.x+playerW/2-cannonW/2,proj.y+playerH/2-cannonH,cannonW,cannonH,"black",0,2);  
    jt.rotate(-player.r,proj.x+playerW/2-1,proj.y+playerH/2-1,2,2);

    //draw top circle
    var circleD=12;
    jt.circle(proj.x+playerW/2-circleD/2,proj.y+playerH/2-circleD/2,circleD,player.c,);  
    jt.circleB(proj.x+playerW/2-circleD/2,proj.y+playerH/2-circleD/2,circleD,"black",2);
  }
  
  //jt.circle(player.x,player.y,player.w,[0,255,0,0.5])
  
  if(player.toxic>0){
   	jt.resetFilters();
  }
  
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
  client.waitTime=client.waitSecond*60; 
  jt.setView("Loading"); 
  
  //console.log(jt.alarms()["changeRound"])
  
  client.clientObj.projectiles=[];
  client.powerups=[];
  
  if(client.index==0){
    	//jt.getObject("Map").generate();
      jt.getObject("Client").sendMap();
    
  }else{
   	jt.getObject("Game").restart(); 
  }
  
  if(this.local){
   	 jte.getObject("Client").started=false;    
    jte.getObject("Client").playing="Player1";        
    jte.getObject("Client").waitTime=jte.getObject("Client").waitSecond*60;
    jt.setView("Loading"); 
  }
}

obj.powerups=[
  {id:"minigun",text:"M",name:"Minigun",desc:"You can shoot multiple bullets"},  
  {id:"shotgun",text:"S",name:"Shotgun",desc:"Shoot 5 bullets in a small arc"},    
  {id:"laser",text:"L",name:"Laser",desc:"Shoot a fast laser beam"},      
  {id:"invisible",text:"I",name:"Invisible",desc:"You become invisible to other players"},        
  {id:"toxic",text:"T",name:"Toxic",desc:"Shoot a radiation cloud that goes through walls and slowly gets bigger"},          
  {id:"teleport",text:"Q",name:"Quantum",desc:"Shoot during your next bullet to teleport to it"},            
  {id:"drill",text:"D",name:"Drill",desc:"Run into walls and tanks to destroy them, but you can't shoot"},              
  {id:"bazooka",text:"B",name:"Bazooka",desc:"Shoot a remote controlled bazooka that explodes on wall, but you can't move"}, 
];

obj.getPowerup=function(id){
  for(var i=0;i<this.powerups.length;i++){
   	if(id==this.powerups[i].id){
     	return this.powerups[i]; 
    }
  }
  return undefined;
}

obj.controls=[
  //{input:"keyboard",inputIndex:0,"left":"left","up":"up","right":"right","down":"down","shoot":"num0","shoot2":"space"},  
  //{input:"gamepad",inputIndex:0,left:"dpadLeft",up:"dpadUp",right:"dpadRight",down:"dpadDown",shoot:"leftShoulder",shoot2:"leftTrigger"},    
  
  {input:"keyboard",inputIndex:0,left:"left",up:"up",right:"right",down:"down",shoot:"enter",shoot2:"num0"},    
  {input:"keyboard",inputIndex:0,left:"a",up:"w",right:"d",down:"s",shoot:"e",shoot2:"g"},      
  {input:"keyboard",inputIndex:0,left:"j",up:"i",right:"l",down:"k",shoot:"o",shoot2:"è"},      
  {input:"keyboard",inputIndex:0,left:"num4",up:"num8",right:"num6",down:"num5",shoot:"num9",shoot2:"+"},  
  
  {input:"gamepad",inputIndex:0,left:"dpadLeft",up:"dpadUp",right:"dpadRight",down:"dpadDown",shoot:"leftShoulder",shoot2:"leftTrigger"},
  {input:"gamepad",inputIndex:1,left:"dpadLeft",up:"dpadUp",right:"dpadRight",down:"dpadDown",shoot:"leftShoulder",shoot2:"leftTrigger"},
  
  {input:"gamepad",inputIndex:0,left:"x",up:"y",right:"b",down:"a",shoot:"rightShoulder",shoot2:"rightTrigger"},  
  {input:"gamepad",inputIndex:1,left:"x",up:"y",right:"b",down:"a",shoot:"rightShoulder",shoot2:"rightTrigger"},
]

;
obj.setup=function(){	/*Setup runs once when the game starts*/
  this.debug();
  
	
};obj.update=function(){	/*Update runs at the fps specified*/
  var local=this.local;
  if(local){
    if(this.alives.length<=0){
			jt.delAlarm("changeRound");
      this.changeRound();
    }else if(this.alives.length<=1 && !jt.isAlarm("changeRound")){
       var name=this.alives[0];
      //Add score
      for(var i=0;i<this.locals.length;i++){
       	if(this.locals[i].clientObj.name==name){
         	this.locals[i].clientObj.score++; 
          this.wonId=i;
        }
      }
      
      this.endRound();
    }
  }
  
  if(jt.checkAlarm("changeRound",true)){
    this.changeRound();
  }
  
  var localHost=false;
  var max=this.locals.length;
  
  var looped=0;
  
  if(!local){max=1;}
  for(var localI=0;localI<this.locals.length;localI++){
    var localIndex=localI;
    var alive=true;
  	if(local && localIndex==0){localHost=true;}
    
    var client=jt.getObject("Client");
    var player=client.clientObj;
    
    var localClient=client;
    
    if(local){
      localClient=this.locals[0];
     	client=this.locals[localIndex];
      player=client.clientObj;
      
      if(this.alives.indexOf(player.name)==-1){
       	alive=false;
        //break;
      }
    }else{
      localIndex=undefined;
      if(localI>0){break;}
    }
    
    
    var doOnce=true;
    if(local && looped>0){doOnce=false;}
    
    var left=false;
    var right=false;    
    var up=false;        
    var down=false;            
    var shoot=false;                
    var shoot2=false;                    
    var shoot3=false; 
    
    var shootH=false;                
    var shoot2H=false;                    
    var shoot3H=false;
    
    if(local){
      if(this.controls[localIndex].input=="keyboard"){
        left=jt.kCheck(this.controls[localIndex].left); 
        right=jt.kCheck(this.controls[localIndex].right);       
        up=jt.kCheck(this.controls[localIndex].up);             
        down=jt.kCheck(this.controls[localIndex].down);                   
        shoot=jt.kPress(this.controls[localIndex].shoot); 
        shoot2=jt.kPress(this.controls[localIndex].shoot2); 
        //shoot3=jt.kPress(this.controls[localIndex].shoot3); 

        shootH=jt.kCheck(this.controls[localIndex].shoot); 
        shoot2H=jt.kCheck(this.controls[localIndex].shoot2); 
        //shoot3H=jt.kCheck(this.controls[localIndex].shoot3);  
      }else{
        var gamepad=this.controls[localIndex].inputIndex;
        if(jt.pConnected(gamepad)){
        
          left=jt.pCheck(this.controls[localIndex].left,gamepad); 
          right=jt.pCheck(this.controls[localIndex].right,gamepad);       
          up=jt.pCheck(this.controls[localIndex].up,gamepad);             
          down=jt.pCheck(this.controls[localIndex].down,gamepad);                   
          shoot=jt.pPress(this.controls[localIndex].shoot,gamepad); 
          shoot2=jt.pPress(this.controls[localIndex].shoot2,gamepad); 
          //shoot3=jt.kPress(this.controls[localIndex].shoot3); 

          shootH=jt.pCheck(this.controls[localIndex].shoot,gamepad); 
          shoot2H=jt.pCheck(this.controls[localIndex].shoot2,gamepad);
        }
      }
     	
    }else{
      var left=jt.kCheck("left");
      var right=jt.kCheck("right");    
      var up=jt.kCheck("up");        
      var down=jt.kCheck("down");            
      var shoot=jt.kPress("space");                
      var shoot2=jt.kPress("num0");                    
      var shoot3=jt.kPress("enter"); 

      var shootH=jt.kCheck("space");                
      var shoot2H=jt.kCheck("num0");                    
      var shoot3H=jt.kCheck("enter");
    }
    
    if(player.powerupTimer%10==0 && player.powerup=="minigun"){
     	if(shootH){shoot=true;} 
     	if(shoot2H){shoot2=true;}       
     	if(shoot3H){shoot3=true;}             
    }
    
    
    
    var serverObjs=client.serverObjs;
    if(local){
     	serverObjs=this.localServerObjs(); 
    }

    var map=jt.getObject("Map");
    var walls=map.walls;

    if(client.isHost || (local && looped==0)){
      this.powerupWaitTimer++;
      if(this.powerupWaitTimer>this.powerupWaitTimerMax){
        this.powerupWaitTimer=0;
        //Spawn powerup
        var ranY=jt.random(2,map.map.length-2,2)-1;
        var ranX=jt.random(2,map.map[0].length-2,2)-1; 

        var chosen=jt.choose(this.powerups)

        var powerup={x:ranX*map.ts,y:ranY*map.ts,w:map.ts,h:map.ts,d:map.ts,id:chosen.id,text:chosen.text};

        var col=false;
        if(!local){
          for(var i=0;i<client.powerups.length;i++){
            var already=client.powerups[i];
            if(jt.cRect(powerup,already)){
               col=true;
              break;
            }
          }
        }else{
          for(var i=0;i<localClient.powerups.length;i++){
            var already=localClient.powerups[i];
            if(jt.cRect(powerup,already)){
               col=true;
              break;
            }
          }
        }

        if(!col){

          if(!local){
          	client.socket.emit("spawnPowerup",client.clientObj.lobby,powerup); 
          }

          this.powerupSpawn=powerup;
          this.powerupSpawnTimer=this.powerupSpawnTimerMax+client.delay;
        }else{
          this.powerupWaitTimer=this.powerupWaitTimerMax-this.powerupWaitTimerRetry; 
        }
      }
    }
    
    if(!local || (local && looped==0)){
      if(this.powerupSpawnTimer>0){
        this.powerupWaitTimer=0;
        this.powerupSpawnTimer--;
        if(this.powerupSpawnTimer<=0){
          //spawn powerup
          if(local){
            localClient.powerups.push(this.powerupSpawn);
          }else{
            client.powerups.push(this.powerupSpawn);
          }

        }
      }
    }

    var playerSpeedMod=1;

    if(client.clientObj.powerup=="bazooka" && this.getBullet("explosion",localIndex)!=undefined){
      //this.powerupTimer=0;
      client.clientObj.powerupTimer=0;      
    }

    if(client.clientObj.powerupTimer>0){
      //this.powerupTimer--; 
      client.clientObj.powerupTimer--;       
      if(client.clientObj.powerup=="speed"){
         playerSpeedMod=2;
      }else if(client.clientObj.powerup=="teleport"){
         if(client.shot && this.getBullet("teleport",localIndex)==undefined){
           client.shot=false;
           client.clientObj.powerupTimer=0;
         }
      }else if(client.clientObj.powerup=="toxic"){
        if(jt.frames()%15==0){
          var projectile={};
          projectile.vX=jt.random(-1,1,0.1)
          projectile.vY=jt.random(-1,1,0.1)

          var projX=startX+projectile.vX;
          var projY=startY+projectile.vY;  

          projectile.x=client.clientObj.x+this.playerW/2;
          projectile.y=client.clientObj.y+this.playerH/2;        

          projectile.w=8;    
          projectile.h=8;  
          projectile.d=8;        

          projectile.c=[150,175,25,0.5];

          projectile.frames=jt.floor(60);
          projectile.framesMax=jt.floor(60);          

          projectile.powerup="smoke";


          client.clientObj.projectiles.push(projectile);
        }
      }
    }else{
      client.clientObj.powerup=""; 
    }

    //Rainbow
    if(doOnce){
      this.rainbowFrame++;
      if(this.rainbowFrame>=this.rainbowFrameMax){
        this.rainbowFrame=0; 
      }
    }
    var rainbowRatio=this.rainbowFrame/this.rainbowFrameMax;
    var rainbowAlpha=this.getRainbow(rainbowRatio,0.5);
    var rainbow=this.getRainbow(rainbowRatio);  

    //Draw powerup
    /*
    var ranY=jt.random(2,map.map.length-2,2)-1;
    var ranX=jt.random(2,map.map[0].length-2,2)-1; 
    jt.rect(ranX*map.ts,ranY*map.ts,map.ts,map.ts,"red");

    */

    //Update player
    var temp={x:client.clientObj.x,y:client.clientObj.y,w:this.playerW,h:this.playerH,d:this.playerD};
    var moveX=0;
    var moveY=0;  


    var canMove=true;
    if(!alive){
     	canMove=false; 
    }
    if(this.getBullet("bazooka",localIndex)!=undefined && client.clientObj.powerup=="bazooka"){
      canMove=false;

      //Change direction of projectile
      var proj=client.clientObj.projectiles[client.clientObj.projectiles.length-1];

      var speed=jt.distP(0,0,proj.vX,proj.vY);
      var angle=jt.angleP(0,0,proj.vX,proj.vY);    

      if(left){angle-=this.playerTurn*playerSpeedMod;}
      if(right){angle+=this.playerTurn*playerSpeedMod;}  
      angle=jt.wrap(angle,0,359)

      var angleX=jt.angleX(angle);
      var angleY=jt.angleY(angle);

      client.clientObj.projectiles[client.clientObj.projectiles.length-1].vX=angleX*speed;
      client.clientObj.projectiles[client.clientObj.projectiles.length-1].vY=angleY*speed;   

    }

    if(canMove){

      if(left){client.clientObj.r-=this.playerTurn*playerSpeedMod;}
      if(right){client.clientObj.r+=this.playerTurn*playerSpeedMod;}  
      client.clientObj.r=jt.wrap(client.clientObj.r,0,359)

      var angleX=jt.angleX(client.clientObj.r);
      var angleY=jt.angleY(client.clientObj.r);

      if(up){
        moveX=angleX*this.playerSpeed*playerSpeedMod;
        moveY=angleY*this.playerSpeed*playerSpeedMod;    
      }
      if(down){
        moveX=-angleX*this.playerSpeedBack*playerSpeedMod;
        moveY=-angleY*this.playerSpeedBack*playerSpeedMod; 
      } 
    }

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

    player.w=this.playerW;
    player.h=this.playerH;  
    player.d=this.playerD;      

    //Shoot
    if(alive){
      if((shoot || shoot2 || shoot3)){
        this.shoot(localIndex);
      }
    }
    
    if(doOnce){
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
      
      //Draw texts
      jt.fontSize(14);
      var padding=2;
      for(var i=0;i<this.texts.length;i++){
        var text=this.texts[i];
        var textW=jt.textW(text.text);
        //text.y-=0.1;
        text.alpha-=1/180;
        //jt.rect(text.x-textW/2-padding,text.y-padding,textW+padding*2,jt.fontSize()+padding*2,[255,255,255,0.5]);
        jt.text(text.text,text.x,text.y-jt.fontSize()/2,[0,0,0,text.alpha],"center");
        
        if(text.alpha<0){
         	this.texts.splice(i,1);
          i--;
        }
      }
    }

    if(jt.debug()){
      var id=""
      if(jt.kPress(1)){id="minigun";}
      if(jt.kPress(2)){id="shotgun";}      
      if(jt.kPress(3)){id="laser";}            
      if(jt.kPress(4)){id="invisible";}                  
      if(jt.kPress(5)){id="toxic";}                        
      if(jt.kPress(6)){id="teleport";}                              
      if(jt.kPress(7)){id="drill";}                                    
      if(jt.kPress(8)){id="bazooka";} 
      
      if(id!=""){
        var powerupInfo=this.getPowerup(id);

        client.clientObj.powerupTimer=this.powerupTimerMax;        
        client.clientObj.powerup=id;

        client.modX=jt.random(-this.modMax,this.modMax);
        client.modY=jt.random(-this.modMax,this.modMax);     
      }
    }
    
    //Check powerup col
    var powerups=client.powerups;
    if(alive){
      if(local){powerups=localClient.powerups;}
      for(var i=0;i<powerups.length;i++){
        var powerup=powerups[i];
        if(jt.cCircle(player,powerup)){
            var padding=0;
           var obj={x:player.x-padding,y:player.y-padding,w:player.w+padding*2,h:player.h+padding*2,d:player.d+padding*2}

           var powerupInfo=this.getPowerup(powerup.id);
           //get powerup
           //this.powerupTimer=this.powerupTimerMax;
           client.clientObj.powerupTimer=this.powerupTimerMax;        
          client.clientObj.powerup=powerup.id;
          client.shot=false;

          this.addText(powerupInfo.name,powerup.x+powerup.w/2,powerup.y+powerup.h/2);

          if(!local){
           client.socket.emit("deletePowerup",client.clientObj.lobby,obj);
            client.powerups.splice(i,1);
          }else{
            client.modX=jt.random(-this.modMax,this.modMax);
            client.modY=jt.random(-this.modMax,this.modMax);          
            localClient.powerups.splice(i,1);
          }

          i--;
        }
      }

      jt.camActive(false);
      jt.fontSize(20);

      if(!local){
        //Draw powerup info
        if(client.clientObj.powerup!=""){
          //Get powerup info
          var powerupInfo=this.getPowerup(client.clientObj.powerup);

          var startX=map.tsUi;
          var startY=jt.h()-map.tsUi-map.tsUi/2;

          //Draw timer
          var max=60;

          var framesPer=this.powerupTimerMax/max;
          var powerupTimer=client.clientObj.powerupTimer;
          if(powerupTimer<0){powerupTimer=0;}
          var timePer=jt.ceil(client.clientObj.powerupTimer/framesPer)

          var angled=360/max;

          var distMin=1;
          var distMax=map.tsUi*0.75;

          var lineW=4;

          for(var i=0;i<max;i++){
            if(i<timePer){
              var angle=angled*i; 
              var angleX=jt.angleX(angle);
              var angleY=jt.angleY(angle);
              jt.line(startX+map.tsUi/2+angleX*distMin,startY+map.tsUi/2+angleY*distMin,startX+map.tsUi/2+angleX*distMax,startY+map.tsUi/2+angleY*distMax,lineW,"white")
            }
          }

          jt.circle(startX,startY,map.tsUi,rainbow);
          jt.text(powerupInfo.text,startX+map.tsUi/2,startY+map.tsUi/2-jt.fontSize()/2,"black","center");

          startX+=map.tsUi*1.5;
          var name=powerupInfo.name;
          var desc=powerupInfo.desc;    
          jt.text(name+": "+desc,startX,startY,"white","left",jt.fontSize(),0,60,jt.fontSize());
        }
      }
    }

    jt.camActive(true);
    var fs=20;
    jt.fontSize(jt.floor(20/map.size));
    //Draw powerups
    if(doOnce){
      for(var i=0;i<powerups.length;i++){
        var powerup=powerups[i];
        jt.circle(powerup.x,powerup.y,powerup.w,rainbowAlpha);
        jt.text(powerup.text,powerup.x+powerup.w/2,powerup.y+powerup.h/2-fs/2,"black","center");
      }
    }

    //Draw laser sight
    if(client.clientObj.powerup=="laser" && alive){
      var bulletWHRate=this.laserWHRate;
      var bulletOffset=this.laserOffset;

      var angle=client.clientObj.r;

      var cannonX=this.cannonH/2*jt.angleX(angle);
      var cannonY=this.cannonH/2*jt.angleY(angle);    

      var startX=client.clientObj.x+client.clientObj.w/2-this.laserW/2+cannonX;
      var startY=client.clientObj.y+client.clientObj.h/2-this.laserH/2+cannonY; 

      var time=jt.floor((this.bulletTime*this.laserTimeMod)*1)+this.laserMax*1;
      var speed=(this.bulletSpeed*this.laserSpeedMod)/1;

      var x=startX;
      var y=startY;    

      var vX=jt.angleX(angle)*speed;
      var vY=jt.angleY(angle)*speed;

      var alpha=1;
      var alphaRate=-1/time;

      for(var i=0;i<time;i++){
        //check collisions
        var proj={x:x,y:y,w:this.laserW,h:this.laserH};
        proj.w+=bulletWHRate;
        proj.h+=bulletWHRate;
        proj.x-=bulletWHRate/2;
        proj.y-=bulletWHRate/2;    

        proj.x+=vX;
        for(var j=0;j<walls.length;j++){
          var wall=walls[j];
          if(jt.cRect(proj,wall)){
            //col=true;
            if(vX>=0){
              proj.x=wall.x-proj.w;
            }else{
              proj.x=wall.x+wall.w;
            }
            vX*=-1
            break; 
          }
        }

        proj.y+=vY; 
        for(var j=0;j<walls.length;j++){
          var wall=walls[j];
          if(jt.cRect(proj,wall)){
            //col=true;
            if(vY>=0){
              proj.y=wall.y-proj.h;
            }else{
              proj.y=wall.y+wall.h;
            }
            vY*=-1
            break; 
          }
        }

        //Draw laser
        jt.line(x,y,proj.x,proj.y,this.laserW,[255,0,0,alpha],0);

        x=proj.x;
        y=proj.y;    

        alpha+=alphaRate;
      }
    }

    //Drill (add bullet)
    if(player.powerup=="drill" && alive){
      var angle=player.r;
      var angleX=jt.angleX(angle);
      var angleY=jt.angleY(angle);     

      var startX=player.x;
      var startY=player.y;     

      var drillX=startX+((this.drawW/2+player.w/2)*angleX);
      var drillY=startY+((this.drawH/2+player.w/2)*angleY);

      var drillD=player.w;
      
      var padding=4;

      var drill={x:drillX-padding,y:drillY-padding,w:drillD+padding*2,h:drillD+padding*2,d:drillD+padding*2,c:[0,0,0,0],powerup:"drill",frames:3,vX:0,vY:0};

      //jt.circle(drill.x,drill.y,drill.d,[255,0,0,0.5]);
      player.projectiles.push(drill);
      var sent=false;

      for(var i=0;i<walls.length;i++){
        var wall=walls[i];
        if(jt.cCircleRect(drill,wall) && !wall.invincible){
          walls.splice(i,1)
          i--;

          if(!local && !sent){
            sent=true;
          	client.socket.emit("deleteWall",client.clientObj.lobby,drill);    
          }
          
          //break;
        }
      }
    }

    //Bullets
    col=false;
    for(var i=0;i<player.projectiles.length;i++){
      var proj=player.projectiles[i];
      var explosion=undefined;

      player.projectiles[i].frames--;
      if(player.projectiles[i].frames>0){


        var bulletWHRate=this.bulletWHRate;
        var bulletOffset=this.bulletOffset;
        
        var safe=false;
        if(proj.powerup=="smoke"){
         	safe=true; 
          proj.c[3]-=0.01;
        }

        if(proj.powerup=="laser"){
          bulletWHRate=this.laserWHRate; 
          bulletOffset=this.laserOffset;         
        }

        if(proj.powerup=="teleport"){
          bulletOffset=this.teleportOffset;         
        }

        if(proj.powerup=="explosion"){
          bulletOffset=this.explosionOffset; 
          var sent=false;
          if(proj.frames>=proj.framesMax-1){
            for(var j=0;j<walls.length;j++){
              var wall=walls[j];
              if(jt.cCircleRect(proj,wall) && !wall.invincible){
                walls.splice(j,1)
                j--;

                if(!local && !sent){
                  sent=true;
                  client.socket.emit("deleteWall",client.clientObj.lobby,proj);    
                }

              }
            }
          }
        }
        
        if(proj.powerup=="toxic" || proj.powerup=="smoke"){
          proj.x-=this.ghostWHRate/2;         
          proj.y-=this.ghostWHRate/2;                   
          proj.w+=this.ghostWHRate;                             
          proj.h+=this.ghostWHRate;                                       
          proj.d+=this.ghostWHRate;                                                 
        }
        
        if(proj.powerup=="toxic"){
         	if(proj.frames%5==0){
            var projectile={};
            projectile.vX=jt.random(-1,1,0.1)
            projectile.vY=jt.random(-1,1,0.1)


            projectile.x=proj.x+proj.w/2+jt.random(-proj.w/2,proj.w/2);
            projectile.y=proj.y+proj.h/2+jt.random(-proj.h/2,proj.h/2);        

            projectile.w=8;    
            projectile.h=8;  
            projectile.d=8;        

            projectile.c=[150,175,25,0.5];

            projectile.frames=jt.floor(60);

            projectile.powerup="smoke";


            client.clientObj.projectiles.push(projectile);
          } 
        }


        var checkCol=true;
        if(proj.powerup=="toxic" || proj.powerup=="drill" || proj.powerup=="explosion" || proj.powerup=="smoke"){
          checkCol=false;
        }

        var col=false;

        proj.x+=proj.vX;
        if(checkCol){
          for(var j=0;j<walls.length;j++){
            var wall=walls[j];
            if(jt.cRect(proj,wall)){
              //col=true;
              if(proj.vX>=0){
                proj.x=wall.x-proj.w-1;
              }else{
                proj.x=wall.x+wall.w+1;
              }
              proj.vX*=-1

              col=true;
              break; 
            }
          }
        }

        proj.y+=proj.vY; 
        if(checkCol){
          for(var j=0;j<walls.length;j++){
            var wall=walls[j];
            if(jt.cRect(proj,wall)){
              //col=true;
              if(proj.vY>=0){
                proj.y=wall.y-proj.h-1;
              }else{
                proj.y=wall.y+wall.h+1;
              }
              proj.vY*=-1

              col=true;
              break; 
            }
          }
        }
        
        proj.d+=bulletWHRate;
        proj.w+=bulletWHRate;        
        proj.h+=bulletWHRate;
        proj.x-=bulletWHRate/2;
        proj.y-=bulletWHRate/2; 

        if(proj.powerup=="bazooka"){
           //draw line
          var angle=jt.angleP(0,0,proj.vX,proj.vY);
          jt.rotate(angle,proj.x,proj.y,proj.w,proj.h);
          //jt.rotate(45,proj.x,proj.y,proj.w,proj.h);        
          jt.rect(proj.x-bulletOffset,proj.y-proj.h/2-bulletOffset,proj.w+bulletOffset*2,proj.h+bulletOffset*2,proj.c,45);
          jt.rect(proj.x,proj.y,proj.w,proj.h,proj.c);        
          jt.rect(proj.x,proj.y+proj.h/2,proj.w,proj.h,proj.c);                
          //jt.rotate(-45,proj.x,proj.y,proj.w,proj.h);             
          jt.rotate(-angle,proj.x,proj.y,proj.w,proj.h);                
        }else if(powerup=="teleport"){
          jt.circle(proj.x-bulletOffset,proj.y-bulletOffset,proj.w+bulletOffset*2,proj.c);
        }else{
          jt.circle(proj.x-bulletOffset,proj.y-bulletOffset,proj.w+bulletOffset*2,proj.c);
        }

        if(proj.powerup=="laser" && i-1>=0){
           //draw line
          var before=player.projectiles[i-1];
          if(jt.distP(proj.x,proj.y,before.x,before.y)<=9){
          	jt.line(proj.x+proj.w/2,proj.y+proj.h/2,before.x+before.w/2,before.y+before.h/2,this.laserW+bulletOffset*2,[255,0,0]);
          }
        }
        jt.alpha(1);

        client.clientObj.projectiles[i]=proj;
        
        var deleted=false;
        
        //jt.rect(proj.x,proj.y,proj.w,proj.h,[255,0,0,0.5]);
        //jt.circle(proj.x,proj.y,proj.d,[255,0,0,0.5]);        
        
        if(jt.cRectCircle(player,proj) && player.projectiles[i].frames<player.projectiles[i].framesMax-this.bulletTimeBuffer && this.playerInvincibility<=0 && proj.powerup!="drill" && !safe){
          //console.log(proj.powerup);
          if(proj.powerup=="toxic"){
            player.toxic+=2;
          }else{
            if(!local){
              this.respawn(true);

              //this.endRound(true); 
              client.dead=true;
              if(client.isHost){
                client.checkDead(); 
              }else{
                client.socket.emit("dead",client.host);  
              }

              client.clientObj.x=jt.w()/2+((client.index*2)-1)*999
            }else{

              this.respawn(true,localIndex);

              player.x=jt.w()/2+((client.index*2)-1)*999

              this.alives.splice(this.alives.indexOf(player.name),1);
            }

            if(proj.powerup=="explosion"){
              
            }else{
              client.clientObj.projectiles.splice(i,1);
              i--;

              deleted=true;
              break;
            }
          }
        }else{
          if(proj.powerup=="bazooka" && col){
            //Spawn explosion
            var explosion=this.getExplosion(proj);

            client.clientObj.projectiles.splice(i,1);
            i--;


            deleted=true;
          } 
        }
        
        //delete if outside map
        if(!checkCol){
          if(proj.x<-proj.w || proj.x>map.ww || proj.y<-proj.h || proj.y>map.hh){
            deleted=true;
            client.clientObj.projectiles.splice(i,1);
          	i--;
          }       
        }
        
        if(!deleted){
          proj.w-=bulletWHRate;
          proj.h-=bulletWHRate;
          proj.x+=bulletWHRate/2;
          proj.y+=bulletWHRate/2; 
        }
      }else{
        col=true; 

        if(proj.powerup=="bazooka"){
          var explosion=this.getExplosion(proj);
        }

        client.clientObj.projectiles.splice(i,1);
        i--;
        deleted=true;
      }

      if(explosion!=undefined){
        player.projectiles.push(explosion); 
      }
    }

    if(col){
      
    }

    //Draw player
    if(alive){
    	this.drawPlayer(player,true,localIndex);
    }
      
    //Draw scores
    //jt.fontSize(jt.ceil(14/map.size));
    jt.fontSize(14);    
    jt.camActive(false);
    if(!local){
    	//jt.text(client.clientObj.name+"(You): "+player.score,5,5,"white","left");
    }else{
      if(looped==0){
       	for(var i=0;i<this.locals.length;i++){
          var y=2;
          var x=(i*(jt.w()/4))+5;
          if(i>=4){
            x=((i-4)*(jt.w()/4))+5;
             y=2+jt.fontSize();
          }
          
          var flashing=false;
          if(this.wonId==i){
            if(jt.floor(jt.frames()/10)%2==0){
              flashing=true; 
            }
          }

          if(!flashing){
            jt.text(this.locals[i].clientObj.name+": "+this.locals[i].clientObj.score,x,y,"white","left");
          }

          
        }
      }
      
    }
    jt.camActive(true);
    
    
    //Draw name + powers
    jt.fontSize(jt.ceil(14/map.size));
    var text=player.name;

    if(player.powerup!=""){
      var powerup=this.getPowerup(player.powerup);
      text+="-"+powerup.text;
    }

    var textW=jt.textW(text);
    var margin=2;

    if(player.powerup!="invisible"){
      jt.rect(player.x+this.playerW/2-textW/2-margin,player.y-jt.fontSize()-margin,textW+margin*2,jt.fontSize()+margin*2,[255,255,255,0.5])
      jt.text(text,player.x+this.playerW/2,player.y-jt.fontSize(),"black","center");
    }


    //Draw players
    var keys=Object.keys(serverObjs);
    var len=Object.keys(serverObjs).length;
    var index=1;

    var drill=undefined;

    for (var i = 0; i < len; i++) {
      var other = serverObjs[keys[i]];
      if(local){other=serverObjs[keys[i]].clientObj}
      if(local && client.clientObj.name==other.name){continue;}
      var dead=false;
      if(client.withs.indexOf(keys[i])!=-1 || local){


        //Bullets
        for(var j=0;j<other.projectiles.length;j++){
          var proj=other.projectiles[j];    
          
          var safe=false;
          if(proj.powerup=="smoke"){
            safe=true;       
          }

          var bulletWHRate=this.bulletWHRate;
          var bulletOffset=this.bulletOffset;        

          if(proj.powerup=="laser"){
            bulletWHRate=this.laserWHRate; 
            bulletOffset=this.laserOffset;         
          }

          if(proj.powerup=="teleport"){
            bulletOffset=this.teleportOffset;         
          }

          var col=false;
          
          proj.d+=bulletWHRate;
          proj.w+=bulletWHRate;        
          proj.h+=bulletWHRate;
          proj.x-=bulletWHRate/2;
          proj.y-=bulletWHRate/2; 

          if(!safe){
            if(jt.cCircle(player,proj)){
              col=true;
            }else{
              proj.x+=proj.vX;
              proj.y+=proj.vY; 
              if(jt.cCircle(player,proj)){
                col=true; 
              }
              proj.x-=proj.vX;
              proj.y-=proj.vY; 
            }
          }
          
          if(col && proj.powerup=="toxic"){
            player.toxic+=2;
            col=false;
          }
          
          if(col && player.powerup=="drill" && proj.powerup=="explosion"){
            player.powerupTimer++;
            col=false;
          }

          if(!local){
            if(proj.powerup=="bazooka"){
             //draw line
              var angle=jt.angleP(0,0,proj.vX,proj.vY);
              jt.rotate(angle,proj.x,proj.y,proj.w,proj.h);
              //jt.rotate(45,proj.x,proj.y,proj.w,proj.h);        
              jt.rect(proj.x-bulletOffset,proj.y-proj.h/2-bulletOffset,proj.w+bulletOffset*2,proj.h+bulletOffset*2,proj.c,45);
              jt.rect(proj.x,proj.y,proj.w,proj.h,proj.c);        
              jt.rect(proj.x,proj.y+proj.h/2,proj.w,proj.h,proj.c);                
              //jt.rotate(-45,proj.x,proj.y,proj.w,proj.h);             
              jt.rotate(-angle,proj.x,proj.y,proj.w,proj.h);                
            }else{
              jt.circle(proj.x-bulletOffset,proj.y-bulletOffset,proj.w+bulletOffset*2,proj.c);
            }
            //jt.circle(proj.x-bulletOffset,proj.y-bulletOffset,proj.w+bulletOffset*2,proj.c);

            if(proj.powerup=="laser" && i-1>=0){
               //draw line
              var before=other.projectiles[i-1];
              jt.line(proj.x+proj.w/2,proj.y+proj.h/2,before.x+before.w/2,before.y+before.h/2,this.laserW,[255,0,0]);
            }
          }

          if(col){
            var padding=8;
            var obj={x:player.x-padding,y:player.y-padding,w:player.w+padding*2,h:player.h+padding*2,d:player.d+padding*2}

            if(proj.powerup=="toxic" || proj.powerup=="explosion"){
              //dont destroy
            }else{
              if(!local){
                client.socket.emit("deleteProjectile",keys[i],obj);    
              }else{
                other.projectiles.splice(j,1);
              }
            }
            
            dead=true;
            break;

          }
        }

        if(dead){
          if(!local){
            this.respawn(true);

            //this.endRound(true); 
            client.dead=true;
            if(client.isHost){
              client.checkDead(); 
            }else{
              client.socket.emit("dead",client.host);  
            }

            client.clientObj.x=jt.w()/2+((client.index*2)-1)*999
          }else{
            
            this.respawn(true,client.index);
            
            player.x=jt.w()/2+((client.index*2)-1)*999
            
            this.alives.splice(this.alives.indexOf(player.name),1);
          }
        }

        if(!local){
        	this.drawPlayer(other,false);
          
        }

        jt.fontSize(jt.ceil(14/map.size));

        var text=other.name;

        if(other.powerup!=""){
          var powerup=this.getPowerup(other.powerup);
          text+="-"+powerup.text;
        }

        var textW=jt.textW(text);
        var margin=2;

        if(!local){
          if(other.powerup!="invisible"){
            jt.rect(other.x+this.playerW/2-textW/2-margin,other.y-jt.fontSize()-margin,textW+margin*2,jt.fontSize()+margin*2,[255,255,255,0.5])
            jt.text(text,other.x+this.playerW/2,other.y-jt.fontSize(),"black","center");
          }
          jt.fontSize(14);
          jt.camActive(false);
          
          if(i==0){
            var y=2;
            var x=(i*(jt.w()/4))+5;
            
            var flashing=false;
            if(client.wonId==client.socketId){
              if(jt.floor(jt.frames()/10)%2==0){
                flashing=true; 
              }
            }

            if(!flashing){
              jt.text(client.clientObj.name+": "+client.clientObj.score,x,y,"white","left");
            }
            
            
          }
          
          var index=i+1;

          var y=2;
          var x=(index*(jt.w()/4))+5;
          if(index>=4){
            x=((index-4)*(jt.w()/4))+5;
             y=2+jt.fontSize();
          }
          
          
          var flashing=false;
          if(client.wonId==client.socketId){
            if(jt.floor(jt.frames()/10)%2==0){
              flashing=true; 
            }
          }

          if(!flashing){
            jt.text(other.name+": "+other.score,x,y,"white","left");
          }
          
          

          jt.camActive(true);

          index++;
        }
      }
    }
    
    if(player.toxic>0){
     	player.toxic--; 
      if(player.toxic>=this.toxicMax){
        player.toxic=this.toxicMax;
       	 if(!local){
           this.respawn(true);

           //this.endRound(true); 
           client.dead=true;
           if(client.isHost){
             client.checkDead(); 
           }else{
             client.socket.emit("dead",client.host);  
           }

           client.clientObj.x=jt.w()/2+((client.index*2)-1)*999
         }else{

           this.respawn(true,localIndex);

           player.x=jt.w()/2+((client.index*2)-1)*999

           this.alives.splice(this.alives.indexOf(player.name),1);
         }
      }
    }
    
    
    
    
    looped++;
  }
  
	jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.local=false;","obj.locals=[];","obj.alives=[];","","obj.wonId=undefined;","","obj.texts=[];","","obj.debug=function(){"," \tjt.debug(true); ","}","","obj.addText=function(text,x,y){","  this.texts.push({text:text,x:x,y:y,alpha:1})","}","","","obj.localServerObjs=function(index){"," \tvar arr={};","  for(var i=0;i<this.locals.length;i++){","    if(i!=index){","     \tarr[this.locals[i].clientObj.name]=this.locals[i]; ","    }","  }","  return arr;","}","","obj.localChange=function(mod){","  var clientObj={name:\"\",c:[0,0,255],x:0,y:0,score:0,projectiles:[],powerupTimer:0,powerup:\"\",state:\"\",toxic:0,time:0,r:0,playing:false,lobby:undefined,host:undefined};","  var client={clientObj:clientObj,isHost:false,powerups:[],withs:[],delay:0,modX:0,modY:0,shot:false};","  var colors=jt.getObjects([\"Color\"],\"Lobby\");","  var len=this.locals.length;","  var color=[127,127,127];","  if(len<=colors.length-1){","   \tcolor=colors[len].c; ","  }","  var name=\"P\"+(len+1)","  client.clientObj.name=name;","  client.index=len;","  ","  if(client.index==0){client.isHost=true;}","  ","  client.clientObj.c=color;","  ","  if(mod==1 && this.locals.length<8){","    this.locals.push(client);","  }else if(mod==-1 && this.locals.length>2){","    this.locals.splice(this.locals.length-1,1);","  }","}","","","obj.playerInvincibility=15;","obj.playerInvincibilityMax=15;","","obj.playerW=16;","obj.playerH=16;","obj.playerD=16;","","obj.cannonW=8;","obj.cannonH=16;","","obj.drawW=16;","obj.drawH=20;","","obj.playerMod=1;","obj.playerTurn=3;","obj.playerSpeed=1.5;","obj.playerSpeedBack=1;","obj.bulletSpeed=3;","","obj.bulletTime=300;","obj.bulletTimeBuffer=12;","","obj.bulletOffset=2;","obj.laserOffset=2;","obj.teleportOffset=0;","obj.explosionOffset=8;","","obj.ghostWHRate=1;","","obj.bulletW=8;","obj.bulletH=8;","","obj.bulletWHRate=0;","obj.laserWHRate=0;","","obj.endRoundWait=60;","","obj.lastDelay=false;","","//obj.powerupTimer=0;","obj.powerupTimerMax=480;","","obj.powerupWaitTimer=0;","obj.powerupWaitTimerMax=300;//360","obj.powerupWaitTimerRetry=5;","","obj.powerupSpawn=undefined;","obj.powerupSpawnTimer=0;","obj.powerupSpawnTimerMax=60;","","obj.modMax=4;","","obj.toxicMax=30;","","obj.restart=function(){","  this.texts=[];","  this.powerupTimer=0;","  this.powerupWaitTimer=0;  ","  var client=jt.getObject(\"Client\");","  ","  client.powerups=[];","  client.clientObj.projectiles=[];  ","  if(this.local){","    for(var i=0;i<this.locals.length;i++){","     \tthis.respawn(false,i); ","      this.locals[i].clientObj.projectiles=[];","      this.locals[i].clientObj.powerupTimer=0;","    }","  }else{","    this.respawn();","    client.clientObj.projectiles=[];","    client.clientObj.powerupTimer=0;","  }","  ","  ","  //Change cam w and h","  var map=jt.getObject(\"Map\");","  ","  this.alives=[];","  for(var i=0;i<this.locals.length;i++){","   \tthis.alives.push(this.locals[i].clientObj.name); ","  }","  ","  map.ww=jt.w()*map.size;","  map.hh=jt.h()*map.size; ","  ","  jt.cam().w=map.ww;","  jt.cam().h=map.hh;  "," \tjt.camActive(true);","  ","  this.playerW=16;","\tthis.playerH=16;","\tthis.playerD=16;","}","","obj.respawn=function(dead,localIndex){","  //this.powerupTimer=0;","  if(dead==undefined){dead=false;}","  this.powerupWaitTimer=0;  ","  var client=jt.getObject(\"Client\");","  var map=jt.getObject(\"Map\");  ","  if(localIndex!=undefined){client=this.locals[localIndex];}","  ","  client.powerups=[];","  ","  client.clientObj.toxic=0;","  ","  if(dead){","   \t//spawn explosion on player     ","    var explosion=this.getExplosion(client.clientObj);","","    client.clientObj.projectiles.push(explosion);","  }","  ","  ","  client.clientObj.x=map.spawns[client.index].x+map.ts/2-this.playerW/2; ","  ","  client.clientObj.y=map.spawns[client.index].y+map.ts/2-this.playerH/2;","  ","  client.clientObj.r=map.spawns[client.index].r;","  ","  /*","  if(client.index==0){","   \tclient.clientObj.r=135; ","  }else if(client.index==1){","    client.clientObj.r=315; ","  }else if(client.index==2){","    client.clientObj.r=225; ","  }else if(client.index==3){","    client.clientObj.r=45; ","  }else if(client.index==4){","    client.clientObj.r=180; ","  }else if(client.index==5){","    client.clientObj.r=0; ","  }else if(client.index==6){","    client.clientObj.r=90; ","  }else if(client.index==7){","    client.clientObj.r=270; ","  }","  */","  ","  this.playerInvincibility=this.playerInvincibilityMax;","  ","  this.playerW=16;","\tthis.playerH=16;","\tthis.playerD=16;","}","","obj.laserSpeedMod=2;","obj.laserTimeMod=0.67;","obj.laserMax=4;","obj.laserW=2;","obj.laserH=2;","","obj.minigunTimerSub=30;","","obj.ghostSpeedMod=0.5;","obj.ghostTimeMod=3;","","obj.teleportW=16;","obj.teleportH=16;","","obj.teleportSpeedMod=0.75;","","obj.getBullet=function(powerup,localIndex){","  var client=jt.getObject(\"Client\");","  if(localIndex!=undefined){client=this.locals[localIndex];}","  var player=client.clientObj;"," \tfor(var i=0;i<player.projectiles.length;i++){","   \tvar proj=player.projectiles[i];","    if(proj.powerup==powerup){","     \treturn proj; ","    }","  }","  return undefined;","}","","obj.getAllBullet=function(powerup,localIndex){","  var client=jt.getObject(\"Client\");","  if(localIndex!=undefined){client=this.locals[localIndex];}","  var player=client.clientObj;"," \tfor(var i=0;i<player.projectiles.length;i++){","   \tvar proj=player.projectiles[i];","    if(proj.powerup!=powerup){","     \treturn false; ","    }","  }","  return true;","}","","obj.getBulletIndex=function(powerup,localIndex){","  var client=jt.getObject(\"Client\");","  if(localIndex!=undefined){client=this.locals[localIndex];}","  var player=client.clientObj;"," \tfor(var i=0;i<player.projectiles.length;i++){","   \tvar proj=player.projectiles[i];","    if(proj.powerup==powerup){","     \treturn i; ","    }","  }","  return undefined;","}","","obj.getExplosion=function(proj){","  var explosionW=64;","  var explosionH=64; ","  var explosionFrames=16;","  var explosion={x:proj.x+proj.w/2-explosionW/2,y:proj.y+proj.h/2-explosionH/2,w:explosionW,h:explosionH,d:explosionH,c:\"red\",powerup:\"explosion\",frames:explosionFrames,framesMax:explosionFrames,vX:0,vY:0};","\treturn explosion;","}","","obj.shoot=function(localIndex){","  ","  var client=jt.getObject(\"Client\");","  var player=client.clientObj;","  if(localIndex!=undefined){client=this.locals[localIndex];player=client.clientObj}","  var canShoot=false;","  if(player.projectiles.length<=0 || player.powerup==\"minigun\"){","   \tcanShoot=true; ","  }","  ","  if(player.powerup==\"teleport\"){","    if(this.getBullet(\"teleport\",localIndex)==undefined && player.projectiles.length<=0 && !client.shot){","     \tcanShoot=true; ","      //this.powerupTimer=this.bulletTime+1;","      player.powerupTimer=this.bulletTime+1;      ","    }else if(this.getBullet(\"teleport\",localIndex)!=undefined && player.projectiles.length<=1){","     \t//teleport ","      var proj=player.projectiles[0];","      player.x=proj.x+proj.w/2-player.w/2;","      player.y=proj.y+proj.h/2-player.h/2; ","      ","      player.projectiles=[];","      player.powerupTimer=0;      ","    }","  }","  ","  if(player.powerup==\"bazooka\"){","    if(this.getBullet(\"bazooka\",localIndex)==undefined){","     \tcanShoot=true; ","       //this.powerupTimer=this.bulletTime+1;","       player.powerupTimer=this.bulletTime+1;      ","    }else{","      //explode","     \tcanShoot=false;","      //get bullet","      var bazooka=this.getBullet(\"bazooka\",localIndex);","      var bazookaIndex=this.getBulletIndex(\"bazooka\",localIndex);      ","      var explosion=this.getExplosion(bazooka);","      ","      client.clientObj.projectiles.splice(bazookaIndex,1);","      ","      client.clientObj.projectiles.push(explosion);","    }","  }","  ","  if(player.powerup==\"toxic\" && this.getAllBullet(\"smoke\",localIndex)){","    canShoot=true;","  }","  ","  if(player.powerup==\"drill\"){","   \tcanShoot=false; ","  }","  ","  if(canShoot){","    var bulletW=this.bulletW;","    var bulletH=this.bulletH;    ","  ","    if(player.powerup==\"minigun\"){","\t\t\t//this.powerupTimer-=this.minigunTimerSub;","\t\t\tplayer.powerupTimer-=this.minigunTimerSub;      ","    }else if(player.powerup==\"teleport\" && !client.shot){","      //nothing for first bullet","      client.shot=true;","    }else if(player.powerup==\"bazooka\"){","      //nothing for first bullet","    }else{","      player.projectiles=[];","      //this.powerupTimer=0;","      player.powerupTimer=0;      ","    }","    ","    if(player.powerup==\"laser\"){","     \tbulletW=this.laserW; ","     \tbulletH=this.laserH;       ","    }","    ","    if(player.powerup==\"teleport\"){","     \tbulletW=this.teleportW; ","     \tbulletH=this.teleportH;       ","    }","    ","    var angle=player.r;","    ","    var cannonX=this.cannonH/2*jt.angleX(angle);","    var cannonY=this.cannonH/2*jt.angleY(angle);    ","","    var startX=player.x+player.w/2-bulletW/2+cannonX;","    var startY=player.y+player.h/2-bulletH/2+cannonY; ","    ","    var angleAdd=5;","    var move=0;  ","    var max=1;","    var speedMod=1;","    var timeMod=1;","    var c=[0,0,0];","","    if(player.powerup==\"shotgun\"){max=5;angle-=angleAdd*(jt.floor(max/2));}","    if(player.powerup==\"laser\"){speedMod=this.laserSpeedMod;timeMod=this.laserTimeMod;c=[255,0,0];angleAdd=0;max=this.laserMax;move=1}","    if(player.powerup==\"toxic\"){speedMod=this.ghostSpeedMod;c=[150,175,25,0.5];timeMod=this.ghostTimeMod}    ","    if(player.powerup==\"teleport\"){speedMod=this.teleportSpeedMod;c=player.c;}        ","    if(player.powerup==\"bazooka\"){c=[255,0,0];}            ","","    for(var i=0;i<max;i++){","      var projectile={};","      projectile.vX=jt.angleX(angle)*this.bulletSpeed*speedMod;","      projectile.vY=jt.angleY(angle)*this.bulletSpeed*speedMod;","      ","      var projX=startX+projectile.vX;","      var projY=startY+projectile.vY;  ","","      projectile.x=projX+(move*i*projectile.vX);","      projectile.y=projY+(move*i*projectile.vY);","","      projectile.w=bulletW;    ","      projectile.h=bulletH;  ","      projectile.d=bulletW;        ","      ","      projectile.c=c;","      ","      projectile.powerup=undefined","      if(player.powerup!=\"\"){","       \tprojectile.powerup=player.powerup;","      }","","      projectile.frames=jt.floor(this.bulletTime*timeMod);","      projectile.framesMax=projectile.frames;  ","","","      player.projectiles.push(projectile);","      angle+=angleAdd;","    }","  }","}","","obj.rainbowFrame=0;","obj.rainbowFrameMax=60;","","obj.getRainbow=function(ratio,alpha){","  if(alpha==undefined){alpha=1;}","  var r=jt.waveYPos(ratio);","  var g=jt.waveYPos(ratio+0.33);","  var b=jt.waveYPos(ratio+0.66);","  return [255*r,255*g,255*b,alpha];","}","","obj.drawPlayer=function(player,self,localIndex,drawX,drawY,newW,newH){ ","  if(drawX!=undefined){player.x=drawX;}","  if(drawY!=undefined){player.y=drawY;}","  ","  var playerW=this.playerW;","  var playerH=this.playerH;  ","  var playerD=this.playerD;    ","  ","  var drawW=this.drawW;","  var drawH=this.drawH;","  ","  var cannonW=this.cannonW;","  var cannonH=this.cannonH;","  ","  var ratioWH=1;","  ","  if(newW!=undefined){","    ratioWH=newW/this.playerW;","    ","    playerW*=ratioWH;","    playerH*=ratioWH;    ","    playerD*=ratioWH;","    ","    drawW*=ratioWH;            ","    drawH*=ratioWH;    ","    ","    cannonW*=ratioWH;            ","    cannonH*=ratioWH;","  }","  ","  if(self==undefined){self=true;}","  var powerup=player.powerup; ","  ","  if(powerup==\"invisible\"){","    if(self && !this.local){","      jt.alpha(0.25);","    }else{","      if(this.local){","        //Draw random dots","        var map=jt.getObject(\"Map\");","        var wh=4;","        jt.alpha(0.25);","        ","        var modX=this.locals[localIndex].modX;","        var modY=this.locals[localIndex].modY;        ","        ","        var oX=player.x%map.ts+playerW/2;","        var oY=player.y%map.ts+playerH/2;  ","        ","        //v1","        for(var y=1;y<map.map.length-1;y++){","          for(var x=1;x<map.map[0].length-1;x++){","            //jt.rotate((player.r),x*map.ts-wh/2+oX-1,y*map.ts-wh/2+oY-1,2,2);","            //jt.clipRect(x*map.ts-wh/2+oX,y*map.ts-wh/2+oY-wh/2,wh,wh)","          \tjt.rect(x*map.ts-wh/2+oX,y*map.ts-wh/2+oY-wh/2,wh,wh*2,player.c,player.r);","            //jt.unclip();","            //jt.rotate(-(player.r),x*map.ts-wh/2+oX-1,y*map.ts-wh/2+oY-1,2,2);","        \t}","        }","        ","        /*","        //v2","        console.log(player.x,map.ts,this.playerW/2,modX,modY);","        for(var y=-this.modMax;y<=this.modMax;y++){","          for(var x=-this.modMax;x<=this.modMax;x++){","            var xx=player.x+x*map.ts+this.playerW/2+modX*map.ts;","            var yy=player.y+y*map.ts+this.playerH/2+modY*map.ts; ","            ","          \tjt.rect(xx-wh/2,yy-wh/2,wh,wh,player.c,player.r);","        \t}","        }","        */","        ","        jt.alpha(1);","      }","      ","      return undefined;","      jt.alpha(0);","    }","  }","  ","  if(player.toxic>0){","    var ratio=(player.toxic/this.toxicMax);","   \tjt.blur(ratio*20) ","    var rev=1-ratio;","    //jt.alpha(rev)","  }","  ","  var diffW=drawW-playerW;","  var diffH=drawH-playerH;  "," \tjt.rect(player.x-diffW/2,player.y-diffH/2,drawW,drawH,player.c,player.r);","  ","  ","  //Draw drill","  if(powerup==\"drill\"){","   \tjt.rotate(player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);","    ","    jt.rotate(45,player.x+playerW/2-1,player.y-playerH/2-1,2,2);","    ","    jt.rect(player.x,player.y-playerH,playerW,playerW,player.c);","    ","    jt.clipRect(player.x,player.y-playerH,playerW,playerH)","    ","    var mult=3;","    var waveX=((jt.frames()*mult)/jt.fps())%mult;","    var ratio=jt.waveX(waveX);","    var num=2;","    var lineW=2;","    var h=(playerH/num)","    var offset=((playerH)*ratio)/num;","    for(var i=-3;i<num;i++){","    \tjt.line(player.x,player.y-playerH+offset+(h*i),player.x+playerW,player.y-playerH+offset+(h*i),lineW,\"black\");","    }","    ","    jt.unclip();","    ","    jt.rotate(-45,player.x+playerW/2-1,player.y-playerH/2-1,2,2);","    ","    jt.rotate(-player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);","  }else if(powerup==\"minigun\"){","    //draw cannon","    jt.rotate(player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);","    jt.rect(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,player.c);","    ","    ","    jt.clipRect(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH)","    ","    var mult=2;","    var waveX=((jt.frames()*mult)/jt.fps())%mult;","    var ratio=jt.waveX(waveX);","    var num=2;","    var lineW=2;","    var w=(cannonW/num)","    var offset=(cannonW*ratio)/num;","    for(var i=-1;i<num;i++){","      //+offset+(w*i)","    \tjt.line(player.x+playerW/2-cannonW/2+offset+(w*i),player.y+playerH/2-cannonH,player.x+playerW/2-cannonW/2+offset+(w*i),player.y+playerH/2,lineW,\"black\");","    }","    //console.log(player.x+this.playerW/2-cannonW/2,player.x+this.playerW/2-cannonW/2,player.y+this.playerH/2-cannonH,player.y+this.playerH/2,lineW,\"orange\")","    ","    jt.unclip();","    ","    ","    jt.rectB(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,\"black\",0,2);  ","    jt.rotate(-player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);","  }else if(powerup==\"shotgun\"){","    //draw cannon","    jt.rotate(player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);","    ","    for(var i=-3;i<=3;i++){","      jt.rotate(i*5,player.x+playerW/2-1,player.y+playerH/2-1,2,2);","      ","    \tjt.rect(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,player.c);","      if(i==-2){","    \t\tjt.rectB(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,\"black\",0,2);","      }else{","       \t//Draw only top, buttom and right part ","        jt.rectB(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,0,\"black\",0,2);","        jt.rectB(player.x+playerW/2-cannonW/2,player.y+playerH/2,cannonW,0,\"black\",0,2);  ","        jt.rectB(player.x+playerW/2+cannonW/2,player.y+playerH/2-cannonH,0,cannonH,\"black\",0,2);","      }","      ","      jt.rotate(-i*5,player.x+playerW/2-1,player.y+playerH/2-1,2,2);","    }","    ","    jt.rotate(-player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);","  }else if(powerup==\"bazooka\"){","    //draw cannon","    jt.rotate(player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);","    ","    //bazooka","    var bulletW=this.bulletW+this.bulletOffset;","    var bulletH=this.bulletH+this.bulletOffset;    ","    jt.rect(player.x+playerW/2-bulletW/2,player.y+playerH/2-cannonH-bulletH/2,bulletW,bulletH,[255,0,0],45);","    ","    jt.rect(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,player.c);    ","    jt.rectB(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,\"black\",0,2);  ","    jt.rotate(-player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);","  }else{","  ","    //draw cannon","    jt.rotate(player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);","    jt.rect(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,player.c);","    jt.rectB(player.x+playerW/2-cannonW/2,player.y+playerH/2-cannonH,cannonW,cannonH,\"black\",0,2);  ","    jt.rotate(-player.r,player.x+playerW/2-1,player.y+playerH/2-1,2,2);","  }","  ","  //draw top circle","  var circleD=12*ratioWH;","  jt.circle(player.x+playerW/2-circleD/2,player.y+playerH/2-circleD/2,circleD,player.c,);  ","  jt.circleB(player.x+playerW/2-circleD/2,player.y+playerH/2-circleD/2,circleD,\"black\",2);","  ","  //Draw poweruptimer on top circle","  jt.fontSize(14);","","  //Draw powerup info","  if(player.powerup!=\"\"){","    //Get powerup info","    var powerupInfo=this.getPowerup(player.powerup);","","    var startX=player.x+playerW/2;","    var startY=player.y+playerH/2;","","    //Draw timer","    var max=60;","","    var framesPer=this.powerupTimerMax/max;","    var powerupTimer=player.powerupTimer;","    if(powerupTimer<0){powerupTimer=0;}","    var timePer=jt.ceil(player.powerupTimer/framesPer)","","    var angled=360/max;","","    var distMin=0;","    var distMax=circleD/2-1;","","    var lineW=2;","","    for(var i=0;i<max;i++){","      if(i<timePer){","        var angle=angled*i; ","        var angleX=jt.angleX(angle);","        var angleY=jt.angleY(angle);","        jt.line(startX+angleX*distMin,startY+angleY*distMin,startX+angleX*distMax,startY+angleY*distMax,lineW,\"white\")","      }","    }","","    //jt.circle(startX,startY,circleD,rainbow);","    //jt.text(powerupInfo.text,startX,startY-jt.fontSize()/2,\"black\",\"center\");","  }","  ","  //Redraw preview of teleport","  if(self && powerup==\"teleport\" && player.projectiles.length>0 && this.getBullet(\"teleport\",localIndex)){","    jt.alpha(0.25)","    var proj=player.projectiles[0];","    ","    var diffW=drawW-playerW;","    var diffH=drawH-playerH;  ","    jt.rect(proj.x-diffW/2,proj.y-diffH/2,drawW,drawH,player.c,player.r);","","    //draw cannon","    jt.rotate(player.r,proj.x+playerW/2-1,proj.y+playerH/2-1,2,2);","    jt.rect(proj.x+playerW/2-cannonW/2,proj.y+playerH/2-cannonH,cannonW,cannonH,player.c);","    jt.rectB(proj.x+playerW/2-cannonW/2,proj.y+playerH/2-cannonH,cannonW,cannonH,\"black\",0,2);  ","    jt.rotate(-player.r,proj.x+playerW/2-1,proj.y+playerH/2-1,2,2);","","    //draw top circle","    var circleD=12;","    jt.circle(proj.x+playerW/2-circleD/2,proj.y+playerH/2-circleD/2,circleD,player.c,);  ","    jt.circleB(proj.x+playerW/2-circleD/2,proj.y+playerH/2-circleD/2,circleD,\"black\",2);","  }","  ","  //jt.circle(player.x,player.y,player.w,[0,255,0,0.5])","  ","  if(player.toxic>0){","   \tjt.resetFilters();","  }","  ","  jt.alpha(1)","}","","obj.endRound=function(delay){","  var client=jt.getObject(\"Client\");","  this.lastDelay=delay;","  ","  ","  client.waitTime=client.waitSecond*60; ","  if(delay){","  \tclient.waitTime+=client.delay; ","  }","  ","  ","  jt.alarm(\"changeRound\",this.endRoundWait);","}","","obj.changeRound=function(){","  var client=jt.getObject(\"Client\");"," \tclient.started=false; ","  client.waitTime=client.waitSecond*60; ","  jt.setView(\"Loading\"); ","  ","  //console.log(jt.alarms()[\"changeRound\"])","  ","  client.clientObj.projectiles=[];","  client.powerups=[];","  ","  if(client.index==0){","    \t//jt.getObject(\"Map\").generate();","      jt.getObject(\"Client\").sendMap();","    ","  }else{","   \tjt.getObject(\"Game\").restart(); ","  }","  ","  if(this.local){","   \t jte.getObject(\"Client\").started=false;    ","    jte.getObject(\"Client\").playing=\"Player1\";        ","    jte.getObject(\"Client\").waitTime=jte.getObject(\"Client\").waitSecond*60;","    jt.setView(\"Loading\"); ","  }","}","","obj.powerups=[","  {id:\"minigun\",text:\"M\",name:\"Minigun\",desc:\"You can shoot multiple bullets\"},  ","  {id:\"shotgun\",text:\"S\",name:\"Shotgun\",desc:\"Shoot 5 bullets in a small arc\"},    ","  {id:\"laser\",text:\"L\",name:\"Laser\",desc:\"Shoot a fast laser beam\"},      ","  {id:\"invisible\",text:\"I\",name:\"Invisible\",desc:\"You become invisible to other players\"},        ","  {id:\"toxic\",text:\"T\",name:\"Toxic\",desc:\"Shoot a radiation cloud that goes through walls and slowly gets bigger\"},          ","  {id:\"teleport\",text:\"Q\",name:\"Quantum\",desc:\"Shoot during your next bullet to teleport to it\"},            ","  {id:\"drill\",text:\"D\",name:\"Drill\",desc:\"Run into walls and tanks to destroy them, but you can't shoot\"},              ","  {id:\"bazooka\",text:\"B\",name:\"Bazooka\",desc:\"Shoot a remote controlled bazooka that explodes on wall, but you can't move\"}, ","];","","obj.getPowerup=function(id){","  for(var i=0;i<this.powerups.length;i++){","   \tif(id==this.powerups[i].id){","     \treturn this.powerups[i]; ","    }","  }","  return undefined;","}","","obj.controls=[","  //{input:\"keyboard\",inputIndex:0,\"left\":\"left\",\"up\":\"up\",\"right\":\"right\",\"down\":\"down\",\"shoot\":\"num0\",\"shoot2\":\"space\"},  ","  //{input:\"gamepad\",inputIndex:0,left:\"dpadLeft\",up:\"dpadUp\",right:\"dpadRight\",down:\"dpadDown\",shoot:\"leftShoulder\",shoot2:\"leftTrigger\"},    ","  ","  {input:\"keyboard\",inputIndex:0,left:\"left\",up:\"up\",right:\"right\",down:\"down\",shoot:\"enter\",shoot2:\"num0\"},    ","  {input:\"keyboard\",inputIndex:0,left:\"a\",up:\"w\",right:\"d\",down:\"s\",shoot:\"e\",shoot2:\"g\"},      ","  {input:\"keyboard\",inputIndex:0,left:\"j\",up:\"i\",right:\"l\",down:\"k\",shoot:\"o\",shoot2:\"è\"},      ","  {input:\"keyboard\",inputIndex:0,left:\"num4\",up:\"num8\",right:\"num6\",down:\"num5\",shoot:\"num9\",shoot2:\"+\"},  ","  ","  {input:\"gamepad\",inputIndex:0,left:\"dpadLeft\",up:\"dpadUp\",right:\"dpadRight\",down:\"dpadDown\",shoot:\"leftShoulder\",shoot2:\"leftTrigger\"},","  {input:\"gamepad\",inputIndex:1,left:\"dpadLeft\",up:\"dpadUp\",right:\"dpadRight\",down:\"dpadDown\",shoot:\"leftShoulder\",shoot2:\"leftTrigger\"},","  ","  {input:\"gamepad\",inputIndex:0,left:\"x\",up:\"y\",right:\"b\",down:\"a\",shoot:\"rightShoulder\",shoot2:\"rightTrigger\"},  ","  {input:\"gamepad\",inputIndex:1,left:\"x\",up:\"y\",right:\"b\",down:\"a\",shoot:\"rightShoulder\",shoot2:\"rightTrigger\"},","]",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","  this.debug();","  ","\t"];obj.JTEupdate=["\t/*Update runs at the fps specified*/","  var local=this.local;","  if(local){","    if(this.alives.length<=0){","\t\t\tjt.delAlarm(\"changeRound\");","      this.changeRound();","    }else if(this.alives.length<=1 && !jt.isAlarm(\"changeRound\")){","       var name=this.alives[0];","      //Add score","      for(var i=0;i<this.locals.length;i++){","       \tif(this.locals[i].clientObj.name==name){","         \tthis.locals[i].clientObj.score++; ","          this.wonId=i;","        }","      }","      ","      this.endRound();","    }","  }","  ","  if(jt.checkAlarm(\"changeRound\",true)){","    this.changeRound();","  }","  ","  var localHost=false;","  var max=this.locals.length;","  ","  var looped=0;","  ","  if(!local){max=1;}","  for(var localI=0;localI<this.locals.length;localI++){","    var localIndex=localI;","    var alive=true;","  \tif(local && localIndex==0){localHost=true;}","    ","    var client=jt.getObject(\"Client\");","    var player=client.clientObj;","    ","    var localClient=client;","    ","    if(local){","      localClient=this.locals[0];","     \tclient=this.locals[localIndex];","      player=client.clientObj;","      ","      if(this.alives.indexOf(player.name)==-1){","       \talive=false;","        //break;","      }","    }else{","      localIndex=undefined;","      if(localI>0){break;}","    }","    ","    ","    var doOnce=true;","    if(local && looped>0){doOnce=false;}","    ","    var left=false;","    var right=false;    ","    var up=false;        ","    var down=false;            ","    var shoot=false;                ","    var shoot2=false;                    ","    var shoot3=false; ","    ","    var shootH=false;                ","    var shoot2H=false;                    ","    var shoot3H=false;","    ","    if(local){","      if(this.controls[localIndex].input==\"keyboard\"){","        left=jt.kCheck(this.controls[localIndex].left); ","        right=jt.kCheck(this.controls[localIndex].right);       ","        up=jt.kCheck(this.controls[localIndex].up);             ","        down=jt.kCheck(this.controls[localIndex].down);                   ","        shoot=jt.kPress(this.controls[localIndex].shoot); ","        shoot2=jt.kPress(this.controls[localIndex].shoot2); ","        //shoot3=jt.kPress(this.controls[localIndex].shoot3); ","","        shootH=jt.kCheck(this.controls[localIndex].shoot); ","        shoot2H=jt.kCheck(this.controls[localIndex].shoot2); ","        //shoot3H=jt.kCheck(this.controls[localIndex].shoot3);  ","      }else{","        var gamepad=this.controls[localIndex].inputIndex;","        if(jt.pConnected(gamepad)){","        ","          left=jt.pCheck(this.controls[localIndex].left,gamepad); ","          right=jt.pCheck(this.controls[localIndex].right,gamepad);       ","          up=jt.pCheck(this.controls[localIndex].up,gamepad);             ","          down=jt.pCheck(this.controls[localIndex].down,gamepad);                   ","          shoot=jt.pPress(this.controls[localIndex].shoot,gamepad); ","          shoot2=jt.pPress(this.controls[localIndex].shoot2,gamepad); ","          //shoot3=jt.kPress(this.controls[localIndex].shoot3); ","","          shootH=jt.pCheck(this.controls[localIndex].shoot,gamepad); ","          shoot2H=jt.pCheck(this.controls[localIndex].shoot2,gamepad);","        }","      }","     \t","    }else{","      var left=jt.kCheck(\"left\");","      var right=jt.kCheck(\"right\");    ","      var up=jt.kCheck(\"up\");        ","      var down=jt.kCheck(\"down\");            ","      var shoot=jt.kPress(\"space\");                ","      var shoot2=jt.kPress(\"num0\");                    ","      var shoot3=jt.kPress(\"enter\"); ","","      var shootH=jt.kCheck(\"space\");                ","      var shoot2H=jt.kCheck(\"num0\");                    ","      var shoot3H=jt.kCheck(\"enter\");","    }","    ","    if(player.powerupTimer%10==0 && player.powerup==\"minigun\"){","     \tif(shootH){shoot=true;} ","     \tif(shoot2H){shoot2=true;}       ","     \tif(shoot3H){shoot3=true;}             ","    }","    ","    ","    ","    var serverObjs=client.serverObjs;","    if(local){","     \tserverObjs=this.localServerObjs(); ","    }","","    var map=jt.getObject(\"Map\");","    var walls=map.walls;","","    if(client.isHost || (local && looped==0)){","      this.powerupWaitTimer++;","      if(this.powerupWaitTimer>this.powerupWaitTimerMax){","        this.powerupWaitTimer=0;","        //Spawn powerup","        var ranY=jt.random(2,map.map.length-2,2)-1;","        var ranX=jt.random(2,map.map[0].length-2,2)-1; ","","        var chosen=jt.choose(this.powerups)","","        var powerup={x:ranX*map.ts,y:ranY*map.ts,w:map.ts,h:map.ts,d:map.ts,id:chosen.id,text:chosen.text};","","        var col=false;","        if(!local){","          for(var i=0;i<client.powerups.length;i++){","            var already=client.powerups[i];","            if(jt.cRect(powerup,already)){","               col=true;","              break;","            }","          }","        }else{","          for(var i=0;i<localClient.powerups.length;i++){","            var already=localClient.powerups[i];","            if(jt.cRect(powerup,already)){","               col=true;","              break;","            }","          }","        }","","        if(!col){","","          if(!local){","          \tclient.socket.emit(\"spawnPowerup\",client.clientObj.lobby,powerup); ","          }","","          this.powerupSpawn=powerup;","          this.powerupSpawnTimer=this.powerupSpawnTimerMax+client.delay;","        }else{","          this.powerupWaitTimer=this.powerupWaitTimerMax-this.powerupWaitTimerRetry; ","        }","      }","    }","    ","    if(!local || (local && looped==0)){","      if(this.powerupSpawnTimer>0){","        this.powerupWaitTimer=0;","        this.powerupSpawnTimer--;","        if(this.powerupSpawnTimer<=0){","          //spawn powerup","          if(local){","            localClient.powerups.push(this.powerupSpawn);","          }else{","            client.powerups.push(this.powerupSpawn);","          }","","        }","      }","    }","","    var playerSpeedMod=1;","","    if(client.clientObj.powerup==\"bazooka\" && this.getBullet(\"explosion\",localIndex)!=undefined){","      //this.powerupTimer=0;","      client.clientObj.powerupTimer=0;      ","    }","","    if(client.clientObj.powerupTimer>0){","      //this.powerupTimer--; ","      client.clientObj.powerupTimer--;       ","      if(client.clientObj.powerup==\"speed\"){","         playerSpeedMod=2;","      }else if(client.clientObj.powerup==\"teleport\"){","         if(client.shot && this.getBullet(\"teleport\",localIndex)==undefined){","           client.shot=false;","           client.clientObj.powerupTimer=0;","         }","      }else if(client.clientObj.powerup==\"toxic\"){","        if(jt.frames()%15==0){","          var projectile={};","          projectile.vX=jt.random(-1,1,0.1)","          projectile.vY=jt.random(-1,1,0.1)","","          var projX=startX+projectile.vX;","          var projY=startY+projectile.vY;  ","","          projectile.x=client.clientObj.x+this.playerW/2;","          projectile.y=client.clientObj.y+this.playerH/2;        ","","          projectile.w=8;    ","          projectile.h=8;  ","          projectile.d=8;        ","","          projectile.c=[150,175,25,0.5];","","          projectile.frames=jt.floor(60);","          projectile.framesMax=jt.floor(60);          ","","          projectile.powerup=\"smoke\";","","","          client.clientObj.projectiles.push(projectile);","        }","      }","    }else{","      client.clientObj.powerup=\"\"; ","    }","","    //Rainbow","    if(doOnce){","      this.rainbowFrame++;","      if(this.rainbowFrame>=this.rainbowFrameMax){","        this.rainbowFrame=0; ","      }","    }","    var rainbowRatio=this.rainbowFrame/this.rainbowFrameMax;","    var rainbowAlpha=this.getRainbow(rainbowRatio,0.5);","    var rainbow=this.getRainbow(rainbowRatio);  ","","    //Draw powerup","    /*","    var ranY=jt.random(2,map.map.length-2,2)-1;","    var ranX=jt.random(2,map.map[0].length-2,2)-1; ","    jt.rect(ranX*map.ts,ranY*map.ts,map.ts,map.ts,\"red\");","","    */","","    //Update player","    var temp={x:client.clientObj.x,y:client.clientObj.y,w:this.playerW,h:this.playerH,d:this.playerD};","    var moveX=0;","    var moveY=0;  ","","","    var canMove=true;","    if(!alive){","     \tcanMove=false; ","    }","    if(this.getBullet(\"bazooka\",localIndex)!=undefined && client.clientObj.powerup==\"bazooka\"){","      canMove=false;","","      //Change direction of projectile","      var proj=client.clientObj.projectiles[client.clientObj.projectiles.length-1];","","      var speed=jt.distP(0,0,proj.vX,proj.vY);","      var angle=jt.angleP(0,0,proj.vX,proj.vY);    ","","      if(left){angle-=this.playerTurn*playerSpeedMod;}","      if(right){angle+=this.playerTurn*playerSpeedMod;}  ","      angle=jt.wrap(angle,0,359)","","      var angleX=jt.angleX(angle);","      var angleY=jt.angleY(angle);","","      client.clientObj.projectiles[client.clientObj.projectiles.length-1].vX=angleX*speed;","      client.clientObj.projectiles[client.clientObj.projectiles.length-1].vY=angleY*speed;   ","","    }","","    if(canMove){","","      if(left){client.clientObj.r-=this.playerTurn*playerSpeedMod;}","      if(right){client.clientObj.r+=this.playerTurn*playerSpeedMod;}  ","      client.clientObj.r=jt.wrap(client.clientObj.r,0,359)","","      var angleX=jt.angleX(client.clientObj.r);","      var angleY=jt.angleY(client.clientObj.r);","","      if(up){","        moveX=angleX*this.playerSpeed*playerSpeedMod;","        moveY=angleY*this.playerSpeed*playerSpeedMod;    ","      }","      if(down){","        moveX=-angleX*this.playerSpeedBack*playerSpeedMod;","        moveY=-angleY*this.playerSpeedBack*playerSpeedMod; ","      } ","    }","","    var col=false;","    ","    temp.x=temp.x+moveX;","    for(var i=0;i<walls.length;i++){","      var wall=walls[i];","      if(jt.cRect(temp,wall)){","        if(temp.x+temp.w/2>wall.x+wall.w/2){","          temp.x=wall.x+wall.w; ","        }else{","          temp.x=wall.x-this.playerW;","        }","        col=true;","        break; ","      }","    }","","    client.clientObj.x=temp.x;     ","","","    col=false;","    ","    temp.y=temp.y+moveY;","    for(var i=0;i<walls.length;i++){","      var wall=walls[i];","      if(jt.cRect(temp,wall)){","        if(temp.y+temp.h/2>wall.y+wall.h/2){","          temp.y=wall.y+wall.h; ","        }else{","          temp.y=wall.y-this.playerH;","        }","        col=true;","        break; ","      }","    }","","    client.clientObj.y=temp.y;  ","    ","","    if(this.playerInvincibility>0){","      this.playerInvincibility--;","    }","","    player.w=this.playerW;","    player.h=this.playerH;  ","    player.d=this.playerD;      ","","    //Shoot","    if(alive){","      if((shoot || shoot2 || shoot3)){","        this.shoot(localIndex);","      }","    }","    ","    if(doOnce){","      //Draw walls","      for(var i=0;i<walls.length;i++){","        var wall=walls[i];","        jt.rect(wall.x,wall.y,wall.w,wall.h,wall.c);","      }","","      //Draw spawns","      for(var i=0;i<map.spawns.length;i++){","        var spawn=map.spawns[i];","        jt.rect(spawn.x,spawn.y,map.ts,map.ts,\"lightblue\");","      }","      ","      //Draw texts","      jt.fontSize(14);","      var padding=2;","      for(var i=0;i<this.texts.length;i++){","        var text=this.texts[i];","        var textW=jt.textW(text.text);","        //text.y-=0.1;","        text.alpha-=1/180;","        //jt.rect(text.x-textW/2-padding,text.y-padding,textW+padding*2,jt.fontSize()+padding*2,[255,255,255,0.5]);","        jt.text(text.text,text.x,text.y-jt.fontSize()/2,[0,0,0,text.alpha],\"center\");","        ","        if(text.alpha<0){","         \tthis.texts.splice(i,1);","          i--;","        }","      }","    }","","    if(jt.debug()){","      var id=\"\"","      if(jt.kPress(1)){id=\"minigun\";}","      if(jt.kPress(2)){id=\"shotgun\";}      ","      if(jt.kPress(3)){id=\"laser\";}            ","      if(jt.kPress(4)){id=\"invisible\";}                  ","      if(jt.kPress(5)){id=\"toxic\";}                        ","      if(jt.kPress(6)){id=\"teleport\";}                              ","      if(jt.kPress(7)){id=\"drill\";}                                    ","      if(jt.kPress(8)){id=\"bazooka\";} ","      ","      if(id!=\"\"){","        var powerupInfo=this.getPowerup(id);","","        client.clientObj.powerupTimer=this.powerupTimerMax;        ","        client.clientObj.powerup=id;","","        client.modX=jt.random(-this.modMax,this.modMax);","        client.modY=jt.random(-this.modMax,this.modMax);     ","      }","    }","    ","    //Check powerup col","    var powerups=client.powerups;","    if(alive){","      if(local){powerups=localClient.powerups;}","      for(var i=0;i<powerups.length;i++){","        var powerup=powerups[i];","        if(jt.cCircle(player,powerup)){","            var padding=0;","           var obj={x:player.x-padding,y:player.y-padding,w:player.w+padding*2,h:player.h+padding*2,d:player.d+padding*2}","","           var powerupInfo=this.getPowerup(powerup.id);","           //get powerup","           //this.powerupTimer=this.powerupTimerMax;","           client.clientObj.powerupTimer=this.powerupTimerMax;        ","          client.clientObj.powerup=powerup.id;","          client.shot=false;","","          this.addText(powerupInfo.name,powerup.x+powerup.w/2,powerup.y+powerup.h/2);","","          if(!local){","           client.socket.emit(\"deletePowerup\",client.clientObj.lobby,obj);","            client.powerups.splice(i,1);","          }else{","            client.modX=jt.random(-this.modMax,this.modMax);","            client.modY=jt.random(-this.modMax,this.modMax);          ","            localClient.powerups.splice(i,1);","          }","","          i--;","        }","      }","","      jt.camActive(false);","      jt.fontSize(20);","","      if(!local){","        //Draw powerup info","        if(client.clientObj.powerup!=\"\"){","          //Get powerup info","          var powerupInfo=this.getPowerup(client.clientObj.powerup);","","          var startX=map.tsUi;","          var startY=jt.h()-map.tsUi-map.tsUi/2;","","          //Draw timer","          var max=60;","","          var framesPer=this.powerupTimerMax/max;","          var powerupTimer=client.clientObj.powerupTimer;","          if(powerupTimer<0){powerupTimer=0;}","          var timePer=jt.ceil(client.clientObj.powerupTimer/framesPer)","","          var angled=360/max;","","          var distMin=1;","          var distMax=map.tsUi*0.75;","","          var lineW=4;","","          for(var i=0;i<max;i++){","            if(i<timePer){","              var angle=angled*i; ","              var angleX=jt.angleX(angle);","              var angleY=jt.angleY(angle);","              jt.line(startX+map.tsUi/2+angleX*distMin,startY+map.tsUi/2+angleY*distMin,startX+map.tsUi/2+angleX*distMax,startY+map.tsUi/2+angleY*distMax,lineW,\"white\")","            }","          }","","          jt.circle(startX,startY,map.tsUi,rainbow);","          jt.text(powerupInfo.text,startX+map.tsUi/2,startY+map.tsUi/2-jt.fontSize()/2,\"black\",\"center\");","","          startX+=map.tsUi*1.5;","          var name=powerupInfo.name;","          var desc=powerupInfo.desc;    ","          jt.text(name+\": \"+desc,startX,startY,\"white\",\"left\",jt.fontSize(),0,60,jt.fontSize());","        }","      }","    }","","    jt.camActive(true);","    var fs=20;","    jt.fontSize(jt.floor(20/map.size));","    //Draw powerups","    if(doOnce){","      for(var i=0;i<powerups.length;i++){","        var powerup=powerups[i];","        jt.circle(powerup.x,powerup.y,powerup.w,rainbowAlpha);","        jt.text(powerup.text,powerup.x+powerup.w/2,powerup.y+powerup.h/2-fs/2,\"black\",\"center\");","      }","    }","","    //Draw laser sight","    if(client.clientObj.powerup==\"laser\" && alive){","      var bulletWHRate=this.laserWHRate;","      var bulletOffset=this.laserOffset;","","      var angle=client.clientObj.r;","","      var cannonX=this.cannonH/2*jt.angleX(angle);","      var cannonY=this.cannonH/2*jt.angleY(angle);    ","","      var startX=client.clientObj.x+client.clientObj.w/2-this.laserW/2+cannonX;","      var startY=client.clientObj.y+client.clientObj.h/2-this.laserH/2+cannonY; ","","      var time=jt.floor((this.bulletTime*this.laserTimeMod)*1)+this.laserMax*1;","      var speed=(this.bulletSpeed*this.laserSpeedMod)/1;","","      var x=startX;","      var y=startY;    ","","      var vX=jt.angleX(angle)*speed;","      var vY=jt.angleY(angle)*speed;","","      var alpha=1;","      var alphaRate=-1/time;","","      for(var i=0;i<time;i++){","        //check collisions","        var proj={x:x,y:y,w:this.laserW,h:this.laserH};","        proj.w+=bulletWHRate;","        proj.h+=bulletWHRate;","        proj.x-=bulletWHRate/2;","        proj.y-=bulletWHRate/2;    ","","        proj.x+=vX;","        for(var j=0;j<walls.length;j++){","          var wall=walls[j];","          if(jt.cRect(proj,wall)){","            //col=true;","            if(vX>=0){","              proj.x=wall.x-proj.w;","            }else{","              proj.x=wall.x+wall.w;","            }","            vX*=-1","            break; ","          }","        }","","        proj.y+=vY; ","        for(var j=0;j<walls.length;j++){","          var wall=walls[j];","          if(jt.cRect(proj,wall)){","            //col=true;","            if(vY>=0){","              proj.y=wall.y-proj.h;","            }else{","              proj.y=wall.y+wall.h;","            }","            vY*=-1","            break; ","          }","        }","","        //Draw laser","        jt.line(x,y,proj.x,proj.y,this.laserW,[255,0,0,alpha],0);","","        x=proj.x;","        y=proj.y;    ","","        alpha+=alphaRate;","      }","    }","","    //Drill (add bullet)","    if(player.powerup==\"drill\" && alive){","      var angle=player.r;","      var angleX=jt.angleX(angle);","      var angleY=jt.angleY(angle);     ","","      var startX=player.x;","      var startY=player.y;     ","","      var drillX=startX+((this.drawW/2+player.w/2)*angleX);","      var drillY=startY+((this.drawH/2+player.w/2)*angleY);","","      var drillD=player.w;","      ","      var padding=4;","","      var drill={x:drillX-padding,y:drillY-padding,w:drillD+padding*2,h:drillD+padding*2,d:drillD+padding*2,c:[0,0,0,0],powerup:\"drill\",frames:3,vX:0,vY:0};","","      //jt.circle(drill.x,drill.y,drill.d,[255,0,0,0.5]);","      player.projectiles.push(drill);","      var sent=false;","","      for(var i=0;i<walls.length;i++){","        var wall=walls[i];","        if(jt.cCircleRect(drill,wall) && !wall.invincible){","          walls.splice(i,1)","          i--;","","          if(!local && !sent){","            sent=true;","          \tclient.socket.emit(\"deleteWall\",client.clientObj.lobby,drill);    ","          }","          ","          //break;","        }","      }","    }","","    //Bullets","    col=false;","    for(var i=0;i<player.projectiles.length;i++){","      var proj=player.projectiles[i];","      var explosion=undefined;","","      player.projectiles[i].frames--;","      if(player.projectiles[i].frames>0){","","","        var bulletWHRate=this.bulletWHRate;","        var bulletOffset=this.bulletOffset;","        ","        var safe=false;","        if(proj.powerup==\"smoke\"){","         \tsafe=true; ","          proj.c[3]-=0.01;","        }","","        if(proj.powerup==\"laser\"){","          bulletWHRate=this.laserWHRate; ","          bulletOffset=this.laserOffset;         ","        }","","        if(proj.powerup==\"teleport\"){","          bulletOffset=this.teleportOffset;         ","        }","","        if(proj.powerup==\"explosion\"){","          bulletOffset=this.explosionOffset; ","          var sent=false;","          if(proj.frames>=proj.framesMax-1){","            for(var j=0;j<walls.length;j++){","              var wall=walls[j];","              if(jt.cCircleRect(proj,wall) && !wall.invincible){","                walls.splice(j,1)","                j--;","","                if(!local && !sent){","                  sent=true;","                  client.socket.emit(\"deleteWall\",client.clientObj.lobby,proj);    ","                }","","              }","            }","          }","        }","        ","        if(proj.powerup==\"toxic\" || proj.powerup==\"smoke\"){","          proj.x-=this.ghostWHRate/2;         ","          proj.y-=this.ghostWHRate/2;                   ","          proj.w+=this.ghostWHRate;                             ","          proj.h+=this.ghostWHRate;                                       ","          proj.d+=this.ghostWHRate;                                                 ","        }","        ","        if(proj.powerup==\"toxic\"){","         \tif(proj.frames%5==0){","            var projectile={};","            projectile.vX=jt.random(-1,1,0.1)","            projectile.vY=jt.random(-1,1,0.1)","","","            projectile.x=proj.x+proj.w/2+jt.random(-proj.w/2,proj.w/2);","            projectile.y=proj.y+proj.h/2+jt.random(-proj.h/2,proj.h/2);        ","","            projectile.w=8;    ","            projectile.h=8;  ","            projectile.d=8;        ","","            projectile.c=[150,175,25,0.5];","","            projectile.frames=jt.floor(60);","","            projectile.powerup=\"smoke\";","","","            client.clientObj.projectiles.push(projectile);","          } ","        }","","","        var checkCol=true;","        if(proj.powerup==\"toxic\" || proj.powerup==\"drill\" || proj.powerup==\"explosion\" || proj.powerup==\"smoke\"){","          checkCol=false;","        }","","        var col=false;","","        proj.x+=proj.vX;","        if(checkCol){","          for(var j=0;j<walls.length;j++){","            var wall=walls[j];","            if(jt.cRect(proj,wall)){","              //col=true;","              if(proj.vX>=0){","                proj.x=wall.x-proj.w-1;","              }else{","                proj.x=wall.x+wall.w+1;","              }","              proj.vX*=-1","","              col=true;","              break; ","            }","          }","        }","","        proj.y+=proj.vY; ","        if(checkCol){","          for(var j=0;j<walls.length;j++){","            var wall=walls[j];","            if(jt.cRect(proj,wall)){","              //col=true;","              if(proj.vY>=0){","                proj.y=wall.y-proj.h-1;","              }else{","                proj.y=wall.y+wall.h+1;","              }","              proj.vY*=-1","","              col=true;","              break; ","            }","          }","        }","        ","        proj.d+=bulletWHRate;","        proj.w+=bulletWHRate;        ","        proj.h+=bulletWHRate;","        proj.x-=bulletWHRate/2;","        proj.y-=bulletWHRate/2; ","","        if(proj.powerup==\"bazooka\"){","           //draw line","          var angle=jt.angleP(0,0,proj.vX,proj.vY);","          jt.rotate(angle,proj.x,proj.y,proj.w,proj.h);","          //jt.rotate(45,proj.x,proj.y,proj.w,proj.h);        ","          jt.rect(proj.x-bulletOffset,proj.y-proj.h/2-bulletOffset,proj.w+bulletOffset*2,proj.h+bulletOffset*2,proj.c,45);","          jt.rect(proj.x,proj.y,proj.w,proj.h,proj.c);        ","          jt.rect(proj.x,proj.y+proj.h/2,proj.w,proj.h,proj.c);                ","          //jt.rotate(-45,proj.x,proj.y,proj.w,proj.h);             ","          jt.rotate(-angle,proj.x,proj.y,proj.w,proj.h);                ","        }else if(powerup==\"teleport\"){","          jt.circle(proj.x-bulletOffset,proj.y-bulletOffset,proj.w+bulletOffset*2,proj.c);","        }else{","          jt.circle(proj.x-bulletOffset,proj.y-bulletOffset,proj.w+bulletOffset*2,proj.c);","        }","","        if(proj.powerup==\"laser\" && i-1>=0){","           //draw line","          var before=player.projectiles[i-1];","          if(jt.distP(proj.x,proj.y,before.x,before.y)<=9){","          \tjt.line(proj.x+proj.w/2,proj.y+proj.h/2,before.x+before.w/2,before.y+before.h/2,this.laserW+bulletOffset*2,[255,0,0]);","          }","        }","        jt.alpha(1);","","        client.clientObj.projectiles[i]=proj;","        ","        var deleted=false;","        ","        //jt.rect(proj.x,proj.y,proj.w,proj.h,[255,0,0,0.5]);","        //jt.circle(proj.x,proj.y,proj.d,[255,0,0,0.5]);        ","        ","        if(jt.cRectCircle(player,proj) && player.projectiles[i].frames<player.projectiles[i].framesMax-this.bulletTimeBuffer && this.playerInvincibility<=0 && proj.powerup!=\"drill\" && !safe){","          //console.log(proj.powerup);","          if(proj.powerup==\"toxic\"){","            player.toxic+=2;","          }else{","            if(!local){","              this.respawn(true);","","              //this.endRound(true); ","              client.dead=true;","              if(client.isHost){","                client.checkDead(); ","              }else{","                client.socket.emit(\"dead\",client.host);  ","              }","","              client.clientObj.x=jt.w()/2+((client.index*2)-1)*999","            }else{","","              this.respawn(true,localIndex);","","              player.x=jt.w()/2+((client.index*2)-1)*999","","              this.alives.splice(this.alives.indexOf(player.name),1);","            }","","            if(proj.powerup==\"explosion\"){","              ","            }else{","              client.clientObj.projectiles.splice(i,1);","              i--;","","              deleted=true;","              break;","            }","          }","        }else{","          if(proj.powerup==\"bazooka\" && col){","            //Spawn explosion","            var explosion=this.getExplosion(proj);","","            client.clientObj.projectiles.splice(i,1);","            i--;","","","            deleted=true;","          } ","        }","        ","        //delete if outside map","        if(!checkCol){","          if(proj.x<-proj.w || proj.x>map.ww || proj.y<-proj.h || proj.y>map.hh){","            deleted=true;","            client.clientObj.projectiles.splice(i,1);","          \ti--;","          }       ","        }","        ","        if(!deleted){","          proj.w-=bulletWHRate;","          proj.h-=bulletWHRate;","          proj.x+=bulletWHRate/2;","          proj.y+=bulletWHRate/2; ","        }","      }else{","        col=true; ","","        if(proj.powerup==\"bazooka\"){","          var explosion=this.getExplosion(proj);","        }","","        client.clientObj.projectiles.splice(i,1);","        i--;","        deleted=true;","      }","","      if(explosion!=undefined){","        player.projectiles.push(explosion); ","      }","    }","","    if(col){","      ","    }","","    //Draw player","    if(alive){","    \tthis.drawPlayer(player,true,localIndex);","    }","      ","    //Draw scores","    //jt.fontSize(jt.ceil(14/map.size));","    jt.fontSize(14);    ","    jt.camActive(false);","    if(!local){","    \t//jt.text(client.clientObj.name+\"(You): \"+player.score,5,5,\"white\",\"left\");","    }else{","      if(looped==0){","       \tfor(var i=0;i<this.locals.length;i++){","          var y=2;","          var x=(i*(jt.w()/4))+5;","          if(i>=4){","            x=((i-4)*(jt.w()/4))+5;","             y=2+jt.fontSize();","          }","          ","          var flashing=false;","          if(this.wonId==i){","            if(jt.floor(jt.frames()/10)%2==0){","              flashing=true; ","            }","          }","","          if(!flashing){","            jt.text(this.locals[i].clientObj.name+\": \"+this.locals[i].clientObj.score,x,y,\"white\",\"left\");","          }","","          ","        }","      }","      ","    }","    jt.camActive(true);","    ","    ","    //Draw name + powers","    jt.fontSize(jt.ceil(14/map.size));","    var text=player.name;","","    if(player.powerup!=\"\"){","      var powerup=this.getPowerup(player.powerup);","      text+=\"-\"+powerup.text;","    }","","    var textW=jt.textW(text);","    var margin=2;","","    if(player.powerup!=\"invisible\"){","      jt.rect(player.x+this.playerW/2-textW/2-margin,player.y-jt.fontSize()-margin,textW+margin*2,jt.fontSize()+margin*2,[255,255,255,0.5])","      jt.text(text,player.x+this.playerW/2,player.y-jt.fontSize(),\"black\",\"center\");","    }","","","    //Draw players","    var keys=Object.keys(serverObjs);","    var len=Object.keys(serverObjs).length;","    var index=1;","","    var drill=undefined;","","    for (var i = 0; i < len; i++) {","      var other = serverObjs[keys[i]];","      if(local){other=serverObjs[keys[i]].clientObj}","      if(local && client.clientObj.name==other.name){continue;}","      var dead=false;","      if(client.withs.indexOf(keys[i])!=-1 || local){","","","        //Bullets","        for(var j=0;j<other.projectiles.length;j++){","          var proj=other.projectiles[j];    ","          ","          var safe=false;","          if(proj.powerup==\"smoke\"){","            safe=true;       ","          }","","          var bulletWHRate=this.bulletWHRate;","          var bulletOffset=this.bulletOffset;        ","","          if(proj.powerup==\"laser\"){","            bulletWHRate=this.laserWHRate; ","            bulletOffset=this.laserOffset;         ","          }","","          if(proj.powerup==\"teleport\"){","            bulletOffset=this.teleportOffset;         ","          }","","          var col=false;","          ","          proj.d+=bulletWHRate;","          proj.w+=bulletWHRate;        ","          proj.h+=bulletWHRate;","          proj.x-=bulletWHRate/2;","          proj.y-=bulletWHRate/2; ","","          if(!safe){","            if(jt.cCircle(player,proj)){","              col=true;","            }else{","              proj.x+=proj.vX;","              proj.y+=proj.vY; ","              if(jt.cCircle(player,proj)){","                col=true; ","              }","              proj.x-=proj.vX;","              proj.y-=proj.vY; ","            }","          }","          ","          if(col && proj.powerup==\"toxic\"){","            player.toxic+=2;","            col=false;","          }","          ","          if(col && player.powerup==\"drill\" && proj.powerup==\"explosion\"){","            player.powerupTimer++;","            col=false;","          }","","          if(!local){","            if(proj.powerup==\"bazooka\"){","             //draw line","              var angle=jt.angleP(0,0,proj.vX,proj.vY);","              jt.rotate(angle,proj.x,proj.y,proj.w,proj.h);","              //jt.rotate(45,proj.x,proj.y,proj.w,proj.h);        ","              jt.rect(proj.x-bulletOffset,proj.y-proj.h/2-bulletOffset,proj.w+bulletOffset*2,proj.h+bulletOffset*2,proj.c,45);","              jt.rect(proj.x,proj.y,proj.w,proj.h,proj.c);        ","              jt.rect(proj.x,proj.y+proj.h/2,proj.w,proj.h,proj.c);                ","              //jt.rotate(-45,proj.x,proj.y,proj.w,proj.h);             ","              jt.rotate(-angle,proj.x,proj.y,proj.w,proj.h);                ","            }else{","              jt.circle(proj.x-bulletOffset,proj.y-bulletOffset,proj.w+bulletOffset*2,proj.c);","            }","            //jt.circle(proj.x-bulletOffset,proj.y-bulletOffset,proj.w+bulletOffset*2,proj.c);","","            if(proj.powerup==\"laser\" && i-1>=0){","               //draw line","              var before=other.projectiles[i-1];","              jt.line(proj.x+proj.w/2,proj.y+proj.h/2,before.x+before.w/2,before.y+before.h/2,this.laserW,[255,0,0]);","            }","          }","","          if(col){","            var padding=8;","            var obj={x:player.x-padding,y:player.y-padding,w:player.w+padding*2,h:player.h+padding*2,d:player.d+padding*2}","","            if(proj.powerup==\"toxic\" || proj.powerup==\"explosion\"){","              //dont destroy","            }else{","              if(!local){","                client.socket.emit(\"deleteProjectile\",keys[i],obj);    ","              }else{","                other.projectiles.splice(j,1);","              }","            }","            ","            dead=true;","            break;","","          }","        }","","        if(dead){","          if(!local){","            this.respawn(true);","","            //this.endRound(true); ","            client.dead=true;","            if(client.isHost){","              client.checkDead(); ","            }else{","              client.socket.emit(\"dead\",client.host);  ","            }","","            client.clientObj.x=jt.w()/2+((client.index*2)-1)*999","          }else{","            ","            this.respawn(true,client.index);","            ","            player.x=jt.w()/2+((client.index*2)-1)*999","            ","            this.alives.splice(this.alives.indexOf(player.name),1);","          }","        }","","        if(!local){","        \tthis.drawPlayer(other,false);","          ","        }","","        jt.fontSize(jt.ceil(14/map.size));","","        var text=other.name;","","        if(other.powerup!=\"\"){","          var powerup=this.getPowerup(other.powerup);","          text+=\"-\"+powerup.text;","        }","","        var textW=jt.textW(text);","        var margin=2;","","        if(!local){","          if(other.powerup!=\"invisible\"){","            jt.rect(other.x+this.playerW/2-textW/2-margin,other.y-jt.fontSize()-margin,textW+margin*2,jt.fontSize()+margin*2,[255,255,255,0.5])","            jt.text(text,other.x+this.playerW/2,other.y-jt.fontSize(),\"black\",\"center\");","          }","          jt.fontSize(14);","          jt.camActive(false);","          ","          if(i==0){","            var y=2;","            var x=(i*(jt.w()/4))+5;","            ","            var flashing=false;","            if(client.wonId==client.socketId){","              if(jt.floor(jt.frames()/10)%2==0){","                flashing=true; ","              }","            }","","            if(!flashing){","              jt.text(client.clientObj.name+\": \"+client.clientObj.score,x,y,\"white\",\"left\");","            }","            ","            ","          }","          ","          var index=i+1;","","          var y=2;","          var x=(index*(jt.w()/4))+5;","          if(index>=4){","            x=((index-4)*(jt.w()/4))+5;","             y=2+jt.fontSize();","          }","          ","          ","          var flashing=false;","          if(client.wonId==client.socketId){","            if(jt.floor(jt.frames()/10)%2==0){","              flashing=true; ","            }","          }","","          if(!flashing){","            jt.text(other.name+\": \"+other.score,x,y,\"white\",\"left\");","          }","          ","          ","","          jt.camActive(true);","","          index++;","        }","      }","    }","    ","    if(player.toxic>0){","     \tplayer.toxic--; ","      if(player.toxic>=this.toxicMax){","        player.toxic=this.toxicMax;","       \t if(!local){","           this.respawn(true);","","           //this.endRound(true); ","           client.dead=true;","           if(client.isHost){","             client.checkDead(); ","           }else{","             client.socket.emit(\"dead\",client.host);  ","           }","","           client.clientObj.x=jt.w()/2+((client.index*2)-1)*999","         }else{","","           this.respawn(true,localIndex);","","           player.x=jt.w()/2+((client.index*2)-1)*999","","           this.alives.splice(this.alives.indexOf(player.name),1);","         }","      }","    }","    ","    ","    ","    ","    looped++;","  }","  ","\tjt.drawObject(this);"];jte.objects.push(obj);var obj=new JTEObject(610,-130,310,110,[255,127,0],0,1,'{"text":"Map","size":128,"font":"Consolas","align":"left"}',true,'Game','[""]',false,157,'Map');/*Attributes and methods go here*/
obj.map=undefined;
obj.divides=[];
obj.walls=[];

obj.tsUi=32;
obj.ts=32;
obj.wallWH=4;

obj.ww=0;
obj.hh=0;
obj.size=1;

obj.spawns=[{x:0,y:0,sort:0,r:0},{x:1,y:1,sort:1,r:0},{x:2,y:2,sort:2,r:0},{x:3,y:3,sort:3,r:0},{x:0,y:0,sort:0,r:0},{x:1,y:1,sort:1,r:0},{x:2,y:2,sort:2,r:0},{x:3,y:3,sort:3,r:0}];

obj.generate=function(){
  this.ts=32;
  this.tsUi=this.ts;
  //console.log(this.ts);
  var ts=this.ts;
  
 	this.size=jt.choose([0.6,0.8,1,1.2,1.4]);//[0.6,0.8,1,1.2,1.4]
  
  //change size on number of players
  var players=1;
  var game=jt.getObject("Game");
  if(game.local){
    players=game.locals.length;
  }else{
    players=jt.getObject("Client").withs.length;
  }
  
  if(players<=2){
    this.size=jt.choose([0.6,0.8,1]);
  }else if(players<=4){
    this.size=jt.choose([0.6,0.8,1,1.2]);
  }else{
    this.size=jt.choose([0.8,1,1.2,1.4]);
  }
  
  //this.size=0.8;
  
  var size=this.size;
  
  var modSpawnX=0;
  var modSpawnY=0;  
  
  if(size==0.6){modSpawnX=1; }
  if(size==0.8){modSpawnX=1;}
  if(size==1.2){modSpawnY=1;}  
  if(size==1.4){modSpawnX=1;modSpawnY=-1;}    
  
  this.ww=jt.w()*size;
  this.hh=jt.h()*size;  
  
  var mapW=jt.floor((this.ww)/ts);
  var mapH=jt.floor((this.hh)/ts); 
  
  if(this.size>1){
   	mapH-=2; 
  }
  
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
  this.spawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:135})
  
  //bottom right
  var ranY=this.map.length-2;
  var ranX=this.map[0].length-2;
  this.spawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:315})
  
  //top right
  var ranY=1;
  var ranX=this.map[0].length-2;
  this.spawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:225})
  
  //bottom left
  var ranY=this.map.length-2;
  var ranX=1; 
  this.spawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:45})
  
  this.spawns.sort(function(a,b){return a.sort-b.sort;})
  
  var randomSpawns=[];
  //top (5+ players)
  var ranY=1;
  var ranX=jt.ceil((this.map[0].length-3)/2)+modSpawnX;
  randomSpawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:180})

  //bottom
  var ranY=this.map.length-2;
  var ranX=jt.ceil((this.map[0].length-3)/2)+2+modSpawnX;
  randomSpawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:0})

  //left
  var ranY=jt.ceil((this.map.length-2)/2)+modSpawnY;
  var ranX=1;  
  randomSpawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:90})

  //right
  var ranY=jt.ceil((this.map.length-2)/2)+2+modSpawnY;
  var ranX=this.map[0].length-2;
  randomSpawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:270})

  randomSpawns.sort(function(a,b){return a.sort-b.sort;})
  
  this.spawns=this.spawns.concat(randomSpawns);
  
  
  
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
      var tsUi=this.tsUi;    
      /*
      if(tsUi<ts){
       	tsUi=ts; 
      }
      */
      var wh=this.wallWH;
      var mg=jt.ceil((ts-wh)/2);

      this.walls=[];
      this.addWall(0,0,this.ww,tsUi,"black",true);
      this.addWall(0,0,tsUi,this.hh,"black",true);
      this.addWall(this.ww-tsUi-remW*tsUi,0,tsUi+remW*tsUi,this.hh,"black",true);
      this.addWall(0,(this.map.length-1)*tsUi,this.ww,tsUi*4,"black",true);
      
      //this.addWall(0,this.hh-tsUi-remH*tsUi,this.ww,tsUi+remH*tsUi);      
      
      //remove random walls
      var removeWalls=jt.random(jt.floor(2*size),jt.floor(12*size));
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

obj.addWall=function(x,y,w,h,c,invincible){
  if(invincible==undefined){
   	invincible=false; 
  }
  if(c==undefined){
    c="black";
  }
  this.walls.push({x:x,y:y,w:w,h:h,c:c,invincible:invincible});
}

;
obj.setup=function(){	/*Setup runs once when the game starts*/
	this.ww=jt.w();
	this.hh=jt.h();  
};obj.update=function(){	/*Update runs at the fps specified*/

	//jt.drawObject(this);
};obj.JTEcode=["/*Attributes and methods go here*/","obj.map=undefined;","obj.divides=[];","obj.walls=[];","","obj.tsUi=32;","obj.ts=32;","obj.wallWH=4;","","obj.ww=0;","obj.hh=0;","obj.size=1;","","obj.spawns=[{x:0,y:0,sort:0,r:0},{x:1,y:1,sort:1,r:0},{x:2,y:2,sort:2,r:0},{x:3,y:3,sort:3,r:0},{x:0,y:0,sort:0,r:0},{x:1,y:1,sort:1,r:0},{x:2,y:2,sort:2,r:0},{x:3,y:3,sort:3,r:0}];","","obj.generate=function(){","  this.ts=32;","  this.tsUi=this.ts;","  //console.log(this.ts);","  var ts=this.ts;","  "," \tthis.size=jt.choose([0.6,0.8,1,1.2,1.4]);//[0.6,0.8,1,1.2,1.4]","  ","  //change size on number of players","  var players=1;","  var game=jt.getObject(\"Game\");","  if(game.local){","    players=game.locals.length;","  }else{","    players=jt.getObject(\"Client\").withs.length;","  }","  ","  if(players<=2){","    this.size=jt.choose([0.6,0.8,1]);","  }else if(players<=4){","    this.size=jt.choose([0.6,0.8,1,1.2]);","  }else{","    this.size=jt.choose([0.8,1,1.2,1.4]);","  }","  ","  //this.size=0.8;","  ","  var size=this.size;","  ","  var modSpawnX=0;","  var modSpawnY=0;  ","  ","  if(size==0.6){modSpawnX=1; }","  if(size==0.8){modSpawnX=1;}","  if(size==1.2){modSpawnY=1;}  ","  if(size==1.4){modSpawnX=1;modSpawnY=-1;}    ","  ","  this.ww=jt.w()*size;","  this.hh=jt.h()*size;  ","  ","  var mapW=jt.floor((this.ww)/ts);","  var mapH=jt.floor((this.hh)/ts); ","  ","  if(this.size>1){","   \tmapH-=2; ","  }","  ","  var remW=0;","  var remH=0;  ","  ","  if(mapW%2==0){mapW--;remW=1;}","  if(mapH%2==0){mapH--;remH=1;}  ","  ","  this.map=jt.matrix(mapW,mapH,0);","  ","  //Add dividers / edges","  for(var y=0;y<this.map.length;y++){","    for(var x=0;x<this.map[y].length;x++){","      if((x==this.map[y].length-1 || y==this.map.length-1) || (x%2==0 || y%2==0)){","        this.map[y][x]=1;","        if(!(x%2==0 && y%2==0) && x>0 && x<this.map[y].length-1 && y>0 && y<this.map.length-1){","          this.divides.push([x,y])","        }","      }","    }","  }","  ","  //Get spawns","  var broke=false;","  this.spawns=[];","  ","  //top left","  var ranY=1;","  var ranX=1;  ","  this.spawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:135})","  ","  //bottom right","  var ranY=this.map.length-2;","  var ranX=this.map[0].length-2;","  this.spawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:315})","  ","  //top right","  var ranY=1;","  var ranX=this.map[0].length-2;","  this.spawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:225})","  ","  //bottom left","  var ranY=this.map.length-2;","  var ranX=1; ","  this.spawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:45})","  ","  this.spawns.sort(function(a,b){return a.sort-b.sort;})","  ","  var randomSpawns=[];","  //top (5+ players)","  var ranY=1;","  var ranX=jt.ceil((this.map[0].length-3)/2)+modSpawnX;","  randomSpawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:180})","","  //bottom","  var ranY=this.map.length-2;","  var ranX=jt.ceil((this.map[0].length-3)/2)+2+modSpawnX;","  randomSpawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:0})","","  //left","  var ranY=jt.ceil((this.map.length-2)/2)+modSpawnY;","  var ranX=1;  ","  randomSpawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:90})","","  //right","  var ranY=jt.ceil((this.map.length-2)/2)+2+modSpawnY;","  var ranX=this.map[0].length-2;","  randomSpawns.push({x:ranX*ts,y:ranY*ts,sort:Math.random(),r:270})","","  randomSpawns.sort(function(a,b){return a.sort-b.sort;})","  ","  this.spawns=this.spawns.concat(randomSpawns);","  ","  ","  ","  //Add sets","  var sets=2;","  for(var y=0;y<this.map.length;y++){","    for(var x=0;x<this.map[y].length;x++){","      if(this.map[y][x]==0){","        this.map[y][x]=sets;","        sets++;","      }","    }","  }","  ","  ","  //Generate","  var step=999;","  var finished=false;","  var index=0;","","  while(!finished){","    var x=-1;","    var y=-1;","    var randomIndex=-1;","    var randomWall=undefined;","","    if(this.divides.length>0){","      //choose a starting spot","      randomIndex=jt.random(this.divides.length-1);","      randomWall=this.divides[randomIndex];","","      x=randomWall[0];","      y=randomWall[1];","    }else{","      finished=true;","","      //console.log(\"thinning walls\");","","      //Remove dividers for walls","      var ts=this.ts;","      var tsUi=this.tsUi;    ","      /*","      if(tsUi<ts){","       \ttsUi=ts; ","      }","      */","      var wh=this.wallWH;","      var mg=jt.ceil((ts-wh)/2);","","      this.walls=[];","      this.addWall(0,0,this.ww,tsUi,\"black\",true);","      this.addWall(0,0,tsUi,this.hh,\"black\",true);","      this.addWall(this.ww-tsUi-remW*tsUi,0,tsUi+remW*tsUi,this.hh,\"black\",true);","      this.addWall(0,(this.map.length-1)*tsUi,this.ww,tsUi*4,\"black\",true);","      ","      //this.addWall(0,this.hh-tsUi-remH*tsUi,this.ww,tsUi+remH*tsUi);      ","      ","      //remove random walls","      var removeWalls=jt.random(jt.floor(2*size),jt.floor(12*size));","      for(var i=0;i<removeWalls;i++){","        var ranY=jt.random(2,this.map.length-4,2);","        var ranX=jt.random(2,this.map[0].length-4,2);     ","        ","      \tif(this.map[ranY][ranX]==1){","         \tthis.map[ranY][ranX]=0; ","         \tthis.map[ranY-1][ranX]=0;           ","         \tthis.map[ranY+1][ranX]=0;                     ","         \tthis.map[ranY][ranX-1]=0;                               ","         \tthis.map[ranY][ranX+1]=0;                                         ","          ","         \t//this.map[ranY][ranX+1]=0;                     ","         \t//this.map[ranY+1][ranX+1]=0;                               ","        }","      }","      ","      ","      for(var y=0;y<this.map.length;y++){","        for(var x=0;x<this.map[y].length;x++){","          if(this.map[y][x]==1 && x>0 && x<this.map[0].length-1 && y>0 && y<this.map.length-1){","            var left=this.isXY(x-1,y,1);","            var right=this.isXY(x+1,y,1);","            var up=this.isXY(x,y-1,1);","            var down=this.isXY(x,y+1,1);","","            if(!left && !up & !right && !down){","              //no wall","            }else{","              //check all cases","              if(left){","                this.addWall(x*ts,y*ts+mg,ts/2+wh/2,wh);","              }","","              if(right){","                this.addWall(x*ts+ts/2-wh/2,y*ts+mg,ts/2+wh/2,wh);","              }","","              if(up){","                this.addWall(x*ts+mg,y*ts,wh,ts/2+wh/2);","              }","","              if(down){","                this.addWall(x*ts+mg,y*ts+ts/2-wh/2,wh,ts/2+wh/2);","              }","            }","          }","        }","      }","    }","","    if(randomWall!=undefined){","      var left=this.getXY(x-1,y);","      var right=this.getXY(x+1,y);","      var up=this.getXY(x,y-1);","      var down=this.getXY(x,y+1);","","      var dirs=[left,up,right,down];","","      //check horizontal/vertical priority","      var del=false;","      if(jt.random(0,1)==0){","        if(left>1 && right>1){","          if(left!=right){","            this.map[y][x]=left;","            this.changeSet(right,left);","            this.divides.splice(randomIndex,1);","            del=true;","          }","        }","        if(!del){","          if(up>1 && down>1){","            if(up!=down){","              this.map[y][x]=up;","              this.changeSet(down,up);","              this.divides.splice(randomIndex,1);","              del=true;","            }","          }","        }","      }else{","        if(up>1 && down>1){","          if(up!=down){","            this.map[y][x]=up;","            this.changeSet(down,up);","            this.divides.splice(randomIndex,1);","            del=true;","          }","        }","        if(!del){","          if(left>1 && right>1){","            if(left!=right){","              this.map[y][x]=left;","              this.changeSet(right,left);","              this.divides.splice(randomIndex,1);","              del=true;","            }","          }","","        }","      }","","      if(!del){","        this.divides.splice(randomIndex,1);","      }","","    }","","    index++;","    if(index>step){","      finished=true;","    }","  }","}","","obj.findWall=function(x,y){","  var found=-1;","  for(var i=0;i<this.divides.length;i++){","    var wall=this.divides[i];","    if(wall[0]==x && wall[1]==y){","      found=i;","      break;","    }","  }","  return found;","}","","obj.changeSet=function(oldSet,newSet){","  for(var y=0;y<this.map.length;y++){","    for(var x=0;x<this.map[y].length;x++){","      if(this.map[y][x]==oldSet){","        this.map[y][x]=newSet;","      }","    }","  }","}","","obj.getXY=function(x,y){","  if(x>0 && x<this.map[0].length-1 && y>0 && y<this.map.length-1){","    return this.map[y][x];","  }else{","    return -1;","  }","}","","obj.isXY=function(x,y,val){","  if(this.map[y][x]==val){","    return true;","  }else{","    return false;","  }","}","","obj.addWall=function(x,y,w,h,c,invincible){","  if(invincible==undefined){","   \tinvincible=false; ","  }","  if(c==undefined){","    c=\"black\";","  }","  this.walls.push({x:x,y:y,w:w,h:h,c:c,invincible:invincible});","}",""];obj.JTEsetup=["\t/*Setup runs once when the game starts*/","\tthis.ww=jt.w();","\tthis.hh=jt.h();  "];obj.JTEupdate=["\t/*Update runs at the fps specified*/","","\t//jt.drawObject(this);"];jte.objects.push(obj);
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


	