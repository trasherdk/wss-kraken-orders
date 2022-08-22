const WebSocket = require('ws')
/*
const fs = require('fs');
*/
const subject = require('./subject')

/*
Optional - depth associated with book subscription in float of levels each side, default 10.
Valid Options are: 10, 25, 100, 500, 1000
*/
const ORDER_BOOK_DEPTH = 25
const PRICE_DECIMALS = 1

const apiBookFromKraken = { bid: {}, ask: {} }

const apiUpdateBook = (side, data) => {
  /*
      https://support.kraken.com/hc/en-us/articles/360027821131-How-to-maintain-a-valid-order-book-
      https://support.kraken.com/hc/en-us/articles/360027678792-Example-order-book-transcript
      */
  // console.log('apiUpdateBook ' + side + ', ' + JSON.stringify(data))
  for (const x of data) {
    const priceLevel = parseFloat(x[0])
    const volume = parseFloat(x[1])
    /*
            https://docs.kraken.com/websockets/#message-book
            Price level volume, for updates
            volume = 0 for level removal/deletion
            */
    if (volume !== 0) {
      apiBookFromKraken[side][priceLevel] = volume
    } else {
      delete apiBookFromKraken[side][priceLevel]
    }
  }
}

/*
https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Array/reduce
*/
const reducer = (accumulator, currentValue) => {
  const price = +currentValue[0]
  const truncatedPrice = price.toFixed(PRICE_DECIMALS)
  let newVolumeValue = +currentValue[1]
  if (accumulator.get(truncatedPrice)) {
    newVolumeValue += accumulator.get(truncatedPrice)
  }
  accumulator.set(truncatedPrice, newVolumeValue)
  return accumulator
}

const getForVisualisation = () => {
  const orderBook = []

  const unorderedAsks = apiBookFromKraken.ask
  const asks = Object.keys(unorderedAsks)
    .sort()
    .map((cle) => [cle, unorderedAsks[cle]])
  const askMapResultat = asks.reduce(reducer, new Map())
  const askData = []
  for (const [k, v] of askMapResultat) {
    askData.push({
      price: k,
      volume: v,
      type: 'ask'
    })
  }
  let sum = 0
  askData.forEach(function (d) {
    sum += +d.volume
    d.volume = sum
  })
  const resolvedPrice = askData[0].price
  orderBook.push(...askData)

  const unorderedBids = apiBookFromKraken.bid
  const bids = Object.keys(unorderedBids)
    .sort((a, b) => b - a)
    .map((cle) => [cle, unorderedBids[cle]])
  const bidMapResultat = bids.reduce(reducer, new Map())
  const bidData = []
  for (const [k, v] of bidMapResultat) {
    bidData.push({
      price: k,
      volume: v,
      type: 'bid'
    })
  }
  sum = 0
  bidData.forEach(function (d) {
    sum += +d.volume
    d.volume = sum
  })
  orderBook.push(...bidData)

  orderBook.sort((a, b) => a.price - b.price)

  const retour = {
    orderBook,
    resolvedPrice
  }

  // pour démo
  /*
      fs.writeFile('exemple_order_book.json',
          JSON.stringify(retour, null, 4),
          function (err, result) {
              if (err) console.log('error', err);
          });
      */

  return retour
}

const wsClient = new WebSocket('wss://ws.kraken.com/')
/* https://docs.kraken.com/websockets/#message-subscribe */
const payload = {
  event: 'subscribe',
  pair: ['ETH/EUR'],
  subscription: {
    name: 'book',
    depth: ORDER_BOOK_DEPTH
  }
}

wsClient.on('open', function open () {
  console.log('websocket open')
  wsClient.send(JSON.stringify(payload))
})

wsClient.on('message', function incoming (data) {
  const jsonData = JSON.parse(data)
  if (!jsonData[1]) {
    return
  }
  /*
      https://support.kraken.com/hc/en-us/articles/360027678792-Example-order-book-transcript
      https://support.kraken.com/hc/en-us/articles/360027821131-How-to-maintain-a-valid-order-book-
      */
  if ('as' in jsonData[1]) {
    apiUpdateBook('ask', jsonData[1].as)
  }
  if ('a' in jsonData[1]) {
    apiUpdateBook('ask', jsonData[1].a)
  }
  if ('bs' in jsonData[1]) {
    apiUpdateBook('bid', jsonData[1].bs)
  }
  if ('b' in jsonData[1]) {
    apiUpdateBook('bid', jsonData[1].b)
  }

  const formattedData = getForVisualisation()

  subject.next(formattedData)
})
