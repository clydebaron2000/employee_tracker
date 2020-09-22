var mysql = require("mysql");
const inquirer = require("inquirer");
const util = require("util");
const chalk = require("chalk");
var Data_Table = require("./Data_table");
let d, r, e;

function text_field_limit(str) {
    return str.split(" ").map(word => {
        if (word.length > 0) return word[0].toUpperCase() + word.substr(1).toLowerCase()
    }).join(" ");
}
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "emp_db"
});
async function view_rearrange_menu(data_table) {
    console.log(chalk `Table: {yellow.bold ${data_table.table_name}}\n\n${data_table.get_table()}\n\n`);
    const { column_index } = await inquirer.prompt({
        type: "list",
        name: "column_index",
        choices: [...data_table.column_names, new inquirer.Separator('--------'), chalk `{red.bold cancel}`, new inquirer.Separator('--------')],
        message: "Choose a column to sort by:",
        filter: (choice) => data_table.column_names.indexOf(choice)
    });
    if (column_index === -1) return data_table;
    await data_table.sort_by_column(column_index);
    return view_rearrange_menu(data_table);
}
async function add_row(data_table) {
    let { output } = data_table.obj_list_to_table_string(data_table.json_raw);
    console.log(chalk `Displaying raw table {yellow.bold ${data_table.table_name}}:\n${output}\n`);
    switch (data_table.table_name) {
        case "employee":
            return add_to_e(data_table);
        case "role":
            return add_to_r(data_table);
        case "department":
            return add_to_d(data_table);
        default:
            throw "err";
    }
}
async function add_to_e(e) {
    const { first_name, last_name, role_id, manager_id } = await inquirer.prompt([{
        type: "input",
        name: "first_name",
        message: chalk `What is the employee's {yellow.bold first name}?`,
        filter: text_field_limit,
        validate: (input) => {
            if (input > 30) return `err: input too long. can't be longer than 30 chars`;
            else return true;
        }
    }, {
        type: "input",
        name: "last_name",
        message: chalk `What is employee's {yellow.bold last name}?`,
        filter: text_field_limit,
        validate: (input) => {
            if (input > 30) return `err: input too long. can't be longer than 30 chars`;
            else return true;
        }
    }, {
        type: "list",
        name: "role_id",
        message: chalk `What {yellow.bold role} does employee have?`,
        choices: r.rows,
        filter: (choice) => r.json_fancy[r.rows.indexOf(choice)].id
    }, {
        type: "list",
        name: "manager_id",
        message: chalk `Who is this employee's {yellow.bold manager}?`,
        choices: e.rows,
        filter: (choice) => e.json_fancy[e.rows.indexOf(choice)].id
    }, ]);
    return e.add_row({ first_name: first_name, last_name, last_name, role_id: role_id, manager_id: manager_id });
}
async function add_to_r(r) {
    const { title, salary, d_id } = await inquirer.prompt([{
        type: "input",
        name: "title",
        message: chalk `What is the {yellow.bold title} of this role?`,
        filter: text_field_limit,
        validate: (input) => {
            if (input > 30) return `err: input too long. can't be longer than 30 chars`;
            else return true;
        }
    }, {
        type: "input",
        name: "salary",
        message: chalk `What is the {yellow.bold salary} for this role?`,
        validate: (input) => {
            if (isNaN(parseFloat(input))) {
                return 'Salary shouild be a number. Please enter a number.';
            }
            return true;
        },
        filter: parseFloat
    }, {
        type: "list",
        name: "d_id",
        choices: d.json_raw.map(obj => obj.name),
        message: chalk `Which {yellow.bold department} does this role fit into?`,
        filter: (choice) => d.json_raw.find((obj) => obj.name === choice)[d.id_name]
    }, ]);
    return r.add_row({ title: title, salary: salary, department_id: d_id });
}
async function add_to_d(d) {
    const { input } = await inquirer.prompt({
        type: "input",
        name: "input",
        message: "What is the Department_name?",
        filter: text_field_limit,
        validate: (input) => {
            if (input > 30) return `err: input too long. can't be longer than 30 chars`;
            else return true;
        }
    });;
    return d.add_row({ name: input });
}
async function delete_row(data_table) {
    const { index } = await inquirer.prompt({
        type: "list",
        name: "index",
        choices: [...data_table.rows, new inquirer.Separator('--------'), chalk `{red.bold cancel}`, new inquirer.Separator('--------')],
        message: `Which row would you like to delete?\n  ${data_table.header}\n`,
        filter: (choice) => data_table.rows.indexOf(choice)
    });
    if (index === -1) return data_table; //canceling
    let id = data_table.json_raw[index][data_table.id_name];
    // console.log(id);
    await data_table.remove_row_by_id(id);
    return data_table;
}
async function modify_value(data_table) {
    try {
        const { row_index } = await inquirer.prompt({
            type: "list",
            name: "row_index",
            choices: [...data_table.rows_raw, new inquirer.Separator('--------'), chalk `{red.bold cancel}`, new inquirer.Separator('--------')],
            message: chalk `Which {yellow.bold row} would you like to modify?\n  ${data_table.header_raw} `,
            filter: (choice) => data_table.rows_raw.indexOf(choice)
        });
        if (row_index === -1) return data_table; //canceling
        const id = data_table.json_raw[row_index][data_table.id_name]; //json_raw is reorganized with rows
        const { col_index } = await inquirer.prompt({
            type: "list",
            name: "col_index",
            choices: [...(data_table.keys.slice(1))],
            message: chalk `Which {yellow.bold column} would you like to modify?\n  ${data_table.header_raw}\n  ${data_table.rows_raw[row_index]}`,
            filter: (choice) => data_table.keys.slice(1).indexOf(choice)
        });
        if (col_index === -1) return data_table;
        let value_q;
        console.log(data_table.column_types[col_index]);
        switch (data_table.column_types[col_index].slice(0, data_table.column_types[col_index].indexOf('('))) {
            case "varchar":
                value_q = {
                    type: "input",
                    name: "value",
                    message: chalk `What is the {yellow.bold string value} you want for this location?`,
                    filter: text_field_limit,
                    validate: (input) => {
                        if (input > 30) return `err: input too long. can't be longer than 30 chars`;
                        else return true
                    }
                };
                break;
            case "int":
                value_q = {
                    type: "input",
                    name: "value",
                    message: chalk `What is the {yellow.bold integer value} you want for this location?`,
                    validate: (input) => {
                        if (isNaN(parseInt(input)) || parseInt(input) != parseFloat(input)) {
                            return 'err: enter an integer'
                        }
                        switch (data_table.keys[col_index]) {
                            case "manager_id":
                                if (!e.json_fancy.map(obj => obj.id).includes(parseInt(input))) return 'err: not a valid manager id, try again.'
                                break;
                            case "role_id":
                                if (!r.json_fancy.map(obj => obj.id).includes(parseInt(input))) return 'err: not a valid role id, try again.'
                                break;
                            case "department_id":
                                if (!d.json_fancy.map(obj => obj.id).includes(parseInt(input))) return 'err: not a valid department id, try again.'
                                break;
                            default:
                                break;
                        }
                    },
                    filter: parseInt
                }
                break;
            case "decimal":
                value_q = {
                    type: "input",
                    name: "value",
                    message: chalk `What is the {yellow.bold decimal value} you want for this location?`,
                    validate: (input) => {
                        if (isNaN(parseFloat(input))) {
                            return 'enter a decimal'
                        }
                    },
                    filter: parseFloat
                }
                break;
        }
        const { value } = await inquirer.prompt(value_q);
        return await data_table.update_value_by_id_column(value, id, col_index);
    } catch (err) { throw err; }
}
async function total_salary_by_department(data_table) {
    try {
        var valid_departments = [];
        data_table.json_fancy.forEach(row => {
            if (!valid_departments.includes(row.Department)) valid_departments.push(row.Department);
        })
        const { department } = await inquirer.prompt({
            type: "list",
            name: "department",
            choices: [...valid_departments, new inquirer.Separator('--------'), chalk `{red.bold cancel}`, new inquirer.Separator('--------')],
            message: ""
        });
        if (!valid_departments.includes(department)) return '';
        let sum = 0;
        data_table.json_fancy.forEach(row => {
            if (row.Department === department) {
                sum += parseFloat(row.Salary);
            }
        });
        return chalk `Total of salary of {yellow.bold ${department}} is {green.bold $${sum}}\n`;
    } catch (err) {
        throw err;
    }
}
async function sub_menu(data_table) {
    try {
        var choices = ["view/rearrange", "add a row", "delete a row", "modify a value"];
        if (data_table.table_name === "employee") choices.push("total salary by department")
        choices.push(new inquirer.Separator('--------'), chalk `{red.bold Return to main menu}`);
        console.log(chalk `Table: {yellow.bold ${data_table.table_name}}\n\n${data_table.get_table()}\n\n`);
        const { choice } = await inquirer.prompt({
            type: "list",
            name: "choice",
            choices: choices,
            message: chalk `What would you like to do with this table?`
        });
        switch (choice) {
            case "view/rearrange":
                //sth
                data_table = await view_rearrange_menu(data_table);
                return await sub_menu(data_table);
            case "add a row":
                //sth
                data_table = await add_row(data_table);
                return await sub_menu(data_table);
            case "delete a row":
                //sth
                data_table = await delete_row(data_table);
                return await sub_menu(data_table);
            case "modify a value":
                //sth
                data_table = await modify_value(data_table);
                return await sub_menu(data_table);
            case "total salary by department":
                //sth
                console.log(await total_salary_by_department(data_table));
                return await sub_menu(data_table);
            default:
                console.log("Returning to main menu");
                return data_table;
        }
    } catch (err) { throw err; }
}
async function init() {
    try {
        d = await (d).get_content_from_server();
        r = await (r).get_content_from_server();
        e = await (e).get_content_from_server();
    } catch (error) {
        throw err
    }
}
async function main_block() {
    try {
        await init();
        console.log(chalk `Table: {yellow.bold ${e.table_name}}\n\n${e.get_table()}\n\n`);
        const { choice } = await inquirer.prompt({
            type: "list",
            name: "choice",
            choices: ["employees", "roles", "departments", new inquirer.Separator('--------'), chalk `{red.bold exit}`],
            message: chalk `What {yellow.bold table} would you like to access?`
        });
        switch (choice) {
            case "employees":
                e = await sub_menu(e);
                await main_block();
                break;
            case "roles":
                r = await sub_menu(r);
                await main_block();
                break;
            case "departments":
                d = await sub_menu(d);
                await main_block();
                break;
            default:
                console.log("exiting");
                return;
        }
    } catch (err) { throw err; }
}
connection.connect(async function(err) {
    if (err) throw err;
    try {
        console.log("connected as id " + connection.threadId + "\n");
        const query = util.promisify(connection.query).bind(connection);
        d = new Data_Table(query, 'department');
        r = new Data_Table(query, 'role');
        e = new Data_Table(query, 'employee');
        await init();
        await main_block();
    } catch (err) {
        throw err;
    } finally {
        connection.end();
    }
});