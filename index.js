var mysql = require("mysql");
const inquirer = require("inquirer");
const util = require("util");
const chalk = require("chalk");
var Data_Table = require("./Data_table");
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "emp_db"
});
async function main() {
    const query = util.promisify(connection.query).bind(connection);
    var d_table = await (new Data_Table(query, 'department')).init();
    var r_table = await (new Data_Table(query, 'role')).init();
    var e_table = await (new Data_Table(query, 'employee')).init();
}
connection.connect(async function(err) {
    if (err) throw err;
    try {
        console.log("connected as id " + connection.threadId + "\n");
        await main();
    } catch (err) {
        connection.end();
        throw err;
    } finally {
        connection.end();
    }
});