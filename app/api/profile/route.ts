import { getD1 } from "@/db/client";

const defaults = { weightKg: 118, heightCm: 185, age: 30, sex: "male" };

function number(value: unknown, min: number, max: number, label: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) throw new Error(`${label} geçerli aralıkta olmalı.`);
  return parsed;
}

export async function GET() {
  try {
    const result = await getD1().prepare("SELECT weight_kg AS weightKg, height_cm AS heightCm, age, sex FROM profile WHERE id = 1").first();
    return Response.json({ profile: result ?? defaults });
  } catch (error) {
    return Response.json({ profile: defaults, error: error instanceof Error ? error.message : "Profil okunamadı." });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const weight = number(payload.weightKg, 30, 350, "Kilo");
    const height = number(payload.heightCm, 100, 250, "Boy");
    const age = Math.round(number(payload.age, 15, 100, "Yaş"));
    const sex = payload.sex === "female" ? "female" : payload.sex === "male" ? "male" : null;
    if (!sex) throw new Error("Cinsiyet seç.");
    const updatedAt = new Date().toISOString();
    await getD1().prepare(
      "INSERT INTO profile (id, weight_kg, height_cm, age, sex, updated_at) VALUES (1, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET weight_kg = excluded.weight_kg, height_cm = excluded.height_cm, age = excluded.age, sex = excluded.sex, updated_at = excluded.updated_at"
    ).bind(weight, height, age, sex, updatedAt).run();
    return Response.json({ profile: { weightKg: weight, heightCm: height, age, sex } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Profil kaydedilemedi." }, { status: 400 });
  }
}
