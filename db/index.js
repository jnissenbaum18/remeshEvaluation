const sqlite3 = require('sqlite3').verbose();

//Connect to the sqlite db
let db = new sqlite3.Database('./sqlite.db', sqlite3.OPEN_READ, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the in-memory sqlite database')
});

//General query that will return all rows that match the query
const all = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error(`Error running query: ${sql}\n
                Error: ${err}`);
                reject(err);
            } else {
                resolve(rows);
            }

        });
    });
};

//Call close when all operations are complete
/* db.close((err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Close the database connection');
})
 */
module.exports = {
    all: all
}