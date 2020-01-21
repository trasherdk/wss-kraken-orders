// pour wsClient de Kraken :
const WebSocket = require('ws');

const express = require("express")
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

const server = require('http').Server(app);

// pour le ws server :
const io = require('socket.io')(server);

const EventEmitter = require('events');

const ORDER_BOOK_DEPTH = 25;
const PRICE_DECIMALS = 1;

class MyEmitter extends EventEmitter { };

const myEmitter = new MyEmitter();

const apiBookFromKraken = { "bid": {}, "ask": {} };

const apiUpdateBook = (side, data) => {
    for (x of data) {
        const priceLevel = parseFloat(x[0]);
        const volume = parseFloat(x[1]);
        if (volume !== 0) {
            apiBookFromKraken[side][priceLevel] = volume;
        } else {
            delete apiBookFromKraken[side][priceLevel];
        }
    }
}

const reducer = (accumulator, currentValue) => {
    const price = +currentValue[0];
    const truncatedPrice = price.toFixed(PRICE_DECIMALS);
    let newVolumeValue = +currentValue[1];
    if (accumulator.get(truncatedPrice)) {
        newVolumeValue += accumulator.get(truncatedPrice);
    }
    accumulator.set(truncatedPrice, newVolumeValue);
    return accumulator;
}

const getForVisualisation = () => {

    const orderBook = [];

    const unorderedAsks = apiBookFromKraken["ask"];
    
    const asks = Object.keys(unorderedAsks)
        .sort()
        .map((cle) => [cle, unorderedAsks[cle]]);
    const askMapResultat = asks.reduce(reducer, new Map());
    const askData = [];
    for (let [k, v] of askMapResultat) {
        askData.push({
            price: k,
            volume: v,
            type: "ask"
        });
    }
    let sum = 0;
    askData.forEach(function (d) {
        sum += +d.volume;
        d.volume = sum;
    });
    const resolvedPrice = askData[0].price;
    orderBook.push(...askData);

    const unorderedBids = apiBookFromKraken["bid"];
    //console.log(side + " " + JSON.stringify(unOrderedSideData));
    const bids = Object.keys(unorderedBids)
        .sort((a,b) => b - a)
        .map((cle) => [cle, unorderedBids[cle]]);
    const bidMapResultat = bids.reduce(reducer, new Map());
    const bidData = [];
    for (let [k, v] of bidMapResultat) {
        bidData.push({
            price: k,
            volume: v,
            type: "bid"
        });
    }
    sum = 0;
    bidData.forEach(function (d) {
        sum += +d.volume;
        d.volume = sum;
    })
    orderBook.push(...bidData);

    // sort and update graph
    orderBook.sort((a, b) => a.price - b.price)

    return {
        orderBook: orderBook,
        resolvedPrice: resolvedPrice
    };
}

const wsClient = new WebSocket('wss://ws.kraken.com/');

const payload = {
    "event": "subscribe",
    "pair": ["ETH/EUR"],
    "subscription": {
        "name": "book",
        "depth": ORDER_BOOK_DEPTH
    }
}

wsClient.on('open', function open() {
    wsClient.send(JSON.stringify(payload));
});

wsClient.on('message', function incoming(data) {

    const jsonData = JSON.parse(data);
    if (!jsonData[1]) {
        return;
    }
    if ('as' in jsonData[1]) {
        apiUpdateBook("ask", jsonData[1]["as"]);
    }
    if ('a' in jsonData[1]) {
        apiUpdateBook("ask", jsonData[1]["a"]);
    }
    if ('bs' in jsonData[1]) {
        apiUpdateBook("bid", jsonData[1]["bs"]);
    }
    if ('b' in jsonData[1]) {
        apiUpdateBook("bid", jsonData[1]["b"]);
    }

    const formattedData = getForVisualisation();
    myEmitter.emit('event', formattedData);
});

// this ws server
io.on('connection', socket => {

    setTimeout(() => {
        //console.log('closing websocket');
        socket.disconnect();
    }, 60000);

    socket.on('message', msg => {
        console.log('received: %s', message);
    });

    myEmitter.on('event', (payload) => {
        io.emit('message', payload);
    });
  });

if (module === require.main) {
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
      console.log(`App listening on port ${PORT}`);
      console.log('Press Ctrl+C to quit.');
    });
  }