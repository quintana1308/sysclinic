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
('075d01a4-0ba3-4f7b-9eef-2f66609d5e53','1e4e8a7a-a3c4-46f2-a4d4-a8ed90048fb0','4e249690-8add-455c-85cb-d49671a01bf1',1,100.00,NULL),
('2bce54e5-4dbf-4a44-92c3-e395b5bf8b0c','b7db38c3-cf4d-4da2-a9fb-47a15798fef3','4e249690-8add-455c-85cb-d49671a01bf1',1,100.00,NULL),
('312edcef-a4d4-4095-a85d-b6d31e1a5570','2a93538a-981e-48a3-968d-7f102a25ce18','feb291bb-7b8a-4dce-8c48-9be85d8ecfae',1,50.00,NULL),
('39fece9a-1d06-4931-8b2d-77479ae2a2a5','8b31a2e4-3fc0-439d-a5e7-09cb18b4297f','4e249690-8add-455c-85cb-d49671a01bf1',1,100.00,NULL),
('4cc55f1c-12e9-45ce-9221-68e210c2be62','d54a6a37-ab9f-409c-b394-13b957f54068','4e249690-8add-455c-85cb-d49671a01bf1',1,100.00,NULL),
('9d8ef81c-4568-4a02-8484-b14c7fbd5b4f','d764291d-206e-4b6b-af88-a3f330959bf5','feb291bb-7b8a-4dce-8c48-9be85d8ecfae',1,50.00,NULL),
('d367c4ea-1c6c-4f2a-a744-533150c47ddb','86e61cc7-436f-4ba0-a341-bb2eac33f75b','feb291bb-7b8a-4dce-8c48-9be85d8ecfae',1,50.00,NULL);

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
  CONSTRAINT `fk_appointments_company` FOREIGN KEY (`companyId`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `appointments` */

insert  into `appointments`(`id`,`companyId`,`clientId`,`employeeId`,`date`,`startTime`,`endTime`,`status`,`notes`,`totalAmount`,`createdAt`,`updatedAt`) values 
('1e4e8a7a-a3c4-46f2-a4d4-a8ed90048fb0','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','21ba1c31-491a-43fc-826d-bc5fe8546913','35d0dae2-3fd1-4c2c-9dbe-e171c4d07aa3','2026-10-10','2026-10-10 14:00:00','2026-10-10 15:00:00','CONFIRMED','dwdwdwdw\n--- CONFIRMADA POR EL CLIENTE ---\nFecha de confirmación: 2025-12-15 16:55:37',100.00,'2025-12-15 16:22:22','2025-12-15 16:55:37'),
('2a93538a-981e-48a3-968d-7f102a25ce18','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','21ba1c31-491a-43fc-826d-bc5fe8546913','35d0dae2-3fd1-4c2c-9dbe-e171c4d07aa3','2025-12-20','2025-12-20 14:00:00','2025-12-20 15:00:00','CANCELLED','Cita de prueba\n--- CANCELADA ---\nMotivo: Cancelada por el cliente',50.00,'2025-12-15 15:10:54','2025-12-15 15:59:36'),
('86e61cc7-436f-4ba0-a341-bb2eac33f75b','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','21ba1c31-491a-43fc-826d-bc5fe8546913','35d0dae2-3fd1-4c2c-9dbe-e171c4d07aa3','2026-02-05','2026-02-05 14:00:00','2026-02-05 15:00:00','CONFIRMED','Nueva\n--- CONFIRMADA POR EL CLIENTE ---\nFecha de confirmación: 2025-12-15 16:16:30',50.00,'2025-12-15 16:12:33','2025-12-15 16:16:30'),
('8b31a2e4-3fc0-439d-a5e7-09cb18b4297f','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','21ba1c31-491a-43fc-826d-bc5fe8546913','35d0dae2-3fd1-4c2c-9dbe-e171c4d07aa3','2026-05-05','2026-05-05 16:00:00','2026-05-05 17:00:00','CONFIRMED','Nueva cita para factura\n--- CONFIRMADA POR EL CLIENTE ---\nFecha de confirmación: 2025-12-15 16:20:24',100.00,'2025-12-15 16:20:06','2025-12-15 16:20:24'),
('b7db38c3-cf4d-4da2-a9fb-47a15798fef3','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','21ba1c31-491a-43fc-826d-bc5fe8546913','a7c9a4d1-af65-4352-890b-1b23da20305d','2026-12-12','2026-12-12 02:00:00','2026-12-12 03:00:00','SCHEDULED','aa',100.00,'2025-12-16 09:40:35','2025-12-16 09:40:35'),
('d54a6a37-ab9f-409c-b394-13b957f54068','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','21ba1c31-491a-43fc-826d-bc5fe8546913','35d0dae2-3fd1-4c2c-9dbe-e171c4d07aa3','2026-01-12','2026-01-12 14:00:00','2026-01-12 15:00:00','CONFIRMED','ss\n--- CONFIRMADA POR EL CLIENTE ---\nFecha de confirmación: 2025-12-15 17:01:00',100.00,'2025-12-15 17:00:47','2025-12-15 17:01:00'),
('d764291d-206e-4b6b-af88-a3f330959bf5','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','21ba1c31-491a-43fc-826d-bc5fe8546913','a7c9a4d1-af65-4352-890b-1b23da20305d','2025-12-20','2025-12-20 16:00:00','2025-12-20 17:00:00','SCHEDULED','a',50.00,'2025-12-16 16:52:31','2025-12-16 16:52:31');

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
('21ba1c31-491a-43fc-826d-bc5fe8546913','97b3c054-66cd-47fd-b957-c2698d45a586','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','CLI-MJ7H7ZOJ-A6GE','1998-07-18',27,'M',NULL,NULL,NULL,NULL,'2025-12-15 14:17:44','2025-12-15 14:17:44');

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
('7af09fd6-2fab-4542-ad9e-6a80d1b3a773','Clínica Estética Dr Karina Di\' Stefano','clinica-estetica-bella','karinadistefano@clinicaestetica.com','04147114721','Clinica San Sebastián, San Cristóbal, Estado Táchira','https://www.instagram.com/drkarinadistefano',NULL,1,'enterprise',NULL,4,500,'2025-12-02 10:47:37','2025-12-12 12:35:49');

/*Table structure for table `company_licenses` */

CREATE TABLE `company_licenses` (
  `id` varchar(36) NOT NULL,
  `companyId` varchar(36) NOT NULL,
  `licenseId` varchar(36) NOT NULL,
  `licenseKey` varchar(255) NOT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `startDate` date NOT NULL,
  `endDate` date NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `licenseKey` (`licenseKey`),
  KEY `idx_company_licenses_company` (`companyId`),
  KEY `idx_company_licenses_license` (`licenseId`),
  KEY `idx_company_licenses_active` (`isActive`),
  KEY `idx_company_licenses_dates` (`startDate`,`endDate`),
  KEY `idx_company_licenses_company_active` (`companyId`,`isActive`),
  CONSTRAINT `fk_company_licenses_license` FOREIGN KEY (`licenseId`) REFERENCES `licenses` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `company_licenses` */

insert  into `company_licenses`(`id`,`companyId`,`licenseId`,`licenseKey`,`isActive`,`startDate`,`endDate`,`createdAt`,`updatedAt`) values 
('d6be7e99-583a-4353-8433-f8af26409447','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','c3d4e5f6-g7h8-9012-cdef-345678901234','LIC-DR -1765557302349',1,'2025-12-12','2026-12-12','2025-12-12 12:35:02','2025-12-12 12:35:02');

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
('a96b1517-c0ec-4c2e-a7b4-9a080733aaea','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','#8B5CF6','#A78BFA','#C4B5FD','light','America/New_York','DD/MM/YYYY','USD','es',NULL,NULL,'2025-12-02 10:47:37','2025-12-02 10:47:37');

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
('35d0dae2-3fd1-4c2c-9dbe-e171c4d07aa3','0e131c9b-7eea-48c5-9052-567418d32d49','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','Licenciada','Licenciada en Enfermeria','\"\\\"\\\\\\\"{\\\\\\\\\\\\\\\"lunes\\\\\\\\\\\\\\\":{\\\\\\\\\\\\\\\"inicio\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"08:00\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"fin\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"17:00\\\\\\\\\\\\\\\"},\\\\\\\\\\\\\\\"martes\\\\\\\\\\\\\\\":{\\\\\\\\\\\\\\\"inicio\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"08:00\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"fin\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"17:00\\\\\\\\\\\\\\\"},\\\\\\\\\\\\\\\"miercoles\\\\\\\\\\\\\\\":{\\\\\\\\\\\\\\\"inicio\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"08:00\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"fin\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"17:00\\\\\\\\\\\\\\\"},\\\\\\\\\\\\\\\"jueves\\\\\\\\\\\\\\\":{\\\\\\\\\\\\\\\"inicio\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"08:00\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"fin\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"17:00\\\\\\\\\\\\\\\"},\\\\\\\\\\\\\\\"viernes\\\\\\\\\\\\\\\":{\\\\\\\\\\\\\\\"inicio\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"08:00\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"fin\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"17:00\\\\\\\\\\\\\\\"}}\\\\\\\"\\\"\"',30.00,'2021-01-01',1,'employee','2025-12-02 10:47:39','2025-12-12 15:23:54');

/*Table structure for table `invoice_discounts` */

CREATE TABLE `invoice_discounts` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `invoiceId` varchar(36) NOT NULL,
  `discountType` enum('PERCENTAGE','FIXED') NOT NULL,
  `discountValue` decimal(10,2) NOT NULL,
  `discountReason` text NOT NULL,
  `appliedBy` varchar(36) NOT NULL,
  `appliedAt` datetime DEFAULT current_timestamp(),
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_invoice_discount` (`invoiceId`),
  KEY `idx_discount_type` (`discountType`),
  KEY `idx_applied_by` (`appliedBy`),
  CONSTRAINT `invoice_discounts_ibfk_1` FOREIGN KEY (`invoiceId`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_discounts_ibfk_2` FOREIGN KEY (`appliedBy`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `invoice_discounts` */

/*Table structure for table `invoices` */

CREATE TABLE `invoices` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `clientId` varchar(36) NOT NULL,
  `appointmentId` varchar(36) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) DEFAULT 0.00,
  `discountType` enum('PERCENTAGE','FIXED') DEFAULT NULL,
  `discountValue` decimal(10,2) DEFAULT 0.00,
  `discountReason` text DEFAULT NULL,
  `discountAppliedBy` varchar(36) DEFAULT NULL,
  `discountAppliedAt` datetime DEFAULT NULL,
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
  KEY `idx_discount_type` (`discountType`),
  KEY `idx_discount_applied_by` (`discountAppliedBy`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `clients` (`id`),
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`appointmentId`) REFERENCES `appointments` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

/*Data for the table `invoices` */

insert  into `invoices`(`id`,`clientId`,`appointmentId`,`amount`,`subtotal`,`discountType`,`discountValue`,`discountReason`,`discountAppliedBy`,`discountAppliedAt`,`status`,`description`,`dueDate`,`createdAt`,`updatedAt`) values 
('661ce99e-96bf-4c24-a403-9b677dc80b42','21ba1c31-491a-43fc-826d-bc5fe8546913','2a93538a-981e-48a3-968d-7f102a25ce18',40.00,50.00,'FIXED',10.00,'Porque si','a19f292d-c4e3-42dc-b53f-bf228fa4f03a','2025-12-17 11:57:50','PARTIAL','Factura por Hidrafacial - Anthony Quintana','2026-01-19','2025-12-15 15:11:03','2025-12-17 11:57:50');

/*Table structure for table `licenses` */

CREATE TABLE `licenses` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('basic','premium','enterprise') NOT NULL,
  `description` text DEFAULT NULL,
  `maxUsers` int(11) NOT NULL,
  `maxClients` int(11) NOT NULL,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `billingCycle` enum('monthly','yearly') NOT NULL DEFAULT 'monthly',
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `type` (`type`),
  UNIQUE KEY `unique_type` (`type`),
  KEY `idx_licenses_type` (`type`),
  KEY `idx_licenses_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

/*Data for the table `licenses` */

insert  into `licenses`(`id`,`name`,`type`,`description`,`maxUsers`,`maxClients`,`features`,`price`,`currency`,`billingCycle`,`isActive`,`createdAt`,`updatedAt`) values 
('a1b2c3d4-e5f6-7890-abcd-ef1234567890','Plan Básico','basic','Plan básico para clínicas pequeñas con funcionalidades esenciales',10,100,'[\"Gestión de usuarios\",\"Gestión de clientes\",\"Gestión de citas\",\"Gestión de tratamientos\",\"Inventario básico\",\"Reportes básicos\"]',50.00,'USD','monthly',1,'2025-12-10 11:23:45','2025-12-12 12:34:31'),
('b2c3d4e5-f6g7-8901-bcde-f23456789012','Plan Premium','premium','Plan avanzado para clínicas medianas con funcionalidades adicionales',50,500,'[\"Gestión de usuarios\",\"Gestión de clientes\",\"Gestión de citas\",\"Gestión de tratamientos\",\"Inventario básico\",\"Inventario avanzado\",\"Reportes básicos\",\"Reportes avanzados\",\"Facturación\",\"Notificaciones Email\"]',60.00,'USD','monthly',1,'2025-12-10 11:23:45','2025-12-10 17:31:59'),
('c3d4e5f6-g7h8-9012-cdef-345678901234','Plan Empresarial','enterprise','Plan completo para grandes organizaciones con todas las funcionalidades',100,800,'[\"Gestión de usuarios\",\"Gestión de clientes\",\"Gestión de citas\",\"Gestión de tratamientos\",\"Inventario básico\",\"Inventario avanzado\",\"Reportes básicos\",\"Reportes avanzados\",\"Facturación\",\"Pagos en línea\",\"Notificaciones SMS\",\"Notificaciones Email\",\"API Access\",\"Integraciones\",\"Soporte 24/7\",\"Backup automático\",\"Múltiples ubicaciones\",\"Personalización avanzada\"]',70.00,'USD','monthly',1,'2025-12-10 11:23:45','2025-12-12 12:34:48');

/*Table structure for table `medical_history` */

CREATE TABLE `medical_history` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `clientId` varchar(36) NOT NULL,
  `date` datetime DEFAULT current_timestamp(),
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
('65aa5035-680c-441c-936f-dd69f989c528','21ba1c31-491a-43fc-826d-bc5fe8546913','2a93538a-981e-48a3-968d-7f102a25ce18','661ce99e-96bf-4c24-a403-9b677dc80b42',20.00,'CASH','PAID','egervreve','325325',NULL,'2025-12-16 10:15:09','2025-12-16 10:15:09','2025-12-16 10:15:09');

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
('ebadaf62-f7e3-4849-9347-c181d756019a','Crema de prueba ','Es una crema de prueba ','Limpieza','unidad',20,2,100,2.00,'Nuevo proveedor','2026-01-16','ACTIVE','2025-12-16 10:14:55','2025-12-16 10:14:55');

/*Table structure for table `supply_movements` */

CREATE TABLE `supply_movements` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `supplyId` varchar(36) NOT NULL,
  `type` enum('IN','OUT','ADJUST','EXPIRED') NOT NULL,
  `quantity` int(11) NOT NULL,
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
('4e249690-8add-455c-85cb-d49671a01bf1','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','Limpieza profunda','Nuevo',60,100.00,'Facial',1,'[]','2025-12-15 16:18:06','2025-12-15 16:18:06'),
('feb291bb-7b8a-4dce-8c48-9be85d8ecfae','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','Hidrafacial','Nuevo',30,50.00,'Facial',1,'[\"Guantes\",\"Crema\"]','2025-12-15 15:03:21','2025-12-15 15:03:21');

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
('09b6c2fd-643c-41d1-bd82-b8cb7e68247c','a7c9a4d1-af65-4352-890b-1b23da20305d','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','admin',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('161a6ba7-5b56-4c82-89be-7aff727efe5b','745e05e7-726a-49f8-b10d-f5f8dd0ab529','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','employee',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('23f8ec5d-e59b-4cd7-a18c-6b190fdd3644','0e131c9b-7eea-48c5-9052-567418d32d49','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','employee',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('4ee86888-6411-4bd1-aef0-4c6cdd7dd0ec','a19f292d-c4e3-42dc-b53f-bf228fa4f03a','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','master',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38'),
('9961b4ae-98d9-4d63-9378-fcac1c93b793','97b3c054-66cd-47fd-b957-c2698d45a586','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','client',1,NULL,'2025-12-15 14:17:44',NULL,'2025-12-15 14:17:44','2025-12-15 14:17:44');

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
('7f196b04-504f-4fc2-a555-eb986551e57f','a19f292d-c4e3-42dc-b53f-bf228fa4f03a','master-role-id','2025-12-02 10:47:37','2025-12-02 10:47:37'),
('a719ee74-d9e5-11f0-9ad3-b999d4594038','97b3c054-66cd-47fd-b957-c2698d45a586','client-role-id','2025-12-15 14:40:49','2025-12-15 14:40:49'),
('a7ad73e7-d777-11f0-9ad3-b999d4594038','a7c9a4d1-af65-4352-890b-1b23da20305d','admin-role-id','2025-12-12 12:28:26','2025-12-12 12:28:26'),
('c23a2670-da7d-11f0-9ad3-b999d4594038','745e05e7-726a-49f8-b10d-f5f8dd0ab529','employee-role-id','2025-12-16 08:49:36','2025-12-16 08:49:36'),
('ce1d6e04-d777-11f0-9ad3-b999d4594038','0e131c9b-7eea-48c5-9052-567418d32d49','employee-role-id','2025-12-12 12:29:30','2025-12-12 12:29:30');

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
('0e131c9b-7eea-48c5-9052-567418d32d49','alissongomezperez10@gmail.com','$2a$10$7QvRCKMK1i4ckFbfZiRAPe4kp4pwpCCqJM9ieXf9hFhJCFkNo6Bwq','Alisson','Gomez','04247129490',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:37','2025-12-12 15:23:54'),
('745e05e7-726a-49f8-b10d-f5f8dd0ab529','carlos.rodriguez@clinicabella.com','$2a$10$tHuvbti3TdSh6whF5n/xx.JqMTWuYwu/O1MS24ScqNAhYpeWQwlFa','Paola','Rodríguez','04140811363',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:37','2025-12-16 12:49:36'),
('97b3c054-66cd-47fd-b957-c2698d45a586','quintana@gmail.com','$2a$10$w51UuvFB87hcKg7mpojvC./VmV1xW4KJ14dIhZPC7ZMqzPDZUcSI6','Anthony','Quintana','04147268222',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-15 14:17:44','2025-12-15 18:40:49'),
('a19f292d-c4e3-42dc-b53f-bf228fa4f03a','master@sistema.com','$2a$10$hRoIN0LBafsZGPlX2KCDpewE9yne6uwLkTYn4BFzl53t/FJio9q4S','Usuario','Master','+1-555-0000',NULL,1,1,NULL,NULL,'2025-12-02 10:47:37','2025-12-02 10:47:37'),
('a7c9a4d1-af65-4352-890b-1b23da20305d','karinadistefano@gmail.com','$2a$10$2rIJV7Rru0SkEmeWk9VoXOJu.rb6bvYtiv18GlmZWNaTdanl.UpOS','Karina','Di Stefano','+17863523671',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:37','2025-12-12 12:43:08');

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
