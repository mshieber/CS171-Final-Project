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
        vis.margin = {top: 100, right: 30, bottom: 30, left: 30};

        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
            vis.height = 700 - vis.margin.top - vis.margin.bottom;

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

        // NOTE: The following genres are the five least populous genres, and are combined into "Other"
        // OTHER GENRES: TV Movie, Western, Documentary, War, History
        vis.replaceList = ["TV Movie", "Western", "Documentary", "War", "History", "Music"]

        // Replacing the five miscellaneous genres in genresList with "Other"
        vis.genresList = vis.genresList.filter(function(value, index, arr){
            return !(vis.replaceList.includes(value))
        })

        vis.genresList.push("Other")

        // Helper function that returns "Other" if the genre is in the miscellaneous category, and returns the genre otherwise
        function genreClassify(genre) {
            if (vis.replaceList.includes(genre)) {
                return "Other"
            } else {
                return genre
            }
        }

        console.log("HERE'S SOME GENRES")
        console.log(vis.genresList)

        // Initializing a matrix
        vis.genresList.forEach( item => {
            vis.displayData[item] = {}
            vis.genresList.forEach( subItem => {
                vis.displayData[item][subItem] = 0
            })
        })

        // Go through each pair of genres
        vis.data.forEach(item => {
            pairs(item.genres).forEach( pair => {
                let pairFirst = genreClassify(pair[0].name)
                let pairSecond = genreClassify(pair[1].name)

                vis.displayData[pairFirst][pairSecond] = vis.displayData[pairFirst][pairSecond] + 1;
                vis.displayData[pairSecond][pairFirst] = vis.displayData[pairSecond][pairFirst] + 1;

                //
            })
        })

        vis.matrix = []

        // Assembling everything into a final matrix
        Object.keys(vis.displayData).forEach(row => {
            let chosenRow = vis.displayData[row]
            let array = []
            Object.keys(vis.displayData).forEach(subRow => {
                array.push(chosenRow[subRow])
            })
            vis.matrix.push(array)
        })

        // Helper function that, given an array, returns all pairs of the array
        function pairs(arr) {
            var res = [],
                l = arr.length;
            for(var i=0; i<l; ++i)
                for(var j=i+1; j<l; ++j)
                    res.push([arr[i], arr[j]]);
            return res;
        }

        // Adding a tooltip element
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'chordTooltip')

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

        vis.res = d3.chord()
            .padAngle(0.05)
            .sortSubgroups(d3.descending)
            (vis.matrix)

        /*
        // give this matrix to d3.chord(): it will calculates all the info we need to draw arc and ribbon
        vis.res = d3.chord()
            .padAngle(0.05)
            .sortSubgroups(d3.descending)
            (vis.matrix)

         */

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
            .attr("opacity", function(d) {
                if (d.source.index == 0) {
                    return 1.0
                } else {
                    return 0.4
                }
            })
            .style("fill", function(d) {
                if (vis.genresList[d.source.index] == "Animation") {
                    return "#024059"
                } else {
                    return "#69b3a2"
                }
            })

            /*
            .style("fill", "#69b3a2")

             */
            .style("stroke", "black")
            .style("stroke-width", .5)
            /*
            .on("mouseover", vis.showTooltip )
            .on("mouseleave", vis.hideTooltip )

             */
            .on('mouseover', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '2px')
                    .attr('stroke', 'black')
                    .attr('fill', "black");
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`<div style="border: thin solid grey; border-radius: 5px; background: lightgrey; padding: 20px">
                        <p>Genres: ${vis.genresList[d.source.index]}, ${vis.genresList[d.target.index]}</p><br>
                        <p>Number of movies: ${vis.displayData[vis.genresList[d.source.index]][vis.genresList[d.target.index]]}</p>
                        </div>`)
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('stroke-width', '0px')
                    .attr("fill", "#69b3a2")
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })
        ;

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

        vis.group.append("text")
            .each(d => (d.angle = (d.startAngle + d.endAngle) / 2))
            .attr("dy", "0.35em")
            .attr("transform", d => `
        rotate(${(d.angle * 180 / Math.PI - 90)})
        translate(${vis.radius + 10})
        ${d.angle > Math.PI ? "rotate(180)" : ""}
      `)
            .attr("text-anchor", d => d.angle > Math.PI ? "end" : null)
            .text(d => vis.genresList[d.index]);

    }



}