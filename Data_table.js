const chalk = require("chalk");
class Data_Table {
    constructor(query, table_name) {
        this.query = query;
        this.table_name = table_name;
        this.header = "";
        this.rows = [];
        this.fancy = [];
    }
    async init() {
        this.fancy = await this.get_json_fancy(this.table_name);
        const { output, header, rows } = this.obj_list_to_table_string(this.fancy);
        this.header = header;
        this.rows = rows;
        return this;
    }
    verify_type(column_types_list, input_list) {
        if (column_types_list.length != input_list.length) {
            console.log("err: verify_type(): list inputs do not have the same length");
            console.log(`column_types_list: ${column_types_list.length}\n input_list: ${input_list.length}`);
            throw 'err';
        }
        let i = 0;
        return column_types_list.map(type => {
            if (type.includes("varchar"))
                if (typeof(input_list[i]) != "string") return false;
            if (type.includes("int")) {
                if (typeof(input_list[i]) != "number") return false;
                if (input_list[i] !== parseInt(input_list[i])) return false;
            }
            if (type.includes("decimal")) {
                if (typeof(input_list[i]) != "number") return false;
                if (input_list[i] === parseInt(input_list[i])) return false;
            }
            i++;
            return true;
        });
    }
    obj_list_to_table_string(input_obj_list) {
        const chart_matrix = Object.keys(input_obj_list[0]).map(key => {
            var column = [key, ...(input_obj_list.map(obj => `${obj[key]}`))];
            column = column.map((el) => {
                while (el.length < Math.max(...(column.map(el => el.length)))) {
                    el += " ";
                }
                return el;
            });
            return column;
        });
        let i = 0,
            header_line, list_row_lines_raw = [];
        let output = ([...Array(input_obj_list.length + 1)].map(empty => i++)).map(i => {
            let color;
            if (i === 0) color = "yellow.bold";
            else if (i % 2 === 1) color = "gray.bold";
            else color = "white.bold"
            let content_styled = chart_matrix.map(column => chalk `{${color} ${column[i]}}`).join(" | ");
            if (i === 0) header_line = content_styled;
            let content_raw = chart_matrix.map(column => column[i]).join(" | ");
            if (i === 0) content_styled += '\n' + [...Array(content_raw.length)].map(empty => "-").join('');
            if (i != 0) list_row_lines_raw.push(content_raw);
            return content_styled;
        }).join('\n');
        return { output: output, header: header_line, rows: list_row_lines_raw };
    }
    async get_json_fancy(table_name) {
        let query_string = "*";
        switch (table_name) {
            case "employee":
                query_string = `SELECT e.id, 
                e.first_name AS First_Name, 
                e.last_name AS Last_Name, 
                title AS Title, 
                salary AS Salary, 
                name AS Department,
                CONCAT(m.first_name, " ", m.last_name) AS Manager
                 FROM employee e
                 LEFT JOIN employee m ON e.manager_id = m.id 
                 INNER JOIN role r ON e.role_id = r.role_id 
                 INNER JOIN department d ON r.department_id = d.department_id`
                break;
            case "role":
                query_string = `SELECT r.role_id as id, 
                r.title AS Title, 
                r.salary AS Salary, 
                d.name AS Department 
                FROM role r
                INNER JOIN department d ON r.department_id = d.department_id`
                break;
            case "department":
                query_string = `SELECT department_id as id,name as Department_Name from department`
                break;
        }
        try {
            return JSON.parse(JSON.stringify(await this.query(query_string)));
        } catch (err) { throw err };
    }
    get_table() {
        try {
            return this.obj_list_to_table_string(this.fancy).output;
        } catch (err) { console.log(err); }
    }
    async get_table_raw() {
        try {
            return await this.query(`SELECT * FROM ${this.table_name}`);
        } catch (err) { console.log(err); }
    }
    async remove_element_by_id(id_name, id) {
        try {
            return await this.query(`delete from ${this.table_name} where ${id_name}=${id}`)
        } catch (err) { console.log(err); }
    }
    async add_element(elementObj) {
        try {
            const column_names = Object.keys((await this.query(`SELECT * FROM ${this.table_name}`))[0]);
            const column_types = JSON.parse(JSON.stringify(await this.query(`SHOW FIELDS FROM department`))).map(column_obj => column_obj.Type).slice(1);
            const valid_array = this.verify_type(column_types, Object.keys(elementObj).map(key => elementObj[key]));
            if (valid_array.includes(false)) {
                console.log("err: add_element(): elementObj attribute do not match database types");
                console.log(`database column types (sql): ${column_types}`);
                console.log(`input data types (js): ${Object.keys(elementObj).map(key => typeof (elementObj[key]))}`);
            }
            console.log(`(${column_names})`);
            if (Object.keys(elementObj) != column_names) {
                console.log('err: add_element(): columns do not match');
                return;
            }
            const output = this.query(`INSERT INTO ${this.table_name} SET ?`, elementObj);
            return output;
        } catch (err) { console.log(err); }
    }
    async update_element_by_column(id_name, id, database_column, value) {
        try {
            // console.log(`Test: updating ${this.table_name} row with ${id_name} ${id} column ${database_column} with (${value})\n`);
            return await this.query(`UPDATE ${this.table_name} SET ${database_column} = ${value} WHERE  ${id_name} = ${id}`);
        } catch (err) { console.log(err); }
    }
}
module.exports = Data_Table;