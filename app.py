from flask import Flask, abort, render_template, session, redirect
import os


app = Flask(__name__)

if __name__ == "__main__":

    app.debug = True
    app.run()
