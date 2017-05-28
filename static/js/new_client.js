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
    socket.emit("joined");
  });

  // On receiving the clientID from the server
  socket.on("yourID", function(data) {
    console.log("Server-provided ID: " + data["ID"]);
    clientID = data["ID"];
  });

  socket.on("connect_error", function() {
    console.log("MAJOR CONNECT ERROR");
  });

  // On message submit
  $("#submit").click(function() {
    // Log the fact that the msg button was clicked
    console.log("Message submit clicked");
    var text = document.getElementById('msgField').value
    console.log(text);
    // Send the msg to the server, identified by clientID
    socket.emit("sendMsg", {"ID": clientID, "msg": text});
    // Create the msg element and add to chat window
    var newEntry = '<div class="row message-bubble"><p class="text-muted">';
    newEntry += "Me" + '</p><p>' + text + '</p></div>';
    $("#chat").append(newEntry);
    // Reset the text field
    document.getElementById('msgField').value = "";
  });

  // On receiving a relayed message from the serverf
  socket.on("relayMsg", function(data) {
    // Log that message was received
    console.log(data);
    // Only add to window if clientID != this client's ID
    if (data["ID"] != clientID) {
      var newEntry = '<div class="row message-bubble"><p class="text-muted">';
      newEntry += "Them" + '</p><p>' + data["msg"] + '</p></div>';
      $("#chat").append(newEntry);
    }
  });

  // On having a partner join the conversation
  socket.on("partnerJoin", function(data) {
    // Log that message was received
    console.log(data);
    // Only add to window if partnerID != this client's ID
    console.log("partnerID: " + data["ID"] + "; clientID: " + clientID);
    if (data["ID"] != clientID) {
      var newEntry = '<div class="row message-bubble">';
      newEntry += '<p style="font-weight: bold;">'
      newEntry += 'Your partner has joined the conversation.</p></div>';
      $("#chat").append(newEntry);
    }
  });

  // On having a partner leave the conversation
  socket.on("partnerLeft", function(data) {
    // Log that message was received
    console.log(data);
    // Only add to window if partnerID != this client's ID
    if (data["ID"] != clientID) {
      var newEntry = '<div class="row message-bubble">';
      newEntry += '<p style="font-weight: bold;">'
      newEntry += 'Your partner has left the conversation.</p></div>';
      $("#chat").append(newEntry);
    }
  });

  window.onbeforeunload = function() {
    socket.disconnect();
    socket.close();
  };

})
