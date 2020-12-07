class ProfitVis {


    constructor(_parentElement, _data, _eventHandler) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.eventHandler = _eventHandler
        this.filteredData = this.data;

        this.initVis();
    }


    /*
     * Initialize visualization
     */

    initVis() {
        let vis = this;

        vis.margin = {top: 30, right: 20, bottom: 30, left: 100};

        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
            vis.height = 500 - vis.margin.top - vis.margin.bottom;

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

        /*
         Scales and axes
         */
        vis.x = d3.scaleBand()
            .range([0, vis.width]);

        vis.xBarLoc = d3.scaleLinear()
            .range([0, vis.width]);

        vis.yBarsPos = d3.scaleLinear();

        vis.yBarsNeg = d3.scaleLinear();

        vis.yAxisScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()

        vis.yAxis = d3.axisLeft();

        // Rect for selection clear
        vis.rectClear = vis.svg.append("rect")
            .attr("class", "clear-selection")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .attr("x", 0)
            .attr("y", 0)
            .attr("opacity", 0);

        // group for bar chart bars
        vis.barGroup = vis.svg.append("g")
            .attr("class", "bars")

        // Append axis groups
        vis.svg.append("g")
            .attr("class", "x-axis axis");
        vis.svg.append("g")
            .attr("class", "y-axis axis");

        // Axis title
        vis.svg.append("text")
            .attr('class', 'axis-title')
            .attr("x", 0)
            .attr("y", -12)
            .attr('text-anchor', 'middle')
            .attr('fill', vis.colors.navy)
            .text("Avg. Profit");

        // Add text for when data is missing
        vis.emptyDataText = vis.svg.append('text')
            .attr('class', 'profit-empty-text')
            .attr('x', vis.width/2)
            .attr('y', vis.height/2)
            .attr('text-anchor', 'middle')
            .attr('fill', vis.colors.darkOrange)
            .text("Sorry, we don't have data for this time range :(")
            .attr('opacity', 0)

        // initialize with animation selected
        vis.selectedBar = 'Animation'
        vis.clickedBar = 'Animation'
        vis.clickedBarClass = 'animation'
        vis.clickedBarColor = 'blue'

        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    wrangleData(){
        let vis = this;

        vis.genreProfits = {}
        vis.genreCount = {}
        vis.genresList = []

        // find profit for each movie
        vis.filteredData.forEach((d) => {
            let profit = d.revenue - d.budget

            if (profit){
                d.genres.forEach((genre) => {
                    if (vis.genreProfits[genre['name']]) {
                        vis.genreProfits[genre['name']] = vis.genreProfits[genre['name']] + profit;
                        vis.genreCount[genre['name']] = vis.genreCount[genre['name']] + 1;
                    }
                    else {
                        vis.genreProfits[genre['name']] = profit;
                        vis.genreCount[genre['name']] = 1
                    }

                    vis.genresList = []

                    //console.log(vis.genresList.includes(genre))
                    if (!vis.genresList.includes(genre['name'])) {
                        vis.genresList.push(genre['name'])
                    }
                })

            }

        })

        vis.adjProfit = []

        // make object of profits and genres
        for (var k in vis.genreProfits) {
            let genreDict = {
                'genre':  k,
                'ppm': vis.genreProfits[k]/vis.genreCount[k]
            };
            vis.adjProfit.push(genreDict)
        }

        this.filteredData = vis.adjProfit.sort((a,b) => {
            return (b.ppm - a.ppm)
        })

        vis.updateVis()
    }

    updateVis(){
        let vis = this;

        // check if data is empty
        if (vis.filteredData.length < 1) {
            vis.svg.select(".x-axis")
                .attr('opacity', 0)

            vis.emptyDataText
                .transition()
                .duration(600)
                .attr('opacity', 1)
        }
        else {
            vis.svg.select(".x-axis")
                .attr('opacity', 1)

            vis.emptyDataText
                .transition()
                .duration(600)
                .attr('opacity', 0)
        }

        // x axis scale
        vis.x.domain(vis.filteredData.map(d => {return d.genre}))

        // scale for x axis placement
        vis.yAxisScale.domain(d3.extent(vis.filteredData, d=>d.ppm))

        // Scales for pos and neg bars
        vis.yBarsPos
            .range([0, vis.yAxisScale(0)])
            .domain([0, d3.max(vis.filteredData, d => d.ppm)])
        vis.yBarsNeg
            .range([0, vis.height - vis.yAxisScale(0)])
            .domain([0, d3.min(vis.filteredData, d => d.ppm)])

        // scale axes
        vis.xAxis.scale(vis.x)
        vis.yAxis.scale(vis.yAxisScale)

        // Define inter-bar padding amount
        let barPadding = 6

        vis.xBarLoc
            .domain(Array.from(Array(vis.filteredData.length).keys()))

        // reset chart when back clicked
        vis.rectClear
            .on("click", function (){
                vis.selectedBar = 'Movie'
                vis.clickedBar = 'Movie'
                vis.clickedBarClass = 'None'

                vis.svg.selectAll(".bar")
                    .attr('opacity', 1)

                $(vis.eventHandler).trigger("focusChanged", [vis.selectedBar, 'blue']);
            })

        // Bar Chart Bars
        let bars = vis.barGroup
            .selectAll('rect')
            .data(vis.filteredData);

        bars.enter()
            .append('rect')
            .on('mouseover', function(event, d){
                vis.selectedBar = d.genre
                vis.svg.selectAll(".bar")
                    .attr('opacity', .6)

                d3.select(this)
                    .attr('opacity', 1)

                let currColor = 'blue'
                if (d.ppm < 0) {currColor = 'orange'}

                $(vis.eventHandler).trigger("focusChanged", [vis.selectedBar, currColor]);
            })
            .on('mouseout', function(event, d){
                if (vis.clickedBarClass !== 'None') {
                    vis.selectedBar = vis.clickedBar
                    vis.svg.selectAll(".bar")
                        .attr('opacity', .6)

                    console.log(vis.clickedBarClass)
                    vis.svg.select("." + vis.clickedBarClass)
                        .attr('opacity', 1)

                    $(vis.eventHandler).trigger("focusChanged", [vis.selectedBar, vis.clickedBarColor]);
                }
                else {
                    vis.selectedBar = 'Movie'

                    vis.svg.selectAll(".bar")
                        .attr('opacity', 1)

                    $(vis.eventHandler).trigger("focusChanged", [vis.selectedBar, 'blue']);
                }
            })
            .on('click', function(event, d){
                vis.clickedBar = d.genre

                vis.revertColors(vis.filteredData)

                if (d.ppm < 0) {vis.clickedBarColor = 'orange'}
                else {vis.clickedBarColor = 'blue'}

                vis.clickedBarClass = d.genre.replace(/\s+/g, '-').toLowerCase()
                vis.svg.selectAll(".bar")
                    .attr('opacity', .6)

                d3.select(this)
                    .attr('opacity', 1)
                    .attr('fill', vis.colors[vis.clickedBarColor])

                $(vis.eventHandler).trigger("focusChanged", [vis.clickedBar, vis.clickedBarColor]);
            })
            .merge(bars)
            .transition()
            .duration(600)
            .attr('class', d => {
                return d.genre.replace(/\s+/g, '-').toLowerCase() + ' bar'
            })
            .attr('x', d => vis.x(d.genre)+barPadding/2)
            .attr('y', d => {
                if (d.ppm>=0) {return vis.yAxisScale(0) - vis.yBarsPos(d.ppm)}
                else{return vis.yAxisScale(0)}
            })
            .attr('width', (vis.width/vis.filteredData.length)-barPadding)
            .attr('height', d => {
                if (d.ppm>=0) {return vis.yBarsPos(d.ppm)}
                else{return vis.yBarsNeg(d.ppm)}
            })
            .attr('fill', d => {
                // Blue for positive profit
                if (d.ppm > 0) {return vis.colors.blue}
                //orange for negative profit
                else {return vis.colors.orange}
            })
            .attr('opacity', d => {
                if (d.genre === vis.selectedBar || vis.selectedBar === 'Movie') {
                    return 1
                }
                else {return .6}
            })

        bars.exit().remove();

        // Call axis function with the new domain
        vis.svg.select(".x-axis")
            .attr('display', 'block')
            .transition()
            .duration(600)
            .attr("transform", "translate(0," + vis.yAxisScale(0) + ")")
            .call(vis.xAxis);
        vis.svg.select(".y-axis")
            .transition()
            .duration(600)
            .call(vis.yAxis);

        // Flip axis labels for negative bars
        let xTicks = d3.selectAll('.x-axis .tick line')
        let xText = d3.selectAll('.x-axis .tick text')
        vis.filteredData.forEach((d, i) => {
            console.log(d, i)
            if (d.ppm < 0){
                d3.select(xTicks.nodes()[i])
                    .attr("transform", 'translate(0, -5)');
                d3.select(xText.nodes()[i])
                    .attr("transform", 'translate(0, -28)');
            }
            else{
                d3.select(xTicks.nodes()[i])
                    .attr("transform", 'translate(0, 0)');
                d3.select(xText.nodes()[i])
                    .attr("transform", 'translate(0, 0)');
            }
        })
    }

    onSelectionChange (selectionStart, selectionEnd){
        let vis = this;

        // Filter data depending on selected time period (brush)
        vis.filteredData = vis.data.filter(function(d){
            return (selectionStart <= d.release_date.getFullYear() && d.release_date.getFullYear() <= selectionEnd)
        });

        vis.wrangleData();
    }

    revertColors (data){
        let vis = this;

        data.forEach(d => {
            let currBarClass = d.genre.replace(/\s+/g, '-').toLowerCase()
            console.log(currBarClass)
            vis.svg.select("." + currBarClass)
                .transition().duration(600)
                .attr('fill', function(){
                    // Blue for positive profit
                    if (d.ppm > 0){
                        return vis.colors.blue
                    }
                    //orange for negative profit
                    else {return vis.colors.orange}
            })
        })
    }
}