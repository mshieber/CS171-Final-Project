class ProfitVis {


    constructor(_parentElement, _data, _eventHandler) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.eventHandler = _eventHandler
        this.filteredData = this.data;

        this.initVis();
    }


    /*
     * Initialize visualization (static content, e.g. SVG area or axes)
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

        // Scales and axes
        vis.x = d3.scaleBand()
            .range([0, vis.width]);
        //.paddingInner(0.2);

        vis.xBarLoc = d3.scaleLinear()
            .range([0, vis.width]);

        vis.yBarsPos = d3.scaleLinear();

        vis.yBarsNeg = d3.scaleLinear();

        vis.yAxisScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()

        vis.yAxis = d3.axisLeft();

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
            .text("Avg PPM");

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
        vis.clickedBarClass = 'None'
        vis.clickedBarColor = vis.colors.blue

        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    wrangleData(){
        let vis = this;

        vis.genreProfits = {}
        vis.genreCount = {}
        vis.genresList = []

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

        for (var k in vis.genreProfits) {
            // check if the property/key is defined in the object itself, not in parent
            let genreDict = {
                'genre':  k,
                'ppm': vis.genreProfits[k]/vis.genreCount[k]
            };
            //genreDict[k] = vis.genreProfits[k]/vis.genreCount[k]
            vis.adjProfit.push(genreDict)
        }

        this.filteredData = vis.adjProfit.sort((a,b) => {
            return (b.ppm - a.ppm)
        })

        vis.updateVis()
    }

    updateVis(){
        let vis = this;

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

        console.log('FILTERED:', vis.filteredData)
        vis.x.domain(vis.filteredData.map(d => {return d.genre}))

        vis.yAxisScale.domain(d3.extent(vis.filteredData, d=>d.ppm))

        vis.yBarsPos
            .range([0, vis.yAxisScale(0)])
            .domain([0, d3.max(vis.filteredData, d => d.ppm)])
        vis.yBarsNeg
            .range([0, vis.height - vis.yAxisScale(0)])
            .domain([0, d3.min(vis.filteredData, d => d.ppm)])

        vis.xAxis.scale(vis.x)
        vis.yAxis.scale(vis.yAxisScale)

        let barPadding = 6
        let barwidth = (vis.width/vis.filteredData.length)-barPadding

        vis.xBarLoc
            .domain(Array.from(Array(vis.filteredData.length).keys()))

        // Bar Chart Bars
        let bars = vis.svg
            .selectAll('rect')
            .data(vis.filteredData);

        let makeBars = bars.enter()
            .append('rect')
            .on('mouseover', function(event, d){
                vis.selectedBar = d.genre
                vis.svg.selectAll(".bar")
                    .attr('opacity', .6)

                d3.select(this)
                    .attr('opacity', 1)

                $(vis.eventHandler).trigger("focusChanged", [vis.selectedBar, 'blue']);
            })
            .on('mouseout', function(event, d){
                if (vis.clickedBarClass != 'None') {
                    vis.svg.selectAll(".bar")
                        .attr('opacity', .6)

                    console.log(vis.clickedBarClass)
                    vis.svg.select("." + vis.clickedBarClass)
                        .attr('opacity', 1)

                    $(vis.eventHandler).trigger("focusChanged", [vis.selectedBar, 'purp']);
                }
                else {
                    vis.selectedBar = 'Movie'

                    vis.svg.selectAll(".bar")
                        .attr('opacity', .6)

                    $(vis.eventHandler).trigger("focusChanged", [vis.selectedBar, 'blue']);
                }
            })
            .on('click', function(event, d){
                vis.selectedBar = d.genre

                console.log(vis.clickedBarColor)
                console.log(d)

                vis.svg.select("." + vis.clickedBarClass)
                    .attr('fill', vis.clickedBarColor)

                if (d.ppm < 0) {vis.clickedBarColor = vis.colors.orange}
                else {vis.clickedBarColor = vis.colors.blue}

                vis.clickedBarClass = d.genre.replace(/\s+/g, '-').toLowerCase()
                vis.svg.selectAll(".bar")
                    .attr('opacity', .6)

                d3.select(this)
                    .attr('opacity', 1)
                    .attr('fill', vis.colors.purp)

                $(vis.eventHandler).trigger("focusChanged", [vis.selectedBar, 'purp']);
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
            .attr('width', barwidth)
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
                if (d.genre === vis.selectedBar) {
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
}