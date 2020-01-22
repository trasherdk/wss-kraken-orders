// pour wsClient de Kraken :
const WebSocket = require('ws');

const express = require("express")
const app = express();
const path = require('path');

const myEmitter = require('./emitter');

app.use(express.static(path.join(__dirname, '../public')));

const server = require('http').Server(app);

// pour le ws server :
const wss = new WebSocket.Server({
    server: server
});

require('./kraken-client.js');

// this ws server

wss.on('connection', ws => {

    setTimeout(() => {
        console.log('closing websocket');
        ws.close();
    }, 60000);

    ws.on('message', function incoming(message) {
        console.log('received: %s', message);
    });

    myEmitter.on('event', (payload) => {
        ws.send(JSON.stringify(payload));
    });
})

if (module === require.main) {
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
      console.log(`App listening on port ${PORT}`);
      console.log('Press Ctrl+C to quit.');
    });
  }