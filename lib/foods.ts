export type FoodPreparation = { method: string; kcal: number; protein: number; carbs: number; fat: number };
export type FoodPortion = { label: string; grams: number };
export type Food = { id: string; name: string; category: string; kcal: number; protein: number; carbs: number; fat: number; preparations: FoodPreparation[]; portions: FoodPortion[] };

const prep = (method: string, kcal: number, protein: number, carbs: number, fat: number): FoodPreparation => ({ method, kcal, protein, carbs, fat });

// Values are per 100 g edible portion. Basic foods: USDA FoodData Central (Foundation/SR/FNDDS).
// Cooked options deliberately use distinct food entries; oil/sauce should be recorded separately.
const methodData: Record<string, FoodPreparation[]> = {
  "tavuk-gogsu": [prep("Haşlama", 151, 28.5, 0, 3.0), prep("Izgara", 165, 31, 0, 3.6), prep("Fırın", 165, 31, 0, 3.6), prep("Kızartma", 246, 30, 8.5, 11.2)],
  "tavuk-but": [prep("Haşlama", 184, 24, 0, 9), prep("Izgara", 209, 26, 0, 11), prep("Fırın", 209, 26, 0, 11), prep("Kızartma", 260, 24, 8, 15)],
  "hindi-gogsu": [prep("Haşlama", 135, 30, 0, 1), prep("Izgara", 147, 30, 0, 2), prep("Fırın", 147, 30, 0, 2)],
  "dana-biftek": [prep("Izgara", 217, 26, 0, 12), prep("Fırın", 210, 26, 0, 11), prep("Tavada", 250, 25, 0, 17)],
  "dana-kiyma": [prep("Tavada", 217, 26, 0, 12), prep("Fırın", 217, 26, 0, 12)],
  "kuzu-pirzola": [prep("Izgara", 282, 25, 0, 20), prep("Fırın", 282, 25, 0, 20), prep("Tavada", 305, 24, 0, 23)],
  "somon": [prep("Izgara", 208, 20, 0, 13), prep("Fırın", 206, 22, 0, 12), prep("Tavada", 232, 22, 0, 16)],
  "levrek": [prep("Izgara", 124, 24, 0, 2.6), prep("Fırın", 124, 24, 0, 2.6), prep("Tavada", 154, 23, 0, 6.2)],
  "yumurta": [prep("Haşlama", 155, 12.6, 1.1, 10.6), prep("Tavada", 196, 13.6, 1.2, 15.3), prep("Kızartma", 196, 13.6, 1.2, 15.3)],
  "yumurta-beyaz": [prep("Haşlama", 52, 11, 0.7, 0.2), prep("Tavada", 52, 11, 0.7, 0.2)],
  "patates-haslama": [prep("Haşlama", 87, 1.9, 20, 0.1), prep("Fırın", 93, 2.5, 21, 0.1), prep("Kızartma", 312, 3.4, 41, 15)],
  "tatli-patates": [prep("Haşlama", 76, 1.4, 17.7, 0.1), prep("Fırın", 90, 2, 20.7, 0.2)],
  "brokoli": [prep("Çiğ", 34, 2.8, 6.6, 0.4), prep("Haşlama", 35, 2.4, 7.2, 0.4), prep("Buharda", 35, 2.4, 7.2, 0.4)],
  "ispanak": [prep("Çiğ", 23, 2.9, 3.6, 0.4), prep("Haşlama", 23, 3.0, 3.8, 0.3)],
  "mercimek": [prep("Haşlama", 116, 9, 20, 0.4)],
  "nohut": [prep("Haşlama", 164, 8.9, 27.4, 2.6)],
  "kuru-fasulye": [prep("Haşlama", 127, 8.7, 22.8, 0.5)],
  "pirinc-pismis": [prep("Haşlama", 130, 2.7, 28, 0.3)],
  "bulgur-pismis": [prep("Haşlama", 83, 3.1, 18.6, 0.2)],
  "makarna-pismis": [prep("Haşlama", 158, 5.8, 30.9, 0.9)],
  "cilek": [prep("Çiğ", 32, 0.7, 7.7, 0.3)],
  "muz": [prep("Çiğ", 89, 1.1, 22.8, 0.3)], "elma": [prep("Çiğ", 52, 0.3, 13.8, 0.2)], "portakal": [prep("Çiğ", 47, 0.9, 11.8, 0.1)],
  "avokado": [prep("Çiğ", 160, 2, 8.5, 14.7)], "domates": [prep("Çiğ", 18, 0.9, 3.9, 0.2)], "salatalik": [prep("Çiğ", 15, 0.7, 3.6, 0.1)],
  "kasarli-tost": [prep("Tost", 305, 13, 30, 15)],
  "sucuklu-kasarli-tost": [prep("Tost", 340, 16, 28, 18)],
  "kofteli-sandvic": [prep("Izgara", 270, 16, 27, 11)],
  "lahmacun": [prep("Fırın", 295, 12.6, 34, 12)],
  "izgara-kofte": [prep("Izgara", 230, 18.6, 5, 15)],
  "adana-kebap": [prep("Izgara", 335, 17.6, 1, 29)],
  "peynirli-borek": [prep("Fırın", 375, 9.8, 34, 22.2)],
};

