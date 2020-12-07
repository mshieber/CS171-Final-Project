class BoxVis {


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

        /*vis.margin = {top: 30, right: 80, bottom: 30, left: 80};

        vis.width = $("#" + vis.parentElement).width() - vis.margin.left - vis.margin.right,
            vis.height = 700 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");*/

        vis.boxPlotDiv = document.getElementById(vis.parentElement)
        vis.boxPlotDiv.style.height = '650px'

        vis.colors = {
            'navy': '#010D26',
            'blue': '#024059',
            'paleOrange': '#D98E04',
            'orange': '#F28705',
            'darkOrange': '#BF4904',
            'purp': '#8F2051',
            'tan': '#F2E1C9',
        }

        vis.filter = "mean_vote"

        vis.layout = {
            title: 'Distribution of Movie Ratings by Genre',
            yaxis: {
                // autorange: true,
                showgrid: true,
                zeroline: true,
                range: [0,10],
                // dtick: 0,
                gridcolor: 'rgb(255, 255, 255)',
                gridwidth: 1,
                zerolinecolor: 'rgb(255, 255, 255)',
                zerolinewidth: 2
            },
            margin: {
                l: 60,
                r: 50,
                b: 80,
                t: 100
            },
            paper_bgcolor: vis.colors.tan,
            plot_bgcolor: vis.colors.tan,
            showlegend: false
        };

        /*vis.pieChartGroup = vis.svg
            .append('g')
            .attr('class', 'pie-chart')
            .attr("transform", "translate(" + vis.width / 2 + "," + vis.height / 2 + ")");

        // Pie chart settings
        let outerRadius = vis.width / 2;
        let innerRadius = 20;

        // Path generator for the pie segments
        vis.arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        // Pie Layout
        vis.pie = d3.pie()
            .value(function(d){
                return d.value
            });*/

        vis.wrangleData()
    }

    wrangleData() {
        let vis = this;

        let genders = ['allgenders', 'females', 'males']
        let ages = [0, 18, 30, 45, 'allages']
        let voteCats = []
        let voteQuants = []

        genders.forEach(gender => {
            ages.forEach(age => {
                if (typeof age === 'number') {
                    voteCats.push(gender + '_' + age.toString() + 'age_avg_vote')
                    voteQuants.push(gender + '_' + age.toString() + 'age_votes')
                }
                else if (gender !== 'allgenders'){
                    voteCats.push(gender + '_' + age + '_avg_vote')
                    voteQuants.push(gender + '_' + age + '_votes')
                }
            })
        })
        voteCats.push('mean_vote')
        voteQuants.push('total_votes')

        console.log(voteCats)

        vis.genresList = []
        vis.dataByGenre = []

        /*let filtData = vis.filteredData.filter(d => {
            let goodData = true
            for (let quant in voteQuants) {
                if (d[quant] < 5) {goodData = false}
            }

            for (let cat in voteCats) {
                if (!d[cat]) {goodData = false}
            }

            return goodData
        })*/

        //console.log('filt method', filtData, vis.filteredData)

        vis.filteredData.forEach((d) => {
            d.genres.forEach((genre) => {

                let badData = false

                let newObj = {
                    'genre': genre.name
                }

                voteQuants.forEach(quant => {
                    if (d[quant] < 5){badData = true}
                    else {newObj[quant] = d[quant]}
                })
                voteCats.forEach(cat => {
                    if (!d[cat]) {badData = true}
                    else {newObj[cat] = d[cat]}
                })

                if (!badData) {
                    vis.dataByGenre.push(newObj)
                    if (!vis.genresList.includes(genre['name'])) {
                        vis.genresList.push(genre['name'])
                    }
                }
            })
        })

        console.log('forEach method', vis.dataByGenre)

        let voteByGenre = d3.group(vis.dataByGenre, d=>d.genre)

        console.log(voteByGenre)

        vis.boxPlotData = []
        voteByGenre.forEach((val,key) => {
            let genreData = []

            val.forEach(d => genreData.push(d[vis.filter]))

            let genreObj = {
                'genre': key,
                'data': genreData
            }

            vis.boxPlotData.push(genreObj)
        })


        vis.plotDataSorted = vis.boxPlotData.sort((a,b) => {
            return median(b.data) - median(a.data)
        })


        function median(values){
            if(values.length ===0) return 0;

            values.sort(function(a,b){
                return a-b;
            });

            let half = Math.floor(values.length / 2);

            if (values.length % 2)
                return values[half];

            return (values[half - 1] + values[half]) / 2.0;
        }

        /*let rolled = d3.rollup(vis.dataByGenre,
            leaves => {
                let votesObj = {}
                voteCats.forEach(cat => {
                    votesObj[cat] = Math.round(d3.sum(leaves, g => g[cat]) / leaves.length)
                })
                return votesObj
            },
            d => d.genre);

        console.log(rolled)*/

        vis.updateVis()
    }

    updateVis() {
        let vis = this;

        let boxesData = []
        let genres = vis.plotDataSorted.map(d => d.genre)

        for (let i in genres){
            let color = vis.colors.blue
            if (genres[i] === 'Animation'){
                color = vis.colors.orange
            }
            let trace = {
                y: vis.plotDataSorted[i].data,
                x: genres[i],
                name: genres[i].replace(/\s/g, '<br>'),
                type: 'box',
                marker: { color: color },
                ids: genres
            }
            boxesData.push(trace)
        }

        Plotly.react(vis.boxPlotDiv, boxesData, vis.layout)

        d3.select('.xaxislayer-above')
            .attr('transform', 'translate(0, 5)')

        d3.select('.yaxislayer-above').append('text')
            .text('Rating')
            .attr('transform', 'translate(35, 70)')

        // Bind data
        /*let arcs = vis.pieChartGroup.selectAll(".arc")
            .data(vis.pie(vis.filteredData))

        // Append paths
        arcs.enter()
            .append("path")
            .merge(arcs)
            .attr("d", vis.arc)
            .style("fill", function(d, index) {})*/
    }

    filterData() {
        let vis = this;
        let filtersList = ["ageFilter", "genderFilter"]
        let chosenVals = {}

        filtersList.forEach(filt => {
            let dropdownMenu = document.getElementById(filt);
            chosenVals[filt] = dropdownMenu.options[dropdownMenu.selectedIndex].value;
        })
        if (chosenVals["ageFilter"] === 'allages' && chosenVals["genderFilter"] === 'allgenders'){
            vis.filter = 'mean_vote'
        }
        else {
            vis.filter = chosenVals["genderFilter"] + "_" + chosenVals["ageFilter"] + "_avg_vote"
        }

        vis.wrangleData()
    }
}