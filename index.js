var mysql = require("mysql");
const inquirer = require("inquirer");
const util = require("util");
const chalk = require("chalk");
var Data_Table = require("./Data_table");
const { prompt } = require("inquirer");
let d, r, e;
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "emp_db"
});
async function init() {
    try {
        const query = util.promisify(connection.query).bind(connection);
        d = await (new Data_Table(query, 'department')).get_content_from_server();
        r = await (new Data_Table(query, 'role')).get_content_from_server();
        e = await (new Data_Table(query, 'employee')).get_content_from_server();
    } catch (error) {
        throw err
    }
}
async function main_menu() {
    try {
        console.log(chalk `Table: {yellow.bold ${e.table_name}}\n\n${e.get_table()}\n\n`);
        const { choice } = await inquirer.prompt({
            type: "list",
            name: "choice",
            choices: ["employees", "roles", "departments", new inquirer.Separator('--------'), chalk `{red.bold exit}`],
            message: chalk `What {yellow.bold table} would you like to access?`
        })
        switch (choice) {
            case "employee":
                await employee_menu();
                break;
            case "roles":
                await role_menu();
                break;
            case "departments":
                await department_menu();
                break;
            default:
                'exit clause'
                return;
        }
    } catch (err) { throw err; }
}
async function employee_menu() {
    try {
        console.log(chalk `Table: {yellow.bold ${e.table_name}}\n\n${e.get_table()}\n\n`);
        const { choice } = await inquirer.prompt({
            type: "list",
            name: "choice",
            choices: ["view/rearrange", "update a value", "add a row", "delete a row", new inquirer.Separator('--------'), chalk `{red.bold exit}`],
            message: chalk `What would you like to do with this table?`
        })
        switch (choice) {
            case "view/rearrange":
                await employee_menu();
                break;
            case "update a value":
                await role_menu();
                break;
            case "add a row":
                await department_menu();
                break;
            case "delete a row":
                await department_menu();
                break;
            default:
                'exit clause'
                return;
        }
    } catch (err) { throw err; }
}
connection.connect(async function(err) {
    if (err) throw err;
    try {
        console.log("connected as id " + connection.threadId + "\n");
        await init();
        await main_menu();
    } catch (err) {
        connection.end();
        throw err;
    } finally {
        connection.end();
    }
});