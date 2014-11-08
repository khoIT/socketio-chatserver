var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res){
  res.send("This is the chat server");
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on("disconnect", function(){
    console.log('user disconnected');
  });
  socket.on("chat message", function(data) {
    console.log(data.text);
    io.emit("server respond", data);
  });
});

http.listen(app.get('port'), function(){
  console.log('listening on *:' + app.get('port'));
});
