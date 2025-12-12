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
('7af09fd6-2fab-4542-ad9e-6a80d1b3a773',"Clínica Estética Dr Karina Di' Stefano",'clinica-estetica-bella','karinadistefano@clinicaestetica.com','04147114721','Clinica San Sebastián, San Cristóbal, Estado Táchira','https://www.instagram.com/drkarinadistefano',NULL,1,'enterprise',NULL,4,500,'2025-12-02 10:47:37','2025-12-12 12:35:49');

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
('35d0dae2-3fd1-4c2c-9dbe-e171c4d07aa3','0e131c9b-7eea-48c5-9052-567418d32d49','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','Licenciada','Licenciada en Enfermeria','\"\\\"\\\\\\\"{\\\\\\\\\\\\\\\"lunes\\\\\\\\\\\\\\\":{\\\\\\\\\\\\\\\"inicio\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"08:00\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"fin\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"17:00\\\\\\\\\\\\\\\"},\\\\\\\\\\\\\\\"martes\\\\\\\\\\\\\\\":{\\\\\\\\\\\\\\\"inicio\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"08:00\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"fin\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"17:00\\\\\\\\\\\\\\\"},\\\\\\\\\\\\\\\"miercoles\\\\\\\\\\\\\\\":{\\\\\\\\\\\\\\\"inicio\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"08:00\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"fin\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"17:00\\\\\\\\\\\\\\\"},\\\\\\\\\\\\\\\"jueves\\\\\\\\\\\\\\\":{\\\\\\\\\\\\\\\"inicio\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"08:00\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"fin\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"17:00\\\\\\\\\\\\\\\"},\\\\\\\\\\\\\\\"viernes\\\\\\\\\\\\\\\":{\\\\\\\\\\\\\\\"inicio\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"08:00\\\\\\\\\\\\\\\",\\\\\\\\\\\\\\\"fin\\\\\\\\\\\\\\\":\\\\\\\\\\\\\\\"17:00\\\\\\\\\\\\\\\"}}\\\\\\\"\\\"\"',30.00,'2021-01-01',1,'employee','2025-12-02 10:47:39','2025-12-12 15:23:54'),
('373c9472-b205-415c-985c-9d72b3e7dea3','745e05e7-726a-49f8-b10d-f5f8dd0ab529','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','Asistente','','\"{\\\"lunes\\\":{\\\"inicio\\\":\\\"08:00\\\",\\\"fin\\\":\\\"17:00\\\"},\\\"martes\\\":{\\\"inicio\\\":\\\"08:00\\\",\\\"fin\\\":\\\"17:00\\\"},\\\"miercoles\\\":{\\\"inicio\\\":\\\"08:00\\\",\\\"fin\\\":\\\"17:00\\\"},\\\"jueves\\\":{\\\"inicio\\\":\\\"08:00\\\",\\\"fin\\\":\\\"17:00\\\"},\\\"viernes\\\":{\\\"inicio\\\":\\\"08:00\\\",\\\"fin\\\":\\\"17:00\\\"}}\"',40000.00,'2025-08-01',1,'employee','2025-12-02 10:47:39','2025-12-12 15:24:19');

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
('4ee86888-6411-4bd1-aef0-4c6cdd7dd0ec','a19f292d-c4e3-42dc-b53f-bf228fa4f03a','7af09fd6-2fab-4542-ad9e-6a80d1b3a773','master',1,NULL,'2025-12-02 10:47:38',NULL,'2025-12-02 10:47:38','2025-12-02 10:47:38');

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
('7f196b04-504f-4fc2-a555-eb986551e57f','a19f292d-c4e3-42dc-b53f-bf228fa4f03a','master-role-id','2025-12-02 10:47:37','2025-12-02 10:47:37'),
('a7ad73e7-d777-11f0-9ad3-b999d4594038','a7c9a4d1-af65-4352-890b-1b23da20305d','admin-role-id','2025-12-12 12:28:26','2025-12-12 12:28:26'),
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
('745e05e7-726a-49f8-b10d-f5f8dd0ab529','carlos.rodriguez@clinicabella.com','$2a$10$tHuvbti3TdSh6whF5n/xx.JqMTWuYwu/O1MS24ScqNAhYpeWQwlFa','Paola','Rodríguez','04140811363',NULL,1,0,'7af09fd6-2fab-4542-ad9e-6a80d1b3a773',NULL,'2025-12-02 10:47:37','2025-12-12 15:24:19'),
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
