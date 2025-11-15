-- ============================================================
-- DROP EXISTING DATABASE AND TABLES (safe order)
-- ============================================================
DROP DATABASE IF EXISTS medical_db;

-- ============================================================
-- CREATE DATABASE AND USE IT
-- ============================================================
CREATE DATABASE IF NOT EXISTS medical_db;
USE medical_db;

-- ============================================================
-- TABLE: TBL_Country
-- ============================================================
CREATE TABLE TBL_Country (
    Country_Rec_Ref INT AUTO_INCREMENT PRIMARY KEY,
    Country VARCHAR(100),
    In_Use BOOLEAN DEFAULT 1
);

-- ============================================================
-- TABLE: TBL_Town
-- ============================================================
CREATE TABLE TBL_Town (
    Town_Rec_Ref INT AUTO_INCREMENT PRIMARY KEY,
    Town VARCHAR(100),
    In_Use BOOLEAN DEFAULT 1,
    Country_Rec_Ref INT,
    FOREIGN KEY (Country_Rec_Ref) REFERENCES TBL_Country(Country_Rec_Ref)
);

-- ============================================================
-- TABLE: TBL_Gender
-- ============================================================
CREATE TABLE TBL_Gender (
    Gender_Rec_Ref INT AUTO_INCREMENT PRIMARY KEY,
    Gender VARCHAR(50),
    In_Use BOOLEAN DEFAULT 1
);

-- ============================================================
-- TABLE: TBL_Patient
-- ============================================================
CREATE TABLE TBL_Patient (
    Patient_ID INT AUTO_INCREMENT PRIMARY KEY,
    Patient_Number VARCHAR(8),
    Patient_Name VARCHAR(100),
    Patient_Surname VARCHAR(100),
    DOB DATE,
    Add_1 VARCHAR(255),
    Add_2 VARCHAR(255),
    Add_3 VARCHAR(255),
    Town_Rec_Ref INT,
    Country_Rec_Ref INT,
    Gender_Rec_Ref INT,
    FOREIGN KEY (Town_Rec_Ref) REFERENCES TBL_Town(Town_Rec_Ref),
    FOREIGN KEY (Country_Rec_Ref) REFERENCES TBL_Country(Country_Rec_Ref),
    FOREIGN KEY (Gender_Rec_Ref) REFERENCES TBL_Gender(Gender_Rec_Ref)
);

-- ============================================================
-- TABLE: TBL_Medication
-- ============================================================
CREATE TABLE TBL_Medication (
    Medication_Rec_Ref INT AUTO_INCREMENT PRIMARY KEY,
    System_Date DATE,
    Remarks VARCHAR(255),
    Patient_ID INT,
    FOREIGN KEY (Patient_ID) REFERENCES TBL_Patient(Patient_ID)
);

-- ============================================================
-- TABLE: TBL_User (with password reset + tracking columns)
-- ============================================================
CREATE TABLE TBL_User (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password_Hash VARCHAR(255) NOT NULL,
    Role VARCHAR(20) DEFAULT 'user',
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Reset_Token VARCHAR(255) DEFAULT NULL,
    Reset_Token_Expiry TIMESTAMP NULL DEFAULT NULL,
    Last_Login TIMESTAMP NULL DEFAULT NULL,
    Is_Active BOOLEAN DEFAULT 1
);

-- ============================================================
-- INSERT: Malta and Gozo Data
-- ============================================================

-- Insert Malta
INSERT INTO TBL_Country (Country, In_Use) VALUES ('Malta', 1);
SET @malta_id = LAST_INSERT_ID();

-- Insert Maltese towns
INSERT INTO TBL_Town (Town, In_Use, Country_Rec_Ref) VALUES
('Valletta', 1, @malta_id),
('Birkirkara', 1, @malta_id),
('Mosta', 1, @malta_id),
('Qormi', 1, @malta_id),
('Żabbar', 1, @malta_id),
('St. Paul''s Bay', 1, @malta_id),
('San Ġwann', 1, @malta_id),
('Sliema', 1, @malta_id),
('Naxxar', 1, @malta_id),
('Rabat', 1, @malta_id),
('Fgura', 1, @malta_id),
('Żejtun', 1, @malta_id),
('Ħamrun', 1, @malta_id),
('Mellieħa', 1, @malta_id),
('Attard', 1, @malta_id),
('Paola', 1, @malta_id),
('Tarxien', 1, @malta_id),
('Marsa', 1, @malta_id),
('Msida', 1, @malta_id),
('Swieqi', 1, @malta_id),
('Birżebbuġa', 1, @malta_id),
('St. Julian''s', 1, @malta_id),
('Żurrieq', 1, @malta_id),
('Siġġiewi', 1, @malta_id),
('Marsaskala', 1, @malta_id);

-- Insert Gozo
INSERT INTO TBL_Country (Country, In_Use) VALUES ('Gozo', 1);
SET @gozo_id = LAST_INSERT_ID();

-- Insert Gozo towns/villages
INSERT INTO TBL_Town (Town, In_Use, Country_Rec_Ref) VALUES
('Victoria (Rabat)', 1, @gozo_id),
('Nadur', 1, @gozo_id),
('Xagħra', 1, @gozo_id),
('Żebbuġ', 1, @gozo_id),
('Sannat', 1, @gozo_id),
('Munxar', 1, @gozo_id),
('Għarb', 1, @gozo_id),
('Għasri', 1, @gozo_id),
('Kerċem', 1, @gozo_id),
('San Lawrenz', 1, @gozo_id),
('Fontana', 1, @gozo_id),
('Xewkija', 1, @gozo_id),
('Qala', 1, @gozo_id),
('Għajnsielem', 1, @gozo_id);

-- ============================================================
-- INSERT: Gender Data
-- ============================================================
INSERT INTO TBL_Gender (Gender, In_Use) VALUES
('Male', 1),
('Female', 1),
('Other', 1);
