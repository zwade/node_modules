var ws = new WebSocket("ws://localhost:5556")

ws.on('connection', function() {
	console.log('i got the syntax right!');
})

