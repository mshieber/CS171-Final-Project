// BARCHART CLASS FOR TOP TEN GROSSING

/* ISSUES TO FIX/THINGS TO DO:

- long titles towards the left will clip
- would be nice to add text explaining more insights
    - EXAMPLE INSIGHT: in this dataset, the first animated movie to hit the top ten is
        "Who Framed Roger Rabbit" in 1988
    - then the effects of the Disney Renaissance took effect with "The Little Mermaid" the following year
- add a label for number of highest-grossing films that are animated
- add axis labels
- make it look good instead of bad

 */


class GrossingVis {

    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.displayData = [];

        this.initVis();
    }



    /*
     * Initialize visualization (static content; e.g. SVG area, axes)
     */

    initVis() {
        let vis = this;

        vis.margin = {top: 30, right: 60, bottom: 120, left: 120};

        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
            vis.height = 500 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Scales and axes
        vis.x = d3.scaleBand()
            .rangeRound([0, vis.width])
            .paddingInner(0.1);

        vis.y = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        // Attaching Axes
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }




    /*
     * Data wrangling
     */

    wrangleData() {
        let vis = this;

        vis.displayData = []

        vis.selected = document.getElementById('year-select').value
        //console.log(vis.selection)
        //vis.selected = "2008"

        // Filter data on selection, only graph data for the chosen year
        this.data.forEach( item => {
            if (item.year == vis.selected) {
                this.displayData.push(item)
            }
        })

        // Sorting by rank
        this.displayData.sort((a, b) => a['rank_in_year']-b['rank_in_year'])

        console.log(this.displayData)


        vis.updateVis();
    }



    /*
     * The drawing function - should use the D3 update sequence (enter, update, exit)
     */

    updateVis() {
        let vis = this;


        // (1) Update domains
        // (2) Draw rectangles
        // (3) Draw labels
        vis.x.domain(vis.displayData.map(d => d.title))
        vis.y.domain([0, d3.max(vis.displayData, d=> d.worldwide_gross)])

        // Update title
        vis.titleText = vis.svg.selectAll(".title-label")
            .data(vis.displayData)

        vis.titleText.enter().append("text")
            .attr("class", "title-label")
            .attr("fill", "black")
            .attr("x", vis.width/2)
            .merge(vis.titleText)
            .text("TOP 10 GROSSING MOVIES FOR " + document.getElementById('year-select').value.toString())
        
        vis.titleText.exit().remove()

        // ENTER UPDATE EXIT SEQUENCE FOR BAR GRAPH
        vis.bars = vis.svg.selectAll("rect")
            .data(vis.displayData);

        vis.bars.enter().append("rect")
            .attr("class", "bar")
            .attr("x", 0)

            .merge(vis.bars)
            .transition(800)
            .attr("fill", d => {
                if (d.Genres.includes("Animation")) {
                    return "red"
                } else {
                    return "blue"
                }
            })
            .attr("width", vis.x.bandwidth())
            .attr("height", d => vis.height - vis.y(d.worldwide_gross))
            .attr("y", d => vis.y(d.worldwide_gross))
            .attr("x", d=> vis.x(d.title))

        vis.bars.exit().remove()

        /*
        // Adding labels
        vis.labels = vis.svg.selectAll("text.title-label")
            .data(vis.displayData, d=>d.value)

        vis.labels.enter()
            .append("text")
            .attr("class", "title-label")
            .text(d => d.title)
            .attr("y", (d, i) => (i * (vis.height/vis.displayData.length)) + 20)
            .attr("x", d => vis.x(d.title) + 10)
            .attr("fill", "black")

        vis.labels.exit().remove()

         */

        // * TO-DO *
        // Filter data accordingly without changing the original data


        // Update the y-axis
        vis.svg.select(".x-axis").call(vis.xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {
                return "rotate(-25)"
            })
        vis.svg.select(".y-axis").call(vis.yAxis);


    }



    /*
     * Filter data when the user changes the selection
     * Example for brushRegion: 07/16/2016 to 07/28/2016
     */
}