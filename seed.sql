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
  salary DECIMAL(36,2),
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
VALUES ("ya","boi",1,1),("claus","dominica",2,1),("john","doe",3,2);
INSERT INTO role(title,salary,department_id)
VALUES ("Server Master",10000000000100.12,1),("Server Manager",10000,1),("worker",1000,2);
INSERT INTO department (name)
VALUES ("admin"),("pesant");


