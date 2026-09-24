// 2024 Adult Compendium of Physical Activities: https://pacompendium.com/adult-compendium/
// Values describe a representative pace/effort, not a personalized measurement.
export const exercises = [
  { id: "walk", name: "Yürüyüş (orta tempo)", met: 3.8, code: "17190" },
  { id: "brisk-walk", name: "Hızlı yürüyüş", met: 4.8, code: "17200" },
  { id: "jog", name: "Hafif koşu", met: 7.5, code: "12020" },
  { id: "cycle", name: "Bisiklet (orta tempo)", met: 7.0, code: "01016" },
  { id: "stationary-cycle", name: "Kondisyon bisikleti", met: 6.8, code: "01200" },
  { id: "swim", name: "Yüzme (rahat tempo)", met: 6.0, code: "18310" },
  { id: "weights", name: "Ağırlık çalışması", met: 3.5, code: "02054" },
  { id: "elliptical", name: "Eliptik bisiklet", met: 5.0, code: "02048" },
  { id: "stairs", name: "Merdiven çıkma", met: 6.8, code: "17131" },
  { id: "yoga", name: "Yoga", met: 2.3, code: "02175" },
] as const;

export function estimateExerciseCalories(met: number, minutes: number, weightKg: number) {
  // Subtract the resting 1 MET because the daily BMR is already counted separately.
  return Math.round((met - 1) * 3.5 * weightKg / 200 * minutes);
}
