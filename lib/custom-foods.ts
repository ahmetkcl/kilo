import { getD1 } from "@/db/client";
import type { Food } from "@/lib/foods";

type FoodRow = { id: number; name: string; kcal: number; protein: number; carbs: number; fat: number };
export type CustomFoodInput = Omit<FoodRow, "id">;

export function asFood(row: FoodRow): Food {
  const preparation = { method: "Doğal", kcal: row.kcal, protein: row.protein, carbs: row.carbs, fat: row.fat };
  return { id: `custom-${row.id}`, name: row.name, category: "Özel besin", kcal: row.kcal, protein: row.protein, carbs: row.carbs, fat: row.fat, preparations: [preparation], portions: [] };
}

function nutritionNumber(value: unknown, label: string, max: number, required = false) {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max || (required && parsed <= 0)) throw new Error(`${label} geçerli olmalı.`);
  return Math.round(parsed * 10) / 10;
}

export function validateCustomFood(input: Record<string, unknown>): CustomFoodInput {
  const name = String(input.name ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 60) throw new Error("Besin adı 2–60 karakter olmalı.");
  return {
    name,
    kcal: nutritionNumber(input.kcal, "Kalori", 1000, true),
    protein: nutritionNumber(input.protein, "Protein", 100),
    carbs: nutritionNumber(input.carbs, "Karbonhidrat", 100),
    fat: nutritionNumber(input.fat, "Yağ", 100),
  };
}

export async function upsertCustomFood(input: CustomFoodInput) {
  const db = getD1();
  const existingRows = await db.prepare("SELECT id, name FROM custom_foods").all<Pick<FoodRow, "id" | "name">>();
  const normalizedName = input.name.normalize("NFKC").toLocaleLowerCase("tr-TR");
  const existing = existingRows.results?.find((item) => item.name.trim().replace(/\s+/g, " ").normalize("NFKC").toLocaleLowerCase("tr-TR") === normalizedName);
  const { name, kcal, protein, carbs, fat } = input;
  const row = existing
    ? await db.prepare("UPDATE custom_foods SET kcal = ?, protein = ?, carbs = ?, fat = ? WHERE id = ? RETURNING id, name, kcal, protein, carbs, fat")
      .bind(kcal, protein, carbs, fat, existing.id).first<FoodRow>()
    : await db.prepare("INSERT INTO custom_foods (name, kcal, protein, carbs, fat, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(name) DO UPDATE SET kcal = excluded.kcal, protein = excluded.protein, carbs = excluded.carbs, fat = excluded.fat RETURNING id, name, kcal, protein, carbs, fat")
      .bind(name, kcal, protein, carbs, fat, new Date().toISOString()).first<FoodRow>();
  if (!row) throw new Error("Besin kaydedilemedi.");
  return { food: asFood(row), updated: Boolean(existing) };
}
