var x;

document.addEventListener('DOMContentLoaded', function (e) {
    var socket = io();
    var canvasElement = document.getElementById('canvas');
    var game = Game.create(socket, canvasElement);
    x = game;
    
    Input.applyEventHandlers(canvasElement);
    Input.addMouseTracker(canvasElement);
    
    canvasElement.focus();
    
    socket.emit('joined',);
    
    window.onbeforeunload = function () {
	socket.disconnect();
	socket.close();
    };
});