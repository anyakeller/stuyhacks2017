$(document).ready(function() {
  localStorage.debug = '*';
  //var socket = io.connect('http://localhost:5000/');
  var socket = io();
  console.log("started socket");
  var clientID;

  // On connection
  socket.on("connect", function() {
    console.log("connected");
    console.log("Socket ID: " + socket.id);
    socket.emit("joined", {});
    /*
    socket.emit("joined", '', function(data) {
      clientID = data;
      console.log(clientID);
    });
    */
  });

  socket.on("connect_error", function() {
    console.log("MAJOR CONNECT ERROR");
  });

  /*
      // On message submit
      $("#submit").click(function() {
        console.log("Message submit clicked");
        var text = document.getElementById('msgField').value
        console.log(text);
      });
      */

  window.onbeforeunload = function() {
    socket.disconnect();
    socket.close();
  };

})
