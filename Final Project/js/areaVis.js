class AreaVis {

    constructor(parentElement, data, eventHandler) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = [];
        this.eventHandler = eventHandler;

        this.initVis();


    }


    /*
     * Initialize visualization (static content; e.g. SVG area, axes, brush component)
     */

    initVis() {
        let vis = this;

        vis.margin = {top: 40, right: 40, bottom: 40, left: 100};

        vis.width = $('#' + vis.parentElement).width() - vis.margin.left - vis.margin.right;
        vis.height = 280 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.colors = {
            'navy':'#010D26',
            'blue':'#024059',
            'paleOrange': '#D98E04',
            'orange': '#F28705',
            'darkOrange': '#BF4904',
            'purp': '#8F2051'
        }

        // init pathGroup
        vis.pathGroup = vis.svg.append('g').attr('class','pathGroup');

        // init path one (average)
        vis.pathOne = vis.pathGroup
            .append('path')
            .attr("class", "pathOne");

        // init path two (single state)
        vis.pathTwo = vis.pathGroup
            .append('path')
            .attr("class", "pathTwo");

        // Append group for x-axis
        vis.svg.append('g')
            .attr('class', 'axis area-x-axis')
            .attr('transform', 'translate(0,' + vis.height + ')')

        // Append group for y-axis
        vis.svg.append('g')
            .attr('class', 'axis area-y-axis')

        // Axis title
        vis.svg.append("text")
            .attr('class', 'axis-title')
            .attr("x", 0)
            .attr("y", -12)
            .attr('text-anchor', 'middle')
            .attr('fill', vis.colors.navy)
            .text("Total Revenue");

        // Scales and axes
        vis.xScale = d3.scaleLinear()
            .range([0, vis.width])

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0])

        vis.keyScale = d3.scaleBand()
            .range([0, vis.width])

        vis.xAxis = d3.axisBottom()
            .tickFormat(d3.format("d"))

        vis.yAxis = d3.axisLeft()
            .ticks(8)

        // define area function
        vis.area = d3.area()
            .curve(d3.curveCardinal)
            .y0(vis.height)

        vis.areaColor = 'blue'

        // Initialize with animation selected
        vis.selectedGenre = 'Animation'

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

        vis.sortedData = vis.data.sort(function (a,b) {
            b.release_date - a.release_date
        })

        vis.dataYears = []
        vis.sortedData.forEach((d) => {
            if (!vis.dataYears.includes(d.release_date.getFullYear())){
                vis.dataYears.push(d.release_date.getFullYear())
            }
        })

        if (vis.selectedGenre == 'Movie'){
            vis.selectedData = vis.sortedData
        }
        else{
            vis.selectedData = vis.sortedData.filter(d => {
                let valList = []
                d.genres.forEach(obj => {
                    valList.push(obj.name)
                })
                return valList.includes(vis.selectedGenre)
            })
        }

        // sum revenue by year
        vis.dataSets = [vis.data, vis.selectedData]
        vis.moviesCountList = []

        for (let i in vis.dataSets){
            let moviesCount = d3.rollup(vis.dataSets[i],
                leaves => {
                    let sum = 0;
                    leaves.forEach(d => sum += d.revenue);
                    return sum;
                },
                d => +d.release_date.getFullYear());

            let moviesCountArr = Array.from(moviesCount, ([key, value]) => ({key, value}));
            moviesCountArr.sort(function (a,b) {
                return (a.key - b.key)})

            moviesCountArr = moviesCountArr.filter(d => d.key < 2017)
            /* remove last 3 years (not enough data in them)
            if (vis.selectedGenre !== 'Movie'){
                if (i == 0) {moviesCountArr.splice(-3,3)}
                else {moviesCountArr.pop()}
            }
            else{
                moviesCountArr.splice(-3,3)
            }*/

            vis.moviesCountList.push(moviesCountArr)
        }

        vis.displayData = vis.moviesCountList

        // Update the visualization
        vis.updateVis();
    }


    /*
     * The drawing function
     */

    updateVis() {
        let vis = this;

        vis.xScale
            .domain(d3.extent(vis.displayData[0], d => d.key));

        vis.yScale
            .domain([0, d3.max(vis.displayData[0], d => d.value)]);

        vis.xAxis
            .scale(vis.xScale)

        vis.yAxis
            .scale(vis.yScale);

        // define area of area chart
        vis.area
            .x(d => vis.xScale(d.key))
            .y1(d => vis.yScale(d.value))

        // draw pathOne
        vis.pathOne.datum(vis.displayData[0])
            .transition().duration(400)
            .attr("class", "area")
            .attr("d", vis.area)
            .attr('fill', vis.colors.blue)
            .attr('opacity', .6);

        // draw pathOne
        vis.pathTwo.datum(vis.displayData[1])
            .transition().duration(400)
            .attr("class", "area")
            .attr("d", vis.area)
            .attr('fill', vis.colors[vis.areaColor])
            .attr('opacity', 1);

        // Call brush component here
        vis.brush
            .on("brush", function(event){
                // User just selected a specific region
                vis.currentBrushRegion = event.selection;
                //console.log(vis.currentBrushRegion)
                vis.currentBrushRegion = vis.currentBrushRegion.map(vis.xScale.invert);
                //console.log(vis.currentBrushRegion)

                vis.pathTwo.attr('fill', vis.colors.blue)

                // 3. Trigger the event 'selectionChanged' of our event handler
                $(vis.eventHandler).trigger("selectionChanged", vis.currentBrushRegion);
            });

        d3.select(".brush")
            .on("click", function(event){

                d3.select(".selection").attr("width", 0)

                console.log('brush clicked')
                vis.currentBrushRegion = d3.extent(vis.data, d => d.release_date.getFullYear())
                // 3. Trigger the event 'selectionChanged' of our event handler
                $(vis.eventHandler).trigger("selectionChanged", vis.currentBrushRegion);
            })

        // Update the x-axis
        vis.svg.select(".area-x-axis").call(vis.xAxis);
        // Update the y-axis
        vis.svg.select(".area-y-axis").call(vis.yAxis);
    }

    onFocusChange (genre, color){
        let vis = this;

        // Define color of selected area (blue for hover, purple for clicked)
        vis.areaColor = color
        // Filter data depending on selected time period (brush)
        vis.selectedGenre = genre

        vis.wrangleData();
    }
}