// Edible weights for commonly entered whole pieces. Calories still come from
// the selected preparation's per-100 g values, so the same calculation is used.
const portionData: Record<string, FoodPortion[]> = {
  "muz": [{ label: "1 orta boy muz", grams: 118 }],
  "yumurta": [{ label: "1 büyük yumurta", grams: 50 }],
  "yumurta-beyaz": [{ label: "1 büyük yumurta beyazı", grams: 33 }],
  "elma": [{ label: "1 orta boy elma", grams: 182 }],
  "portakal": [{ label: "1 orta boy portakal", grams: 131 }],
  "avokado": [{ label: "1 orta boy avokado", grams: 136 }],
  "domates": [{ label: "1 orta boy domates", grams: 123 }],
  "salatalik": [{ label: "1 orta boy salatalık", grams: 100 }],
  "cilek": [{ label: "1 orta boy çilek", grams: 12 }],
  "peynirli-sandvic": [{ label: "1 orta boy sandviç", grams: 170 }],
  "kasarli-tost": [{ label: "1 orta boy tost", grams: 150 }],
  "sucuklu-kasarli-tost": [{ label: "1 orta boy tost", grams: 180 }],
  "hindi-fume-sandvic": [{ label: "1 orta boy sandviç", grams: 180 }],
  "tavuklu-sandvic": [{ label: "1 orta boy sandviç", grams: 190 }],
  "ton-balikli-sandvic": [{ label: "1 orta boy sandviç", grams: 180 }],
  "yumurtali-sandvic": [{ label: "1 orta boy sandviç", grams: 170 }],
  "kofteli-sandvic": [{ label: "1 orta boy sandviç", grams: 200 }],
  "lahmacun": [{ label: "1 adet lahmacun", grams: 125 }],
  "izgara-kofte": [{ label: "1 orta boy köfte", grams: 30 }],
  "zeytinyagli-yaprak-sarma": [{ label: "1 adet sarma", grams: 25 }],
  "kabak-mucver": [{ label: "1 adet mücver", grams: 27 }],
  "peynirli-borek": [{ label: "1 dilim börek", grams: 70 }],
};

