from flask import Flask, render_template, request, redirect, url_for, session
from utils import database as db
import random
from flask_socketio import SocketIO, emit, send, join_room, leave_room

app = Flask(__name__)
app.secret_key = 'Maddy says hi'
socketio = SocketIO(app, engineio_logger=True)

# Globals
SESSION_KEY_TOP = 0


# index
@app.route("/")
def index():
    return render_template("index.html")


# Chat
@app.route("/chat/")
def chat():
    print "@@@CHAT ROUTE HAS BEEN FOUND@@@"
    global SESSION_KEY_TOP
    SESSION_KEY_TOP += 1
    session["clientID"] = SESSION_KEY_TOP
    print "Current clientID : " + str(session["clientID"])
    session["room"] = "test"
    print "???HI???"
    return render_template("chat.html")


@socketio.on("connect")
def connect():
    print "&&& CLIENT HAS CONNNECTEEEEED &&&"


@socketio.on('joined')
def joined(data):
    """Sent by clients when they enter a room.
    A status message is broadcast to all people in the room."""
    print "A CLIENT HAS JOINED!!!!!"
    room = session.get('room')
    join_room(room)
    clientID = session['clientID']
    emit('partnerJoin', str(clientID) + ' has joined the conversation.', room=room)
    # Response to callback function defined clientside
    print "ABOUT TO SEND CLIENTID of " + str(clientID)
    return {"ID": clientID}


@socketio.on('sendMsg')
def processMsg(message):
    """Sent by a client when the user entered a new message.
    The message is relayed to the conversation partner."""
    room = session.get('room')
    clientID = message['ID']
    # TODO: implement sentiment analysis functionality here
    # the messages 'parrnerKick' and 'tooMuchHate' are emitted from here
    emit('relayMsg', {"ID": clientID, "msg": message["msg"]}, room=room)


@socketio.on('disconnect')
def disconnect():
    """Sent by clients when they leave a room.
    A status message is broadcast to all people in the room."""
    room = session.get('room')
    leave_room(room)
    clientID = session["clientID"]
    emit('status', clientID + ' has left the room.', room=room)

if __name__ == '__main__':
    socketio.run(app, debug=True)
