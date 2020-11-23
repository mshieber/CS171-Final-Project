class ProfitVis {


    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.filteredData = [];

        this.initVis();
    }


    /*
     * Initialize visualization (static content, e.g. SVG area or axes)
     */

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 20, left: 100};

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
            .range([0, vis.width]);
        //.paddingInner(0.2);

        vis.xBarLoc = d3.scaleLinear()
            .range([0, vis.width]);

        vis.yBarsPos = d3.scaleLinear();

        vis.yBarsNeg = d3.scaleLinear();

        vis.yAxisScale = d3.scaleLinear()
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .ticks(0);

        vis.yAxis = d3.axisLeft();

        vis.svg.append("g")
            .attr("class", "x-axis axis");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        // Axis title
        vis.svg.append("text")
            .attr("x", -100)
            .attr("y", -8)
            .text("Profit per Movie");


        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }

    wrangleData(){
        let vis = this;

        vis.genreProfits = {}
        vis.genreCount = {}

        vis.data.forEach((d) => {
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
                })
            }
        })
        console.log(vis.genreProfits)
        console.log(vis.genreCount)

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
        console.log(this.filteredData)

        vis.updateVis()
    }

    updateVis(){
        let vis = this;

        vis.x.domain(vis.filteredData.map(d => {return d.genre}))
        vis.yAxisScale.domain(d3.extent(vis.filteredData, d=>d.ppm))
        vis.yBarsPos
            .range([0, vis.yAxisScale(0)])
            .domain([0, d3.max(vis.filteredData, d => d.ppm)])
        vis.yBarsNeg
            .range([0, vis.height - vis.yAxisScale(0)])
            .domain([0, d3.min(vis.filteredData, d => d.ppm)])

        console.log(vis.height - vis.yAxisScale(0))
        vis.xAxis.scale(vis.x)
        vis.yAxis.scale(vis.yAxisScale)

        /*vis.svg.append('line')
            .attr('class', 'x-line')
            .attr({ 'x1': 0, 'y1': vis.y(0),
                    'x2': vis.width, 'y2': vis.y(0)})*/

        // Call axis function with the new domain
        vis.svg.select(".x-axis")
            .attr("transform", "translate(0," + vis.yAxisScale(0) + ")")
            .call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);

        let barPadding = 6
        let barwidth = (vis.width/vis.filteredData.length)-barPadding

        vis.xBarLoc
            .domain(Array.from(Array(vis.filteredData.length).keys()))

        // Bar Chart Bars
        let bars = vis.svg.selectAll('rect').data(vis.filteredData);
        bars.enter()
            .append('rect')
            .attr('class', 'bar')
            .merge(bars)
            .transition()
            .attr('width', barwidth)
            .attr('height', d => {
                if (d.ppm>=0) {return vis.yBarsPos(d.ppm)}
                else{return vis.yBarsNeg(d.ppm)}
            })
            .attr('x', d => vis.x(d.genre)+barPadding/2)
            .attr('y', d => {
                if (d.ppm>=0) {return vis.yAxisScale(0) - vis.yBarsPos(d.ppm)}
                else{return vis.yAxisScale(0)}
                })
            .attr('fill', d => {
                if (d.ppm > 0) {return 'steelblue'}
                else {return 'IndianRed'}
            })
        bars.exit().remove();

        // Bar Chart Bar Label
        /*let labels = vis.svg.selectAll('.bar-label').data(vis.filteredData);
        labels.enter()
            .append('text')
            .attr('class', 'bar-label')
            .merge(labels)
            .transition()
            .text(d => d.genre)
            .attr('y', d => vis.yBarsPos(d.ppm)+(barwidth/2)+barPadding)
            .attr('x', d => vis.x(d.genre)+5);
        labels.exit().remove();*/
    }

    onSelectionChange (selectionStart, selectionEnd){
        let vis = this;

        console.log(selectionStart, selectionEnd)
        // Filter data depending on selected time period (brush)
        vis.filteredData = vis.data.filter(function(d){
            return (selectionStart < d.release_date && d.release_date < selectionEnd)
        });
        console.log('brushed', vis.filteredData)

        vis.wrangleData();
    }
}