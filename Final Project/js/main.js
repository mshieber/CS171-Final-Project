// (1) Load data with promises
/*let promises = [
    d3.csv("data/movies_metadata.csv"),
    d3.csv("data/IMDB ratings.csv"),
];

Promise.all(promises)
    .then( function(data){ console.log(data)})
    .catch( function (err){console.log(err)} );*/

// Function to convert date objects to strings or reverse
let dateFormatter = d3.timeFormat("%Y-%m-%d");
let dateParser = d3.timeParse("%Y-%m-%d");

// Vis objects
let profitVis,
    areaVis,
    grossingVis;

// load and manage IMDB data
Promise.all([
    // import IMDB Data
    d3.csv("data/IMDB ratings.csv", (row) => {
        // strings -> ints
        Object.keys(row).forEach(function(key) {
            if (key != 'imdb_title_id') { row[key] = +row[key]}
        });
        return row
    }),
    // import movie metadata
    d3.csv("data/movies_metadata.csv", (row) => {

        // strings -> ints
        let colsToInt = ['budget', 'id', 'popularity', 'revenue', 'runtime', 'vote_average', 'vote_count']
        for (i in colsToInt){
            let col = colsToInt[i]
            row[col] = +row[col]
        }
        // string -> bool
        row.adult = (row.adult == 'True')
        // string -> dateTime
        row.release_date = dateParser(row.release_date)
        if (!row.release_date) {return;}

        // string -> JSON (only currently works for 'genre', others show error
        // uncomment bellow to view error

        // GOT SPOKEN LANGUAGES TO WORK
        //let colsToJSON = ['genres', 'spoken_languages', 'production_countries']
        //let colsToJSON = ['production_companies']
        let colsToJSON = ['genres','production_countries', 'spoken_languages']
        for (i in colsToJSON){
            let col = colsToJSON[i]



            // [^a-zA-Z\d\s"] <- ALL NON-ALPHANUM NON-SPACE NON-QUOTE
            /*
            if (row[col].match(/s/)) {
                console.log(col)
                console.log(row[col])
            }

             */

            // Some JSON inputs are empty, which throws an "unexpected end of JSON" error. This fills in the values with something
            if (row[col].length == 0) {
                row[col] = "[{'NA': 'NA'}]"
            }
            //row[col] = JSON.parse(row[col])

            // Function to remove quotes in a substring; was only useful for prod company
            function quoteremove(match) {
                match.replace(/'/g, '"')
            }

            row[col] = row[col].replace(/'/g, '"')
                // Dealing with languages
                .replace("\\x", "x")
                // Dealing with countries
                .replace("D\"Iv", "D\'Iv")
                // Dealing with production companies
                // This is so much to do by hand; possible to simplify?
                .replace("e\"s", "e\'s")
                .replace("d\"I", "d\'I")
                .replace("D\"P", "D\'P")
                .replace("D\"A", "D\'A")
                /* EVERYTHING HERE AND BELOW IS DEALING WITH PRODUCTION COMPANIES
                .replace("Workin\"", "Workin\'")
                .replace("Po\" Boy", "Po\' Boy")
                .replace("\"Tor\"", "Tor")
                .replace("l\"A", "l\'A")
                .replace("de l\"", "de l\'")
                .replace("Sol\"", "Sol\'")
                .replace("production d\"", "production d\'")
                .replace("undefined", "\" undefined")
                //.replace(/\"[0-9]/, quoteremove)
                .replace("\"84", "\'84")
                // Can't replace similarly to 84, because '98 MPH Pictures' also exists
                .replace("Project \"98", "Project \'98")
                // The next ones are brutal because the apostrophe is at the end, so they can't be easily replaced
                .replace("Donners\"", "Donners\'")
                .replace("Kids\" WB", "Kids\' WB")
                .replace("Double \"A\"", "Double A")
                // The next few are just dealing with zespol filmowy
                .replace("\"\"", "")
                //.replace(/Filmow[A-Za-z] \"[A-Za-z]*\"/, quoteremove)
                .replace(/Filmow[a-z] [a-zA-Z\d\s"]*,/, "\",")
                .replace("Zespól Filmowy \"X", "Zespól Filmowy X\"")
                .replace(/Filmowy [\"]*Perspektywa/, "Filmowy Perspektywa\"")
                .replace("Filmowy \"Kadr", "Filmowy Kadr\"")
                .replace(/[a-zA-Z]\"[a-zA-Z]/, quoteremove)

                 */


            // Separated out the replacements and the parsing to make it easier to debug, but we can always combine
            //console.log(row)
            row[col] = JSON.parse(row[col])
            /*row[col] = JSON.parse(row[col].replace(/'/g, '"')
                .replace("\\x", "x")
                .replace("D\"Iv", "D\'Iv")
                .replace("e\"s", "e\'s"))

             */

            //console.log(row[col])



        }
        return row
    }),
    // import top ten grossing metadata
    d3.csv("data/toptengrossing.csv", (row) => {

        // Dealing with worldwide_gross, which has a dollar sign appended
        row['worldwide_gross'] = row['worldwide_gross']
            .replace("$", "")
            .replace(/,/g, "")

        // Converting certain values to numeric
        let colsToInt = ['imdb_rating', 'length', 'rank_in_year', 'year', 'worldwide_gross']
        for (i in colsToInt){
            let col = colsToInt[i]
            row[col] = +row[col]
        }

        row["Genres"] = [row['Main_Genre'], row['Genre_2'], row['Genre_3']]


        return row
    })]).then(function(data) {
        console.log('IMDB ratings: ', data[0]);
        console.log('Movies ratings: ', data[1]);
        combineData(data[0], data[1]);
        createVis(data[1], data[2]);
    }).catch( function (err){console.log(err)} );

// function to combine two data arrays to single data dict with imdb_id as the key
function combineData(imdbD, movieD) {
    // turn movie data into dict
    let dataDict = {}
    // turn data dict into dict version of movie metadata with imdb_id as the key
    movieD.forEach(function(d){
        dataDict[d.imdb_id] = d
    })
    // loop through imdb data and if theres a matching key in dataDict add the info under that key value
    imdbD.forEach(function(row) {
        if (row.imdb_title_id in dataDict) {
            // join the data and save under the key value
            dataDict[row.imdb_title_id] = Object.assign(dataDict[row.imdb_title_id], row)
            // delete repeated imdb id data
            delete dataDict[row.imdb_title_id].imdb_title_id
        }
    });
    // log first 10 elements of dataDict (too big to log all)
    let keysHead = Object.keys(dataDict).slice(1,10)
    keysHead.forEach(key => console.log(dataDict[key]))
}

function createVis(data, topTenData){
    profitVis = new ProfitVis('profitVis', data)
    areaVis = new AreaVis('areaVis', data)
    grossingVis = new GrossingVis('grossingVis', topTenData)
}

function updateGross(){

    grossingVis.wrangleData()

}