ALTER TABLE `invoice` ADD `paymentProof` text;--> statement-breakpoint
ALTER TABLE `invoice` ADD `paymentMethod` enum('xendit','manual') DEFAULT 'xendit';--> statement-breakpoint
ALTER TABLE `invoice` ADD `approvalStatus` enum('pending','approved','rejected');--> statement-breakpoint
ALTER TABLE `invoice` ADD `approvedBy` int;--> statement-breakpoint
ALTER TABLE `invoice` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `invoice` ADD `rejectionReason` text;