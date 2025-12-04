/*
SQLyog Ultimate
MySQL - 10.3.39-MariaDB-log : Database - gestion_citas_db
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`gestion_citas_db` /*!40100 DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci */;

USE `gestion_citas_db`;

/*Table structure for table `appointment_treatments` */

CREATE TABLE `appointment_treatments` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `appointmentId` varchar(36) NOT NULL,
  `treatmentId` varchar(36) NOT NULL,
  `quantity` int(11) DEFAULT 1,
  `price` decimal(10,2) NOT NULL,
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_appointment` (`appointmentId`),
  KEY `idx_treatment` (`treatmentId`),
  CONSTRAINT `appointment_treatments_ibfk_1` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointment_treatments_ibfk_2` FOREIGN KEY (`treatmentId`) REFERENCES `treatments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `appointment_treatments` */

insert  into `appointment_treatments`(`id`,`appointmentId`,`treatmentId`,`quantity`,`price`,`notes`) values 
('021bd8df-e1a6-4054-83ad-8b785d276c51','e71bfb58-b335-4f7a-9afe-57b9b4a95baa','335b8602-6e16-4c7b-8cd9-d357a882da17',1,65.00,NULL),
('86a24e5e-1d21-47d3-96cd-cc95054abc5f','8e6f57e8-86cc-4182-ab8c-c25ca20cf12e','4bc4fcef-41bc-4ad6-8b1c-1f97f9a21a50',1,220.00,NULL);

/*Table structure for table `appointments` */

CREATE TABLE `appointments` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `companyId` varchar(36) NOT NULL,
  `clientId` varchar(36) NOT NULL,
  `employeeId` varchar(36) DEFAULT NULL,
  `date` date NOT NULL,
  `startTime` datetime NOT NULL,
  `endTime` datetime NOT NULL,
  `status` enum('SCHEDULED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW') DEFAULT 'SCHEDULED',
  `notes` text DEFAULT NULL,
  `totalAmount` decimal(10,2) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_client` (`clientId`),
  KEY `idx_employee` (`employeeId`),
  KEY `idx_date` (`date`),
  KEY `idx_status` (`status`),
  KEY `idx_start_time` (`startTime`),
  KEY `idx_appointments_date_status` (`date`,`status`),
  KEY `idx_appointments_company` (`companyId`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`),
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appointments_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `appointments` */

insert  into `appointments`(`id`,`companyId`,`clientId`,`employeeId`,`date`,`startTime`,`endTime`,`status`,`notes`,`totalAmount`,`createdAt`,`updatedAt`) values 
('8e6f57e8-86cc-4182-ab8c-c25ca20cf12e','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','6f94f952-98a7-4a42-972d-174e5957b599','721c41e4-6402-4777-807b-63d55f0843f6','2025-12-02','2025-12-02 16:00:00','2025-12-02 17:00:00','SCHEDULED','nnnnn',220.00,'2025-12-02 15:26:05','2025-12-02 15:26:05'),
('e71bfb58-b335-4f7a-9afe-57b9b4a95baa','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','78ac971e-320d-4b71-a87e-90fa30d1c0e8','4c8df718-ff70-4e88-b3f4-8c9ce3ea2036','2025-12-10','2025-12-10 14:00:00','2025-12-10 15:00:00','CONFIRMED','Nueva cita',65.00,'2025-12-02 10:53:54','2025-12-02 10:54:02');

/*Table structure for table `audit_logs` */

CREATE TABLE `audit_logs` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `companyId` varchar(36) DEFAULT NULL,
  `userId` varchar(36) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `entityType` varchar(50) NOT NULL,
  `entityId` varchar(36) DEFAULT NULL,
  `oldValues` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `newValues` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `ipAddress` varchar(45) DEFAULT NULL,
  `userAgent` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_audit_company` (`companyId`),
  KEY `idx_audit_user` (`userId`),
  KEY `idx_audit_action` (`action`),
  KEY `idx_audit_entity` (`entityType`,`entityId`),
  KEY `idx_audit_created` (`createdAt`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `audit_logs` */

/*Table structure for table `clients` */

CREATE TABLE `clients` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `userId` varchar(36) NOT NULL,
  `companyId` varchar(36) NOT NULL,
  `clientCode` varchar(20) NOT NULL,
  `dateOfBirth` date DEFAULT NULL,
  `age` int(11) DEFAULT NULL,
  `gender` enum('M','F','Other') DEFAULT NULL,
  `address` text DEFAULT NULL,
  `emergencyContact` varchar(255) DEFAULT NULL,
  `medicalConditions` text DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  UNIQUE KEY `clientCode` (`clientCode`),
  KEY `idx_code` (`clientCode`),
  KEY `idx_created` (`createdAt`),
  KEY `idx_clients_company` (`companyId`),
  CONSTRAINT `clients_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_clients_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `clients` */

insert  into `clients`(`id`,`userId`,`companyId`,`clientCode`,`dateOfBirth`,`age`,`gender`,`address`,`emergencyContact`,`medicalConditions`,`allergies`,`createdAt`,`updatedAt`) values 
('4313ad34-d990-4b61-9d35-28f63be95c4d','d2e45fda-9ecb-4dbe-88ca-b2c231a944c7','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','CL00000004XXM','1988-05-20',36,'F','Centro Comercial Sambil, Valencia','Luis López - +58-424-2222222',NULL,NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('5a060c42-9457-43f1-86ee-a1b894051288','ab976fff-95b0-4ec4-8aa7-3df17ef9f906','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','CB858354',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('5c003999-87ab-4fd0-9c87-0e50de60388a','d29c0a0e-ad9c-4ae0-a8ca-a196530c93b8','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','CL00000003XXM','1992-11-08',32,'F','Urbanización Los Palos Grandes, Caracas','Carlos González - +58-414-1111111',NULL,NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('6445ecf9-4c72-4aa9-8f92-d34f57c43c0f','64c265e4-9922-4825-8f5a-1a5f5984b2ef','8cc8c29b-87e4-4590-9713-b911c86bfa8f','CV858869',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('6a70c3ed-14ff-4b8a-b19b-40c135d481f2','45566393-64a3-4add-8215-e17602f69d39','8cc8c29b-87e4-4590-9713-b911c86bfa8f','CL00000002XXM','1990-07-22',34,'M','Calle 5, Maracaibo, Venezuela','Ana Peña - +58-416-7654321',NULL,NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('6f94f952-98a7-4a42-972d-174e5957b599','1b0e4b45-1f44-4b35-b0b7-f02ccb85085c','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','CB858502',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('78ac971e-320d-4b71-a87e-90fa30d1c0e8','aaa84bfe-95f0-4fe5-a5af-f4e49cc1395f','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','CL00000008XXM','1987-04-18',37,'M','Mérida, Estado Mérida','Ana Herrera - +58-424-1212121',NULL,NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('7fb51dbc-6d9b-4ab7-a94c-f8f1afd5a270','915ebdb5-c53e-4c10-b284-af190a57d50a','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','CL00000005XXM','1995-01-12',29,'F','Barquisimeto, Estado Lara','Pedro Gomez - +58-414-4444444',NULL,NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('9046e3b5-133e-4615-b881-89978a72ccfa','eac4df6d-1b00-4007-b4c0-971b72265799','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','CB858273',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('9147c959-ac8d-4d7f-bbe6-37785875f6bb','4590646f-9445-4373-9cb8-d34dbbf6cc85','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','CL00000007XXM','1991-12-03',33,'F','Puerto Ordaz, Estado Bolívar','Miguel Rodríguez - +58-426-5555555',NULL,NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('ab61340c-5680-41c6-9bfb-6b6c56fee43f','27625c27-efc2-4bbf-be46-370c3a86a1d3','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','CB858573',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('b35d8635-1084-4499-ad9b-f21a57dc7a38','563389a9-6757-4ef8-90bb-2a29761cd649','8cc8c29b-87e4-4590-9713-b911c86bfa8f','CV858721',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('b8021383-40c9-4ea5-a383-fc435e2a09b8','f53fd8ed-36c6-4fcf-ad80-7580a3766479','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','CB858427',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('ba50de94-2c9b-4e53-95cf-d027cb87ef6b','0a71500b-3760-4c8b-81c4-80f8aed806d1','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','CB858200',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('bbaec4d9-9e82-45e4-bed7-83e4e34a7ad0','8e5a687a-a2e6-49b2-86ae-c8a7da473f19','8cc8c29b-87e4-4590-9713-b911c86bfa8f','CV858795',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('d6041add-e63f-4daf-b400-ce07e7ac3e32','a7c1f8a4-c94f-447f-9cc2-05bccb1a52e8','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','CL00000006XXM','1983-09-30',41,'M','Maracay, Estado Aragua','Elena Martínez - +58-412-9999999',NULL,NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('dce348ef-d0e7-42cd-956d-1c4b6916d526','fbd1f821-a320-4e34-9241-56f152873c4a','8cc8c29b-87e4-4590-9713-b911c86bfa8f','CV858647',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('ec2c528b-e221-4e7d-abe0-3f0ddcda8216','7c7dc2fe-6e0f-4b48-b1ee-9b6a2f5a1a88','8cc8c29b-87e4-4590-9713-b911c86bfa8f','CV858968',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('efbf817d-759b-4707-9ea7-781afc687a7b','55fcd3fd-7f52-403b-afab-901ff718d5a1','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','CL00000001XXM','1985-03-15',39,'F','Av. Principal, Caracas, Venezuela','María Fernandez - +58-412-1234567',NULL,NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39');

/*Table structure for table `companies` */

CREATE TABLE `companies` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(255) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `licenseType` enum('basic','premium','enterprise') DEFAULT 'basic',
  `licenseExpiry` date DEFAULT NULL,
  `maxUsers` int(11) DEFAULT 10,
  `maxClients` int(11) DEFAULT 100,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_companies_slug` (`slug`),
  KEY `idx_companies_active` (`isActive`),
  KEY `idx_companies_license` (`licenseType`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `companies` */

insert  into `companies`(`id`,`name`,`slug`,`email`,`phone`,`address`,`website`,`logo`,`isActive`,`licenseType`,`licenseExpiry`,`maxUsers`,`maxClients`,`createdAt`,`updatedAt`) values 
('7af09fd6-2fab-4542-ad9e-6a80d1b3a773','Clínica Estética Bella','clinica-estetica-bella','contacto@clinicabella.com','+1-555-1001','123 Avenida Principal, Ciudad, País','https://www.clinicabella.com',NULL,1,'premium',NULL,25,500,'2025-12-02 10:47:37','2025-12-02 10:47:37'),
('8cc8c29b-87e4-4590-9713-b911c86bfa8f','Centro de Bienestar Vida','centro-bienestar-vida','info@centrovida.com','+1-555-2001','456 Calle Salud, Zona Norte, País','https://www.centrovida.com',NULL,1,'basic',NULL,15,200,'2025-12-02 10:47:37','2025-12-02 10:47:37');

/*Table structure for table `company_licenses` */

CREATE TABLE `company_licenses` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `companyId` varchar(36) NOT NULL,
  `licenseKey` varchar(255) NOT NULL,
  `licenseType` enum('basic','premium','enterprise') NOT NULL,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `maxUsers` int(11) NOT NULL,
  `maxClients` int(11) NOT NULL,
  `maxStorage` bigint(20) DEFAULT 1073741824,
  `isActive` tinyint(1) DEFAULT 1,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `licenseKey` (`licenseKey`),
  KEY `idx_licenses_company` (`companyId`),
  KEY `idx_licenses_key` (`licenseKey`),
  KEY `idx_licenses_active` (`isActive`),
  CONSTRAINT `company_licenses_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `company_licenses` */

/*Table structure for table `company_settings` */

CREATE TABLE `company_settings` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `companyId` varchar(36) NOT NULL,
  `primaryColor` varchar(7) DEFAULT '#8B5CF6',
  `secondaryColor` varchar(7) DEFAULT '#A78BFA',
  `accentColor` varchar(7) DEFAULT '#C4B5FD',
  `theme` enum('light','dark') DEFAULT 'light',
  `timezone` varchar(50) DEFAULT 'America/New_York',
  `dateFormat` varchar(20) DEFAULT 'DD/MM/YYYY',
  `currency` varchar(3) DEFAULT 'USD',
  `language` varchar(5) DEFAULT 'es',
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `customSettings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_company_settings` (`companyId`),
  CONSTRAINT `company_settings_ibfk_1` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `company_settings` */

insert  into `company_settings`(`id`,`companyId`,`primaryColor`,`secondaryColor`,`accentColor`,`theme`,`timezone`,`dateFormat`,`currency`,`language`,`features`,`customSettings`,`createdAt`,`updatedAt`) values 
('a96b1517-c0ec-4c2e-a7b4-9a080733aaea','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','#8B5CF6','#A78BFA','#C4B5FD','light','America/New_York','DD/MM/YYYY','USD','es',NULL,NULL,'2025-12-02 10:47:37','2025-12-02 10:47:37'),
('e89e2000-6245-4aae-8237-dac8a50746d3','8cc8c29b-87e4-4590-9713-b911c86bfa8f','#3B82F6','#60A5FA','#93C5FD','light','America/New_York','DD/MM/YYYY','USD','es',NULL,NULL,'2025-12-02 10:47:37','2025-12-02 10:47:37');

/*Table structure for table `employees` */

CREATE TABLE `employees` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `userId` varchar(36) NOT NULL,
  `companyId` varchar(36) NOT NULL,
  `position` varchar(100) NOT NULL,
  `specialties` text DEFAULT NULL,
  `schedule` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `hireDate` date NOT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `role` enum('owner','employee') DEFAULT 'employee',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `userId` (`userId`),
  KEY `idx_position` (`position`),
  KEY `idx_active` (`isActive`),
  KEY `idx_hire_date` (`hireDate`),
  KEY `idx_employees_company` (`companyId`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_employees_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `employees` */

insert  into `employees`(`id`,`userId`,`companyId`,`position`,`specialties`,`schedule`,`salary`,`hireDate`,`isActive`,`role`,`createdAt`,`updatedAt`) values 
('35d0dae2-3fd1-4c2c-9dbe-e171c4d07aa3','0e131c9b-7eea-48c5-9052-567418d32d49','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','Esteticista Senior',NULL,NULL,45000.00,'2023-03-01',1,'employee','2025-12-02 10:47:39','2025-12-02 10:47:39'),
('373c9472-b205-415c-985c-9d72b3e7dea3','745e05e7-726a-49f8-b10d-f5f8dd0ab529','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','Terapeuta de Masajes',NULL,NULL,40000.00,'2023-05-15',1,'employee','2025-12-02 10:47:39','2025-12-02 10:47:39'),
('4657a3d3-1f57-431d-9fe7-2583dbfb5fef','8665a260-5e38-4d30-91be-80c26093008b','8cc8c29b-87e4-4590-9713-b911c86bfa8f','Director de Centro',NULL,NULL,70000.00,'2023-02-01',1,'employee','2025-12-02 10:47:39','2025-12-02 10:47:39'),
('4c8df718-ff70-4e88-b3f4-8c9ce3ea2036','5e80bc74-883d-4248-acce-074aa3b09762','8cc8c29b-87e4-4590-9713-b911c86bfa8f','Entrenador Personal',NULL,NULL,42000.00,'2023-06-01',1,'employee','2025-12-02 10:47:39','2025-12-02 10:47:39'),
('721c41e4-6402-4777-807b-63d55f0843f6','b051e440-7993-40ae-a6d2-fff416430a0e','8cc8c29b-87e4-4590-9713-b911c86bfa8f','Nutricionista',NULL,NULL,50000.00,'2023-04-01',1,'employee','2025-12-02 10:47:39','2025-12-02 10:47:39'),
('949828eb-a7fd-4c23-9679-172dfe173c1e','a7c9a4d1-af65-4352-890b-1b23da20305d','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','Administradora General',NULL,NULL,75000.00,'2023-01-15',1,'employee','2025-12-02 10:47:39','2025-12-02 10:47:39');

/*Table structure for table `invoices` */

CREATE TABLE `invoices` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `clientId` varchar(36) NOT NULL,
  `appointmentId` varchar(36) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('PENDING','PARTIAL','PAID','OVERDUE','CANCELLED') DEFAULT 'PENDING',
  `description` text DEFAULT NULL,
  `dueDate` date DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_client` (`clientId`),
  KEY `idx_appointment` (`appointmentId`),
  KEY `idx_status` (`status`),
  KEY `idx_due_date` (`dueDate`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`),
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `invoices` */

insert  into `invoices`(`id`,`clientId`,`appointmentId`,`amount`,`status`,`description`,`dueDate`,`createdAt`,`updatedAt`) values 
('1f14aead-4aad-4a5c-a860-8ffaca1ffff1','78ac971e-320d-4b71-a87e-90fa30d1c0e8','e71bfb58-b335-4f7a-9afe-57b9b4a95baa',65.00,'PARTIAL','Factura por Hidrafacial Coreano - Carlos Herrera','2026-01-09','2025-12-02 10:54:02','2025-12-02 10:54:29');

/*Table structure for table `medical_history` */

CREATE TABLE `medical_history` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `clientId` varchar(36) NOT NULL,
  `date` date DEFAULT curdate(),
  `diagnosis` text DEFAULT NULL,
  `treatment` text NOT NULL,
  `notes` text DEFAULT NULL,
  `attachments` text DEFAULT NULL,
  `createdBy` varchar(36) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_client` (`clientId`),
  KEY `idx_date` (`date`),
  KEY `idx_created_by` (`createdBy`),
  CONSTRAINT `medical_history_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `medical_history_ibfk_2` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `medical_history` */

/*Table structure for table `payments` */

CREATE TABLE `payments` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `clientId` varchar(36) NOT NULL,
  `appointmentId` varchar(36) DEFAULT NULL,
  `invoiceId` varchar(36) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('UNDEFINED','CASH','CARD','TRANSFER','CHECK','FINANCING') DEFAULT 'UNDEFINED',
  `status` enum('PENDING','PAID','PARTIAL','OVERDUE','CANCELLED','REFUNDED') DEFAULT 'PENDING',
  `description` text DEFAULT NULL,
  `transactionId` varchar(255) DEFAULT NULL,
  `dueDate` date DEFAULT NULL,
  `paidDate` datetime DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_client` (`clientId`),
  KEY `idx_appointment` (`appointmentId`),
  KEY `idx_invoice` (`invoiceId`),
  KEY `idx_status` (`status`),
  KEY `idx_method` (`method`),
  KEY `idx_due_date` (`dueDate`),
  KEY `idx_paid_date` (`paidDate`),
  KEY `idx_payments_client_status` (`clientId`,`status`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`),
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`invoiceId`) REFERENCES `invoices` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `payments` */

insert  into `payments`(`id`,`clientId`,`appointmentId`,`invoiceId`,`amount`,`method`,`status`,`description`,`transactionId`,`dueDate`,`paidDate`,`createdAt`,`updatedAt`) values 
('d5f07ff6-cf8e-11f0-9ad3-b999d4594038','78ac971e-320d-4b71-a87e-90fa30d1c0e8','e71bfb58-b335-4f7a-9afe-57b9b4a95baa','1f14aead-4aad-4a5c-a860-8ffaca1ffff1',20.00,'CASH','PAID','asscecececececece','456743',NULL,'2025-12-02 10:54:29','2025-12-02 10:54:29','2025-12-02 10:54:29');

/*Table structure for table `roles` */

CREATE TABLE `roles` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `roles` */

insert  into `roles`(`id`,`name`,`description`,`permissions`,`createdAt`,`updatedAt`) values 
('admin-role-id','administrador','Administrador de empresa con permisos de gestión','{\"employees\":[\"create\",\"read\",\"update\",\"delete\"],\"clients\":[\"create\",\"read\",\"update\",\"delete\"],\"appointments\":[\"create\",\"read\",\"update\",\"delete\"],\"treatments\":[\"create\",\"read\",\"update\",\"delete\"],\"reports\":[\"read\"],\"settings\":[\"read\",\"update\"]}','2025-12-02 10:47:37','2025-12-02 10:47:37'),
('client-role-id','cliente','Cliente con acceso limitado a sus datos','{\"appointments\":[\"read\"],\"treatments\":[\"read\"],\"profile\":[\"read\",\"update\"]}','2025-12-02 10:47:37','2025-12-02 10:47:37'),
('employee-role-id','empleado','Empleado con permisos operativos básicos','{\"clients\":[\"create\",\"read\",\"update\"],\"appointments\":[\"create\",\"read\",\"update\"],\"treatments\":[\"read\"],\"inventory\":[\"read\",\"update\"]}','2025-12-02 10:47:37','2025-12-02 10:47:37'),
('master-role-id','master','Usuario Master con acceso completo al sistema','{\"companies\":[\"create\",\"read\",\"update\",\"delete\"],\"users\":[\"create\",\"read\",\"update\",\"delete\"],\"employees\":[\"create\",\"read\",\"update\",\"delete\"],\"clients\":[\"create\",\"read\",\"update\",\"delete\"],\"appointments\":[\"create\",\"read\",\"update\",\"delete\"],\"treatments\":[\"create\",\"read\",\"update\",\"delete\"],\"reports\":[\"read\"],\"settings\":[\"read\",\"update\"]}','2025-12-02 10:47:37','2025-12-02 10:47:37');

/*Table structure for table `supplies` */

CREATE TABLE `supplies` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `category` varchar(100) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `stock` int(11) DEFAULT 0,
  `minStock` int(11) DEFAULT 0,
  `maxStock` int(11) DEFAULT NULL,
  `unitCost` decimal(10,2) NOT NULL,
  `supplier` varchar(255) DEFAULT NULL,
  `expiryDate` date DEFAULT NULL,
  `status` enum('ACTIVE','LOW_STOCK','OUT_OF_STOCK','EXPIRED','DISCONTINUED') DEFAULT 'ACTIVE',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`),
  KEY `idx_stock` (`stock`),
  KEY `idx_expiry` (`expiryDate`),
  KEY `idx_supplies_category_status` (`category`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `supplies` */

insert  into `supplies`(`id`,`name`,`description`,`category`,`unit`,`stock`,`minStock`,`maxStock`,`unitCost`,`supplier`,`expiryDate`,`status`,`createdAt`,`updatedAt`) values 
('19d12770-9823-4021-8225-2b8657a06955','Toxina Botulínica 100U','Vial de toxina botulínica para tratamientos estéticos','Medicamentos','vial',8,2,15,280.00,'Pharma Aesthetics',NULL,'ACTIVE','2025-12-02 10:47:39','2025-12-02 10:47:39'),
('3ff8b61a-17f1-46df-879b-bed6839540bd','Crema Anestésica Tópica','Crema anestésica para procedimientos estéticos','Cosméticos','tubo',12,3,20,18.75,'Beauty Care Ltd',NULL,'ACTIVE','2025-12-02 10:47:39','2025-12-02 10:47:39'),
('85a80a52-7876-41a2-a175-c0125e967ec3','Guantes Nitrilo','Guantes desechables de nitrilo talla M','Material Médico','caja',15,5,30,12.50,'Medical Supplies Inc',NULL,'ACTIVE','2025-12-02 10:47:39','2025-12-02 10:47:39'),
('9e98c9f6-c6a5-406d-87d1-0ac42c9edd47','Ácido Hialurónico 2ml','Vial de ácido hialurónico para tratamientos faciales','Insumos Médicos','vial',25,5,50,45.00,'MedSupply Corp',NULL,'ACTIVE','2025-12-02 10:47:39','2025-12-02 10:47:39');

/*Table structure for table `supply_movements` */

CREATE TABLE `supply_movements` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `supplyId` varchar(36) NOT NULL,
  `type` enum('IN','OUT','ADJUST','EXPIRED') NOT NULL,
  `quantity` int(11) NOT NULL,
  `unitCost` decimal(10,2) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `createdBy` varchar(36) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_supply` (`supplyId`),
  KEY `idx_type` (`type`),
  KEY `idx_created` (`createdAt`),
  KEY `idx_created_by` (`createdBy`),
  CONSTRAINT `supply_movements_ibfk_1` FOREIGN KEY (`supplyId`) REFERENCES `supplies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `supply_movements_ibfk_2` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `supply_movements` */

/*Table structure for table `system_config` */

CREATE TABLE `system_config` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `configKey` varchar(100) NOT NULL,
  `configValue` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `description` text DEFAULT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `configKey` (`configKey`),
  KEY `idx_key` (`configKey`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `system_config` */

insert  into `system_config`(`id`,`configKey`,`configValue`,`description`,`updatedAt`) values 
('a8d0c9ef-b9c0-11f0-a2f4-63b669e957f5','clinic_name','\"Clínica Bella\"','Nombre de la clínica','2025-11-04 16:55:39'),
('a8d0cc07-b9c0-11f0-a2f4-63b669e957f5','clinic_address','\"Dirección de la clínica\"','Dirección física de la clínica','2025-11-04 16:55:39'),
('a8d0cc5a-b9c0-11f0-a2f4-63b669e957f5','clinic_phone','\"+1234567890\"','Teléfono de contacto','2025-11-04 16:55:39'),
('a8d0cc85-b9c0-11f0-a2f4-63b669e957f5','clinic_email','\"info@clinica.com\"','Email de contacto','2025-11-04 16:55:39'),
('a8d0cca8-b9c0-11f0-a2f4-63b669e957f5','appointment_duration_default','60','Duración por defecto de citas en minutos','2025-11-04 16:55:39'),
('a8d0ccce-b9c0-11f0-a2f4-63b669e957f5','working_hours','{\"start\": \"08:00\", \"end\": \"18:00\"}','Horario de trabajo','2025-11-04 16:55:39'),
('a8d0ccfc-b9c0-11f0-a2f4-63b669e957f5','working_days','[\"monday\", \"tuesday\", \"wednesday\", \"thursday\", \"friday\", \"saturday\"]','Días de trabajo','2025-11-04 16:55:39');

/*Table structure for table `treatments` */

CREATE TABLE `treatments` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `companyId` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `duration` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(100) NOT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `supplies` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_category` (`category`),
  KEY `idx_active` (`isActive`),
  KEY `idx_price` (`price`),
  KEY `idx_treatments_company` (`companyId`),
  CONSTRAINT `fk_treatments_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `treatments` */

insert  into `treatments`(`id`,`companyId`,`name`,`description`,`duration`,`price`,`category`,`isActive`,`supplies`,`createdAt`,`updatedAt`) values 
('1ffdc0cb-ee70-4c62-94f9-213fdec57507','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','Botox Facial','Aplicación de toxina botulínica para arrugas de expresión',45,350.00,'Facial',1,NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('335b8602-6e16-4c7b-8cd9-d357a882da17','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','Hidrafacial Coreano','Limpieza facial profunda con tecnología coreana',60,65.00,'Facial',1,NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('4bc4fcef-41bc-4ad6-8b1c-1f97f9a21a50','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','Jalupro Classic','Tratamiento de biorevitalización con ácido hialurónico',30,220.00,'Facial',1,NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('ae822817-ea31-432e-8133-aa72724a75d3','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','Radiofrecuencia Corporal','Tratamiento reafirmante con radiofrecuencia',75,180.00,'Corporal',1,NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('e7846353-f84d-4bab-b03e-baea9a89e3e0','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','Masaje Corporal/Linfático','Masaje relajante y drenaje linfático',90,70.00,'Corporal',1,NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39');

/*Table structure for table `user_companies` */

CREATE TABLE `user_companies` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `userId` varchar(36) NOT NULL,
  `companyId` varchar(36) NOT NULL,
  `role` enum('master','admin','employee','client') NOT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `joinedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `lastAccessAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_company` (`userId`,`companyId`),
  KEY `idx_user_companies_user` (`userId`),
  KEY `idx_user_companies_company` (`companyId`),
  KEY `idx_user_companies_role` (`role`),
  CONSTRAINT `user_companies_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_companies_ibfk_2` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `user_companies` */

insert  into `user_companies`(`id`,`userId`,`companyId`,`role`,`isActive`,`permissions`,`joinedAt`,`lastAccessAt`,`createdAt`,`updatedAt`) values 
('01281ea3-9842-415d-904f-d6d5fa1b9b78','f53fd8ed-36c6-4fcf-ad80-7580a3766479','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','client',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('09b6c2fd-643c-41d1-bd82-b8cb7e68247c','a7c9a4d1-af65-4352-890b-1b23da20305d','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','admin',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('0c9ba2d8-b2ab-43fc-8b36-6efe7486112a','64c265e4-9922-4825-8f5a-1a5f5984b2ef','8cc8c29b-87e4-4590-9713-b911c86bfa8f','client',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('161a6ba7-5b56-4c82-89be-7aff727efe5b','745e05e7-726a-49f8-b10d-f5f8dd0ab529','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','employee',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('16cfc782-529e-4287-bf04-e52d5e31414b','8e5a687a-a2e6-49b2-86ae-c8a7da473f19','8cc8c29b-87e4-4590-9713-b911c86bfa8f','client',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('1b46acfb-f915-4d1b-b8c4-4d521e8ced4c','8665a260-5e38-4d30-91be-80c26093008b','8cc8c29b-87e4-4590-9713-b911c86bfa8f','admin',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('23f8ec5d-e59b-4cd7-a18c-6b190fdd3644','0e131c9b-7eea-48c5-9052-567418d32d49','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','employee',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('25212e3b-bd50-4595-8e88-2d6e44103c7d','563389a9-6757-4ef8-90bb-2a29761cd649','8cc8c29b-87e4-4590-9713-b911c86bfa8f','client',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('271ffd25-b5f0-4309-b851-20aaaee6410b','5e80bc74-883d-4248-acce-074aa3b09762','8cc8c29b-87e4-4590-9713-b911c86bfa8f','employee',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('3fe0adda-fccf-4ff7-93f2-ba75d316abc2','aaa84bfe-95f0-4fe5-a5af-f4e49cc1395f','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','client',1,NULL,'2025-12-02 10:47:39',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('4ee86888-6411-4bd1-aef0-4c6cdd7dd0ec','a19f292d-c4e3-42dc-b53f-bf228fa4f03a','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','master',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('598bc25e-7af2-49ef-9325-053422a5d5bc','a7c1f8a4-c94f-447f-9cc2-05bccb1a52e8','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','client',1,NULL,'2025-12-02 10:47:39',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('5eb7314c-f816-4e8b-aa5c-6302ee4b69b8','915ebdb5-c53e-4c10-b284-af190a57d50a','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','client',1,NULL,'2025-12-02 10:47:39',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('60da548c-ba3a-4fb7-84a5-373ac623e5a5','27625c27-efc2-4bbf-be46-370c3a86a1d3','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','client',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('7417e600-fca5-4a0b-8272-f79efc9e7682','1b0e4b45-1f44-4b35-b0b7-f02ccb85085c','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','client',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('7505f058-3ca4-44d0-ad77-a7dba2710404','fbd1f821-a320-4e34-9241-56f152873c4a','8cc8c29b-87e4-4590-9713-b911c86bfa8f','client',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('75558d24-457f-4626-b736-1341f1ca84af','55fcd3fd-7f52-403b-afab-901ff718d5a1','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','client',1,NULL,'2025-12-02 10:47:39',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('7a073a1f-0504-46ab-8c75-181956b00758','4590646f-9445-4373-9cb8-d34dbbf6cc85','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','client',1,NULL,'2025-12-02 10:47:39',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('82b263bc-3043-4b7e-8eb9-5bb40a636e1e','ab976fff-95b0-4ec4-8aa7-3df17ef9f906','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','client',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('8a317bc9-bdf9-4661-94a9-152cc4409341','45566393-64a3-4add-8215-e17602f69d39','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','client',1,NULL,'2025-12-02 10:47:39',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('926267f0-1084-4e40-95c4-abd227e3737f','d2e45fda-9ecb-4dbe-88ca-b2c231a944c7','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','client',1,NULL,'2025-12-02 10:47:39',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('9bc9694a-dbc0-44ac-a5ec-d6ec72c05ae0','45566393-64a3-4add-8215-e17602f69d39','8cc8c29b-87e4-4590-9713-b911c86bfa8f','client',1,NULL,'2025-12-02 10:47:39',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('a564fff1-4680-40d2-973d-11d49de128ef','a19f292d-c4e3-42dc-b53f-bf228fa4f03a','8cc8c29b-87e4-4590-9713-b911c86bfa8f','master',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('d2011ebe-25a8-4850-afbc-4d5f0b958392','eac4df6d-1b00-4007-b4c0-971b72265799','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','client',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('d5846692-c527-4fc3-9e9c-629070f8fb8d','b051e440-7993-40ae-a6d2-fff416430a0e','8cc8c29b-87e4-4590-9713-b911c86bfa8f','employee',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('e0eeda1b-699c-4413-8d34-99a3cea14656','0a71500b-3760-4c8b-81c4-80f8aed806d1','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','client',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('e9e01a5b-2576-4573-97e0-8e361a8c1fd4','d29c0a0e-ad9c-4ae0-a8ca-a196530c93b8','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','client',1,NULL,'2025-12-02 10:47:39',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('eaa8f8df-63fe-479f-a39a-01af78f778fe','7c7dc2fe-6e0f-4b48-b1ee-9b6a2f5a1a88','8cc8c29b-87e4-4590-9713-b911c86bfa8f','client',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38');

/*Table structure for table `user_roles` */

CREATE TABLE `user_roles` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `userId` varchar(36) NOT NULL,
  `roleId` varchar(36) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_role` (`userId`,`roleId`),
  KEY `idx_user` (`userId`),
  KEY `idx_role` (`roleId`),
  KEY `idx_user_roles_user_role` (`userId`,`roleId`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `user_roles` */

insert  into `user_roles`(`id`,`userId`,`roleId`,`createdAt`,`updatedAt`) values 
('00ef2c6d-6f67-4128-9cd8-242c055be078','745e05e7-726a-49f8-b10d-f5f8dd0ab529','employee-role-id','2025-12-02 10:47:38','2025-12-02 10:47:38'),
('09564fa6-d072-402d-b716-6944ceb63c11','d29c0a0e-ad9c-4ae0-a8ca-a196530c93b8','client-role-id','2025-12-02 10:47:39','2025-12-02 10:47:39'),
('0da3f2f2-c263-43eb-817a-bea608565448','8665a260-5e38-4d30-91be-80c26093008b','admin-role-id','2025-12-02 10:47:38','2025-12-02 10:47:38'),
('11e1e73a-40ca-494c-b580-8cd08f44a795','4590646f-9445-4373-9cb8-d34dbbf6cc85','client-role-id','2025-12-02 10:47:39','2025-12-02 10:47:39'),
('12a5e94c-e6e1-4bcd-9734-9a62d63364aa','45566393-64a3-4add-8215-e17602f69d39','client-role-id','2025-12-02 10:47:39','2025-12-02 10:47:39'),
('14e85e76-b061-48ce-a4c0-2bf2b0cbea48','b051e440-7993-40ae-a6d2-fff416430a0e','employee-role-id','2025-12-02 10:47:38','2025-12-02 10:47:38'),
('221e3122-af10-4939-a650-be13f2eb3ef1','5e80bc74-883d-4248-acce-074aa3b09762','employee-role-id','2025-12-02 10:47:38','2025-12-02 10:47:38'),
('2413fb72-bffe-4fe6-9fe5-482d09b329f2','0e131c9b-7eea-48c5-9052-567418d32d49','employee-role-id','2025-12-02 10:47:38','2025-12-02 10:47:38'),
('2ef15c57-a4e3-4e98-8f40-18de6c392a14','a7c1f8a4-c94f-447f-9cc2-05bccb1a52e8','client-role-id','2025-12-02 10:47:39','2025-12-02 10:47:39'),
('2ffd0761-870c-4370-a495-35b616b1c660','915ebdb5-c53e-4c10-b284-af190a57d50a','client-role-id','2025-12-02 10:47:39','2025-12-02 10:47:39'),
('4a8bc54c-fa20-419f-bc17-546c69d7c832','d2e45fda-9ecb-4dbe-88ca-b2c231a944c7','client-role-id','2025-12-02 10:47:39','2025-12-02 10:47:39'),
('55cc2657-a315-4ed9-bced-b97a98b179a9','a7c9a4d1-af65-4352-890b-1b23da20305d','admin-role-id','2025-12-02 10:47:38','2025-12-02 10:47:38'),
('7f196b04-504f-4fc2-a555-eb986551e57f','a19f292d-c4e3-42dc-b53f-bf228fa4f03a','master-role-id','2025-12-02 10:47:37','2025-12-02 10:47:37'),
('839cb215-f389-488f-a2c1-a4797007c870','55fcd3fd-7f52-403b-afab-901ff718d5a1','client-role-id','2025-12-02 10:47:39','2025-12-02 10:47:39'),
('e782134e-9d49-4297-be1a-f1e17fdb0ecd','aaa84bfe-95f0-4fe5-a5af-f4e49cc1395f','client-role-id','2025-12-02 10:47:39','2025-12-02 10:47:39');

/*Table structure for table `users` */

CREATE TABLE `users` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `firstName` varchar(100) NOT NULL,
  `lastName` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar` text DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `isMaster` tinyint(1) DEFAULT 0,
  `currentCompanyId` varchar(36) DEFAULT NULL,
  `lastLoginCompanyId` varchar(36) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_active` (`isActive`),
  KEY `idx_created` (`createdAt`),
  KEY `idx_users_master` (`isMaster`),
  KEY `idx_users_current_company` (`currentCompanyId`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `users` */

insert  into `users`(`id`,`email`,`password`,`firstName`,`lastName`,`phone`,`avatar`,`isActive`,`isMaster`,`currentCompanyId`,`lastLoginCompanyId`,`createdAt`,`updatedAt`) values 
('0a71500b-3760-4c8b-81c4-80f8aed806d1','isabella.lopez@email.com','$2a$10$HtXteawiRnd2kuXX34q9x.iwEVkOTCRF7zAdQu61gvZFjhjolkCBm','Isabella','López','+1-555-3001',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('0e131c9b-7eea-48c5-9052-567418d32d49','ana.martinez@clinicabella.com','$2a$10$aQQsygqrpCxavSQO2RO7ZuzKRTKklCD3pTs3fTEsnSMTvqr5hf1fW','Ana','Martínez','+1-555-1102',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:37','2025-12-02 10:47:37'),
('1b0e4b45-1f44-4b35-b0b7-f02ccb85085c','natalia.herrera@email.com','$2a$10$4dFYQTI0Lqf7bQ5BAeI9AOx9UWjfKcFANMzslSF/yTXLN2FF/SgDu','Natalia','Herrera','+1-555-3005',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('27625c27-efc2-4bbf-be46-370c3a86a1d3','andrea.castillo@email.com','$2a$10$s55cSHbTrfuC75VVT5NtIOic68tiCN2DkjG6L1cH0.k6huQP8fzEq','Andrea','Castillo','+1-555-3006',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('45566393-64a3-4add-8215-e17602f69d39','nicolas.pena@email.com','$2a$10$Ok7./sV3kRergI7w9x/xWueztMD4QvD1s.9oHIyC67ovRxIgfTMyq','Nicolás','Peña','+58-414-9876543',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('4590646f-9445-4373-9cb8-d34dbbf6cc85','sofia.rodriguez@email.com','$2a$10$OXbyi4xBlL1tJB8VifbcMODKujgNb4VWqJKLSLmHN5gFVl4YxhL0S','Sofía','Rodríguez','+58-414-6666666',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('55fcd3fd-7f52-403b-afab-901ff718d5a1','patricia.fernandez@email.com','$2a$10$otUFnIxWtmMItugiC5WMUeMVjcMNhekvkgsnILZJNDyQvpRHlsZgC','Patricia','Fernandez','+58-424-7856456',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('563389a9-6757-4ef8-90bb-2a29761cd649','sebastian.mendoza@email.com','$2a$10$VZEzmBlOIu2xv9T9xezyAOddwvC.dJbIlc6TIR6IpAlem0ZoB6bdC','Sebastián','Mendoza','+1-555-4002',NULL,1,0,'8cc8c29b-87e4-4590-9713-b911c86bfa8f',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('5e80bc74-883d-4248-acce-074aa3b09762','diego.morales@centrovida.com','$2a$10$h.HzKgrCKloetPnRNH0g2uy8Nk7IbgGqCdOiuDu8xo.5j8UCBOl6a','Diego','Morales','+1-555-2103',NULL,1,0,'8cc8c29b-87e4-4590-9713-b911c86bfa8f',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('64c265e4-9922-4825-8f5a-1a5f5984b2ef','daniel.ruiz@email.com','$2a$10$1.HuWWv6hk78zvFvV8/5wOQHbLPQ8NXVylIRgnQgnD8pb2rWHSZ9e','Daniel','Ruiz','+1-555-4004',NULL,1,0,'8cc8c29b-87e4-4590-9713-b911c86bfa8f',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('745e05e7-726a-49f8-b10d-f5f8dd0ab529','carlos.rodriguez@clinicabella.com','$2a$10$K2tM9em6v.ECCgcjX.kKTuuVbJxz53CKpoH7dMdTPOOz64UhmugSG','Carlos','Rodríguez','+1-555-1103',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:37','2025-12-02 10:47:37'),
('7c7dc2fe-6e0f-4b48-b1ee-9b6a2f5a1a88','santiago.ortega@email.com','$2a$10$yzGVCYPE5fD7JRdMoJYsEe7P1HnG6dmUsVUtk9ItKcLASCULpnMzq','Santiago','Ortega','+1-555-4005',NULL,1,0,'8cc8c29b-87e4-4590-9713-b911c86bfa8f',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('8665a260-5e38-4d30-91be-80c26093008b','admin@centrovida.com','$2a$10$L0GWqNbyggUjk.21wI0Rlu9VZ6yCqDC..5x/drEpuhKWRHrcXCMjC','Roberto','Silva','+1-555-2101',NULL,1,0,'8cc8c29b-87e4-4590-9713-b911c86bfa8f',NULL,'2025-12-02 10:47:37','2025-12-02 10:47:37'),
('8e5a687a-a2e6-49b2-86ae-c8a7da473f19','mateo.jimenez@email.com','$2a$10$7jqjYp.c.Zyw133IUrzwYe88oY31xk1CFwUFkDB1nk5dBtq5Hhuk2','Mateo','Jiménez','+1-555-4003',NULL,1,0,'8cc8c29b-87e4-4590-9713-b911c86bfa8f',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('915ebdb5-c53e-4c10-b284-af190a57d50a','alisson.gomez@email.com','$2a$10$mmC.6y9v1MoRsdirGroHn.H8Ki63wXNQaUOUVXQ7UYj8LXIG63KPm','Alisson','Gomez','+58-416-3333333',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('a19f292d-c4e3-42dc-b53f-bf228fa4f03a','master@sistema.com','$2a$10$hRoIN0LBafsZGPlX2KCDpewE9yne6uwLkTYn4BFzl53t/FJio9q4S','Usuario','Master','+1-555-0000',NULL,1,1,NULL,NULL,'2025-12-02 10:47:37','2025-12-02 10:47:37'),
('a7c1f8a4-c94f-447f-9cc2-05bccb1a52e8','roberto.martinez@email.com','$2a$10$U5XY1z4ghMkQcm..WAzmPeJ/dLTQLLRfc4XugkLHYaV0sBDv4CcHS','Roberto','Martínez','+58-424-8888888',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('a7c9a4d1-af65-4352-890b-1b23da20305d','admin@clinicabella.com','$2a$10$rI/8l/.K/my/hgj1KVtYRu9Ix4oeKWp7pvyzD4twgnjukMezv5IpS','María','González','+1-555-1101',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:37','2025-12-02 10:47:37'),
('aaa84bfe-95f0-4fe5-a5af-f4e49cc1395f','carlos.herrera@email.com','$2a$10$L3lPXjF9VaPhX5wtCuSF8.4i/J7bHJaZEbCUswLQbyA4H/gmsszpG','Carlos','Herrera','+58-416-1010101',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('ab976fff-95b0-4ec4-8aa7-3df17ef9f906','valentina.torres@email.com','$2a$10$G11F40LdV6SmqF6tb1LaWOXGfTRZBAxtoBHXJgU3fbTSP0NYgK3xi','Valentina','Torres','+1-555-3003',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('b051e440-7993-40ae-a6d2-fff416430a0e','lucia.fernandez@centrovida.com','$2a$10$z1tMSEgRhWzhygWrC3wy/uQEbZn7GPVIINBZXsDWgErsViQJkSq9a','Lucía','Fernández','+1-555-2102',NULL,1,0,'8cc8c29b-87e4-4590-9713-b911c86bfa8f',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('d29c0a0e-ad9c-4ae0-a8ca-a196530c93b8','maria.gonzalez@email.com','$2a$10$yG4w3PhKHRXOepCGoeU7Qet90RJeV1DUr2814CCI8D9a..Gx99KXq','María','González','+58-412-5555555',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('d2e45fda-9ecb-4dbe-88ca-b2c231a944c7','carmen.lopez@email.com','$2a$10$EvISasHHKwo7Ma6wERj/2OKyz/HFIX9F.Dx2GJJc5xD8WpUjAYMRi','Carmen','López','+58-426-7777777',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:39','2025-12-02 10:47:39'),
('eac4df6d-1b00-4007-b4c0-971b72265799','sofia.ramirez@email.com','$2a$10$WIx1XTJkfVAYgvwF9/GZheGywkl/WVPAkIFj.m.rwGVaylZm67GwC','Sofía','Ramírez','+1-555-3002',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('f53fd8ed-36c6-4fcf-ad80-7580a3766479','camila.flores@email.com','$2a$10$PIkGRCPswE4x4p5Rc7X8IulKQgN8QeDvMQ5ectzo2NJJXJwVilOPm','Camila','Flores','+1-555-3004',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('fbd1f821-a320-4e34-9241-56f152873c4a','alejandro.vargas@email.com','$2a$10$094K51OnNujEIlfYjM.Bqewfr5uEZ.T3i3wDFLEEwtBxHHNGyoRjK','Alejandro','Vargas','+1-555-4001',NULL,1,0,'8cc8c29b-87e4-4590-9713-b911c86bfa8f',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38');

/* Trigger structure for table `supply_movements` */

DELIMITER $$

/*!50003 CREATE */ /*!50017 DEFINER = 'sistemas'@'%' */ /*!50003 TRIGGER `update_supply_status_after_movement` AFTER INSERT ON `supply_movements` FOR EACH ROW 
BEGIN
    DECLARE current_stock INT;
    DECLARE min_stock INT;
    DECLARE new_status ENUM('ACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRED', 'DISCONTINUED');
    
    -- Obtener stock actual y mínimo
    SELECT stock, minStock INTO current_stock, min_stock
    FROM supplies WHERE id = NEW.supplyId;
    
    -- Determinar nuevo estado
    IF current_stock <= 0 THEN
        SET new_status = 'OUT_OF_STOCK';
    ELSEIF current_stock <= min_stock THEN
        SET new_status = 'LOW_STOCK';
    ELSE
        SET new_status = 'ACTIVE';
    END IF;
    
    -- Actualizar estado
    UPDATE supplies 
    SET status = new_status, updatedAt = CURRENT_TIMESTAMP
    WHERE id = NEW.supplyId;
END */$$


DELIMITER ;

/*Table structure for table `appointment_details` */

DROP TABLE IF EXISTS `appointment_details`;

/*!50001 CREATE TABLE  `appointment_details`(
 `id` varchar(36) ,
 `date` date ,
 `startTime` datetime ,
 `endTime` datetime ,
 `status` enum('SCHEDULED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','NO_SHOW') ,
 `notes` text ,
 `totalAmount` decimal(10,2) ,
 `createdAt` timestamp ,
 `clientCode` varchar(20) ,
 `clientFirstName` varchar(100) ,
 `clientLastName` varchar(100) ,
 `clientEmail` varchar(255) ,
 `clientPhone` varchar(20) ,
 `employeePosition` varchar(100) ,
 `employeeFirstName` varchar(100) ,
 `employeeLastName` varchar(100) ,
 `treatments` mediumtext 
)*/;

/*Table structure for table `client_details` */

DROP TABLE IF EXISTS `client_details`;

/*!50001 CREATE TABLE  `client_details`(
 `id` varchar(36) ,
 `clientCode` varchar(20) ,
 `dateOfBirth` date ,
 `gender` enum('M','F','Other') ,
 `address` text ,
 `emergencyContact` varchar(255) ,
 `medicalConditions` text ,
 `allergies` text ,
 `clientCreatedAt` timestamp ,
 `firstName` varchar(100) ,
 `lastName` varchar(100) ,
 `email` varchar(255) ,
 `phone` varchar(20) ,
 `isActive` tinyint(1) ,
 `totalAppointments` bigint(21) ,
 `completedAppointments` bigint(21) ,
 `totalPaid` decimal(32,2) 
)*/;

/*View structure for view appointment_details */

/*!50001 DROP TABLE IF EXISTS `appointment_details` */;
/*!50001 CREATE ALGORITHM=UNDEFINED DEFINER=`sistemas`@`%` SQL SECURITY DEFINER VIEW `appointment_details` AS select `a`.`id` AS `id`,`a`.`date` AS `date`,`a`.`startTime` AS `startTime`,`a`.`endTime` AS `endTime`,`a`.`status` AS `status`,`a`.`notes` AS `notes`,`a`.`totalAmount` AS `totalAmount`,`a`.`createdAt` AS `createdAt`,`c`.`clientCode` AS `clientCode`,`uc`.`firstName` AS `clientFirstName`,`uc`.`lastName` AS `clientLastName`,`uc`.`email` AS `clientEmail`,`uc`.`phone` AS `clientPhone`,`e`.`position` AS `employeePosition`,`ue`.`firstName` AS `employeeFirstName`,`ue`.`lastName` AS `employeeLastName`,group_concat(`t`.`name` separator ', ') AS `treatments` from ((((((`appointments` `a` join `clients` `c` on(`a`.`clientId` = `c`.`id`)) join `users` `uc` on(`c`.`userId` = `uc`.`id`)) left join `employees` `e` on(`a`.`employeeId` = `e`.`id`)) left join `users` `ue` on(`e`.`userId` = `ue`.`id`)) left join `appointment_treatments` `at` on(`a`.`id` = `at`.`appointmentId`)) left join `treatments` `t` on(`at`.`treatmentId` = `t`.`id`)) group by `a`.`id` */;

/*View structure for view client_details */

/*!50001 DROP TABLE IF EXISTS `client_details` */;
/*!50001 CREATE ALGORITHM=UNDEFINED DEFINER=`sistemas`@`%` SQL SECURITY DEFINER VIEW `client_details` AS select `c`.`id` AS `id`,`c`.`clientCode` AS `clientCode`,`c`.`dateOfBirth` AS `dateOfBirth`,`c`.`gender` AS `gender`,`c`.`address` AS `address`,`c`.`emergencyContact` AS `emergencyContact`,`c`.`medicalConditions` AS `medicalConditions`,`c`.`allergies` AS `allergies`,`c`.`createdAt` AS `clientCreatedAt`,`u`.`firstName` AS `firstName`,`u`.`lastName` AS `lastName`,`u`.`email` AS `email`,`u`.`phone` AS `phone`,`u`.`isActive` AS `isActive`,count(distinct `a`.`id`) AS `totalAppointments`,count(distinct case when `a`.`status` = 'COMPLETED' then `a`.`id` end) AS `completedAppointments`,coalesce(sum(case when `p`.`status` = 'PAID' then `p`.`amount` else 0 end),0) AS `totalPaid` from (((`clients` `c` join `users` `u` on(`c`.`userId` = `u`.`id`)) left join `appointments` `a` on(`c`.`id` = `a`.`clientId`)) left join `payments` `p` on(`c`.`id` = `p`.`clientId`)) group by `c`.`id` */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
