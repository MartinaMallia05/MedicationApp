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

-- ============================================================
-- ALTER TABLE: Add User Relationships for Audit Trail
-- ============================================================

-- Add missing Medication_Name field to TBL_Medication (only if it doesn't exist)
ALTER TABLE TBL_Medication 
ADD COLUMN IF NOT EXISTS Medication_Name VARCHAR(255) AFTER Medication_Rec_Ref;

-- Add User relationship to TBL_Patient (who created the patient record)
ALTER TABLE TBL_Patient 
ADD COLUMN IF NOT EXISTS Created_By_User_ID INT,
ADD COLUMN IF NOT EXISTS Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key constraint for Patient creator (only if not exists)
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                  WHERE TABLE_SCHEMA = 'medical_db' 
                  AND TABLE_NAME = 'TBL_Patient' 
                  AND CONSTRAINT_NAME LIKE '%Created_By_User_ID%');

SET @sql = IF(@fk_exists = 0, 
              'ALTER TABLE TBL_Patient ADD FOREIGN KEY (Created_By_User_ID) REFERENCES TBL_User(User_ID)', 
              'SELECT "Foreign key for Patient already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add User relationship to TBL_Medication (who prescribed the medication)
ALTER TABLE TBL_Medication 
ADD COLUMN IF NOT EXISTS Prescribed_By_User_ID INT,
ADD COLUMN IF NOT EXISTS Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key constraint for Medication prescriber (only if not exists)
SET @fk_exists2 = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                   WHERE TABLE_SCHEMA = 'medical_db' 
                   AND TABLE_NAME = 'TBL_Medication' 
                   AND CONSTRAINT_NAME LIKE '%Prescribed_By_User_ID%');

SET @sql2 = IF(@fk_exists2 = 0, 
               'ALTER TABLE TBL_Medication ADD FOREIGN KEY (Prescribed_By_User_ID) REFERENCES TBL_User(User_ID)', 
               'SELECT "Foreign key for Medication already exists" as message');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- ============================================================
-- UPDATE EXISTING DATA: Set default values for new columns
-- ============================================================

-- Update existing patients to have a default creator (first admin user)
-- This prevents NULL foreign key issues
UPDATE TBL_Patient 
SET Created_By_User_ID = (SELECT User_ID FROM TBL_User WHERE Role = 'admin' LIMIT 1)
WHERE Created_By_User_ID IS NULL;

-- Update existing medications to have a default prescriber
UPDATE TBL_Medication 
SET Prescribed_By_User_ID = (SELECT User_ID FROM TBL_User WHERE Role IN ('doctor', 'admin') LIMIT 1)
WHERE Prescribed_By_User_ID IS NULL;
