const orderBook = (function () {
    'use strict';

    const svg = d3.select('#chart-area')
        .append('svg')
        .attr('width', 400)
        .attr('height', 500);

    const xAxisGroup = svg.append("g")
        .attr("transform", "translate(0," + 400 + ")");

    // X Scale
    const x = d3.scaleLinear()
        .range([350, 0]);


    return {

        /**
         * Updates the graph from the transformed data
         * 
         * @param {Array} data the transformed data
         */
        updateVisualisation: function (data, resolvedPrice) {

            console.log(data);
            console.log(resolvedPrice);

            let max = d3.max(data, d => d.volume);

            x.domain([0, max]);

            var xAxisCall = d3.axisBottom(x);

            // X Axis
            var xAxisCall = d3.axisBottom(x);
            xAxisGroup
                .attr("class", "axisWhite")
                .call(xAxisCall)
                .selectAll("text")
                .attr("y", 0)
                .attr("x", 10)
                .attr("dy", "1em")
                .attr("transform", "rotate(45)")
                .style("text-anchor", "start")
                .style("font-size", "14px");

        }
    };
})();
