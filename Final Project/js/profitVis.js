class ProfitVis {


    constructor(_parentElement, _data) {
        this.parentElement = _parentElement;
        this.data = _data;
        this.filteredData = this.data;

        this.initVis();
    }


    /*
     * Initialize visualization (static content, e.g. SVG area or axes)
     */

    initVis() {
        let vis = this;

        vis.margin = {top: 20, right: 20, bottom: 40, left: 100};

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

        vis.yAxis = d3.axisLeft();

        vis.svg.append("g")
            .attr("class", "x-axis axis");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        // Axis title
        vis.svg.append("text")
            .attr("x", -100)
            .attr("y", -8)
            .text("Avg Profit per Movie");

        vis.emptyDataText = vis.svg.append('text')
            .attr('class', 'profit-empty-text')
            .attr('x', vis.width/2)
            .attr('y', vis.height/2)
            .attr('text-anchor', 'middle')
            .text('NO DATA TO DISPLAY')
            .attr('opacity', 0)

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

        /*vis.svg.append('line')
            .attr('class', 'x-line')
            .attr({ 'x1': 0, 'y1': vis.y(0),
                    'x2': vis.width, 'y2': vis.y(0)})*/

        let barPadding = 6
        let barwidth = (vis.width/vis.filteredData.length)-barPadding

        vis.xBarLoc
            .domain(Array.from(Array(vis.filteredData.length).keys()))

        // Bar Chart Bars
        let bars = vis.svg
            .selectAll('rect')
            .data(vis.filteredData);

        bars.enter()
            .append('rect')
            .attr('class', d => {
                return d.genre + ' bar'
            })
            .merge(bars)
            .transition()
            .duration(600)
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
                if (d.ppm > 0) {return 'steelblue'}
                else {return 'IndianRed'}
            })
            .attr('opacity', d => {
                if (d.genre == 'Animation') {
                    return 1
                }
                else {
                    return .6
                }
            })
            /*.on('mouseover', function(event, d){
                console.log(d)
                vis.svg.selectAll(".bar")
                    .attr('opacity', .6)

                d3.select(this)
                    .attr('opacity', 1)
            })*/

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

        // Filter data depending on selected time period (brush)
        vis.filteredData = vis.data.filter(function(d){
            return (selectionStart < d.release_date.getFullYear() && d.release_date.getFullYear() < selectionEnd)
        });

        vis.wrangleData();
    }
}