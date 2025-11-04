CREATE TABLE `issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`kamarId` int,
	`judul` varchar(255) NOT NULL,
	`deskripsi` text NOT NULL,
	`status` enum('open','in_progress','resolved') NOT NULL DEFAULT 'open',
	`prioritas` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `issues_id` PRIMARY KEY(`id`)
);
