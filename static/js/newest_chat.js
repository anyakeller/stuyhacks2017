$(document).ready(function() {
      // === Message class
      var Message;
      Message = function(arg) {
        this.text = arg.text, this.message_side = arg.message_side;
        this.draw = function(_this) {
          return function() {
            var $message;
            $message = $($('.message_template').clone().html());
            $message.addClass(_this.message_side).find('.text').html(_this.text);
            $('.messages').append($message);
            return setTimeout(function() {
              return $message.addClass('appeared');
            }, 0);
          };
        }(this);
        return this;
      };

      // === socketio globals
      localStorage.debug = '*';
      //var socket = io.connect('http://localhost:5000/');
      var socket = io();
      console.log("started socket");
      var clientID;
      var partnerHere;

      $('#waitModal').modal("show");

      // === socketio listeners
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

      // === message helpers
      var getMessageText, message_side, sendMessage;
      message_side = 'right';
      getMessageText = function() {
        var $message_input;
        $message_input = $('.message_input');
        return $message_input.val();
      };

      sendMessage = function(text, side) {
        var $messages, message;
        if (text.trim() === '') {
          return;
        }
        console.log("Message submit clicked");
        $('.message_input').val('');
        $messages = $('.messages');
        message_side = side;
        message = new Message({
          text: text,
          message_side: message_side
        });
        message.draw();
        return $messages.animate({
          scrollTop: $messages.prop('scrollHeight')
        }, 300);
      };

      // === send message events
      $('.send_message').click(function(e) {
        socket.emit("sendMsg", {
          "ID": clientID,
          "msg": getMessageText()
        });
        return sendMessage(getMessageText(), "right");
      });
      $('.message_input').keyup(function(e) {
        if (e.which === 13) {
          socket.emit("sendMsg", {
            "ID": clientID,
            "msg": getMessageText()
          });
          return sendMessage(getMessageText(), "right");
        }
      });

      // === events from server
      // On receiving a relayed message from the serverf
      socket.on("relayMsg", function(data) {
        // Log that message was received
        console.log(data);
        // Only add to window if clientID != this client's ID
        if (data["ID"] != clientID) {
          return sendMessage(data["msg"], "left");
        }
      });

      // On having a partner join the conversation
      socket.on("partnerJoin", function(data) {
        // Log that message was received
        console.log(data);
        // Only add to window if partnerID != this client's ID
        console.log("partnerID: " + data["ID"] + "; clientID: " + clientID);
        if (data["ID"] != clientID && partnerHere != true) {
          $('#waitModal').modal("hide");
          partnerHere = true;
          return sendMessage("Your partner has joined the conversation", "left");
        }
      });

      // On having a partner leave the conversation
      socket.on("partnerLeft", function(data) {
        // Log that message was received
        console.log(data);
        // Only add to window if partnerID != this client's ID
        if (data["ID"] != clientID && partnerHere == true) {
          partnerHere = false;
          return sendMessage("Your partner has left the conversation", "left");
        }
      });

      socket.on("tooMuchHate", function(data) {
        console.log("Too much hate, you must stop @ clientID: " + data["ID"]);
        var newEntry = 'It seems you\'re getting too worked up!\n'
        newEntry += 'Let\'s try keeping the discussion calm and productive.';
        return sendMessage(newEntry);
      });

      // On being kicked from a conversation
      socket.on("kicked", function(data) {
        // Log the message that was received
        console.log(data);
        if (data["ID"] == clientID) {
          newEntry = 'Your comments have consistently been too agressive.\n'
          newEntry += 'You are being taken out of the conversation.';
          return sendMessage(newEntry);
          setTimeout(function() {
            window.location = "/";
          }, 2000);
        } else {
          var newEntry = 'Your partner has been taken out of the conversation for\n'
          newEntry += 'being too aggressive\n';
          newEntry += 'Return to the <a href="/">homepage</a>';
          return sendMessage(newEntry, "left");
        }
      });

      window.onbeforeunload = function() {
        socket.disconnect();
        socket.close();
      };
    });
