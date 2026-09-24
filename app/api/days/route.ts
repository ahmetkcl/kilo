import { getD1 } from "@/db/client";

export async function GET() {
  try {
    const rows = await getD1().prepare(
      `SELECT logged_date AS date, 'food' AS kind, food_name AS name,
              cooking_method || ' · ' || CASE WHEN unit = 'piece' THEN ROUND(amount, 1) || ' adet · ' || ROUND(grams, 0) || ' g' ELSE ROUND(grams, 0) || ' g' END AS detail,
              calories, created_at AS createdAt
       FROM food_logs
       UNION ALL
       SELECT logged_date AS date, 'activity' AS kind, activity_name AS name,
              duration_minutes || ' dk' AS detail,
              calories, created_at AS createdAt
       FROM activity_logs
       ORDER BY date DESC, createdAt DESC`
    ).all();
    return Response.json({ entries: rows.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Gün listesi yüklenemedi." }, { status: 500 });
  }
}
