class AreaVis {

    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = this.data;

        this.initVis();


    }


    /*
     * Initialize visualization (static content; e.g. SVG area, axes, brush component)
     */

    initVis() {
        let vis = this;

        vis.margin = {top: 40, right: 20, bottom: 40, left: 100};

        vis.width = $('#' + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = 300 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Append path element for area
        vis.svg.append("path")
            .attr('class', 'area-path')

        // Append group for x-axis
        vis.svg.append('g')
            .attr('class', 'axis area-x-axis')
            .attr('transform', 'translate(0,' + vis.height + ')')

        // Append group for y-axis
        vis.svg.append('g')
            .attr('class', 'axis area-y-axis');

        // Scales and axes
        vis.xScale = d3.scaleTime()
            .range([0, vis.width])

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0])

        vis.xAxis = d3.axisBottom()

        vis.yAxis = d3.axisLeft()

        vis.area = d3.area()
            .curve(d3.curveCardinal)
            .y0(vis.height)

        // Initialize brush component
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.width, vis.height]])
            //.on("brush", brushed);

        // Append brush component here
        vis.svg.append("g")
            .attr("class", "brush")
            .call(vis.brush)
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", vis.height + 7);

        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }


    /*
     * Data wrangling
     */

    wrangleData() {
        let vis = this;

        // (1) Group data by date and count survey results for each day
        // (2) Sort data by day

        vis.sortedData = vis.displayData.sort(function (a,b) {
            b.release_date - a.release_date
        })
        console.log("sorted", vis.sortedData)
        vis.dataYears = []
        vis.displayData.forEach((d) => {
            if (!vis.dataYears.includes(d.release_date.getFullYear())){
                vis.dataYears.push(d.release_date.getFullYear())
            }
        })
        console.log(vis.dataYears)

        // prep data
        let moviesCount = d3.rollup(vis.data,
            leaves=> {
                let sum = 0;
                leaves.forEach(d => sum += d.revenue);
                return sum;
            },
            d => +d.release_date.getFullYear());
        let moviesCountArr = Array.from(moviesCount, ([key, value]) => ({key, value}));
        console.log(moviesCountArr)
        moviesCountArr.sort(function (a,b) {
            return (a.key - b.key)})

        vis.displayData = moviesCountArr

        // Update the visualization
        vis.updateVis();
    }


    /*
     * The drawing function
     */

    updateVis() {
        let vis = this;

        // * TO-DO *
        vis.xScale
            .domain(d3.extent(vis.displayData, d => d.key));

        vis.yScale
            .domain([0, d3.max(vis.displayData, d => d.value)]);

        vis.xAxis
            .scale(vis.xScale);

        vis.yAxis
            .scale(vis.yScale);

        // define area of area chart
        vis.area
            .x(d => vis.xScale(d.key))
            .y1(d => vis.yScale(d.value))

        vis.svg.select(".area-path")
            .datum(vis.displayData)
            .attr("class", "area")
            .attr("d", vis.area)
            .attr('fill', 'steelblue')

        // Call brush component here
        vis.brush
            .on("brush", function(event){
                // User just selected a specific region
                vis.currentBrushRegion = event.selection;
                console.log(vis.currentBrushRegion)
                vis.currentBrushRegion = vis.currentBrushRegion.map(vis.xScale.invert);
                console.log(vis.currentBrushRegion)

                // 3. Trigger the event 'selectionChanged' of our event handler
                $(vis.eventHandler).trigger("selectionChanged", vis.currentBrushRegion);
            });

        // Update the x-axis
        vis.svg.select(".area-x-axis").call(vis.xAxis);
        // Update the y-axis
        vis.svg.select(".area-y-axis").call(vis.yAxis);
    }
}