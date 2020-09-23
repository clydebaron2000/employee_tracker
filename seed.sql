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
VALUES ("Noel","Joel",1,1),("Mateo","Ergi",2,1),
("Sullivan","Chadwick",3,2),
("Stevie","Haynes",4,2),
("Zac","Nava",5,2),

("Kellie","Whitley",6,4),("Bjorn","Wright",7,4),("Alexis","Kinney",8,4),
("Billie","Sharp",9,5),("Enrico","Knowles",10,3),("Opal","Barrow",11,3),
("Patrick","Brett",12,11),("Colette","BlackBurn",7,4),("Sydnay","Woodcock",6,4),
("Eamon","Mcniel",12,11)
;
INSERT INTO role(title,salary,department_id)
VALUES ("Founder",300000000,1),("CEO",10000000,1),
("Sales Head",250000,2),
("Head Engineer",300000,3),
("Head of Marketing",300000,4),

("Advisor",15000,3),("UX Designer",25000,3),("Programmer",25000,3),
("Associate Marketer",15000,4),("Sales Associate",15000,2),
("Sales Manager",15000,2),("Customer Service Rep",13000,2)
;
INSERT INTO department (name)
VALUES ("Executive"),("Sales"),("Engineering"),("Marketing");


