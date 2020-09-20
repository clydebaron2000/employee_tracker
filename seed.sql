DROP DATABASE IF EXISTS emp_db;

CREATE DATABASE emp_db;

USE emp_db;
CREATE TABLE department (
  department_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(30) NULL
);
CREATE TABLE role (
  role_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(30) NULL,
  salary DECIMAL(20,2),
  department_id INT
);
CREATE TABLE employee (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(30) NULL,
  last_name VARCHAR(30) NULL,
  role_id INT ,
  manager_id INT
);


INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ("clyde","r",1,NULL),("r","0",1,1);
INSERT INTO role(title,salary,department_id)
VALUES ("supreme overlord",10000.2345678,1);
INSERT INTO department (name)
VALUES ("admin");