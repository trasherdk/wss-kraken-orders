const EventEmitter = require('events');

class MyEmitter extends EventEmitter { };

const emitter = new MyEmitter();

/* avoids MaxListenersExceededWarning
https://nodejs.org/docs/latest/api/events.html#events_emitter_setmaxlisteners_n */
emitter.setMaxListeners(20);

module.exports = emitter;