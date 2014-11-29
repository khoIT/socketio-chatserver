var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);

app.set('port', (process.env.PORT || 5000))
http.listen(app.get('port'), function(){
    console.log('listening on *:' + app.get('port'));
});

// routing
app.get('/', function (req, res) {
  res.send("this is a chat server");
});

// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
var rooms = ['mainRoom'];

io.sockets.on('connection', function (socket) {

  console.log("User connected");
  // when the client emits 'adduser', this listens and executes
  socket.on('addUser', function(username){
    // store the username in the socket session for this client
    socket.username = username;
    // store the room name in the socket session for this client
    socket.room = 'mainRoom';
    // add the client's username to the global list
    usernames[username] = username;
    // send client to room 1
    socket.join('mainRoom');
    // echo to client they've connected
    socket.emit('updatechat', 'SERVER', 'you have connected to mainRoom');
    // echo to room 1 that a person has connected to their room
    socket.broadcast.to('mainRoom').emit('updatechat', 'SERVER', username + ' has connected to this room');
    socket.emit('updaterooms', rooms, 'mainRoom');
  });

  // when the client emits 'sendchat', this listens and executes
  socket.on('sendchat', function (data) {
    // we tell the client to execute 'updatechat' with 2 parameters
    io.sockets.in(socket.room).emit('updatechat', socket.username, data);
  });

  socket.on('newRoom', function(newroom){
    console.log("User change room");
    // leave the current room (stored in session)
    socket.leave(socket.room);
    // join new room, received as function parameter
    socket.join(newroom);
    socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
    // sent message to OLD room
    socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
    // update socket session room title
    socket.room = newroom;
    socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
    socket.emit('updaterooms', rooms, newroom);
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function(){
    // remove the username from global usernames list
    delete usernames[socket.username];
    // update list of users in chat, client-side
    io.sockets.emit('updateusers', usernames);
    // echo globally that this client has left
    socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
    socket.leave(socket.room);
  });
});
