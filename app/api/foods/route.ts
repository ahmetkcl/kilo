import { getD1 } from "@/db/client";
import { asFood, upsertCustomFood, validateCustomFood } from "@/lib/custom-foods";

type FoodRow = { id: number; name: string; kcal: number; protein: number; carbs: number; fat: number };

export async function GET() {
  try {
    const rows = await getD1().prepare("SELECT id, name, kcal, protein, carbs, fat FROM custom_foods ORDER BY name COLLATE NOCASE").all<FoodRow>();
    return Response.json({ foods: (rows.results ?? []).map(asFood) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Özel besinler yüklenemedi." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = validateCustomFood(await request.json() as Record<string, unknown>);
    const result = await upsertCustomFood(input);
    return Response.json(result, { status: result.updated ? 200 : 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Besin kaydedilemedi." }, { status: 400 });
  }
}
