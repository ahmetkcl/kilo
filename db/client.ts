import { env } from "cloudflare:workers";

export function getD1() {
  if (!env.DB) throw new Error("Veritabanı bağlantısı şu an kullanılamıyor.");
  return env.DB;
}
