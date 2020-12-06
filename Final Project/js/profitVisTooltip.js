class ProfitVisTooltip {

    constructor(parentElement, data, _eventHandler) {
        this.parentElement = parentElement;
        this.data = data;
        this.displayData = this.data;
        this.eventHandler = _eventHandler;

        this.initVis();


    }


    /*
     * Initialize visualization (static content; e.g. SVG area, axes, brush component)
     */

    initVis() {
        let vis = this;

        vis.id_list = ["original_title","release_date","mean_vote"/*,"budget"*/,"ppm"/*,"revenue"*/,"homepage"];
        vis.genre = 'Animation'

        vis.selectionStart = d3.min(vis.data, d=>d.release_date)
        vis.selectionEnd = d3.max(vis.data, d=>d.release_date)

        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }


    /*
     * Data wrangling
     */

    wrangleData() {
        let vis = this;

        if (vis.genre == 'Movie'){
            vis.displayData = vis.data
        }
        else{
            vis.displayData = vis.data.filter(d => {
                let valList = []
                d.genres.forEach(obj => {
                    valList.push(obj.name)
                })
                return valList.includes(vis.genre)
            })
        }

        // Filter data depending on selected time period (brush)
        vis.displayData = vis.displayData.filter(function(d){
            return (vis.selectionStart <= d.release_date.getFullYear() && d.release_date.getFullYear() <= vis.selectionEnd)
        });

        vis.displayData.map((d) => {
            let profit = d.revenue - d.budget
            d['ppm'] = profit
        })

        vis.displayData = vis.displayData[d3.maxIndex(vis.displayData, d => d.ppm)]

        // Update the visualization
        vis.updateVis();
    }


    /*
     * The drawing function
     */

    updateVis() {
        let vis = this;

        // construct obj to display
        let lstToDisplay = []
        for (let i in vis.id_list){
            let id = vis.id_list[i]
            let obj = {}
            obj[id] = format(id, vis.displayData[id])
            lstToDisplay.push(obj)
        }
        lstToDisplay.forEach(obj => {
            document.getElementById(Object.keys(obj)[0]).innerHTML = Object.values(obj)[0]
        })

        if (vis.genre == 'Movie' || vis.genre == 'TV Movie'){
            document.getElementById('data-title').innerHTML = "Top-Grossing " + vis.genre
        }
        else {
            document.getElementById('data-title').innerHTML = "Top-Grossing " + vis.genre + ' Movie'
        }

        function format(id, element){
            // check if element is null
            if (!element) {
                return 'None Available'
            }
            // format element and return
            if (typeof element == 'number') {
                if (id !=='mean_vote'){
                    return (new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(element))
                }
                else {return (new Intl.NumberFormat().format(element))}
            }
            else if (id == 'homepage'){
                return ("<a href='" + element + "'>" + element + "</a>")
            }
            else if (id == 'original_title'){
                return element
            }
            else {
                let dateFormatter = d3.timeFormat("%B %d, %Y");
                return dateFormatter(element)
            }
        }
    }

    onFilterChange(genre, selectionStart, selectionEnd){
        let vis = this

        genre = genre || vis.genre;
        selectionStart = selectionStart || vis.selectionStart;
        selectionEnd = selectionEnd || vis.selectionEnd;

        vis.genre = genre
        vis.selectionStart = selectionStart
        vis.selectionEnd = selectionEnd

        vis.wrangleData()
    }
}