// CHORDVIS FOR CROSS-GENRE INTERACTION

/*
TO DO:
    -Add labels
    -Tooltip/hovering
    -Colors
 */

class ChordVis {

    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.displayData = [];

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Creating margins
        vis.margin = {top: 30, right: 30, bottom: 30, left: 30};

        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
            vis.height = 500 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")");

        vis.wrangleData()
    }

    wrangleData() {
        let vis = this;

        // **************** FINDING THE LIST OF GENRES *****************

        console.log("HERE'S THE LIST OF GENRES")
        vis.genresList = []

        // Find out which genres are listed
        this.data.forEach( item => {
            item.genres.forEach( genre => {

                //console.log(vis.genresList.includes(genre))
                if (vis.genresList.includes(genre.name)) {
                    //console.log("naw")
                } else {
                    vis.genresList.push(genre.name)
                }
            })
        })

        console.log(vis.genresList)

        // **************** CREATING A MATRIX *********************

        // Initializing a matrix
        vis.genresList.forEach( item => {
            vis.displayData[item] = {}
            vis.genresList.forEach( subItem => {
                vis.displayData[item][subItem] = 0
            })
        })

        console.log(vis.displayData)

        // Going through each pair of genres, creating a display data matrix
        console.log("SAMPLE DATA")
        console.log(vis.sampleData)
        // Go through each pair of genres
        vis.data.forEach(item => {
            pairs(item.genres).forEach( pair => {
                let pairFirst = pair[0].name
                let pairSecond = pair[1].name

                vis.displayData[pairFirst][pairSecond] = vis.displayData[pairFirst][pairSecond] + 1;
                vis.displayData[pairSecond][pairFirst] = vis.displayData[pairSecond][pairFirst] + 1;
            })
        })

        console.log(vis.displayData)

        console.log('clean up')

        vis.matrix = []

        Object.keys(vis.displayData).forEach(row => {
            let chosenRow = vis.displayData[row]
            let array = []
            Object.keys(vis.displayData).forEach(subRow => {
                array.push(chosenRow[subRow])
            })
            vis.matrix.push(array)
        })

        console.log(vis.matrix)

        // Helper function that, given an array, returns all pairs of the array
        function pairs(arr) {
            var res = [],
                l = arr.length;
            for(var i=0; i<l; ++i)
                for(var j=i+1; j<l; ++j)
                    res.push([arr[i], arr[j]]);
            return res;
        }

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        // here is where the vis is created

        // Sample Matrix
        /*
        vis.matrix = [
            [ 0, 58, 89, 28, 20],
            [ 51, 0, 20, 61, 20],
            [ 80, 145, 0, 85, 20],
            [ 103, 99, 40, 0, 20],
            [ 103, 99, 40, 71, 0]
        ];

         */

        // vis.matrix = vis.displayData

        // give this matrix to d3.chord(): it will calculates all the info we need to draw arc and ribbon
        vis.res = d3.chord()
            .padAngle(0.05)
            .sortSubgroups(d3.descending)
            (vis.matrix)

        // Variable for the radius of the chord diagram
        vis.radius = (vis.height / 2) - vis.margin.top

        // Add the links between groups
        vis.svg
            .datum(vis.res)
            .append("g")
            .selectAll("path")
            .data(function(d) { return d; })
            .enter()
            .append("path")
            .attr("d", d3.ribbon()
                .radius(vis.radius)
            )
            .style("fill", "#69b3a2")
            .style("stroke", "black")
            .style("stroke-width", .5);

        // this group object use each group of the data.groups object
        vis.group = vis.svg
            .datum(vis.res)
            .append("g")
            .selectAll("g")
            .data(function(d) { return d.groups; })
            .enter()

        // add the group arcs on the outer part of the circle
        vis.group.append("g")
            .append("path")
            .style("fill", "grey")
            .style("stroke", "black")
            .attr("d", d3.arc()
                .innerRadius(vis.radius)
                .outerRadius(vis.radius + 5)
            )

        /*
        // Add the ticks
        vis.group.selectAll(".group-tick")
            .data(function(d) { return groupTicks(d, 25); })    // Controls the number of ticks: one tick each 25 here.
            .enter()
            .append("g")
            .attr("transform", function(d) { return "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + 200 + ",0)"; })
            .append("line")               // By default, x1 = y1 = y2 = 0, so no need to specify it.
            .attr("x2", 6)
            .attr("stroke", "black")

        // Add the labels of a few ticks:
        vis.group.selectAll(".group-tick-label")
            .data(function(d) { return groupTicks(d, 25); })
            .enter()
            .filter(function(d) { return d.value % 25 === 0; })
            .append("g")
            .attr("transform", function(d) { return "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + 200 + ",0)"; })
            .append("text")
            .attr("x", 8)
            .attr("dy", ".35em")
            .attr("transform", function(d) { return d.angle > Math.PI ? "rotate(180) translate(-16)" : null; })
            .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
            .text(function(d) { return d.value })
            .style("font-size", 9)

         */

        // Returns an array of tick angles and values for a given group and step.
        function groupTicks(d, step) {
            var k = (d.endAngle - d.startAngle) / d.value;
            return d3.range(0, d.value, step).map(function(value) {
                return {value: value, angle: value * k + d.startAngle};
            });
        }

    }



}