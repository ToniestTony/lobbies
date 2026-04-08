const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Client } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Set static folder
app.use(express.static("client"));

// Socket setup
const io = socket(server);

var players={};

var num=0;

function Player(id){
    this.id=id;
    this.name="";
	this.c="black";
    this.x=0;
    this.y=0;
	this.r=0;
	this.time=0;
	this.state="";
	this.playing=false;
}

io.on('connection', (socket) => {
	players[socket.id]=new Player(socket.id);
	console.log('Player connected as '+socket.id+' (players: '+Object.keys(players).length+')');
	//Send id
	num++;
	socket.emit('connected',socket.id,num);
	
	
	socket.on("disconnect",function(){
		delete players[socket.id]
		console.log('Player disconnected as '+socket.id+' (players: '+Object.keys(players).length+')');
		socket.broadcast.emit("disconnected",socket.id)
    });
	
	
	socket.on("update",function(clientObj){
		socket.broadcast.emit("getData",socket.id,clientObj)
    });
	
	
	socket.on('chat message', msg => {
		io.emit('chat message', msg);
	});
	
	socket.on("invite",function(id){
		socket.to(id).emit("invite",socket.id)
    });
	
	socket.on("cancel",function(id){
		socket.to(id).emit("cancel",socket.id)
    });
	
	socket.on("refuse",function(id){
		socket.to(id).emit("refuse",socket.id)
    });
	
	socket.on("accept",function(id,time){
		socket.to(id).emit("accept",socket.id,time)
    });
	
	/*
	socket.on("sendCool",function(id){
		socket.to(id).emit("cool",socket.id);
	});
	*/
	/*
	socket.on("setHighscore",function(name,time,cool){
		console.log("received set highscore")
		//var query="SELECT DISTINCT nom, MIN(score) AS score, MIN(score2) AS score2 FROM launch GROUP BY nom, score2 ORDER BY score ASC, score2 DESC LIMIT 30";
		if(client===null){
			createClient();
		}
		
		client.connect();
		
		var query="INSERT INTO launch(name,time,cool) VALUES('"+name+"',"+time+","+cool+");";
		console.log("connect?")
		client.query(query, (err, res) => {
			if(err){
				throw err
			}else{
				socket.emit('inserted');
				return true;
			}
			endClient();
		});
    });
	*/
	/*
	socket.on("getHighscores",function(){
		console.log("received get highscores")
		//var query="SELECT DISTINCT nom, MIN(score) AS score, MIN(score2) AS score2 FROM launch GROUP BY nom, score2 ORDER BY score ASC, score2 DESC LIMIT 30";
		if(client===null){
			createClient();
		}
		
		client.connect();
		
		var query="SELECT * from launch;";
		console.log("connect?")
		client.query(query, (err, res) => {
			if(err){
				throw err
			}else{
				console.table(res.rows)
				socket.emit('highscores',res.rows);
				return true;
			}
			endClient();
		});
    });
	*/
	
});

/*$servername = "sql209.epizy.com";
$username = "epiz_24532888";
$password = "hMrFKYesZUXe";
$dbname = "epiz_24532888_highscores";*/

/*
var client=null;

createClient();
*/

/*var connect=mysql.createConnection({
	hostname:"db.bit.io",
	database:"ToniestTony/highscores",
	username:"ToniestTony",
	password:"v2_3sGyq_JzYQsrgsQ8u6ccwdgXSaZdC",
	port: 5432,
	connectTimeout:10000,
});*/

/*
var connect=mysql.createConnection({
	host:"sql209.epizy.com",
	database:"epiz_24532888_highscores",
	user:"epiz_24532888",
	password:"hMrFKYesZUXe",
	port:3306,
	connectTimeout:100000,
});

var connect=mysql.createConnection({
	host:"localhost",
	database:"epiz_24532888_highscores",
	user:"root",
	password:"root",
});*/

/*
function createClient(){
	client = new Client({
		user: 'ToniestTony',
		host: 'db.bit.io',
		database: 'ToniestTony/highscores', // public database 
		password: 'v2_3sGyq_JzYQsrgsQ8u6ccwdgXSaZdC', // key from bit.io database page connect menu
		port: 5432,
		ssl:true
	});
	
	client.on('error',e=>{
		console.log("Database error",e);
		client=null;
		createClient();
	});
}

function endClient(){
	client.end();
	client=null;
}
*/


server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
