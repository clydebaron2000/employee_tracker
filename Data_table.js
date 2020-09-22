const chalk = require("chalk");
class Data_Table {
    constructor(query, table_name) {
        this.query = query;
        this.table_name = table_name;
        this.header = "";
        this.rows = [];
        this.table = "";
        this.json_fancy = [];
        this.json_raw = [];
        this.table_raw = [];
        this.keys = [];
        let query_string = "*";
        switch (this.table_name) {
            case "employee":
                query_string = `SELECT e.id as id, 
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
        this.query_string = query_string;
    }
    async get_content_from_server() {
        try {
            //get fancy
            const json_fancy = JSON.parse(JSON.stringify(await this.query(this.query_string)));
            var { output, header, rows } = this.obj_list_to_table_string(json_fancy);
            this.json_fancy = json_fancy;
            this.column_names = Object.keys(json_fancy[0]);
            this.header = header;
            this.rows = rows;
            this.table = output;
            //get raw
            const table_raw = await this.query(`SELECT * FROM ${this.table_name}`);
            const json_raw = JSON.parse(JSON.stringify(table_raw));
            var { output, header, rows } = this.obj_list_to_table_string(json_raw);
            this.keys = Object.keys(json_raw[0]);
            this.id_name = this.keys[0];
            this.json_raw = json_raw;
            this.table_raw = table_raw;
            this.table_raw_print = output;
            this.header_raw = header;
            this.rows_raw = rows;
            this.column_types = JSON.parse(JSON.stringify(await this.query(`SHOW FIELDS FROM ${this.table_name}`))).map(column_obj => column_obj.Type).slice(1);
            return this;
        } catch (err) {
            console.log("err in getting content\n")
            throw err;
        };
    }
    verify_type(column_types_list, input_list) {
        if (column_types_list.length != input_list.length) {
            console.log("err: verify_type(): list inputs do not have the same length");
            console.log(`column_types_list: ${column_types_list.length}\n input_list: ${input_list.length}`);
            throw 'err';
        }
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
            let content_raw = chart_matrix.map(column => column[i]).join(" | ");
            if (i === 0) {
                header_line = content_styled;
                content_styled += '\n' + [...Array(content_raw.length)].map(empty => "-").join('');
            } else list_row_lines_raw.push(content_raw);
            return content_styled;
        }).join('\n');
        return { output: output, header: header_line, rows: list_row_lines_raw };
    }
    get_table() {
        return this.table;
    }
    get_table_raw() {
        return this.table_raw;
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
            const column_types = this.column_types;
            const { bool_array } = this.verify_type(column_types, Object.keys(elementObj).map(key => elementObj[key]));
            if (bool_array.includes(false)) {
                console.log("err: add_element(): elementObj attribute do not match database types");
                console.log(`database column types (sql): ${column_types}`);
                console.log(`input data types (js): ${Object.keys(elementObj).map(key => typeof (elementObj[key]))}`);
                return await this.get_content_from_server();
            }
            if (!Object.keys(elementObj) == column_keys) {
                console.log('err: add_element(): columns do not match');
                console.log(Object.keys(elementObj), column_keys);
                console.log(typeof Object.keys(elementObj), typeof column_keys);
                return await this.get_content_from_server();;
            }
            await this.query(`INSERT INTO ${this.table_name} SET ?`, elementObj);
            return await this.get_content_from_server();
        } catch (err) { console.log(err); }
    }
    async update_value_by_id_column(value, id, column_index) {
        try {
            const database_column = this.keys.slice(1)[column_index];
            // console.log(`Test: updating ${this.table_name} row with ${this.id_name} ${id} column ${database_column} with (${value})\n`);
            await this.query(`UPDATE ${this.table_name} SET ${database_column} = '${value}' WHERE  ${this.id_name} = ${id};`);
            return await this.get_content_from_server(); //update value;
        } catch (err) { console.log(err); }
    }
    async sort_by_column(column_index) {
        try {
            // console.log(column_index, this.column_names.length);
            const column_name = this.column_names[column_index];
            // console.log(column_name);
            const ordered_raw_fancy = await this.query(this.query_string + ` order by ${column_name}`)
            const ordered_json_fancy = JSON.parse(JSON.stringify(ordered_raw_fancy));
            var ordered_raw = [],
                ordered_json_raw = []
            ordered_json_fancy.forEach(row => {
                const id = row.id;
                ordered_json_raw.push(this.json_raw.find((element) => element[this.id_name] === id));
                ordered_raw.push(this.table_raw.find((element) => element[this.id_name] === id));
            });
            // console.log(ordered_json_fancy);
            // console.log(ordered_json_raw);
            var { output, header, rows } = this.obj_list_to_table_string(ordered_json_raw);
            this.rows = rows;
            this.table_raw = ordered_raw;
            this.json_raw = ordered_json_raw;
            this.table_raw = output;
            this.rows_raw = rows;
            this.header_raw = header;
            var { output, header, rows } = this.obj_list_to_table_string(ordered_json_fancy);
            this.json_fancy = ordered_json_fancy; //fancy json changes with output
            this.header = header;
            this.table = output;
            return output;
        } catch (err) {
            throw err;
        }
    }
}
module.exports = Data_Table;