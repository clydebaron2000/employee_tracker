var mysql = require("mysql");
const inquirer = require("inquirer");
const util = require("util");
const chalk = require("chalk");
var Data_Table = require("./Data_table");
const { prototype } = require("stream");
let d, r, e;
const line = new inquirer.Separator('--------');
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "emp_db"
});

function capitalize_each_word(str) {
    return str.split(" ").map(word => {
        if (word.length > 0) return word[0].toUpperCase() + word.substr(1).toLowerCase()
    }).join(" ");
}

function validate_strings(input) {
    return (input > 30) ? `err: input too long. can't be longer than 30 chars` : true;
}
async function view_rearrange_menu(data_table) {
    console.log(chalk `Table: {yellow.bold ${data_table.table_name}}\n\n${data_table.table}\n\n`);
    const { column_index } = await inquirer.prompt({
        type: "list",
        name: "column_index",
        choices: [...data_table.column_names, line, chalk `{red.bold cancel}`, line],
        message: "Choose a column to sort by:",
        filter: (choice) => data_table.column_names.indexOf(choice)
    });
    if (column_index === -1) return data_table;
    await data_table.sort_by_column(column_index);
    return view_rearrange_menu(data_table);
}
async function add_row(data_table) {
    console.log(chalk `Displaying raw table {yellow.bold ${data_table.table_name}}:\n${data_table.obj_list_to_table_string(data_table.json_raw)}\n`);
    switch (data_table.table_name) {
        case "employee":
            return add_to_employee(data_table);
        case "role":
            return add_to_role(data_table);
        case "department":
            return add_to_department(data_table);
        default:
            throw "err";
    }
}
async function add_to_employee(e) {
    const { first_name, last_name, role_id, manager_id } = await inquirer.prompt([{
        type: "input",
        name: "first_name",
        message: chalk `What is the employee's {yellow.bold first name}?`,
        filter: capitalize_each_word,
        validate: validate_strings
    }, {
        type: "input",
        name: "last_name",
        message: chalk `What is employee's {yellow.bold last name}?`,
        filter: capitalize_each_word,
        validate: validate_strings
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
async function add_to_role(r) {
    const { title, salary, d_id } = await inquirer.prompt([{
        type: "input",
        name: "title",
        message: chalk `What is the {yellow.bold title} of this role?`,
        filter: capitalize_each_word,
        validate: validate_strings
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
async function add_to_department(d) {
    const { input } = await inquirer.prompt({
        type: "input",
        name: "input",
        message: "What is the Department_name?",
        filter: capitalize_each_word,
        validate: validate_strings
    });
    return d.add_row({ name: input });
}
async function delete_row(data_table) {
    const { index } = await inquirer.prompt({
        type: "list",
        name: "index",
        choices: [...data_table.rows, line, chalk `{red.bold cancel}`, line],
        message: `Which row would you like to delete?\n  ${data_table.header}\n`,
        filter: (choice) => data_table.rows.indexOf(choice)
    });
    return await data_table.remove_row_by_id(data_table.json_raw[index][data_table.id_name]);
}
async function modify_value(data_table) {
    try {
        const { row_index } = await inquirer.prompt({
            type: "list",
            name: "row_index",
            choices: [...data_table.rows_raw, line, chalk `{red.bold cancel}`, line],
            message: chalk `Which {yellow.bold row} would you like to modify?\n  ${data_table.header_raw} `,
            filter: (choice) => data_table.rows_raw.indexOf(choice)
        });
        if (row_index === -1) return data_table;
        const { col_index } = await inquirer.prompt({
            type: "list",
            name: "col_index",
            choices: [...(data_table.keys.slice(1))],
            message: chalk `Which {yellow.bold column} would you like to modify?\n  ${data_table.header_raw}\n  ${data_table.rows_raw[row_index]}`,
            filter: (choice) => data_table.keys.slice(1).indexOf(choice)
        });
        let value_q;
        switch (data_table.column_types[col_index].slice(0, data_table.column_types[col_index].indexOf('('))) {
            case "varchar":
                value_q = {
                    type: "input",
                    name: "value",
                    message: chalk `What is the {yellow.bold string value} you want for this location?`,
                    filter: capitalize_each_word,
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
            choices: [...valid_departments, line, chalk `{red.bold cancel}`, line],
            message: chalk `What {yellow.bold department} would you like to {green.bold total}?`
        });
        return chalk `Total of salary of {yellow.bold ${department}} is {green.bold $${
            data_table.json_fancy.reduce((sum, row) => {
            if (row.Department === department) return sum + parseFloat(row.Salary);
                else return sum;
        }, 0)}}\n`;
    } catch (err) {
        throw err;
    }
}
async function sub_menu(data_table) {
    try {
        var choices = ["view/rearrange", "add a row", "delete a row", "modify a value"];
        if (data_table.table_name === "employee") choices.push("total salary by department")
        choices.push(line, chalk `{red.bold Return to main menu}`);
        console.log(chalk `Table Menu: {yellow.bold ${data_table.table_name}}\n\n${data_table.table}\n\n`);
        const { choice } = await inquirer.prompt({
            type: "list",
            name: "choice",
            choices: choices,
            message: chalk `What would you like to do with this table?`
        });
        switch (choice) {
            case "view/rearrange":
                data_table = await view_rearrange_menu(data_table);
                return await sub_menu(data_table);
            case "add a row":
                data_table = await add_row(data_table);
                return await sub_menu(data_table);
            case "delete a row":
                data_table = await delete_row(data_table);
                return await sub_menu(data_table);
            case "modify a value":
                data_table = await modify_value(data_table);
                return await sub_menu(data_table);
            case "total salary by department":
                console.log(await total_salary_by_department(data_table));
                return await sub_menu(data_table);
            default:
                return data_table;
        }
    } catch (err) { throw err; }
}
async function load_values() {
    try {
        d = await (d).get_content_from_server();
        r = await (r).get_content_from_server();
        e = await (e).get_content_from_server();
    } catch (err) {
        throw err;
    }
}
const welcome = ` _                       ___                 
|_ ._ _ ._ | _    _  _    | ._  _. _ |  _ ._ 
|_ | | ||_)|(_)\\/(/_(/_   | |  (_|(_ |<(/_|  
        |      /\n`;
async function main_block() {
    try {
        await load_values();
        console.log(chalk `{yellow.bold ${welcome}}\nMain Menu\n------`)
        console.log(chalk `Table: {yellow.bold ${e.table_name}}\n\n${e.table}\n\n`);
        const { choice } = await inquirer.prompt({
            type: "list",
            name: "choice",
            choices: ["employees", "roles", "departments", line, chalk `{red.bold exit}`],
            message: chalk `What {yellow.bold table} would you like to access?`
        });
        switch (choice) {
            case "employees":
                e = await sub_menu(e);
                return await main_block();
            case "roles":
                r = await sub_menu(r);
                return await main_block();
            case "departments":
                d = await sub_menu(d);
                return await main_block();
            default:
                console.log("exiting");
                return;
        }
    } catch (err) { throw err; }
}
connection.connect(async function(err) {
    if (err) throw err;
    try {
        const query = util.promisify(connection.query).bind(connection);
        d = new Data_Table(query, 'department');
        r = new Data_Table(query, 'role');
        e = new Data_Table(query, 'employee');
        await main_block();
    } catch (err) {
        throw err;
    } finally {
        connection.end();
    }
});