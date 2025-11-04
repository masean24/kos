CREATE TABLE `invoice` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kamarId` int NOT NULL,
	`bulan` varchar(7) NOT NULL,
	`jumlahTagihan` int NOT NULL,
	`status` enum('pending','paid') NOT NULL DEFAULT 'pending',
	`xenditInvoiceId` varchar(255),
	`xenditInvoiceUrl` text,
	`tanggalJatuhTempo` timestamp NOT NULL,
	`tanggalDibayar` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoice_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kamar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nomorKamar` varchar(10) NOT NULL,
	`status` enum('kosong','terisi') NOT NULL DEFAULT 'kosong',
	`penghuniId` int,
	`hargaSewa` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kamar_id` PRIMARY KEY(`id`),
	CONSTRAINT `kamar_nomorKamar_unique` UNIQUE(`nomorKamar`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','penghuni') NOT NULL DEFAULT 'penghuni';--> statement-breakpoint
ALTER TABLE `users` ADD `nomorHp` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `kamarId` int;