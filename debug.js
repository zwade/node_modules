(function() {var ws = new WebSocket('ws://localhost:5556');
	ws.onmessage = function(data) {
		if (data.data=='reload') {
			setTimeout(function() {window.location.reload()},500);
		} else {
			console.log(data);
		}
	}
})() 