const rows = [
  ["tavuk-gogsu", "Tavuk göğsü", "Et & tavuk", 165, 31, 0, 3.6], ["tavuk-but", "Tavuk but", "Et & tavuk", 209, 26, 0, 11], ["hindi-gogsu", "Hindi göğsü", "Et & tavuk", 135, 30, 0, 1], ["dana-kiyma", "Dana kıyma (%10 yağlı)", "Et & tavuk", 217, 26, 0, 12], ["dana-biftek", "Dana biftek", "Et & tavuk", 217, 26, 0, 12], ["kuzu-pirzola", "Kuzu pirzola", "Et & tavuk", 282, 25, 0, 20],
  ["somon", "Somon", "Balık", 208, 20, 0, 13], ["ton-baligi", "Ton balığı (suda)", "Balık", 116, 26, 0, 1], ["levrek", "Levrek", "Balık", 124, 24, 0, 2.6], ["yumurta", "Yumurta", "Yumurta", 143, 13, 0.7, 9.5], ["yumurta-beyaz", "Yumurta beyazı", "Yumurta", 52, 11, 0.7, 0.2],
  ["sut-tam", "Süt (tam yağlı)", "Süt ürünleri", 61, 3.2, 4.8, 3.3], ["yogurt", "Yoğurt (tam yağlı)", "Süt ürünleri", 61, 3.5, 4.7, 3.3], ["suzme-yogurt", "Süzme yoğurt", "Süt ürünleri", 97, 9, 3.6, 5], ["ayran", "Ayran", "Süt ürünleri", 37, 2, 3, 2], ["beyaz-peynir", "Beyaz peynir", "Süt ürünleri", 264, 14, 4, 21], ["kasar-peynir", "Kaşar peyniri", "Süt ürünleri", 404, 25, 1.3, 33], ["lor-peyniri", "Lor peyniri", "Süt ürünleri", 96, 17, 3, 1.5],
  ["pirinc-pismis", "Pirinç", "Tahıl", 130, 2.7, 28, 0.3], ["bulgur-pismis", "Bulgur", "Tahıl", 83, 3.1, 18.6, 0.2], ["makarna-pismis", "Makarna", "Tahıl", 158, 5.8, 30.9, 0.9], ["yulaf", "Yulaf ezmesi", "Tahıl", 379, 13.2, 67.7, 6.5], ["tam-bugday-ekmek", "Tam buğday ekmeği", "Tahıl", 247, 13, 41, 4.2], ["beyaz-ekmek", "Beyaz ekmek", "Tahıl", 266, 8.9, 49, 3.3], ["lavaş", "Lavaş", "Tahıl", 275, 8.7, 55, 2.2],
  ["patates-haslama", "Patates", "Sebze", 87, 1.9, 20, 0.1], ["tatli-patates", "Tatlı patates", "Sebze", 90, 2, 20.7, 0.2], ["mercimek", "Mercimek", "Bakliyat", 116, 9, 20, 0.4], ["nohut", "Nohut", "Bakliyat", 164, 8.9, 27.4, 2.6], ["kuru-fasulye", "Kuru fasulye", "Bakliyat", 127, 8.7, 22.8, 0.5],
  ["muz", "Muz", "Meyve", 89, 1.1, 22.8, 0.3], ["elma", "Elma", "Meyve", 52, 0.3, 13.8, 0.2], ["portakal", "Portakal", "Meyve", 47, 0.9, 11.8, 0.1], ["cilek", "Çilek", "Meyve", 32, 0.7, 7.7, 0.3], ["avokado", "Avokado", "Meyve", 160, 2, 8.5, 14.7], ["domates", "Domates", "Sebze", 18, 0.9, 3.9, 0.2], ["salatalik", "Salatalık", "Sebze", 15, 0.7, 3.6, 0.1], ["brokoli", "Brokoli", "Sebze", 35, 2.4, 7.2, 0.4], ["ispanak", "Ispanak", "Sebze", 23, 2.9, 3.6, 0.4],
  ["zeytinyagi", "Zeytinyağı", "Yağ", 884, 0, 0, 100], ["tereyagi", "Tereyağı", "Yağ", 717, 0.9, 0.1, 81], ["badem", "Badem", "Kuruyemiş", 579, 21.2, 21.6, 49.9], ["ceviz", "Ceviz", "Kuruyemiş", 654, 15.2, 13.7, 65.2], ["findik", "Fındık", "Kuruyemiş", 628, 15, 17, 61], ["fistik-ezmesi", "Fıstık ezmesi", "Kuruyemiş", 588, 25, 20, 50], ["bal", "Bal", "Tatlandırıcı", 304, 0.3, 82.4, 0], ["seker", "Toz şeker", "Tatlandırıcı", 387, 0, 100, 0], ["bitter-cikolata", "Bitter çikolata", "Atıştırmalık", 598, 7.8, 45.9, 42.6], ["protein-tozu", "Whey protein tozu", "Takviye", 400, 80, 10, 6], ["pizza", "Pizza (peynirli)", "Hazır yemek", 266, 11, 33, 10], ["hamburger", "Hamburger", "Hazır yemek", 295, 17, 24, 14], ["doner-et", "Et döner", "Hazır yemek", 215, 18, 5, 14], ["doner-tavuk", "Tavuk döner", "Hazır yemek", 190, 20, 5, 10], ["menemen", "Menemen", "Ev yemeği", 86, 4.8, 4.5, 5.6], ["corba-mercimek", "Mercimek çorbası", "Ev yemeği", 58, 3.2, 8.8, 1.2],
  // Assembled sandwich estimates based on USDA FNDDS ingredient profiles; bread, fillings and sauces vary.
  ["peynirli-sandvic", "Peynirli sandviç", "Sandviç", 235, 10, 29, 9],
  ["kasarli-tost", "Kaşarlı tost", "Sandviç", 305, 13, 30, 15],
  ["sucuklu-kasarli-tost", "Sucuklu kaşarlı tost", "Sandviç", 340, 16, 28, 18],
  ["hindi-fume-sandvic", "Hindi fümeli sandviç", "Sandviç", 205, 15, 25, 5],
  ["tavuklu-sandvic", "Tavuklu sandviç", "Sandviç", 220, 18, 25, 5.5],
  ["ton-balikli-sandvic", "Ton balıklı sandviç", "Sandviç", 225, 15, 24, 7.5],
  ["yumurtali-sandvic", "Yumurtalı sandviç", "Sandviç", 250, 12, 25, 11],
  ["kofteli-sandvic", "Köfteli sandviç", "Sandviç", 270, 16, 27, 11],
  // Turkish dish energy/protein: Turkish Renal Food Guide (PRNT), 100 g cooked recipe values.
  // Carbohydrate and fat are approximate recipe-based splits; homemade preparations vary.
  // https://theipna.org/wp-content/uploads/2026/04/FINAL-Turkish-Renal-Food-Guide_energy-and-protein-March-2025.pdf
  ["kuru-fasulye-yemegi", "Kuru fasulye yemeği", "Türk yemeği", 100, 5.6, 14, 2.5],
  ["etli-kuru-fasulye", "Etli kuru fasulye", "Türk yemeği", 110, 8.4, 12, 3.2],
  ["nohut-yemegi", "Nohut yemeği", "Türk yemeği", 100, 5.2, 14, 2.6],
  ["etli-nohut", "Etli nohut", "Türk yemeği", 110, 8, 12, 3.3],
  ["pirinc-pilavi", "Pirinç pilavı (yağlı)", "Türk yemeği", 180, 2.5, 30, 5.6],
  ["bulgur-pilavi", "Bulgur pilavı (yağlı)", "Türk yemeği", 135, 2.7, 25, 2.7],
  ["yayla-corbasi", "Yayla çorbası", "Türk yemeği", 110, 3.4, 14, 4.5],
  ["ezogelin-corbasi", "Ezogelin çorbası", "Türk yemeği", 55, 2.1, 7, 2],
  ["lahmacun", "Lahmacun", "Türk yemeği", 295, 12.6, 34, 12],
  ["izgara-kofte", "Izgara köfte", "Türk yemeği", 230, 18.6, 5, 15],
  ["karniyarik", "Karnıyarık", "Türk yemeği", 90, 5.7, 6, 4.8],
  ["zeytinyagli-taze-fasulye", "Zeytinyağlı taze fasulye", "Türk yemeği", 70, 2, 6, 4.2],
  ["yogurtlu-manti", "Yoğurtlu mantı", "Türk yemeği", 100, 4.3, 14, 3],
  ["zeytinyagli-yaprak-sarma", "Zeytinyağlı yaprak sarma", "Türk yemeği", 240, 4.6, 26, 13.1],
  ["kabak-mucver", "Kabak mücver", "Türk yemeği", 200, 5.7, 14, 13.5],
  ["peynirli-borek", "Peynirli börek", "Türk yemeği", 375, 9.8, 34, 22.2],
  ["kisir", "Kısır", "Türk yemeği", 175, 3.8, 26, 6.2],
  ["adana-kebap", "Adana kebap", "Türk yemeği", 335, 17.6, 1, 29],
] as const;

export const foods: Food[] = rows.map(([id, name, category, kcal, protein, carbs, fat]) => {
  const defaultMethod = category === "Sandviç" ? "Hazır" : category === "Türk yemeği" ? "Ev yapımı" : "Doğal";
  const preparations = methodData[id] ?? [prep(defaultMethod, kcal, protein, carbs, fat)];
  const primary = preparations[0];
  const displayCategory = category === "Sandviç" || category === "Türk yemeği" ? `${category} · ortalama tarif` : category;
  return { id, name, category: displayCategory, kcal: primary.kcal, protein: primary.protein, carbs: primary.carbs, fat: primary.fat, preparations, portions: portionData[id] ?? [] };
});

export function getFoodPreparation(food: Food, method: string) {
  return food.preparations.find((preparation) => preparation.method === method);
}
