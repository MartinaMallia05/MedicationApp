-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 22, 2025 at 03:02 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `medical_db`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `insert_patients` ()   BEGIN
    DECLARE i INT DEFAULT 1;

    DECLARE letters TEXT DEFAULT 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    WHILE i <= 100 DO

        -- Patient_Number: 7 digits + 1 letter
        SET @num_part = LPAD(FLOOR(RAND() * 9999999), 7, '0');
        SET @letter_part = SUBSTRING(letters, FLOOR(1 + RAND() * 26), 1);
        SET @patient_number = CONCAT(@num_part, @letter_part);

        -- Random first name
        SET @fname = ELT(FLOOR(1 + RAND() * 20),
            'John','Mary','Alex','Emma','Michael','Sarah','David','Laura',
            'Daniel','Julia','Matthew','Emily','Joseph','Linda','Andrew',
            'Rebecca','Nicholas','Olivia','Ben','Grace');

        -- Random last name
        SET @lname = ELT(FLOOR(1 + RAND() * 20),
            'Borg','Camilleri','Vella','Zammit','Micallef','Gauci','Spiteri',
            'Grech','Agius','Farrugia','Attard','Caruana','Debono','Mizzi',
            'Fenech','Formosa','Gatt','Pace','Bonnici','Cassar');

        -- DOB (18–90 years old)
        SET @dob = DATE_SUB(CURDATE(), INTERVAL (18 + FLOOR(RAND() * 72)) YEAR);

        -- Addresses
        SET @add1 = CONCAT('House ', FLOOR(1 + RAND() * 200));
        SET @add2 = CONCAT('Street ', FLOOR(1 + RAND() * 200));
        SET @add3 = CONCAT('Block ', FLOOR(1 + RAND() * 20));

        -- Town (and linked country)
        SET @town = (SELECT Town_Rec_Ref FROM TBL_Town ORDER BY RAND() LIMIT 1);
        SET @country = (SELECT Country_Rec_Ref FROM TBL_Town WHERE Town_Rec_Ref = @town);

        -- Gender
        SET @gender = (SELECT Gender_Rec_Ref FROM TBL_Gender ORDER BY RAND() LIMIT 1);

        INSERT INTO TBL_Patient
        (Patient_Number, Patient_Name, Patient_Surname, DOB,
         Add_1, Add_2, Add_3, Town_Rec_Ref, Country_Rec_Ref, Gender_Rec_Ref)
        VALUES
        (@patient_number, @fname, @lname, @dob,
         @add1, @add2, @add3, @town, @country, @gender);

        SET i = i + 1;
    END WHILE;

END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_country`
--

CREATE TABLE `tbl_country` (
  `Country_Rec_Ref` int(11) NOT NULL,
  `Country` varchar(100) DEFAULT NULL,
  `In_Use` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_country`
--

