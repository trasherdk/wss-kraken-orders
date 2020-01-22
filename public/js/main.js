/* global constants */
//const WS_URL = "ws://localhost:8080";

/* graphical constants */
const TRANSITION_DURATION = 20;

const margin = { left: 0, right: 200, top: 80, bottom: 80 };

const width = 500 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const t = d3.transition().duration(TRANSITION_DURATION);

const g = d3.select("#chart-area")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

// X axis is on top by default:
const xAxisGroup = g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")");

const yAxisGroup = g.append("g")
    .attr("class", "y axis")
    .attr("transform", "translate(" + width + ", 0)");;

// X Scale
const x = d3.scaleLinear()
    .range([width, 0]);

// Y Scale
const y = d3.scaleBand()
    .range([height, 0])
    .padding(0.1);

// Define the div for the tooltip
const div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

const mouseOverTouchStart = d => {
    div.transition()
        .duration(TRANSITION_DURATION)
        .style("opacity", .9);
    div.html(d.price + "€" + ", " + Math.trunc(d.volume))
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY) + "px");
}

const mouseOutTouchEnd = d => {
    div.transition()
        .duration(TRANSITION_DURATION)
        .style("opacity", 0);
}

let resolvedPriceText;
let resolvedPriceLine;

//let socket = new WebSocket(WS_URL);
let socket = io();

socket.on('connect', msg => {
    console.log("connexion established");
})

socket.on('message', function(data){
    updateVisualisation(data["orderBook"], data["resolvedPrice"])
  });

  socket.on("disconnect", function(){
    document.getElementById("info").innerHTML = "WS closed. Please reload"
      console.log('disconnect');
      /*
    if (event.wasClean) {
        console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
        console.log('[close] Connection died');
    }
    */
});

socket.on("error", function(){
    console.log(`[error] ${error.message}`);
});




/**
 * Updates the graph from the transformed data
 * 
 * @param {Array} data the transformed data
 */
function updateVisualisation(data, resolvedPrice) {

    y.domain(data.map(d => d.price));
    x.domain([0, d3.max(data, d => d.volume)])

    // X Axis
    var xAxisCall = d3.axisBottom(x)
    xAxisGroup.transition(t)
        .attr("class", "axisWhite")
        .call(xAxisCall)
        .selectAll("text")
            .attr("y", 0)
            .attr("x", 10)
            .attr("dy", "1em")
            .attr("transform", "rotate(45)")
            .style("text-anchor", "start")
            .style("font-size", "14px");

    // Y Axis
    var yAxisCall = d3.axisRight(y)
        .tickValues([])
        /*.tickFormat(d => (d + "€"))*/;
    yAxisGroup.transition(t)
        .attr("class", "axisWhite")
        .call(yAxisCall);

    // JOIN new data with old elements.
    var rects = g.selectAll("rect")
        .data(data, d => d.price);

    // EXIT old elements not present in new data.
    rects.exit()
        /*.transition(t)*/
        .attr("x", x(0))
        .attr("width", 0)
        .remove();

    // ENTER new elements present in new data...
    rects.enter()
        .append("rect")
        .attr("class", d => (d.type === "ask" ? "ask-rect" : "bid-rect"))
        .attr("x", x(0))
        .attr("width", 0)
        .attr("y", d => y(d.price))
        .attr("height", y.bandwidth)
        .on("mouseover", mouseOverTouchStart)
        .on("mouseout", mouseOutTouchEnd)
        .on("touchstart", mouseOverTouchStart)
        .on("touchend", mouseOutTouchEnd)
        // AND UPDATE old elements present in new data.
        .merge(rects)
        .transition(t)
        .attr("y", d => y(d.price))
        .attr("height", y.bandwidth)
        .attr("x", d => x(d.volume))
        .attr("class", d => (d.type === "ask" ? "ask-rect" : "bid-rect"))
        .attr("width", d => (width - x(d.volume)));

    if (resolvedPriceText) {
        resolvedPriceText.remove();
    }

    resolvedPriceText = g.append("text")
        .attr("y", y(resolvedPrice))
        .attr("x", width + 50)
        .attr("fill", "white")
        .attr("font-size", "28px")
        .text(resolvedPrice + "€");

    if (resolvedPriceLine) {
        resolvedPriceLine.remove();
    }
    resolvedPriceLine = g.append("line")
        .style("stroke", "white")
        .style("z-index", "-1")
        .attr("x1", width)
        .attr("y1", y(resolvedPrice))
        .attr("x2", width + 50)
        .attr("y2", y(resolvedPrice));
}
