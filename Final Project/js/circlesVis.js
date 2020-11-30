class CirclesVis {


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
            'navy': '#010D26',
            'blue': '#024059',
            'paleOrange': '#D98E04',
            'orange': '#F28705',
            'darkOrange': '#BF4904',
            'purp': '#8F2051'
        }

        vis.pieChartGroup = vis.svg
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
            });

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

        console.log(vis.dataByGenre)

        let rolled = d3.rollup(vis.dataByGenre,
            leaves => {
                let votesObj = {}
                voteCats.forEach(cat => {
                    votesObj[cat] = Math.round(d3.sum(leaves, g => g[cat]) / leaves.length)
                })
                return votesObj
            },
            d => d.genre);

        console.log(rolled)

        vis.updateVis()
    }

    updateVis(){
        let vis = this;

        // Bind data
        let arcs = vis.pieChartGroup.selectAll(".arc")
            .data(vis.pie(vis.filteredData))

        // Append paths
        arcs.enter()
            .append("path")
            .merge(arcs)
            .attr("d", vis.arc)
            .style("fill", function(d, index) {})
    }
}