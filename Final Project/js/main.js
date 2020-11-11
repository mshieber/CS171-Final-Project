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

        // string -> JSON (only currently works for 'genre', others show error
        // uncomment bellow to view error
        let colsToJSON = ['genres']//,'production_countries', 'production_companies', 'spoken_languages']
        for (i in colsToJSON){
            let col = colsToJSON[i]
            row[col] = JSON.parse(row[col].replace(/'/g, '"'))
        }
        return row
    })]).then(function(data) {
        console.log('IMDB ratings: ', data[0])
        console.log('Movies ratings: ', data[1])
        combineData(data[0], data[1])
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
    let keysHead = Object.keys(dataDict).slice(0,10)
    keysHead.forEach(key => console.log(dataDict[key]))
}