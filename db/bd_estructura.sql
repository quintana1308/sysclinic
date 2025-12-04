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
