//Modules
var app = require('express')();
var http = require('http').Server(app);
var fs = require("fs");
var prompt = require("prompt");
var fsp = require('fs-promise');
var path = require("path");
var settings = {};

if(process.argv.length==3){
	var port = process.argv[2];
	if(!isNaN(parseInt(port))){
		settings.port = parseInt(port);
		settings.directory = process.cwd();
		startCloud();
	} else {
		settings.directory = port;
		getPort(function(port){
			settings.port = port;
			startCloud();
		});
	}
} else if (process.argv.length>3){
	var port = process.argv[2];
	if(!isNaN(parseInt(port))){
		settings.port = parseInt(port);
		settings.directory = process.argv[3];
	} else {
		settings.directory = port;
		settings.port = parseInt(process.argv[3]);
	}
	startCloud();
} else {
	getPort(function(port){
		settings.port = port;
		getDirectory(function(directory){
			settings.directory = directory;
			startCloud();
		});
	});
}


function getPort(callback){
	var portSchema={name:"Port",default:8000,description:"Port:",type:"number",message:"Port must be a number"};
	console.log("Please enter the port you want to run the server on.");
	prompt.message="";
	prompt.delimiter="";
	prompt.start();
	prompt.get(portSchema,function(err, res){
		if(err){
			console.log("Error: Input Error!".red);
			getPort(callback);
		} else {
			if(isNaN(parseInt(res.Port))){
				getPort(callback);
			} else {
				callback(parseInt(res.Port));
			}
		}
	});	
}

function getDirectory(callback){
	var dirSchema={name:"Directory",default:process.cwd(),description:"Directory:",type:"string",message:"Directory must be a valid string"};
	console.log("Please enter file directory you want to run the server off of.");
	prompt.message="";
	prompt.delimiter="";
	prompt.start();
	prompt.get(dirSchema,function(err, res){
		if(err){
			console.log("Error: Input Error!".red);
			getDirectory(callback);
		} else {
			fs.readdir(res.Directory, function(err, files){
				if(err){
					console.log("Error: Not Valid Directory!".red);
					getDirectory(callback);
				} else {
					var dir = res.Directory;
					if(!path.isAbsolute(dir)){
						dir = path.resolve(dir);
					}
					callback(dir);
				}
			});
		}
	});	
}

function startCloud(){
	http.listen(settings.port, function(){
		console.log(("Server started on "+settings.port+"!").green);
		console.log(settings);
	});
	app.get("/Sys/:id", function(req,res){
		res.sendFile(__dirname+"/assets/"+req.params.id);
	});
	app.get("*", function(req,res){
		var pathname=req._parsedUrl.pathname.substring(1,req._parsedUrl.pathname.length);
		pathname=pathname.replace(/%20/g," ");
		pathname=pathname.replace(/%5B/g,"[");
		pathname=pathname.replace(/%5D/g,"]");
		var localPath = path.normalize(settings.directory+"/"+pathname);
		console.log(("Request at "+localPath).green);
		fs.readFile(localPath, function(err,file){
			if(!err){
				console.log("Sending File".yellow);
				try{
					res.sendFile(localPath);
				} catch(e){
					res.send(403);
				}
				
			}else{
				openDirectory(localPath,res);
			}
		});
	});
}

function openDirectory(Path,resend){
	var maxSize=1000000000;
	var startHTML="<head><title>"+Path+"</title><link rel='stylesheet' href='/Sys/bootstrap.min.css'><link rel='stylesheet' href='/Sys/UI.css'></head><body>";
	var endHTML="</div></body>";
	console.log("Sending Directory".yellow);
	fs.readdir(Path,function(err, res){
		if(err){
			console.log("Could not find requested directory!".red);
			resend.send(Path+"404!");
		} else {
			console.log(Path.yellow);
			var sendStr="<div class='row'><div class='item col-lg-2 col-md-3 col-sm-6 col-xs-12'><div class='icon'><img src='/Sys/HOME.png'/></div><div class='link'><a href='/'>Home</a></div><div class='filesize'></div></div>";
			var backPath = path.resolve(Path+"/..");
			var back=path.relative(settings.directory,backPath);
			if(back == backPath){
				back = "";
			}
			sendStr+="<div class='item col-lg-2 col-md-3 col-sm-6 col-xs-12'><div class='icon'><img src='/Sys/BACK.png'/></div><div class='link'><a class='' href='/"+back+"'>Back</a></div><div class='filesize'></div></div></div><div class='row'>";
			for(var i=0;i<res.length;i++){
				var stats;
				try{
					var link = path.relative(settings.directory,Path)+"/"+(res[i]);
					if(link.substr(0,1)!=="/")
						link = "/"+link;
					stats=fs.statSync(path.join(Path,res[i]));
					if(stats.size>maxSize)
						sendStr+="<div class='itemFalse col-lg-2 col-md-3 col-sm-6 col-xs-12'><div class='icon'><img src='/Sys/FILE.png'/></div><div class='link'><a class='linkFalse' href='"+link+"'>"+res[i]+"</a></div><div class='filesize'>"+size(stats.size)+"</div></div>";
					else if(!stats.isFile())
						sendStr+="<div class='item col-lg-2 col-md-3 col-sm-6 col-xs-12'><div class='icon'><img src='/Sys/FOLDER.png'/></div><div class='link'><a href='"+link+"'>"+res[i]+"</a></div><div class='filesize'></div></div>";
					else 
						sendStr+="<div class='item col-lg-2 col-md-3 col-sm-6 col-xs-12'><div class='icon'><img src='/Sys/FILE.png'/></div><div class='link'><a href='"+link+"'>"+res[i]+"</a></div><div class='filesize'>"+size(stats.size)+"</div></div>";
				} catch(e){
					console.log(("Could not access file or folder: "+res[i]+".").red);
					sendStr+="<div class='itemFalse col-lg-2 col-md-3 col-sm-6 col-xs-12'><div class='icon'><img src='/Sys/FOLDER.png'/></div><div class='link'><a class='linkFalse ' href='"+link+"'>"+res[i]+"</a></div><div class='filesize'>X</div></div>";
				}
				
			}
			resend.send(startHTML+sendStr+endHTML);
		}
	});
}

function size(num){
	var i=0;
	var type=["B","kB","MB","GB","TB","PB","EB"];
	for(;num>=1000;i++){
		num/=1000;
	}
	return (num).toFixed(1)+" "+type[i];
}
