from flask import Flask, render_template, request, redirect, url_for, session
from utils import sentanalysis
import random
from flask_socketio import SocketIO, emit, send, join_room, leave_room
import cgi

app = Flask(__name__)
app.secret_key = 'Maddy says hi'
socketio = SocketIO(app, engineio_logger=True)


# === GLOBALS === #
SESSION_KEY_TOP = 0
AVAIL_CONSERVATIVES = []
AVAIL_LIBERALS = []


# === ROUTES === #
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/process/", methods=['POST',"GET"])
def process():
    # TODO: use function to process survey input into a leaning
    form = cgi.FieldStorage(environ="post")
    points = 0
    points = points + int(form["q1"])
    points = points + 5 - int(form["q2"])
    points = points + int(form["q3"])
    points = points + int(form["q4"])
    points = points + int(form["q5"])
    points = points + 5 - int(form["q6"])
    points = points + 5 - int(form["q7"])
    points = points + 5 - int(form["q8"])
    points = points + int(form["q9"])
    points = points + int(form["q10"])
    avg = points / 10.0
    if points < 2.5:
        leaning = "conservative"
    else:
        leaning = "liberal"

    global SESSION_KEY_TOP
    session['clientID'] = SESSION_KEY_TOP
    SESSION_KEY_TOP += 1
    if leaning == "liberal":
        if len(AVAIL_CONSERVATIVES) > 0:
            session["room"] = AVAIL_CONSERVATIVES.pop()
            session["status"] = "connect"
        else:
            room = session['clientID']
            AVAIL_LIBERALS.append(room)
            session['room'] = room
            session['status'] = 'wait'
    else:
        if len(AVAIL_LIBERALS) > 0:
            session["room"] = AVAIL_LIBERALS.pop()
            session["status"] = "connect"
        else:
            room = session['clientID']
            AVAIL_CONSERVATIVES.append(room)
            session['room'] = room
            session['status'] = 'wait'
    return redirect(url_for("chat"))


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
    # return render_template("chat.html", status=session["status"])
    return render_template("chat.html")


# === SOCKETIO LISTENERS === #

@socketio.on("connect")
def connect():
    print "SERVER: A client has connected"


@socketio.on('joined')
def joined():
    """Sent by clients when they enter a room.
    A status message is broadcast to all people in the room."""
    print "SERVER: A client has joined"
    room = session.get("room")
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
    msg_score = sentanalysis.analyze(message["msg"])
    session['sent_score'] += msg_score
    emit('relayMsg', {"ID": clientID, "msg": message["msg"]}, room=room)
    if msg_score < -2:
        overall_neg = session['sent_score'] < -4 and session['strikes'] >= 3
        too_much_neg = session['strikes'] >= 6
        if overall_neg or too_much_neg:
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
