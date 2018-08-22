const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var helmet = require('helmet');

app.use(helmet());

// serve files in public folder
app.use(express.static(__dirname + '/public'));

// route url to mobile page
app.get('/mobile', function(req, res) {
    res.sendFile(path.join(__dirname + '/public/mobile.html'));
});

io.on('connection', function(socket){
  console.log('Connection established');
  
  // retrieving file from a URL
  socket.on("URL",function(address){
		var httpfile = require('http');
		var httpsfile = require('https');

		// check if URL is http or https
		var client = httpfile;
		if (address.indexOf("https") === 0){
			client = httpsfile;
		}

		client.get(address, (resp) => {
			// convert image to base64
			resp.setEncoding('base64');
			body = "data:" + resp.headers["content-type"] + ";base64,";
			resp.on('data', (data) => { body += data});
			resp.on('end', () => {				
				// return base64 data to client
				socket.emit("URL", body);
			});
		}).on('error', (e) => {
			console.log(`Error: ${e.message}`);
		});	 
  });

  // process OCR functions server-side for mobile use
  socket.on("scan",function(dataObject){	
	var Tesseract = require('tesseract.js');
	// format base64 data
	var base64 = dataObject.imageData.replace(/^data:image\/jpeg;base64,/,"");
	// convert base64 to buffer object
	var imageBuffer = Buffer.from(base64,'base64');
		
	Tesseract.recognize(imageBuffer, {
		lang: dataObject.lang
	}).progress(function(result){
	console.log("Status: " + result["status"] + " (" + (result["progress"] * 100) + "%)");
	}).then(function(result){
		socket.emit("scan", result.text);
	})
  });
  
});



http.listen(process.env.PORT || 8000);