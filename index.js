var mysql = require("mysql"); //for sql queries
const inquirer = require("inquirer"); //to ask q's
const util = require("util"); //to convert query
const chalk = require("chalk"); //colorful CLI
var Data_Table = require("./Data_table"); //custom class
let d, r, e;
const welcome = ` _                       ___                 
|_ ._ _ ._ | _    _  _    | ._  _. _ |  _ ._ 
|_ | | ||_)|(_)\\/(/_(/_   | |  (_|(_ |<(/_|  
        |      /\n`;
const line = new inquirer.Separator('--------');
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "root",
    database: "emp_db"
});

function capitalize_each_word(str) {
    //split a string into a list separated by space characters
    return str.split(" ").map(word => { //map each word into a word with first char uppper and rest lower
        if (word.length > 0) return word[0].toUpperCase() + word.substr(1).toLowerCase()
    }).join(" "); //rejoin everything
}

function validate_strings(input) { //strings cannot be longer than 30 chracters
    return (input > 30) ? `err: input too long. can't be longer than 30 chars` : true;
}
async function view_rearrange_menu(data_table) {
    //display table
    console.log(chalk `Table: {yellow.bold ${data_table.table_name}}\n\n${data_table.table}\n\n`);
    const { column_index } = await inquirer.prompt({
        type: "list",
        name: "column_index", //choices are column names (with id)
        choices: [...data_table.column_names, line, chalk `{red.bold cancel}`, line],
        message: "Choose a column to sort by:",
        filter: (choice) => data_table.column_names.indexOf(choice) //transform to index
    });
    if (column_index === -1) return data_table; //cancel clause
    await data_table.sort_by_column(column_index); //sort
    return view_rearrange_menu(data_table); //loop back 
}
async function add_row(data_table) {
    //display table
    console.log(chalk `Displaying raw table {yellow.bold ${data_table.table_name}}:\n${data_table.obj_list_to_table_string(data_table.json_raw).output}\n`);
    switch (data_table.table_name) { //fork to individual tables
        case "employee":
            return await add_to_employee(data_table);
        case "role":
            return await add_to_role(data_table);
        case "department":
            return await add_to_department(data_table);
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
        choices: r.rows_raw, //display rows of the roles (type of roles and salary)
        filter: (choice) => r.json_fancy[r.rows_raw.indexOf(choice)].id //get the id
    }, {
        type: "list",
        name: "manager_id",
        message: chalk `Who is this employee's {yellow.bold manager}?`,
        choices: e.rows_raw, //show rows of employee
        filter: (choice) => e.json_fancy[e.rows_raw.indexOf(choice)].id //get id
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
        name: "salary", //validation verifys if it's a float
        message: chalk `What is the {yellow.bold salary} for this role?`,
        validate: (input) => (isNaN(parseFloat(input))) ? 'Salary shouild be a number. Please enter a number.' : true,
        filter: parseFloat
    }, {
        type: "list",
        name: "d_id",
        choices: d.rows_raw, //display rows
        message: chalk `Which {yellow.bold department} does this role fit into?`,
        filter: (choice) => d.json_fancy[e.rows_raw.indexOf(choice)].id //get id
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
    try {
        const { index } = await inquirer.prompt({
            type: "list",
            name: "index",
            choices: [...data_table.rows, line, chalk `{red.bold cancel}`, line],
            message: `Which row would you like to delete?\n  ${data_table.header}\n`,
            filter: (choice) => data_table.rows.indexOf(choice)
        }); //below is exit and sucess clauses
        return (index === -1) ? data_table : await data_table.remove_row_by_id(data_table.json_raw[index][data_table.id_name]);
    } catch (err) { throw err }
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
        if (row_index === -1) return data_table; //exit clause
        const { col_index } = await inquirer.prompt({
            type: "list",
            name: "col_index",
            choices: [...(data_table.keys.slice(1))], //remove id_name from list of modifiable items
            message: chalk `Which {yellow.bold column} would you like to modify?\n  ${data_table.header_raw}\n  ${data_table.rows_raw[row_index]}`,
            filter: (choice) => data_table.keys.slice(1).indexOf(choice)
        });
        const id = data_table.json_fancy[row_index].id;
        let value_q; //switch statment if taking the column types at the column index and cutting off anything after the '('
        switch (data_table.column_types[col_index].slice(0, data_table.column_types[col_index].indexOf('('))) {
            case "varchar":
                value_q = {
                    type: "input",
                    name: "value",
                    message: chalk `What is the {yellow.bold string value} you want for this location?`,
                    filter: capitalize_each_word,
                    validate: (input) => (input > 30) ? `err: input too long. can't be longer than 30 chars` : true
                };
                break;
            case "int":
                value_q = {
                    type: "input",
                    name: "value",
                    message: chalk `What is the {yellow.bold integer value} you want for this location?`,
                    validate: (input) => {
                        if (isNaN(parseInt(input)) || parseInt(input) != parseFloat(input)) return 'err: not an integer. please enter an integer';
                        switch (data_table.keys.slice(1)[col_index]) {
                            case "manager_id":
                                if (e.json_fancy.map(obj => obj.id).includes(parseInt(input))) return true;
                                break;
                            case "role_id":
                                if (r.json_fancy.map(obj => obj.id).includes(parseInt(input))) return true;
                                break;
                            case "department_id":
                                if (d.json_fancy.map(obj => obj.id).includes(parseInt(input))) return true;
                                break;
                            default:
                                break;
                        }
                        return `err: not a valid ${data_table.keys.slice(1)[col_index]}, try again.`;
                    },
                    filter: parseInt
                }
                break;
            case "decimal":
                value_q = {
                    type: "input",
                    name: "value",
                    message: chalk `What is the {yellow.bold decimal value} you want for this location?`,
                    validate: (input) => (isNaN(parseFloat(input))) ? 'enter a decimal' : true,
                    filter: parseFloat
                }
                break;
        }
        const { value } = await inquirer.prompt(value_q);
        return await data_table.update_value_by_id_column(value, id, col_index);
    } catch (err) { throw err; }
}
async function total_salary_by_department(e) {
    try {
        //get valid departments from emplopoyee table
        const valid_departments = e.json_fancy.map(row => row.Department).filter((value, index, self) => self.indexOf(value) === index);
        const { choice } = await inquirer.prompt({
            type: "list",
            name: "choice",
            choices: [...valid_departments, line, chalk `{red.bold cancel}`, line],
            message: chalk `What {yellow.bold department} would you like to {green.bold total}?`
        });
        return (!valid_departments.includes(choice)) ? "" : chalk `\nTotal of salary of {yellow.bold ${choice}} is {green.bold $${
            e.json_fancy.reduce((sum, row) => (row.Department === choice) ? sum + parseFloat(row.Salary):sum, 0) 
        }}\n`;
    } catch (err) {
        throw err;
    }
}
async function sub_menu(data_table) {
    try {
        var choices = ["view/rearrange", "add a row", "delete a row", "modify a value"]; //default choices
        if (data_table.table_name === "employee") choices.push("total salary by department"); //choice only for employee
        choices.push(line, chalk `{red.bold Return to main menu}`); //exit choice
        console.log(chalk `Table Menu: {yellow.bold ${data_table.table_name}}\n\n${data_table.table}\n\n`); //display table
        const { choice } = await inquirer.prompt({
            type: "list",
            name: "choice",
            choices: choices,
            message: `What would you like to do with this table?`
        });
        switch (choice) {
            case "view/rearrange": //run functio and loop
                return await sub_menu(await view_rearrange_menu(data_table));
            case "add a row":
                return await sub_menu(await add_row(data_table));
            case "delete a row":
                return await sub_menu(await delete_row(data_table));
            case "modify a value":
                return await sub_menu(await modify_value(data_table));
            case "total salary by department":
                console.log(await total_salary_by_department(data_table));
                return await sub_menu(data_table); //loop
            default:
                return data_table; //exit loop
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
async function main_block() {
    try {
        await load_values(); //load values from server
        console.log(chalk `{yellow.bold ${welcome}}\nMain Menu\n------`);
        console.log(chalk `Table: {yellow.bold ${e.table_name}}\n\n${e.table}\n\n`); //display employee table
        const { choice } = await inquirer.prompt({
            type: "list",
            name: "choice",
            choices: ["employees", "roles", "departments", line, chalk `{red.bold exit}`],
            message: chalk `What {yellow.bold table} would you like to access?`
        });
        switch (choice) {
            case "employees":
                e = await sub_menu(e); //sub menu
                return await main_block(); //loop
            case "roles":
                r = await sub_menu(r);
                return await main_block();
            case "departments":
                d = await sub_menu(d);
                return await main_block();
            default:
                console.log("exiting"); //final exit for all
                return;
        }
    } catch (err) { throw err; }
}
connection.connect(async function(err) {
    if (err) throw err;
    try {
        //bind query to connection and pass thru Data_tables
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