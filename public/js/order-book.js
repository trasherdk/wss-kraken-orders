const orderBook = (function () {
    'use strict';

    /* graphical constants */
    const TRANSITION_DURATION = 100;

    const margin = { left: 75, right: 75, top: 30, bottom: 80 };
    const width = 400 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    const resolvedPriceLineLength = 250;

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
    let ALL_TIME_MAX_VOLUME = null;

    return {

        /**
         * Updates the graph from the transformed data
         * 
         * @param {Array} data the transformed data
         */
        updateVisualisation: function (data, resolvedPrice) {

            let dataMaxVolume = d3.max(data, d => d.volume);
            let max = Math.max(ALL_TIME_MAX_VOLUME, dataMaxVolume);
            ALL_TIME_MAX_VOLUME = max;

            y.domain(data.map(d => d.price));
            x.domain([0, max])

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
            g.selectAll("rect")
                .data(data, d => d.price)
                .join(
                    // ENTER new elements present in new data...
                    enter => enter.append("rect")
                        .attr("class", d => (d.type === "ask" ? "ask-rect" : "bid-rect"))
                        .attr("x", x(0))
                        .attr("width", 0)
                        .attr("y", d => y(d.price))
                        .attr("height", y.bandwidth)
                        .on("mouseover", mouseOverTouchStart)
                        .on("mouseout", mouseOutTouchEnd)
                        .on("touchstart", mouseOverTouchStart)
                        .on("touchend", mouseOutTouchEnd)
                        .call(
                            enter => enter.transition().duration(TRANSITION_DURATION)
                                .attr("x", d => x(d.volume))
                                .attr("width", d => (width - x(d.volume)))
                        ),
                    // UPDATE old elements present in new data.
                    update => update
                        .transition().duration(TRANSITION_DURATION)
                        .attr("y", d => y(d.price))
                        .attr("height", y.bandwidth)
                        .attr("class", d => (d.type === "ask" ? "ask-rect" : "bid-rect"))
                        .attr("x", d => x(d.volume))
                        .attr("width", d => (width - x(d.volume)))
                        ,
                    // EXIT old elements not present in new data.
                    exit => exit.attr("x", x(0))
                        .attr("width", 0)
                        .remove()
                );

            if (resolvedPriceText) {
                resolvedPriceText.remove();
            }

            resolvedPriceText = g.append("text")
                .attr("y", y(resolvedPrice))
                .attr("x", width - resolvedPriceLineLength)
                .attr("fill", "white")
                .attr("font-size", "28px")
                .text(resolvedPrice + "€");

            if (resolvedPriceLine) {
                resolvedPriceLine.remove();
            }
            resolvedPriceLine = g.append("line")
                .style("stroke", "white")
                .style("z-index", "-1")
                .attr("x1", width - resolvedPriceLineLength)
                .attr("x2", width)
                .attr("y1", y(resolvedPrice) + y.bandwidth() / 2)
                .attr("y2", y(resolvedPrice) + y.bandwidth() / 2);
        }
    };
})();
