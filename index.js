var app=require('express')();
var http=require('http').Server(app);
var fs=require("fs");
var crypto=require("crypto");
var prompt=require("prompt");
var hashish=crypto.createHash('sha256');
app.get("/", function(req,res){
	res.send("Suck it logic");
});

http.listen(90,function(){
	console.log("Listening on port "+90+"!");
	getPath();
});
function getPath(){
	prompt.message="";
	prompt.delimiter="";
	prompt.start();
	prompt.get(["FilePath"],function(err, res){
		console.log("Result: ");
		if(err)
			return false;
		console.log(res.FilePath);
		fs.readdir(res.FilePath,function(err, Result){
			if(!err){
				fs.mkdir(res.FilePath,function(e){
					if(e)
						console.log("Created the file!");
					setInterval(function(){
						hashish=crypto.createHash('sha256');
						var crypted = hashish.update((new Date).getTime().toString(),"utf8");
							crypted=hashish.digest("hex");
						fs.mkdir(res.FilePath+"/"+crypted, function(e){
							console.log("Made Dir");
						});
					},2000);	
				});
			} else {
				getPath();
			}
		});
	});
}