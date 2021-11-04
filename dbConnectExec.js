const sql = require("mssql");
const rockwellConfig = require("./config.js")

const config = {
    user: rockwellConfig.DB.user,
    password: rockwellConfig.DB.password,
    server: rockwellConfig.DB.server, // You can use 'localhost\\instance' to connect to named instance
    database: rockwellConfig.DB.database,
}


async function executeQuery(aQuery) {
    let connection = await sql.connect(config);
    let result = await connection.query(aQuery);

    // console.log(result);

    return result.recordset;
}

// executeQuery('SELECT * FROM Player LEFT JOIN Position ON position.PositionPK = player.PositionFK');

module.exports = {executeQuery: executeQuery };