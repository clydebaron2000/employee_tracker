const chalk = require("chalk");
class Data_Table {
    constructor(query, table_name) {
        this.query = query; //set query function with bounded 'connection'
        this.table_name = table_name; //table name
        let query_string = "*";
        switch (this.table_name) { //determine fancy qeury string
            case "employee":
                query_string = `SELECT e.id as id, e.first_name AS First_Name, e.last_name AS Last_Name, title AS Title, salary AS Salary, name AS Department, CONCAT(m.first_name, " ", m.last_name) AS Manager
                 FROM employee e LEFT JOIN employee m ON e.manager_id = m.id INNER JOIN role r ON e.role_id = r.role_id INNER JOIN department d ON r.department_id = d.department_id`
                break;
            case "role":
                query_string = `SELECT r.role_id as id, r.title AS Title, r.salary AS Salary, d.name AS Department 
                FROM role r INNER JOIN department d ON r.department_id = d.department_id`
                break;
            case "department":
                query_string = `SELECT department_id as id,name as Department_Name from department`
                break;
        }
        this.fancy_query_string = query_string;
    }
    async get_content_from_server() {
        try {
            const json_fancy = JSON.parse(JSON.stringify(await this.query(this.fancy_query_string)));
            const json_raw = JSON.parse(JSON.stringify(await this.query(`SELECT * FROM ${this.table_name}`)));
            this.store_json_to_values(json_fancy, json_raw); //more assignment in this function
            //following values don't change unless table changes
            this.column_types = JSON.parse(JSON.stringify(await this.query(`SHOW FIELDS FROM ${this.table_name}`))).map(column_obj => column_obj.Type).slice(1);
            this.column_names = Object.keys(json_fancy[0]);
            this.keys = Object.keys(json_raw[0]);
            this.id_name = this.keys[0];
            return this;
        } catch (err) {
            console.log("err in getting content\n")
            throw err;
        };
    }
    store_json_to_values(json_fancy, json_raw) {
        var { output, header, rows } = this.obj_list_to_table_string(json_fancy);
        this.json_fancy = json_fancy; //assignement to fancy
        this.header = header;
        this.rows = rows;
        this.table = output;
        var { output, header, rows } = this.obj_list_to_table_string(json_raw);
        this.json_raw = json_raw; //assignment for raws
        this.table_raw = output;
        this.header_raw = header;
        this.rows_raw = rows;
    }
    verify_type(column_types_list, input_list) {
        if (column_types_list.length != input_list.length) throw `err: verify_type(): list inputs do not have the same length\ncolumn_types_list: ${column_types_list.length}\n input_list: ${input_list.length}`;
        let i = 0,
            bool_array = [],
            type_array = [];
        column_types_list.map(type => {
            if (type.includes("varchar")) {
                type_array.push("varchar");
                if (typeof(input_list[i]) === "string") bool_array.push(true);
                else bool_array.push(false);
            } else if (type.includes("int")) {
                type_array.push("int");
                if (typeof(input_list[i]) === "number" && parseFloat(input_list[i]) === parseInt(input_list[i])) bool_array.push(true);
                else bool_array.push(false);
            } else if (type.includes("decimal")) {
                type_array.push("decimal");
                if (typeof(input_list[i]) === "number" && !isNaN(parseFloat(input_list[i]))) bool_array.push(true);
                else bool_array.push(false);
            } else {
                bool_array.push(false);
                type_array.push(null);
            }
            i++;
        });
        return { bool_array: bool_array, type_array: type_array }
    }
    obj_list_to_table_string(input_obj_list) {
        const chart_matrix = Object.keys(input_obj_list[0]).map(key => {
            var column = [key, ...(input_obj_list.map(obj => `${obj[key]}`))]
            return column.map((el) => {
                while (el.length < Math.max(...(column.map(el => el.length)))) el += " ";
                return el;
            });
        });
        let row_index = 0,
            header_line, list_row_lines_raw = [];
        let output = ([...Array(input_obj_list.length + 1)].map(empty => row_index++)).map(i => {
            let color;
            if (i === 0) color = "yellow.bold.bgBlack";
            else if (i % 2 === 1) color = "rgb(20, 20, 20).bgWhite.inverse";
            else color = "rgb(30, 30, 30).bgWhite.inverse";
            let content_styled = chart_matrix.map(column => chalk `{${color} ${column[i]}}`).join(chalk `{${color}  | }`);
            let content_raw = chart_matrix.map(column => column[i]).join(" | ");
            if (i === 0) header_line = content_styled;
            else list_row_lines_raw.push(content_raw);
            return content_styled;
        }).join('\n');
        return { output: output, header: header_line, rows: list_row_lines_raw };
    }
    async remove_row_by_id(id) {
        try {
            await this.query(`delete from ${this.table_name} where ${this.id_name}=${id}`)
            return await this.get_content_from_server();
        } catch (err) { console.log(err); }
    }
    async add_row(elementObj) {
        try {
            const column_keys = this.keys.slice(1);
            const { bool_array } = this.verify_type(this.column_types, Object.keys(elementObj).map(key => elementObj[key]));
            if (bool_array.includes(false)) {
                console.log("err: add_element(): elementObj attribute do not match database types");
                console.log(`database column types (sql): ${this.column_types}`);
                console.log(`input data types (js): ${Object.keys(elementObj).map(key => typeof (elementObj[key]))}`);
                return await this.get_content_from_server();
            }
            if (!Object.keys(elementObj) == column_keys) {
                console.log('err: add_element(): columns do not match');
                console.log(Object.keys(elementObj), column_keys);
                console.log(typeof Object.keys(elementObj), typeof column_keys);
                return await this.get_content_from_server();
            }
            await this.query(`INSERT INTO ${this.table_name} SET ?`, elementObj);
            return await this.get_content_from_server();
        } catch (err) { console.log(err); }
    }
    async update_value_by_id_column(value, id, column_index) {
        try {
            const database_column = this.keys.slice(1)[column_index];
            await this.query(`UPDATE ${this.table_name} SET ${database_column} = '${value}' WHERE  ${this.id_name} = ${id};`);
            return this.get_content_from_server();
        } catch (err) { console.log(err); }
    }
    async sort_by_column(column_index) {
        try {
            const ordered_json_fancy = JSON.parse(JSON.stringify(await this.query(this.fancy_query_string + ` order by ${this.column_names[column_index]}`)));
            var ordered_json_raw = [];
            ordered_json_fancy.forEach(row => {
                ordered_json_raw.push(this.json_raw.find((element) => element[this.id_name] === row.id));
            });
            this.store_json_to_values(ordered_json_fancy, ordered_json_raw);
            return this.table;
        } catch (err) {
            throw err;
        }
    }
}
module.exports = Data_Table;