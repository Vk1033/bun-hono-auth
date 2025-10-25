

CREATE TABLE `users` (
	`id` text PRIMARY KEY,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`favorite_color` text,
	`favorite_animal` text
);

