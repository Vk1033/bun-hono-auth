import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text().primaryKey(),
  email: text().notNull(),
  passwordHash: text("password_hash").notNull(),
  favoriteColor: text("favorite_color"),
  favoriteAnimal: text("favorite_animal"),
});