INSERT INTO `tbl_country` (`Country_Rec_Ref`, `Country`, `In_Use`) VALUES
(1, 'Malta', 1),
(2, 'Gozo', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_gender`
--

CREATE TABLE `tbl_gender` (
  `Gender_Rec_Ref` int(11) NOT NULL,
  `Gender` varchar(50) DEFAULT NULL,
  `In_Use` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_gender`
--

INSERT INTO `tbl_gender` (`Gender_Rec_Ref`, `Gender`, `In_Use`) VALUES
(1, 'Male', 1),
(2, 'Female', 1),
(3, 'Other', 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_medication`
--

CREATE TABLE `tbl_medication` (
  `Medication_Rec_Ref` int(11) NOT NULL,
  `System_Date` date DEFAULT NULL,
  `Remarks` varchar(255) DEFAULT NULL,
  `Patient_ID` int(11) DEFAULT NULL,
  `Medication_Name` varchar(255) DEFAULT NULL,
  `Prescribed_By_User_ID` int(11) DEFAULT NULL,
  `Created_At` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_medication`
--

INSERT INTO `tbl_medication` (`Medication_Rec_Ref`, `System_Date`, `Remarks`, `Patient_ID`, `Medication_Name`, `Prescribed_By_User_ID`, `Created_At`) VALUES
(1, '2025-11-15', 'N/A1', 49, 'Lisinopril (Oral Pill)', 1, '2025-11-16 15:49:56'),
(2, '2025-11-01', 'Take twice daily for headache', 20, 'Acetaminophen (Tylenol)', 1, '2025-11-16 15:49:56'),
(3, '2025-11-02', 'For pain management', 20, 'Ibuprofen (Advil, Motrin)', 1, '2025-11-16 15:49:56'),
(4, '2025-11-03', 'Cholesterol control', 37, 'Atorvastatin (Lipitor)', 1, '2025-11-16 15:49:56'),
(5, '2025-11-04', 'Blood pressure medication', 37, 'Lisinopril (Prinivil, Zestril)', 1, '2025-11-16 15:49:56'),
(6, '2025-11-05', 'Diabetes management', 82, 'Metformin (Glucophage)', 1, '2025-11-16 15:49:56'),
(7, '2025-11-06', 'Morning and evening doses', 82, 'Insulin', 1, '2025-11-16 15:49:56'),
(8, '2025-11-07', 'Daily low dose for heart health', 20, 'Aspirin', 1, '2025-11-16 15:49:56'),
(9, '2025-11-08', 'Thyroid medication', 37, 'Levothyroxine (Synthroid)', 1, '2025-11-16 15:49:56'),
(10, '2025-11-09', 'Acid reflux', 82, 'Omeprazole (Prilosec)', 1, '2025-11-16 15:49:56'),
(11, '2025-11-10', 'Antibiotic - 7 day course', 20, 'Amoxicillin', 1, '2025-11-16 15:49:56'),
(12, '2025-11-11', 'Respiratory infection', 37, 'Azithromycin (Zithromax)', 1, '2025-11-16 15:49:56'),
(13, '2025-11-12', 'UTI treatment', 82, 'Ciprofloxacin (Cipro)', 1, '2025-11-16 15:49:56'),
(14, '2025-11-13', 'Blood thinner', 20, 'Clopidogrel (Plavix)', 1, '2025-11-16 15:49:56'),
(15, '2025-11-14', 'Blood pressure', 37, 'Losartan (Cozaar)', 1, '2025-11-16 15:49:56'),
(16, '2025-11-15', 'Beta blocker', 82, 'Metoprolol (Lopressor, Toprol)', 1, '2025-11-16 15:49:56'),
(17, '2025-11-01', 'Stomach protection', 20, 'Pantoprazole (Protonix)', 1, '2025-11-16 15:49:56'),
(18, '2025-11-02', 'Antidepressant', 37, 'Sertraline (Zoloft)', 1, '2025-11-16 15:49:56'),
(19, '2025-11-03', 'Cholesterol medication', 82, 'Simvastatin (Zocor)', 1, '2025-11-16 15:49:56'),
(20, '2025-11-04', 'Anticoagulant - monitor INR', 20, 'Warfarin (Coumadin)', 1, '2025-11-16 15:49:56'),
(21, '2025-11-05', 'Inhaler for asthma', 37, 'Albuterol (Ventolin, ProAir)', 1, '2025-11-16 15:49:56'),
(22, '2025-11-06', 'Nerve pain', 82, 'Gabapentin (Neurontin)', 1, '2025-11-16 15:49:56'),
(23, '2025-11-07', 'Diuretic', 20, 'Hydrochlorothiazide (HCTZ)', 1, '2025-11-16 15:49:56'),
(24, '2025-11-08', 'Asthma prevention', 37, 'Montelukast (Singulair)', 1, '2025-11-16 15:49:56'),
(25, '2025-11-09', 'Anti-inflammatory - 5 day taper', 82, 'Prednisone', 1, '2025-11-16 15:49:56'),
(26, '2025-11-10', 'Pain relief', 20, 'Tramadol (Ultram)', 1, '2025-11-16 15:49:56'),
(27, '2025-11-11', 'Sleep aid', 37, 'Trazodone (Desyrel)', 1, '2025-11-16 15:49:56'),
(28, '2025-11-12', 'Calcium channel blocker', 82, 'Amlodipine (Norvasc)', 1, '2025-11-16 15:49:56'),
(29, '2025-11-13', 'Diuretic for edema', 20, 'Furosemide (Lasix)', 1, '2025-11-16 15:49:56'),
(30, '2025-11-14', 'Antibiotic', 37, 'Metronidazole (Flagyl)', 1, '2025-11-16 15:49:56'),
(31, '2025-11-15', 'Broad spectrum antibiotic', 82, 'Doxycycline', 1, '2025-11-16 15:49:56'),
(32, '2025-11-01', 'Skin infection', 20, 'Cephalexin (Keflex)', 1, '2025-11-16 15:49:56'),
(33, '2025-11-02', 'SSRI antidepressant', 37, 'Fluoxetine (Prozac)', 1, '2025-11-16 15:49:56'),
(35, '2025-11-04', 'Anxiety medication', 20, 'Lorazepam (Ativan)', 1, '2025-11-16 15:49:56'),
(37, '2025-11-06', 'NSAID for pain', 82, 'Naproxen (Aleve)', 1, '2025-11-16 15:49:56'),
(49, '2025-11-03', 'Anxiety and depression', 82, 'LEVO-T (Oral Pill)', 1, '2025-11-16 15:49:56'),
(54, '2025-11-16', 'Knives', 102, 'Omeprazole (Oral Pill)', 13, '2025-11-16 16:17:55'),
(56, '2025-11-16', 'nlkn', 101, 'PRINIVIL (Oral Pill)', 15, '2025-11-16 16:21:04'),
(58, '2025-11-17', 'N/A', 93, 'UNITHROID (Oral Pill)', 13, '2025-11-17 17:26:19'),
(59, '2025-11-17', 'Panadolsddddd', 87, 'Levothyroxine (Oral Pill)', 13, '2025-11-17 17:28:05'),
(60, '2025-11-18', 'N/A', 92, 'UNITHROID (Oral Pill)', 15, '2025-11-18 17:05:47');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_patient`
--

CREATE TABLE `tbl_patient` (
  `Patient_ID` int(11) NOT NULL,
  `Patient_Number` varchar(8) DEFAULT NULL,
  `Patient_Name` varchar(100) DEFAULT NULL,
  `Patient_Surname` varchar(100) DEFAULT NULL,
  `DOB` date DEFAULT NULL,
  `Add_1` varchar(255) DEFAULT NULL,
  `Add_2` varchar(255) DEFAULT NULL,
  `Add_3` varchar(255) DEFAULT NULL,
  `Town_Rec_Ref` int(11) DEFAULT NULL,
  `Country_Rec_Ref` int(11) DEFAULT NULL,
  `Gender_Rec_Ref` int(11) DEFAULT NULL,
  `Created_By_User_ID` int(11) DEFAULT NULL,
  `Created_At` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_patient`
--

INSERT INTO `tbl_patient` (`Patient_ID`, `Patient_Number`, `Patient_Name`, `Patient_Surname`, `DOB`, `Add_1`, `Add_2`, `Add_3`, `Town_Rec_Ref`, `Country_Rec_Ref`, `Gender_Rec_Ref`, `Created_By_User_ID`, `Created_At`) VALUES
(1, '4717790Q', 'Linda', 'Caruana', '1946-11-15', 'House 102', 'Street 197', 'Block 8', 24, 1, 1, 1, '2025-11-16 15:49:56'),
(2, '6637015N', 'Linda', 'Pace', '1994-11-15', 'House 81', 'Street 87', 'Block 19', 27, 2, 1, 1, '2025-11-16 15:49:56'),
(3, '6110060H', 'Emily', 'Vella', '1947-11-15', 'House 160', 'Street 97', 'Block 1', 31, 2, 1, 1, '2025-11-16 15:49:56'),
(4, '0713376N', 'Laura', 'Spiteri', '1978-11-15', 'House 27', 'Street 88', 'Block 16', 5, 1, 3, 1, '2025-11-16 15:49:56'),
(5, '1742389T', 'Michael', 'Formosa', '1982-11-15', 'House 79', 'Street 181', 'Block 7', 31, 2, 2, 1, '2025-11-16 15:49:56'),
(6, '5853579H', 'Rebecca', 'Pace', '2001-11-15', 'House 165', 'Street 171', 'Block 16', 15, 1, 2, 1, '2025-11-16 15:49:56'),
(7, '3774420P', 'Nicholas', 'Agius', '1966-11-15', 'House 130', 'Street 97', 'Block 10', 31, 2, 1, 1, '2025-11-16 15:49:56'),
(8, '2182322X', 'Grace', 'Borg', '1994-11-15', 'House 179', 'Street 181', 'Block 17', 17, 1, 2, 1, '2025-11-16 15:49:56'),
(10, '0510152V', 'Grace', 'Farrugia', '1971-11-15', 'House 5', 'Street 120', 'Block 19', 12, 1, 2, 1, '2025-11-16 15:49:56'),
(11, '6654277R', 'Laura', 'Gatt', '2000-11-15', 'House 199', 'Street 129', 'Block 5', 38, 2, 1, 1, '2025-11-16 15:49:56'),
(12, '2883332J', 'Olivia', 'Spiteri', '1938-11-15', 'House 180', 'Street 115', 'Block 4', 34, 2, 2, 1, '2025-11-16 15:49:56'),
(13, '3711706F', 'Grace', 'Gauci', '1978-11-15', 'House 48', 'Street 192', 'Block 2', 4, 1, 3, 1, '2025-11-16 15:49:56'),
(14, '8315438D', 'Sarah', 'Pace', '1964-11-15', 'House 76', 'Street 17', 'Block 6', 25, 1, 3, 1, '2025-11-16 15:49:56'),
(15, '9414594E', 'Grace', 'Spiteri', '1952-11-15', 'House 178', 'Street 22', 'Block 18', 17, 1, 2, 1, '2025-11-16 15:49:56'),
(16, '8132188K', 'Emily', 'Formosa', '2007-11-15', 'House 150', 'Street 144', 'Block 7', 18, 1, 1, 1, '2025-11-16 15:49:56'),
(17, '7477577M', 'Emma', 'Grech', '1977-11-15', 'House 190', 'Street 96', 'Block 12', 24, 1, 3, 1, '2025-11-16 15:49:56'),
(18, '9356730H', 'Emily', 'Cassar', '1996-11-15', 'House 180', 'Street 3', 'Block 8', 14, 1, 3, 1, '2025-11-16 15:49:56'),
(19, '5377402D', 'John', 'Gatt', '1944-11-15', 'House 6', 'Street 97', 'Block 7', 10, 1, 3, 1, '2025-11-16 15:49:56'),
(20, '7408249A', 'Nicholas', 'Zammit', '1983-11-15', 'House 34', 'Street 167', 'Block 14', 29, 2, 1, 1, '2025-11-16 15:49:56'),
(21, '9884844Z', 'Grace', 'Cassar', '1946-11-15', 'House 82', 'Street 94', 'Block 3', 5, 1, 2, 1, '2025-11-16 15:49:56'),
(22, '8818066N', 'Olivia', 'Gatt', '1969-11-15', 'House 33', 'Street 48', 'Block 14', 6, 1, 3, 1, '2025-11-16 15:49:56'),
(23, '5348211I', 'Grace', 'Bonnici', '1964-11-15', 'House 66', 'Street 163', 'Block 2', 1, 1, 1, 1, '2025-11-16 15:49:56'),
(24, '8093330Y', 'David', 'Fenech', '1957-11-15', 'House 63', 'Street 92', 'Block 8', 17, 1, 2, 1, '2025-11-16 15:49:56'),
(25, '4336665M', 'Mary', 'Camilleri', '1937-11-15', 'House 152', 'Street 167', 'Block 18', 24, 1, 3, 1, '2025-11-16 15:49:56'),
(26, '9729881H', 'Matthew', 'Gatt', '1968-11-15', 'House 48', 'Street 111', 'Block 1', 14, 1, 1, 1, '2025-11-16 15:49:56'),
(27, '5988639W', 'Matthew', 'Borg', '1974-11-15', 'House 69', 'Street 58', 'Block 9', 5, 1, 1, 1, '2025-11-16 15:49:56'),
(28, '2424781G', 'Daniel', 'Farrugia', '1995-11-15', 'House 74', 'Street 64', 'Block 10', 31, 2, 3, 1, '2025-11-16 15:49:56'),
(29, '4723231C', 'John', 'Cassar', '1957-11-15', 'House 117', 'Street 166', 'Block 8', 39, 2, 1, 1, '2025-11-16 15:49:56'),
(30, '4202255U', 'Joseph', 'Formosa', '1937-11-15', 'House 115', 'Street 187', 'Block 20', 24, 1, 2, 1, '2025-11-16 15:49:56'),
(31, '9355618S', 'Andrew', 'Attard', '1977-11-15', 'House 111', 'Street 101', 'Block 17', 31, 2, 3, 1, '2025-11-16 15:49:56'),
(32, '4102355W', 'John', 'Debono', '2003-11-15', 'House 87', 'Street 190', 'Block 9', 15, 1, 1, 1, '2025-11-16 15:49:56'),
(33, '3230514K', 'Mary', 'Zammit', '1957-11-15', 'House 184', 'Street 99', 'Block 15', 29, 2, 1, 1, '2025-11-16 15:49:56'),
(34, '2525311F', 'David', 'Bonnici', '1964-11-15', 'House 64', 'Street 153', 'Block 18', 17, 1, 3, 1, '2025-11-16 15:49:56'),
(35, '4954586R', 'Grace', 'Fenech', '1950-11-15', 'House 160', 'Street 116', 'Block 10', 31, 2, 2, 1, '2025-11-16 15:49:56'),
(36, '5347939S', 'John', 'Bonnici', '1967-11-15', 'House 3', 'Street 79', 'Block 19', 38, 2, 1, 1, '2025-11-16 15:49:56'),
(37, '3285737I', 'Linda', 'Agius', '2005-11-15', 'House 186', 'Street 107', 'Block 18', 6, 1, 2, 1, '2025-11-16 15:49:56'),
(38, '3858939B', 'Emma', 'Formosa', '1988-11-15', 'House 7', 'Street 69', 'Block 13', 4, 1, 2, 1, '2025-11-16 15:49:56'),
(39, '8119083Y', 'Sarah', 'Caruana', '1999-11-15', 'House 161', 'Street 132', 'Block 18', 27, 2, 1, 1, '2025-11-16 15:49:56'),
(40, '4119941V', 'Ben', 'Borg', '1970-11-15', 'House 88', 'Street 130', 'Block 19', 22, 1, 2, 1, '2025-11-16 15:49:56'),
(41, '3768284J', 'Rebecca', 'Fenech', '1986-11-15', 'House 65', 'Street 143', 'Block 13', 12, 1, 3, 1, '2025-11-16 15:49:56'),
(42, '7053197N', 'Daniel', 'Caruana', '1963-11-15', 'House 76', 'Street 7', 'Block 1', 39, 2, 3, 1, '2025-11-16 15:49:56'),
(43, '2880208U', 'Alex', 'Zammit', '1963-11-15', 'House 108', 'Street 161', 'Block 9', 2, 1, 3, 1, '2025-11-16 15:49:56'),
(44, '9959148Y', 'Andrew', 'Formosa', '1962-11-15', 'House 176', 'Street 101', 'Block 18', 9, 1, 1, 1, '2025-11-16 15:49:56'),
(45, '7812115H', 'Alex', 'Gatt', '1958-11-15', 'House 197', 'Street 167', 'Block 5', 15, 1, 3, 1, '2025-11-16 15:49:56'),
(46, '1516912R', 'Nicholas', 'Micallef', '1967-11-15', 'House 35', 'Street 34', 'Block 7', 20, 1, 3, 1, '2025-11-16 15:49:56'),
(47, '9436628O', 'John', 'Farrugia', '1992-11-15', 'House 142', 'Street 173', 'Block 4', 36, 2, 2, 1, '2025-11-16 15:49:56'),
(48, '9160555O', 'Grace', 'Gauci', '1974-11-15', 'House 98', 'Street 8', 'Block 15', 28, 2, 3, 1, '2025-11-16 15:49:56'),
(49, '5651196O', 'John', 'Agius', '1995-11-15', 'House 103', 'Street 13', 'Block 16', 8, 1, 2, 1, '2025-11-16 15:49:56'),
(50, '6528426O', 'Andrew', 'Camilleri', '1991-11-15', 'House 176', 'Street 141', 'Block 18', 31, 2, 2, 1, '2025-11-16 15:49:56'),
(51, '9274217T', 'Olivia', 'Micallef', '1969-11-15', 'House 186', 'Street 12', 'Block 11', 23, 1, 3, 1, '2025-11-16 15:49:56'),
(52, '0449056Y', 'Linda', 'Agius', '1992-11-15', 'House 147', 'Street 5', 'Block 19', 29, 2, 1, 1, '2025-11-16 15:49:56'),
(53, '6939835Y', 'Joseph', 'Zammit', '1995-11-15', 'House 56', 'Street 176', 'Block 12', 36, 2, 1, 1, '2025-11-16 15:49:56'),
(54, '2849902I', 'Rebecca', 'Cassar', '1973-11-15', 'House 93', 'Street 177', 'Block 1', 25, 1, 1, 1, '2025-11-16 15:49:56'),
(55, '7659857X', 'Michael', 'Agius', '1982-11-15', 'House 113', 'Street 148', 'Block 20', 15, 1, 2, 1, '2025-11-16 15:49:56'),
(56, '4610012E', 'Matthew', 'Zammit', '1995-11-15', 'House 83', 'Street 106', 'Block 9', 36, 2, 1, 1, '2025-11-16 15:49:56'),
(57, '8726299R', 'Linda', 'Spiteri', '1968-11-15', 'House 173', 'Street 130', 'Block 14', 21, 1, 2, 1, '2025-11-16 15:49:56'),
(58, '0361941L', 'Mary', 'Camilleri', '1991-11-15', 'House 169', 'Street 110', 'Block 5', 6, 1, 1, 1, '2025-11-16 15:49:56'),
(59, '7677150F', 'Andrew', 'Camilleri', '1997-11-15', 'House 102', 'Street 22', 'Block 1', 21, 1, 3, 1, '2025-11-16 15:49:56'),
(60, '7280247L', 'John', 'Formosa', '1951-11-15', 'House 126', 'Street 158', 'Block 2', 3, 1, 2, 1, '2025-11-16 15:49:56'),
(61, '0347169S', 'Laura', 'Fenech', '1971-11-15', 'House 80', 'Street 93', 'Block 3', 17, 1, 1, 1, '2025-11-16 15:49:56'),
(62, '5905232S', 'Andrew', 'Attard', '1968-11-15', 'House 16', 'Street 151', 'Block 11', 5, 1, 2, 1, '2025-11-16 15:49:56'),
(63, '8238115X', 'Grace', 'Zammit', '1936-11-15', 'House 88', 'Street 42', 'Block 15', 1, 1, 2, 1, '2025-11-16 15:49:56'),
(64, '1626510E', 'Daniel', 'Caruana', '1963-11-15', 'House 69', 'Street 173', 'Block 6', 37, 2, 2, 1, '2025-11-16 15:49:56'),
(65, '1120872T', 'Daniel', 'Cassar', '1976-11-15', 'House 69', 'Street 77', 'Block 18', 11, 1, 1, 1, '2025-11-16 15:49:56'),
(66, '8494712N', 'Alex', 'Camilleri', '1936-11-15', 'House 147', 'Street 134', 'Block 4', 39, 2, 2, 1, '2025-11-16 15:49:56'),
(67, '1895608V', 'Joseph', 'Attard', '1950-11-15', 'House 82', 'Street 133', 'Block 2', 26, 2, 1, 1, '2025-11-16 15:49:56'),
(68, '8070185Q', 'Nicholas', 'Vella', '1987-11-15', 'House 1', 'Street 31', 'Block 15', 14, 1, 3, 1, '2025-11-16 15:49:56'),
(69, '0598142X', 'David', 'Bonnici', '1967-11-15', 'House 21', 'Street 163', 'Block 16', 34, 2, 1, 1, '2025-11-16 15:49:56'),
(70, '9872454T', 'Andrew', 'Grech', '1954-11-15', 'House 112', 'Street 117', 'Block 5', 32, 2, 3, 1, '2025-11-16 15:49:56'),
(71, '4189738Z', 'Andrew', 'Caruana', '1947-11-15', 'House 79', 'Street 91', 'Block 2', 7, 1, 1, 1, '2025-11-16 15:49:56'),
(72, '9834198O', 'Andrew', 'Vella', '1979-11-15', 'House 116', 'Street 143', 'Block 17', 1, 1, 2, 1, '2025-11-16 15:49:56'),
(73, '9976220B', 'Laura', 'Caruana', '1950-11-15', 'House 53', 'Street 184', 'Block 17', 18, 1, 1, 1, '2025-11-16 15:49:56'),
(74, '4982748G', 'Rebecca', 'Borg', '1943-11-15', 'House 77', 'Street 46', 'Block 20', 25, 1, 3, 1, '2025-11-16 15:49:56'),
(75, '6365486S', 'Andrew', 'Agius', '1941-11-15', 'House 74', 'Street 13', 'Block 5', 32, 2, 3, 1, '2025-11-16 15:49:56'),
(76, '8727446H', 'Rebecca', 'Cassar', '1969-11-15', 'House 159', 'Street 70', 'Block 8', 37, 2, 3, 1, '2025-11-16 15:49:56'),
(77, '0022097O', 'Andrew', 'Bonnici', '1972-11-15', 'House 137', 'Street 188', 'Block 13', 22, 1, 1, 1, '2025-11-16 15:49:56'),
(78, '2337604E', 'Michael', 'Attard', '1940-11-15', 'House 28', 'Street 175', 'Block 20', 35, 2, 1, 1, '2025-11-16 15:49:56'),
(79, '8734788U', 'Laura', 'Attard', '1980-11-15', 'House 80', 'Street 168', 'Block 20', 29, 2, 2, 1, '2025-11-16 15:49:56'),
(80, '6481020J', 'Ben', 'Farrugia', '1963-11-15', 'House 129', 'Street 75', 'Block 19', 26, 2, 2, 1, '2025-11-16 15:49:56'),
(81, '7809312X', 'Michael', 'Agius', '1984-11-15', 'House 85', 'Street 28', 'Block 9', 8, 1, 2, 1, '2025-11-16 15:49:56'),
(82, '7813578E', 'Matthew', 'Zammit', '1982-11-15', 'House 33', 'Street 152', 'Block 6', 7, 1, 1, 1, '2025-11-16 15:49:56'),
(83, '7988313F', 'Emily', 'Spiteri', '1944-11-15', 'House 82', 'Street 81', 'Block 16', 29, 2, 3, 1, '2025-11-16 15:49:56'),
(84, '4849853I', 'Michael', 'Vella', '1943-11-15', 'House 29', 'Street 3', 'Block 13', 16, 1, 3, 1, '2025-11-16 15:49:56'),
(85, '8454056L', 'Andrew', 'Spiteri', '1978-11-15', 'House 17', 'Street 38', 'Block 14', 23, 1, 2, 1, '2025-11-16 15:49:56'),
(86, '3043552X', 'Joseph', 'Grech', '2005-11-15', 'House 2', 'Street 191', 'Block 15', 29, 2, 1, 1, '2025-11-16 15:49:56'),
(87, '0100843N', 'Emily', 'Grech', '1994-11-15', 'House 156', 'Street 61', 'Block 4', 1, 1, 2, 1, '2025-11-16 15:49:56'),
(88, '8362591L', 'Joseph', 'Formosa', '2004-11-15', 'House 185', 'Street 92', 'Block 11', 11, 1, 2, 1, '2025-11-16 15:49:56'),
(89, '2478472V', 'Laura', 'Agius', '2001-11-15', 'House 18', 'Street 34', 'Block 12', 36, 2, 3, 1, '2025-11-16 15:49:56'),
(90, '3993860L', 'Mary', 'Borg', '1939-11-15', 'House 123', 'Street 45', 'Block 6', 6, 1, 3, 1, '2025-11-16 15:49:56'),
(91, '3449244L', 'Alex', 'Grech', '1978-11-15', 'House 197', 'Street 135', 'Block 9', 16, 1, 2, 1, '2025-11-16 15:49:56'),
(92, '5315009L', 'Matthew', 'Grech', '1987-11-15', 'House 64', 'Street 146', 'Block 14', 33, 2, 1, 1, '2025-11-16 15:49:56'),
(93, '0016263F', 'John', 'Farrugia', '1984-11-15', 'House 43', 'Street 16', 'Block 15', 34, 2, 2, 1, '2025-11-16 15:49:56'),
(94, '3821335M', 'Emma', 'Caruana', '1987-11-15', 'House 145', 'Street 151', 'Block 12', 24, 1, 2, 1, '2025-11-16 15:49:56'),
(97, '4688379S', 'Emma', 'Debono', '1958-11-15', 'House 110', 'Street 135', 'Block 15', 11, 1, 2, 1, '2025-11-16 15:49:56'),
(98, '4961179K', 'Matthew', 'Attard', '1943-11-15', 'House 187', 'Street 199', 'Block 4', 29, 2, 1, 1, '2025-11-16 15:49:56'),
(100, '6343315I', 'Andrew', 'Mizzi', '1995-11-15', 'House 174', 'Street 161', 'Block 9', 11, 1, 2, 1, '2025-11-16 15:49:56'),
(101, '0058472M', 'Joseph', 'Mallia', '1972-01-01', '105, Isouard Crt, P/H 13', 'Triq it-Tabib Chetcuti', '111111', 3, 1, 3, 1, '2025-11-16 15:49:56'),
(102, '0153906L', 'Martin', 'Mallia', '2005-05-06', '105, Isouard Crt, P/H 13', 'Triq it-Tabib Chetcuti', 'Klu474', 3, 1, 3, 1, '2025-11-16 15:49:56'),
(103, '0501475M', 'Janet Mallia', 'Mallia', '1975-10-13', '105, Isouard Crt, P/H 13', 'Triq it-Tabib Chetcut', 'MST1102', 3, 1, 1, 1, '2025-11-16 15:49:56');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_town`
--

CREATE TABLE `tbl_town` (
  `Town_Rec_Ref` int(11) NOT NULL,
  `Town` varchar(100) DEFAULT NULL,
  `In_Use` tinyint(1) DEFAULT 1,
  `Country_Rec_Ref` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_town`
--

INSERT INTO `tbl_town` (`Town_Rec_Ref`, `Town`, `In_Use`, `Country_Rec_Ref`) VALUES
(1, 'Valletta', 1, 1),
(2, 'Birkirkara', 1, 1),
(3, 'Mosta', 1, 1),
(4, 'Qormi', 1, 1),
(5, 'Żabbar', 1, 1),
(6, 'St. Paul\'s Bay', 1, 1),
(7, 'San Ġwann', 1, 1),
(8, 'Sliema', 1, 1),
(9, 'Naxxar', 1, 1),
(10, 'Rabat', 1, 1),
(11, 'Fgura', 1, 1),
(12, 'Żejtun', 1, 1),
(13, 'Ħamrun', 1, 1),
(14, 'Mellieħa', 1, 1),
(15, 'Attard', 1, 1),
(16, 'Paola', 1, 1),
(17, 'Tarxien', 1, 1),
(18, 'Marsa', 1, 1),
(19, 'Msida', 1, 1),
(20, 'Swieqi', 1, 1),
(21, 'Birżebbuġa', 1, 1),
(22, 'St. Julian\'s', 1, 1),
(23, 'Żurrieq', 1, 1),
(24, 'Siġġiewi', 1, 1),
(25, 'Marsaskala', 1, 1),
(26, 'Victoria (Rabat)', 1, 2),
(27, 'Nadur', 1, 2),
(28, 'Xagħra', 1, 2),
(29, 'Żebbuġ', 1, 2),
(30, 'Sannat', 1, 2),
(31, 'Munxar', 1, 2),
(32, 'Għarb', 1, 2),
(33, 'Għasri', 1, 2),
(34, 'Kerċem', 1, 2),
(35, 'San Lawrenz', 1, 2),
(36, 'Fontana', 1, 2),
(37, 'Xewkija', 1, 2),
(38, 'Qala', 1, 2),
(39, 'Għajnsielem', 1, 2);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_user`
--

CREATE TABLE `tbl_user` (
  `User_ID` int(11) NOT NULL,
  `Username` varchar(50) NOT NULL,
  `Password_Hash` varchar(255) NOT NULL,
  `Role` varchar(20) DEFAULT 'user',
  `Created_At` timestamp NOT NULL DEFAULT current_timestamp(),
  `Reset_Token` varchar(255) DEFAULT NULL,
  `Reset_Token_Expiry` timestamp NULL DEFAULT NULL,
  `Last_Login` timestamp NULL DEFAULT NULL,
  `Is_Active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_user`
--

INSERT INTO `tbl_user` (`User_ID`, `Username`, `Password_Hash`, `Role`, `Created_At`, `Reset_Token`, `Reset_Token_Expiry`, `Last_Login`, `Is_Active`) VALUES
(1, 'martinamallia05', '$2y$10$H7jJ915oyj4l1AvCSEr7AOnd3TY3TMX7Gkl6br8peA8vRwbEwvdFC', 'admin', '2025-11-15 13:25:30', NULL, NULL, '2025-11-16 15:14:33', 1),
(2, 'JosephMall', '$2y$10$uPqy65QqtTb7Sad.UJYlh.CCcwKq/lFlYpTayLCF1o4XH9nqBfrjK', 'doctor', '2025-11-15 20:14:51', NULL, NULL, '2025-11-20 18:45:03', 1),
(3, 'MarthaV', '$2y$10$I79Oe06pcFliXGh.UgQZm.7LBvZ3gkeUyO9n4HEw2wzIgNlkM7jmu', 'nurse', '2025-11-15 21:04:52', NULL, NULL, '2025-11-16 09:44:38', 1),
(4, 'janetM123', '$2y$10$Jowmx8Ig7DRLrXVTUXYNROT6iLA5vUHInYcKJWlsxTHkn2D4oX87m', 'nurse', '2025-11-15 21:16:05', NULL, NULL, '2025-11-15 21:16:13', 1),
(5, 'KylieZar', '$2y$10$WXyzui6ivObovFvJHRn7xuEF1uf0gwKpBKoR0V/L3zStxfTjnocPe', 'doctor', '2025-11-15 21:22:43', NULL, NULL, '2025-11-15 21:22:51', 1),
(6, 'DavidD', '$2y$10$MbN338xNKBw1bn7Yv0PdhOqhID4EaFXvAUgnHLlhQKYE4OvzRUfYm', 'doctor', '2025-11-16 09:45:27', NULL, NULL, '2025-11-21 20:14:41', 1),
(7, 'janet.mallia', '$2y$10$SVLxzfQwlVjlsnE/dQbLTOQzxqUdG3z47FqDbpPxMmJMyWTsn.ptC', 'doctor', '2025-11-16 13:18:06', NULL, NULL, '2025-11-16 13:18:23', 1),
(8, 'Tina05', '$2y$10$pPjZQb5.x8cbixPZyoa.VO9la4LEiNxlg1liwJ64FR1Of6ejqeApS', 'nurse', '2025-11-16 13:45:07', NULL, NULL, '2025-11-16 13:45:32', 1),
(9, 'Tina2', '$2y$10$JWHgbW2J7jbUZcq69RqS.ORxENtkfhdDvwzDO5eONrbEq.P5Z5kjK', 'doctor', '2025-11-16 13:50:29', NULL, NULL, '2025-11-16 15:44:52', 1),
(10, 'Tina1', '$2y$10$7PwCEqx9xB54WhFhdoR0FOOK1/mC5KZ25FyVBvvGbMsqAmMwZOPCi', 'doctor', '2025-11-16 13:54:52', NULL, NULL, NULL, 1),
(11, 'Tina3', '$2y$10$D1RGWSvUGb6CKHB8F2bb6OiCL/PSKlVC3.deUb16.nVUpXK06hiA6', 'nurse', '2025-11-16 13:57:15', NULL, NULL, '2025-11-16 15:09:49', 1),
(12, 'AMartina', '$2y$10$bIBCpHQgHvcqjA4GFfMgcu.2E2BD72C9FKBeH9vHP6hfCMoaUhs8e', 'admin', '2025-11-16 15:54:09', NULL, NULL, '2025-11-19 16:44:10', 1),
(13, 'DMartina', '$2y$10$fwi9Sm0unq3noywG0XWY8OrWspbK9WcfPOIdwuub9qUyic09F1s5m', 'doctor', '2025-11-16 15:58:30', NULL, NULL, '2025-11-20 18:58:53', 1),
(14, 'NMartina', '$2y$10$Ia4rIRSyUi.PlQv4irjjS.9pqvemKvBsQdpw1kjVieLy90h6kLc2G', 'nurse', '2025-11-16 15:59:17', NULL, NULL, NULL, 1),
(15, 'DJoseph', '$2y$10$tOkZzQT7Fxk57HPJeCnEhetuXrRC1kAJjSatZaw8G5dHzhRCTvZf6', 'doctor', '2025-11-16 16:00:55', NULL, NULL, '2025-11-21 19:03:41', 1),
(16, 'NJoseph', '$2y$10$z3E5MBE8NW0NDwYo423N3ulGqqRYjM6PybMaWsc.kYRnHuuSunuXu', 'nurse', '2025-11-16 16:01:14', NULL, NULL, '2025-11-20 17:16:34', 1),
(17, 'NJanet', '$2y$10$SgI7X3Fp6ddAn8mqhffahutuVE5PR6uq0fD6foVuM5vMqBkpxBtTG', 'nurse', '2025-11-16 16:04:42', NULL, NULL, NULL, 1),
(19, 'AJanet', '$2y$10$0VD9YAp1v6fbCLGUT23Iju3HnDFSMBooXy9F7NNFSIycaU5laUf8G', 'admin', '2025-11-16 16:09:11', NULL, NULL, '2025-11-20 16:56:10', 1),
(20, 'DJanet', '$2y$10$lWngpvXSr5Z1LOlO7fIc.u3ut1JUpk2ASoua0CHBKcMcuEJfbj./W', 'doctor', '2025-11-16 16:10:56', NULL, NULL, NULL, 1),
(21, 'AOmar', '$2y$10$AJZpx7yskfNNe5Ic/PSWcuyo2DCii/.c51uO1qooquxw9Dt2ZC/ZK', 'admin', '2025-11-17 17:31:00', NULL, NULL, '2025-11-20 17:16:07', 1),
(22, 'DAmir', '$2y$10$TiCkr6YdhehrBQp3rhtP6.auEwsut42GlhChx/e33dDGtRJ50I6He', 'doctor', '2025-11-19 16:42:46', NULL, NULL, '2025-11-20 18:59:10', 1),
(23, 'DDmartina', '$2y$10$lw3dmEYnBTup9Hs11swHs.T/0cXgZNx3HLJ3.JcTyiINbnFcO9VmK', 'doctor', '2025-11-20 17:16:56', NULL, NULL, '2025-11-21 20:16:16', 1),
(24, 'AAmartina', '$2y$10$xlGy4mZiQzqTAjR4n3/RPusYZKk1X6K6/bmmfYzz4rEvOWPyUasVm', 'admin', '2025-11-20 17:20:29', NULL, NULL, '2025-11-21 20:14:12', 1),
(25, 'ASuda', '$2y$10$XHWE7Z/J60Su2Cw5Uo3EA.KpZEf1aDzp/3WeT61e1/Y70c5gt2Xqm', 'admin', '2025-11-20 17:25:16', NULL, NULL, '2025-11-20 17:25:24', 1),
(26, 'Dsuda', '$2y$10$2Abgehm/vhwJ7DrPJM.hwuWNpA.wzFPv4anJfku7mj2bhv3CX/tEu', 'doctor', '2025-11-20 17:25:55', NULL, NULL, '2025-11-22 06:29:16', 1),
(27, 'AAAJanet', '$2y$10$EpmPEVusRtvVGmoLUm4hruDAkI1dq9bBI0LBeVGOHbR.9eLoJtuwO', 'admin', '2025-11-20 18:45:29', NULL, NULL, '2025-11-20 18:45:37', 1),
(28, 'AAAQujuj', '$2y$10$sd37N6Qut27eAwSrLXWBMO3SEmq9NiJeR/424qMott1wBbrxhTWwS', 'admin', '2025-11-20 18:49:56', NULL, NULL, '2025-11-20 18:52:49', 1),
(29, 'malliaj', '$2y$10$mQSftHOg7xABfRUtPTMLj.6C5eB2DxqpoWikgx9mFGi82SIpJmCEG', 'doctor', '2025-11-22 07:56:43', NULL, NULL, '2025-11-22 08:10:38', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_country`
--
ALTER TABLE `tbl_country`
  ADD PRIMARY KEY (`Country_Rec_Ref`);

--
-- Indexes for table `tbl_gender`
--
ALTER TABLE `tbl_gender`
  ADD PRIMARY KEY (`Gender_Rec_Ref`);

--
-- Indexes for table `tbl_medication`
--
ALTER TABLE `tbl_medication`
  ADD PRIMARY KEY (`Medication_Rec_Ref`),
  ADD KEY `Patient_ID` (`Patient_ID`),
  ADD KEY `Prescribed_By_User_ID` (`Prescribed_By_User_ID`);

--
-- Indexes for table `tbl_patient`
--
ALTER TABLE `tbl_patient`
  ADD PRIMARY KEY (`Patient_ID`),
  ADD KEY `Town_Rec_Ref` (`Town_Rec_Ref`),
  ADD KEY `Country_Rec_Ref` (`Country_Rec_Ref`),
  ADD KEY `Gender_Rec_Ref` (`Gender_Rec_Ref`),
  ADD KEY `Created_By_User_ID` (`Created_By_User_ID`);

--
-- Indexes for table `tbl_town`
--
ALTER TABLE `tbl_town`
  ADD PRIMARY KEY (`Town_Rec_Ref`),
  ADD KEY `Country_Rec_Ref` (`Country_Rec_Ref`);

--
-- Indexes for table `tbl_user`
--
ALTER TABLE `tbl_user`
  ADD PRIMARY KEY (`User_ID`),
  ADD UNIQUE KEY `Username` (`Username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_country`
--
ALTER TABLE `tbl_country`
  MODIFY `Country_Rec_Ref` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbl_gender`
--
ALTER TABLE `tbl_gender`
  MODIFY `Gender_Rec_Ref` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_medication`
--
ALTER TABLE `tbl_medication`
  MODIFY `Medication_Rec_Ref` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `tbl_patient`
--
ALTER TABLE `tbl_patient`
  MODIFY `Patient_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=106;

--
-- AUTO_INCREMENT for table `tbl_town`
--
ALTER TABLE `tbl_town`
  MODIFY `Town_Rec_Ref` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `tbl_user`
--
ALTER TABLE `tbl_user`
  MODIFY `User_ID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_medication`
--
ALTER TABLE `tbl_medication`
  ADD CONSTRAINT `tbl_medication_ibfk_1` FOREIGN KEY (`Patient_ID`) REFERENCES `tbl_patient` (`Patient_ID`),
  ADD CONSTRAINT `tbl_medication_ibfk_2` FOREIGN KEY (`Prescribed_By_User_ID`) REFERENCES `tbl_user` (`User_ID`);

--
-- Constraints for table `tbl_patient`
--
ALTER TABLE `tbl_patient`
  ADD CONSTRAINT `tbl_patient_ibfk_1` FOREIGN KEY (`Town_Rec_Ref`) REFERENCES `tbl_town` (`Town_Rec_Ref`),
  ADD CONSTRAINT `tbl_patient_ibfk_2` FOREIGN KEY (`Country_Rec_Ref`) REFERENCES `tbl_country` (`Country_Rec_Ref`),
  ADD CONSTRAINT `tbl_patient_ibfk_3` FOREIGN KEY (`Gender_Rec_Ref`) REFERENCES `tbl_gender` (`Gender_Rec_Ref`),
  ADD CONSTRAINT `tbl_patient_ibfk_4` FOREIGN KEY (`Created_By_User_ID`) REFERENCES `tbl_user` (`User_ID`);

--
-- Constraints for table `tbl_town`
--
ALTER TABLE `tbl_town`
  ADD CONSTRAINT `tbl_town_ibfk_1` FOREIGN KEY (`Country_Rec_Ref`) REFERENCES `tbl_country` (`Country_Rec_Ref`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
