from flask import Flask, render_template, request, redirect, url_for, session
import hashlib, json
import requests as req
from utils import database as db
import random

app = Flask(__name__)
app.secret_key = 'Maddy says hi'

def get_new_word():
    wordl = open('nounlist.txt', 'r')
    noun = random.choice(wordl.read().split())
    wordl.close()
    return noun

@app.route('/')
def mainpage():
    return render_template('index.html')

@app.route('/chat')
def chat():
    return render_template('chat.html')

if __name__ == '__main__':
    app.debug = True
    app.run()
