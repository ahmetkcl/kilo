import { getD1 } from "@/db/client";
import { foods, getFoodPreparation, type Food } from "@/lib/foods";
import { exercises, estimateExerciseCalories } from "@/lib/exercises";

const validDate = /^\d{4}-\d{2}-\d{2}$/;

function dateFrom(request: Request) {
  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!validDate.test(date)) throw new Error("Geçerli bir tarih seç.");
  return date;
}

function istanbulDate() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function assertEditable(date: string) {
  if (date < istanbulDate()) throw new Error("Geçmiş günlerin kayıtları kilitli; değişiklik yapılamaz.");
}

function positive(value: unknown, label: string) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${label} sıfırdan büyük olmalı.`);
  return number;
}

function weight(value: unknown, label: string) {
  const number = positive(value, label);
  if (number < 30 || number > 350) throw new Error(`${label} 30–350 kg aralığında olmalı.`);
  return number;
}

function errorMessage(error: unknown) { return error instanceof Error ? error.message : "İşlem tamamlanamadı."; }

export async function GET(request: Request) {
  try {
    const date = dateFrom(request);
    const db = getD1();
    const [foodRows, activityRows, weightRows] = await db.batch([
      db.prepare("SELECT id, food_id AS foodId, food_name AS foodName, cooking_method AS cookingMethod, amount, unit, portion_label AS portionLabel, grams, calories, protein, carbs, fat FROM food_logs WHERE logged_date = ? ORDER BY id DESC").bind(date),
      db.prepare("SELECT id, activity_name AS activityName, duration_minutes AS durationMinutes, calories FROM activity_logs WHERE logged_date = ? ORDER BY id DESC").bind(date),
      db.prepare("SELECT current_weight AS currentWeight, target_weight AS targetWeight FROM weight_logs WHERE logged_date = ? LIMIT 1").bind(date),
    ]);
    return Response.json({ foods: foodRows.results, activities: activityRows.results, weight: weightRows.results?.[0] ?? null });
  } catch (error) { return Response.json({ error: errorMessage(error) }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const date = dateFrom(request);
    assertEditable(date);
    const payload = (await request.json()) as Record<string, unknown>;
    const db = getD1();

    if (payload.type === "food") {
      let food = foods.find((item) => item.id === payload.foodId);
      const customId = /^custom-(\d+)$/.exec(String(payload.foodId ?? ""));
      if (!food && customId) {
        const row = await db.prepare("SELECT id, name, kcal, protein, carbs, fat FROM custom_foods WHERE id = ?").bind(Number(customId[1])).first<{ id: number; name: string; kcal: number; protein: number; carbs: number; fat: number }>();
        if (row) {
          const preparation = { method: "Doğal", kcal: row.kcal, protein: row.protein, carbs: row.carbs, fat: row.fat };
          food = { id: `custom-${row.id}`, name: row.name, category: "Özel besin", kcal: row.kcal, protein: row.protein, carbs: row.carbs, fat: row.fat, preparations: [preparation], portions: [] } satisfies Food;
        }
      }
      if (!food) return Response.json({ error: "Bu besin veri tabanında yok. Listeden bir besin seç." }, { status: 422 });
      const unit = payload.unit === "piece" ? "piece" : "grams";
      const amount = positive(payload.amount ?? payload.grams, unit === "piece" ? "Adet" : "Miktar");
      const portion = unit === "piece" ? food.portions[0] : null;
      if (unit === "piece" && !portion) throw new Error("Bu besin porsiyon/adet ile girilemez; gram seçerek ekle.");
      const grams = portion ? amount * portion.grams : amount;
      const cookingMethod = String(payload.cookingMethod ?? "");
      const preparation = getFoodPreparation(food, cookingMethod);
      if (!preparation) throw new Error("Bu besin için geçerli bir pişirme yöntemi seç.");
      const ratio = grams / 100;
      const created = await db.prepare(
        "INSERT INTO food_logs (logged_date, food_id, food_name, cooking_method, amount, unit, portion_label, grams, calories, protein, carbs, fat, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id, food_id AS foodId, food_name AS foodName, cooking_method AS cookingMethod, amount, unit, portion_label AS portionLabel, grams, calories, protein, carbs, fat"
      ).bind(date, food.id, food.name, cookingMethod, amount, unit, portion?.label ?? "", grams, preparation.kcal * ratio, preparation.protein * ratio, preparation.carbs * ratio, preparation.fat * ratio, new Date().toISOString()).first();
      return Response.json({ food: created }, { status: 201 });
    }

    if (payload.type === "activity") {
      const exercise = exercises.find((item) => item.id === payload.exerciseId);
      if (!exercise) throw new Error("Listeden geçerli bir spor seç.");
      const duration = Number(payload.durationMinutes);
      if (!Number.isInteger(duration) || duration < 1 || duration > 1440) throw new Error("Süre 1–1440 dakika arasında olmalı.");
      const savedWeight = await db.prepare("SELECT current_weight AS currentWeight FROM weight_logs WHERE logged_date = ? LIMIT 1").bind(date).first<{ currentWeight: number }>();
      const calories = estimateExerciseCalories(exercise.met, duration, savedWeight?.currentWeight ?? 118);
      const created = await db.prepare(
        "INSERT INTO activity_logs (logged_date, activity_name, duration_minutes, calories, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id, activity_name AS activityName, duration_minutes AS durationMinutes, calories"
      ).bind(date, exercise.name, duration, calories, new Date().toISOString()).first();
      return Response.json({ activity: created }, { status: 201 });
    }

    if (payload.type === "weight") {
      const currentWeight = weight(payload.currentWeight, "Mevcut kilo");
      const targetWeight = weight(payload.targetWeight, "Hedef kilo");
      const saved = await db.prepare(
        "INSERT INTO weight_logs (logged_date, current_weight, target_weight, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(logged_date) DO UPDATE SET current_weight = excluded.current_weight, target_weight = excluded.target_weight, updated_at = excluded.updated_at RETURNING current_weight AS currentWeight, target_weight AS targetWeight"
      ).bind(date, currentWeight, targetWeight, new Date().toISOString()).first();
      return Response.json({ weight: saved }, { status: 201 });
    }

    throw new Error("Bilinmeyen kayıt türü.");
  } catch (error) { return Response.json({ error: errorMessage(error) }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  try {
    const date = dateFrom(request);
    assertEditable(date);
    const payload = (await request.json()) as { type?: string; id?: number };
    const id = Number(payload.id);
    if (!Number.isInteger(id) || id < 1) throw new Error("Geçerli kayıt bulunamadı.");
    const table = payload.type === "food" ? "food_logs" : payload.type === "activity" ? "activity_logs" : "";
    if (!table) throw new Error("Bilinmeyen kayıt türü.");
    await getD1().prepare(`DELETE FROM ${table} WHERE id = ? AND logged_date = ?`).bind(id, date).run();
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: errorMessage(error) }, { status: 400 }); }
}
