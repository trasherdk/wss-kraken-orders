const Rx = require('rxjs');

const debouncer = new Rx.Subject();

module.exports = debouncer;