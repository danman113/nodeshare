var app=require('express')();
var http=require('http').Server(app);
var fs=require("fs");
var prompt=require("prompt");

getPort();
function getPort(){
	var portSchema={name:"Port",default:256,description:"Port:",type:"number",message:"Port must be a number"};
	console.log("Please enter the port you want to run the server on.");
	prompt.message="";
	prompt.delimiter="";
	prompt.start();
	prompt.get(portSchema,function(err, res){
		if(err){
			console.log("Error: Input Error!".red);
			getPort();
		} else {
			try{
				if(isNaN(parseInt(res.Port))){
					getPort();
				} else {
					http.listen(parseInt(res.Port),function(){
						console.log("Listening on port "+parseInt(res.Port)+"!");
						getDirectory();
					});
				}
			} catch (e){
				console.log("Error: not a valid number!".red);
				getPort();
			}
		}
	});	
}

function getDirectory(){
	var dirSchema={name:"Directory",default:"c:",description:"Directory:",type:"string",message:"Directory must be a valid string"};
	console.log("Please enter file directory you want to run the server off of.");
	prompt.message="";
	prompt.delimiter="";
	prompt.start();
	prompt.get(dirSchema,function(err, res){
		if(err){
			console.log("Error: Input Error!".red);
			getDirectory();
		} else {
			fs.readdir(res.Directory, function(err, files){
				if(err){
					console.log("Error: Not Valid Directory!".red);
					getDirectory();
				} else {
					startCloud(res.Directory);
				}
			});
		}
	});	
}

function startCloud(filepath){
	var path=filepath;
	if(!(path[path.length-1]=="\\")){
		path=path+"\\";
	}
	console.log("Server running off of "+path+"!");
	app.get("/", function(req,res){
		openDirectory(path,"/",res);
	});
	app.get("/Sys/:id", function(req,res){
		res.sendFile(__dirname+"/"+req.params.id);
	});
	app.get("*", function(req,res){
		var pathname=req._parsedUrl.pathname.substring(1,req._parsedUrl.pathname.length);
		pathname=pathname.replace(/%20/g," ");
		pathname=pathname.replace(/%5B/g,"[");
		pathname=pathname.replace(/%5D/g,"]");
		console.log(("Request at "+path+pathname+".").green);
		fs.readFile(path+pathname,function(err,file){
			if(!err){
				console.log("Sending File".yellow);
				res.sendFile(path+pathname);
			}else{
				if(pathname!="")
					openDirectory(path,"/"+pathname+"/",res);
				else
					openDirectory(path,"/"+pathname,res);
					
			}
		});
	});
}

function openDirectory(Path,pathname,resend){
	var maxSize=1000000000;
	var startHTML="<head><title>"+Path+pathname+"</title><link rel='stylesheet' href='/Sys/bootstrap.min.css'><link rel='stylesheet' href='/Sys/UI.css'></head><body>";
	var endHTML="</div></body>";
	console.log("Sending Directory".yellow);
	fs.readdir(Path+pathname,function(err, res){;
		if(err){
			console.log("Could not find requested file!".red);
			resend.send(Path+pathname+"404!");
		} else {
			console.log(pathname.yellow);
			var sendStr="<div class='row'><div class='item col-lg-2 col-md-3 col-sm-6 col-xs-12'><div class='icon'><img src='/Sys/HOME.png'/></div><div class='link'><a href='/'>Home</a></div><div class='filesize'></div></div>";
			var back=(Path+pathname).split("/");
			while(back.indexOf("")>0){
				back.splice(back.indexOf(""),1);
			}
			console.log(back);
			back.splice(0,1);
			back.splice(back.length-1,1);
			console.log(back);
			sendStr+="<div class='item col-lg-2 col-md-3 col-sm-6 col-xs-12'><div class='icon'><img src='/Sys/BACK.png'/></div><div class='link'><a class='' href='/"+back.join("/")+"'>Back</a></div><div class='filesize'></div></div></div><div class='row'>";
			for(var i=0;i<res.length;i++){
				var stats;
				try{
					stats=fs.statSync(Path+pathname+res[i]);
					if(stats.size>maxSize)
						sendStr+="<div class='itemFalse col-lg-2 col-md-3 col-sm-6 col-xs-12'><div class='icon'><img src='/Sys/FILE.png'/></div><div class='link'><a class='linkFalse' href='"+pathname+res[i]+"'>"+res[i]+"</a></div><div class='filesize'>"+size(stats.size)+"</div></div>";
					else if(!stats.isFile())
						sendStr+="<div class='item col-lg-2 col-md-3 col-sm-6 col-xs-12'><div class='icon'><img src='/Sys/FOLDER.png'/></div><div class='link'><a href='"+pathname+res[i]+"'>"+res[i]+"</a></div><div class='filesize'></div></div>";
					else 
						sendStr+="<div class='item col-lg-2 col-md-3 col-sm-6 col-xs-12'><div class='icon'><img src='/Sys/FILE.png'/></div><div class='link'><a href='"+pathname+res[i]+"'>"+res[i]+"</a></div><div class='filesize'>"+size(stats.size)+"</div></div>";
				} catch(e){
					console.log(("Could not access file or folder: "+res[i]+".").red);
					sendStr+="<div class='itemFalse col-lg-2 col-md-3 col-sm-6 col-xs-12'><div class='icon'><img src='/Sys/FOLDER.png'/></div><div class='link'><a class='linkFalse ' href='"+pathname+res[i]+"'>"+res[i]+"</a></div><div class='filesize'>X</div></div>";
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
