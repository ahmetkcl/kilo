import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profile = sqliteTable("profile", {
  id: integer("id").primaryKey(),
  weightKg: real("weight_kg").notNull().default(118),
  heightCm: real("height_cm").notNull().default(185),
  age: integer("age").notNull().default(30),
  sex: text("sex", { enum: ["male", "female"] }).notNull().default("male"),
  updatedAt: text("updated_at").notNull().default(""),
});

export const customFoods = sqliteTable("custom_foods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  kcal: real("kcal").notNull(),
  protein: real("protein").notNull().default(0),
  carbs: real("carbs").notNull().default(0),
  fat: real("fat").notNull().default(0),
  createdAt: text("created_at").notNull().default(""),
}, (table) => [uniqueIndex("idx_custom_foods_name").on(table.name)]);

export const foodLogs = sqliteTable("food_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  loggedDate: text("logged_date").notNull(),
  foodId: text("food_id").notNull(),
  foodName: text("food_name").notNull(),
  cookingMethod: text("cooking_method").notNull().default("Belirtilmedi"),
  amount: real("amount").notNull().default(0),
  unit: text("unit", { enum: ["grams", "piece"] }).notNull().default("grams"),
  portionLabel: text("portion_label").notNull().default(""),
  grams: real("grams").notNull(),
  calories: real("calories").notNull(),
  protein: real("protein").notNull(),
  carbs: real("carbs").notNull(),
  fat: real("fat").notNull(),
  createdAt: text("created_at").notNull().default(""),
}, (table) => [index("idx_food_logs_date").on(table.loggedDate)]);

export const activityLogs = sqliteTable("activity_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  loggedDate: text("logged_date").notNull(),
  activityName: text("activity_name").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  calories: real("calories").notNull(),
  createdAt: text("created_at").notNull().default(""),
}, (table) => [index("idx_activity_logs_date").on(table.loggedDate)]);

export const weightLogs = sqliteTable("weight_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  loggedDate: text("logged_date").notNull(),
  currentWeight: real("current_weight").notNull(),
  targetWeight: real("target_weight").notNull(),
  updatedAt: text("updated_at").notNull().default(""),
}, (table) => [
  uniqueIndex("idx_weight_logs_date").on(table.loggedDate),
]);
