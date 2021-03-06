(function() {
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
  $(function() {
    localStorage.debug = '*';
    //var socket = io.connect('http://localhost:5000/');
    var socket = io();
    console.log("started socket");
    var clientID;

    var getMessageText, message_side, sendMessage;
    message_side = 'right';
    getMessageText = function() {
      var $message_input;
      $message_input = $('.message_input');
      return $message_input.val();
    };
    sendMessage = function(text) {
      var $messages, message;
      if (text.trim() === '') {
        return;
      }
      console.log("Message submit clicked");
      $('.message_input').val('');
      $messages = $('.messages');
      message_side = message_side === 'left' ? 'right' : 'left';
      message = new Message({
        text: text,
        message_side: message_side
      });
      socket.emit("sendMsg", {
        "ID": clientID,
        "msg": text
      });
      message.draw();
      return $messages.animate({
        scrollTop: $messages.prop('scrollHeight')
      }, 300);
    };

    $('.send_message').click(function(e) {
      return sendMessage(getMessageText());
    });
    $('.message_input').keyup(function(e) {
      if (e.which === 13) {
        return sendMessage(getMessageText());
      }
    });

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

    // On receiving a relayed message from the serverf
    socket.on("relayMsg", function(data) {
      // Log that message was received
      console.log(data);
      // Only add to window if clientID != this client's ID
      if (data["ID"] != clientID) {
        return sendMessage(data["msg"]);
      }
    });

    // On having a partner join the conversation
    socket.on("partnerJoin", function(data) {
      // Log that message was received
      console.log(data);
      // Only add to window if partnerID != this client's ID
      console.log("partnerID: " + data["ID"] + "; clientID: " + clientID);
      if (data["ID"] != clientID) {
        return sendMessage("Your partner has joined the conversation");
      }
    });

    // On having a partner leave the conversation
    socket.on("partnerLeft", function(data) {
      // Log that message was received
      console.log(data);
      // Only add to window if partnerID != this client's ID
      if (data["ID"] != clientID) {
        return sendMessage("Your partner has left the conversation");
      }
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
        newEntry += 'being too aggressive';
        return sendMessage(newEntry);
        var newEntry = '<span style="font-weight: bold;">';
        newEntry += 'Return to the <a href="/">homepage</a>.</span>';
        return sendMessage(newEntry);
      }
    });

    window.onbeforeunload = function() {
      socket.disconnect();
      socket.close();
    };

  });
}.call(this));
