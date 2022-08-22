const WebSocket = require('ws')
const express = require('express')
const path = require('path')
const Rx = require('rxjs')
const RxOp = require('rxjs/operators')
const subject = require('./subject')

const SECONDS_SERVED = 60000

/* execs this .js : */
require('./kraken-client.js')

/* builds the web server */
const app = express()
app.use(express.static(
  path.join(__dirname, '../public')
))
/* cf index.html: */
app.use('/d3',
  express.static(
    path.join(__dirname, '../node_modules/d3/dist/')
  ))
app.use('/jquery',
  express.static(
    path.join(__dirname, '../node_modules/jquery/dist/')
  ))
app.use('/bootstrap',
  express.static(
    path.join(__dirname, '../node_modules/bootstrap/dist/')
  ))
const server = require('http').Server(app)
/*
https://devcenter.heroku.com/articles/runtime-principles
"Each web process simply binds to a port, and listens for requests coming in on that port. The port to bind to is assigned by Heroku as the PORT environment variable."
https://github.com/websockets/ws/blob/master/doc/ws.md#new-websocketserveroptions-callback
https://stackoverflow.com/questions/13791050/is-it-possible-to-enable-tcp-http-and-websocket-all-using-the-same-port
*/
const wss = new WebSocket.Server({
  server
})

const interval$ = Rx.interval(100)

/* websocket events: */
wss.on('connection', ws => {
  let progress = 0
  let subscription = null

  const interval = setInterval(() => {
    progress += 1
    ws.send(JSON.stringify({ percent: progress }))
  }, SECONDS_SERVED / 100)

  setTimeout(() => {
    console.log('closing websocket')
    ws.close()
    subscription.unsubscribe()
    clearInterval(interval)
  }, SECONDS_SERVED)

  ws.on('message', function incoming (message) {
    console.log('received: %s', message)
  })

  subscription = subject
    .pipe(
      /* https://rxjs-dev.firebaseapp.com/api/operators/debounce */
      RxOp.debounce(() => interval$)
    )
    .subscribe(payload => {
      return ws.send(JSON.stringify(payload))
    }
    )
})

if (module === require.main) {
  const PORT = /* heroku */process.env.PORT || /* local */8080
  server.listen(PORT, 'localhost', () => {
    console.log(`App listening on port http://localhost:${PORT}`)
    console.log('Press Ctrl+C to quit.')
  })
}
