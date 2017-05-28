from flask import Flask, render_template, request, redirect, url_for, session
from utils import sentanalysis
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
    global SESSION_KEY_TOP
    SESSION_KEY_TOP += 1
    session["clientID"] = SESSION_KEY_TOP
    # print "Current clientID : " + str(session["clientID"])
    session["room"] = "test"
    session['sent_score'] = 0
    session['strikes'] = 0
    return render_template("chat.html")


@socketio.on("connect")
def connect():
    print "SERVER: A client has connected"


@socketio.on('joined')
def joined():
    """Sent by clients when they enter a room.
    A status message is broadcast to all people in the room."""
    print "SERVER: A client has joined"
    room = session.get('room')
    join_room(room)
    clientID = session['clientID']
    # Set the clientID of the connected client
    emit('yourID', {"ID": clientID})
    # Inform the partner about the newly joined client
    emit('partnerJoin', {"ID": clientID}, room=room)


@socketio.on('sendMsg')
def processMsg(message):
    """Sent by a client when the user entered a new message.
    The message is relayed to the conversation partner."""
    room = session.get('room')
    clientID = message['ID']
    # TODO: implement sentiment analysis functionality here
    # the messages 'parrnerKick' and 'tooMuchHate' are emitted from here
    session['sent_score'] += sentanalysis.analyze(message["msg"])
    emit('relayMsg', {"ID": clientID, "msg": message["msg"]}, room=room)
    if session['sent_score'] < -3.5:
        if session['strikes'] == 3:
            # Inform the active client & partner that the client is kicked
            emit("kicked", {"ID": clientID}, room=room)
        else:
            session['strikes'] += 1
            emit("tooMuchHate", {"ID": clientID})


@socketio.on('disconnect')
def disconnect():
    """Sent by clients when they leave a room.
    A status message is broadcast to all people in the room."""
    room = session.get('room')
    leave_room(room)
    clientID = session["clientID"]
    emit('partnerLeft', {"ID": clientID}, room=room)

if __name__ == '__main__':
    socketio.run(app, debug=True)
