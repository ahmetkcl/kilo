"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type AnimationEvent as ReactAnimationEvent, type FocusEvent as ReactFocusEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { Camera, ChevronRight, LockKeyhole, Plus, Search, Settings2, Trash2, X } from "lucide-react";
import { foods, type Food } from "@/lib/foods";
import { exercises, estimateExerciseCalories } from "@/lib/exercises";

type Profile = { weightKg: number; heightCm: number; age: number; sex: "male" | "female" };
type FoodLog = { id: number; foodName: string; cookingMethod: string; amount: number; unit: "grams" | "piece"; portionLabel: string; grams: number; calories: number; protein: number; carbs: number; fat: number };
type ActivityLog = { id: number; activityName: string; durationMinutes: number; calories: number };
type WeightLog = { currentWeight: number; targetWeight: number };
type HistoryEntry = { date: string; kind: "food" | "activity"; name: string; detail: string; calories: number; createdAt: string };
type Panel = "records" | "macros" | "bmr" | null;

const baseProfile: Profile = { weightKg: 118, heightCm: 185, age: 30, sex: "male" };
const fmt = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
const dec = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });
const dateFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" });
function today() { const p = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()); const v = (t: string) => p.find((x) => x.type === t)?.value ?? ""; return `${v("year")}-${v("month")}-${v("day")}`; }
function dateLabel(date: string) { return dateFmt.format(new Date(`${date}T12:00:00`)); }
function numberOf(value: string) { return Number(value.replace(",", ".")); }
function portionText(amount: number, label: string) { return amount === 1 ? label : `${dec.format(amount)} × ${label}`; }

const animatedIcons = "svg.utensils-motion, svg.flame-motion, svg.dumbbell-motion, svg.weight-motion, svg.lucide-search, svg.lucide-settings-2, svg.lucide-trash-2, svg.lucide-x";
function startIconMotion(target: EventTarget | null, previousTarget: EventTarget | null, root: HTMLElement) {
  if (!(target instanceof Element) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const relative = target.closest(".relative");
  const searchWrapper = relative?.firstElementChild?.matches("svg.lucide-search") ? relative : null;
  const host = target.closest("button") ?? target.closest(".icon-badge, .brand-mark, .log-row, h3") ?? searchWrapper;
  if (!host || !root.contains(host) || (previousTarget instanceof Node && host.contains(previousTarget))) return;
  const icon = target.closest(animatedIcons) ?? host.querySelector(host.matches(".log-row") ? "svg.utensils-motion, svg.dumbbell-motion" : animatedIcons);
  if (icon && host.contains(icon) && !icon.hasAttribute("data-animating")) icon.setAttribute("data-animating", "true");
}
function finishIconMotion(event: ReactAnimationEvent<HTMLElement>) {
  if (!(event.target instanceof Element)) return;
  const icon = event.target.closest("svg[data-animating]");
  if (!icon) return;
  if (icon.matches(".utensils-motion") && event.animationName !== "knife-cross") return;
  if (icon.matches(".dumbbell-motion") && event.animationName !== "dumbbell-right-hop") return;
  icon.removeAttribute("data-animating");
}

export default function Home() {
  const date = today();
  const [profile, setProfile] = useState(baseProfile);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [weight, setWeight] = useState<WeightLog | null>(null);
  const [recordedWeight, setRecordedWeight] = useState(118);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [panel, setPanel] = useState<Panel>("macros");
  const [query, setQuery] = useState("");
  const [food, setFood] = useState<Food | null>(null);
  const [customFoods, setCustomFoods] = useState<Food[]>([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customKcal, setCustomKcal] = useState("");
  const [customProtein, setCustomProtein] = useState("0");
  const [customCarbs, setCustomCarbs] = useState("0");
  const [customFat, setCustomFat] = useState("0");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [method, setMethod] = useState("");
  const [unit, setUnit] = useState<"grams" | "piece">("grams");
  const [amount, setAmount] = useState("100");
  const [exerciseId, setExerciseId] = useState<string>(exercises[0].id);
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const exercisePickerRef = useRef<HTMLDivElement>(null);
  const [minutes, setMinutes] = useState("20");
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const clearMessage = useCallback(() => setMessage(null), []);

  const loadHistory = useCallback(async () => { try { const r = await fetch("/api/days"); const d = await r.json() as { entries?: HistoryEntry[] }; if (r.ok) setHistory(d.entries ?? []); } catch {} }, []);
  const loadDay = useCallback(async () => { try { const r = await fetch(`/api/day?date=${date}`); const d = await r.json() as { foods?: FoodLog[]; activities?: ActivityLog[]; weight?: WeightLog | null; error?: string }; if (!r.ok) throw new Error(d.error); setFoodLogs(d.foods ?? []); setActivities(d.activities ?? []); setWeight(d.weight ?? null); setRecordedWeight(d.weight?.currentWeight ?? 118); setMessage(null); } catch (e) { setMessage({ text: e instanceof Error ? e.message : "Kayıtlar yüklenemedi.", error: true }); } }, [date]);
  useEffect(() => { void loadDay(); void loadHistory(); void (async () => { const r = await fetch("/api/profile"); const d = await r.json() as { profile?: Profile }; if (d.profile) setProfile(d.profile); })(); void (async () => { const r = await fetch("/api/foods"); const d = await r.json() as { foods?: Food[] }; if (r.ok) setCustomFoods(d.foods ?? []); })(); }, [loadDay, loadHistory]);
  useEffect(() => {
    if (!exerciseOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !exercisePickerRef.current?.contains(event.target)) setExerciseOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExerciseOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [exerciseOpen]);
  useEffect(() => {
    if (!photo) { setPhotoPreview(""); return; }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const totals = useMemo(() => foodLogs.reduce((s, x) => ({ kcal: s.kcal + x.calories, protein: s.protein + x.protein, carbs: s.carbs + x.carbs, fat: s.fat + x.fat }), { kcal: 0, protein: 0, carbs: 0, fat: 0 }), [foodLogs]);
  const activityTotal = useMemo(() => activities.reduce((s, x) => s + x.calories, 0), [activities]);
  const currentWeight = weight?.currentWeight ?? 118;
  const bmr = Math.round(10 * currentWeight + 6.25 * 185 - 5 * profile.age + (profile.sex === "male" ? 5 : -161));
  const burned = bmr + activityTotal;
  const result = totals.kcal - burned;
  const surplus = result > 0;
  const predictedWeight = currentWeight + result / 7700;
  const selectedExercise = exercises.find((item) => item.id === exerciseId);
  const estimatedActivityCalories = selectedExercise ? estimateExerciseCalories(selectedExercise.met, numberOf(minutes), recordedWeight) : 0;
  const preparation = food?.preparations.find((x) => x.method === method);
  const portion = food?.portions[0];
  const portionUnitName = portion && /porsiyon|tabak|kase/i.test(portion.label) ? "Porsiyon" : "Adet";
  const amountNumber = numberOf(amount);
  const equivalentGrams = unit === "piece" && portion ? amountNumber * portion.grams : amountNumber;
  const availableFoods = useMemo(() => [...customFoods, ...foods], [customFoods]);
  const suggestions = useMemo(() => { const q = query.toLocaleLowerCase("tr-TR").trim(); return q ? availableFoods.filter((x) => x.name.toLocaleLowerCase("tr-TR").includes(q)).slice(0, 6) : []; }, [query, availableFoods]);
  const days = useMemo(() => Object.values(history.reduce<Record<string, { date: string; entries: HistoryEntry[] }>>((a, x) => { a[x.date] ??= { date: x.date, entries: [] }; a[x.date].entries.push(x); return a; }, {})).sort((a, b) => b.date.localeCompare(a.date)), [history]);

  async function api(body: Record<string, unknown>, methodName = "POST") { const r = await fetch(`/api/day?date=${date}`, { method: methodName, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json() as Record<string, unknown> & { error?: string }; if (!r.ok) throw new Error(d.error ?? "İşlem tamamlanamadı."); return d; }
  function selectFood(value: Food) { setFood(value); setQuery(value.name); setMethod(value.preparations[0].method); const piece = value.portions.length > 0; setUnit(piece ? "piece" : "grams"); setAmount(piece ? "1" : "100"); }
  async function addFood() {
    if (!food || query !== food.name) return setMessage({ text: "Bu besin veri tabanında yok. Listeden seç.", error: true });
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) return setMessage({ text: "Miktar sıfırdan büyük olmalı.", error: true });
    setSaving(true); try { const d = await api({ type: "food", foodId: food.id, cookingMethod: method, unit, amount: amountNumber }) as { food: FoodLog }; setFoodLogs((x) => [d.food, ...x]); setFood(null); setQuery(""); setUnit("grams"); setAmount("100"); setMessage({ text: `${d.food.foodName} eklendi.` }); void loadHistory(); } catch (e) { setMessage({ text: e instanceof Error ? e.message : "Besin eklenemedi.", error: true }); } finally { setSaving(false); }
  }
  async function addActivity() {
    const mins = numberOf(minutes);
    if (!selectedExercise || !Number.isInteger(mins) || mins < 1 || mins > 1440) return setMessage({ text: "Listeden spor seç ve 1–1440 dakika arasında süre gir.", error: true });
    setSaving(true); try { const d = await api({ type: "activity", exerciseId, durationMinutes: mins }) as { activity: ActivityLog }; setActivities((x) => [d.activity, ...x]); setMessage({ text: `${d.activity.activityName} eklendi.` }); void loadHistory(); } catch (e) { setMessage({ text: e instanceof Error ? e.message : "Aktivite eklenemedi.", error: true }); } finally { setSaving(false); }
  }
  async function addCustomFood() {
    const kcal = numberOf(customKcal), protein = numberOf(customProtein), carbs = numberOf(customCarbs), fat = numberOf(customFat);
    if (customName.trim().length < 2 || !Number.isFinite(kcal) || kcal <= 0 || [protein, carbs, fat].some((x) => !Number.isFinite(x) || x < 0)) return setMessage({ text: "Besin adı ve 100 gram için geçerli değerler gir.", error: true });
    setSaving(true);
    try {
      const response = await fetch("/api/foods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: customName, kcal, protein, carbs, fat }) });
      const data = await response.json() as { food?: Food; updated?: boolean; error?: string };
      if (!response.ok || !data.food) throw new Error(data.error ?? "Besin kaydedilemedi.");
      setCustomFoods((current) => [data.food!, ...current.filter((item) => item.id !== data.food!.id)]);
      selectFood(data.food);
      setCustomName(""); setCustomKcal(""); setCustomProtein("0"); setCustomCarbs("0"); setCustomFat("0"); setCustomOpen(false);
      setMessage({ text: `${data.food.name} ${data.updated ? "güncellendi" : "besin veritabanına eklendi"}.` });
    } catch (e) { setMessage({ text: e instanceof Error ? e.message : "Besin kaydedilemedi.", error: true }); }
    finally { setSaving(false); }
  }
  async function addFoodFromPhoto() {
    if (!photo) return setMessage({ text: "Önce bir besin fotoğrafı seç.", error: true });
    if (photo.size > 5 * 1024 * 1024) return setMessage({ text: "Fotoğraf 5 MB veya daha küçük olmalı.", error: true });
    setAnalyzingPhoto(true);
    try {
      const body = new FormData();
      body.set("photo", photo);
      const response = await fetch("/api/foods/photo", { method: "POST", body });
      const data = await response.json() as { food?: Food; updated?: boolean; source?: "label" | "estimate"; note?: string; error?: string };
      if (!response.ok || !data.food) throw new Error(data.error ?? "Fotoğraftan besin kaydedilemedi.");
      setCustomFoods((current) => [data.food!, ...current.filter((item) => item.id !== data.food!.id)]);
      selectFood(data.food);
      setPhoto(null);
      if (photoInputRef.current) photoInputRef.current.value = "";
      setCustomOpen(false);
      setMessage({ text: `${data.food.name} ${data.updated ? "güncellendi" : "kaydedildi"}. ${data.source === "estimate" ? "100 g değerleri fotoğrafa dayalı tahmindir; kontrol edebilirsin." : "100 g değerleri etiketten okundu; kontrol edebilirsin."}` });
    } catch (e) { setMessage({ text: e instanceof Error ? e.message : "Fotoğraf analiz edilemedi.", error: true }); }
    finally { setAnalyzingPhoto(false); }
  }
  async function remove(type: "food" | "activity", id: number) { try { await api({ type, id }, "DELETE"); type === "food" ? setFoodLogs((x) => x.filter((y) => y.id !== id)) : setActivities((x) => x.filter((y) => y.id !== id)); void loadHistory(); } catch (e) { setMessage({ text: e instanceof Error ? e.message : "Kayıt silinemedi.", error: true }); } }
  async function saveWeight() { setSaving(true); try { const d = await api({ type: "weight", currentWeight: weight?.currentWeight ?? 118, targetWeight: 118 }) as { weight: WeightLog }; setWeight(d.weight); setRecordedWeight(d.weight.currentWeight); setMessage({ text: "Kilo kaydedildi." }); } catch (e) { setMessage({ text: e instanceof Error ? e.message : "Kilo kaydedilemedi.", error: true }); } finally { setSaving(false); } }
  async function saveProfile() { setSaving(true); try { const r = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) }); const d = await r.json() as { error?: string }; if (!r.ok) throw new Error(d.error); setMessage({ text: "BMR ayarları kaydedildi." }); } catch (e) { setMessage({ text: e instanceof Error ? e.message : "Ayarlar kaydedilemedi.", error: true }); } finally { setSaving(false); } }

  return <main className="kilo-app h-dvh overflow-hidden bg-[#f4f7f3] text-[#14251e]" onPointerOver={(event: ReactPointerEvent<HTMLElement>) => startIconMotion(event.target, event.relatedTarget, event.currentTarget)} onFocusCapture={(event: ReactFocusEvent<HTMLElement>) => startIconMotion(event.target, event.relatedTarget, event.currentTarget)} onAnimationEnd={finishIconMotion}><div className="mx-auto grid h-full max-w-[1600px] grid-cols-[250px_minmax(0,1fr)_330px]">
    <aside className="min-h-0 overflow-y-auto border-r border-[#dbe5dd] bg-[#e9f1ec] px-5 py-6">
      <div className="mb-7 flex items-center gap-3 px-2"><span className="brand-mark grid h-10 w-10 place-items-center rounded-2xl bg-[#216b50] text-white"><FlameMotion size={21} /></span><div><p className="text-lg font-bold">kilo<span className="text-[#216b50]">diyet</span></p><p className="text-xs text-[#65746b]">günlük takip</p></div></div>
      <div className="mb-3 flex justify-between px-2 text-xs font-bold uppercase tracking-[.14em] text-[#65746b]"><span>Günlük geçmiş</span><span>{days.length} gün</span></div>
      <nav className="space-y-2">{days.map((day) => { const open = expanded.includes(day.date); const eaten = day.entries.filter((x) => x.kind === "food"), active = day.entries.filter((x) => x.kind === "activity"); const dayResult = eaten.reduce((s, x) => s + x.calories, 0) - bmr - active.reduce((s, x) => s + x.calories, 0); return <div key={day.date} className={`relative rounded-xl border border-[#d3e0d6] bg-white/60 ${open ? "z-30" : "z-0"}`}><button type="button" aria-expanded={open} onClick={() => setExpanded((x) => open ? x.filter((d) => d !== day.date) : [...x, day.date])} className="flex w-full items-center gap-2 px-3 py-3 text-left"><span className="flex-1"><span className="block text-sm font-bold">{dateLabel(day.date)}</span><span className="text-[11px] text-[#65746b]">{eaten.length} öğün · {active.length} aktivite</span></span><span className={`text-xs font-extrabold ${dayResult > 0 ? "text-[#c43f44]" : "text-[#177147]"}`}>{dayResult >= 0 ? "+" : "−"}{fmt.format(Math.abs(dayResult))}</span><ChevronRight size={15} className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`} /></button><div data-open={open} aria-hidden={!open} inert={!open} className="dropdown-float absolute left-0 right-0 top-full mt-1 rounded-xl border border-[#dbe5dd] bg-white px-3 py-3 shadow-xl"><HistoryGroup title="Yediklerin" entries={eaten} /><HistoryGroup title="Yaktıkların" entries={active} minus /></div></div>; })}{!days.length && <p className="rounded-xl border border-dashed border-[#c7d9cc] p-4 text-xs leading-5 text-[#65746b]">Kayıt eklediğinde günler burada alt alta açılır.</p>}</nav>
    </aside>

    <section className="min-h-0 overflow-y-auto px-8 py-7">
      <header className="mb-5 flex items-center justify-between gap-4"><div><p className="mb-1 text-sm text-[#65746b]">Günlük kayıt</p><div className="flex items-center gap-3"><h1 className="text-3xl font-bold">{dateLabel(date)}</h1><span className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${surplus ? "bg-[#fde8e8] text-[#c43f44]" : "bg-[#e1f4e7] text-[#177147]"}`}>{result >= 0 ? "+" : "−"}{fmt.format(Math.abs(result))} kcal</span></div></div><div className={`rounded-2xl px-5 py-3 ${surplus ? "bg-[#fde8e8] text-[#a7353a]" : "bg-[#173a2b] text-white"}`}><p className="text-xs opacity-70">Günlük sonuç</p><p className="text-xl font-extrabold">{result >= 0 ? "+" : "−"}{fmt.format(Math.abs(result))} <span className="text-sm">kcal</span></p><p className="text-[11px] opacity-70">Yediğin − yaktığın</p></div></header>
      {message && <Toast message={message} onClose={clearMessage} />}
      <div className="mb-4 grid grid-cols-2 gap-3"><Stat title="Yediğin" value={totals.kcal} color="orange" /><Stat title="Toplam yakım" value={burned} color="green" /></div>
      <div className="space-y-4">
        <section className="rounded-3xl border border-[#dbe5dd] bg-white p-5">
          <div className="mb-4 flex items-center gap-3"><IconBox><UtensilsMotion size={18} /></IconBox><div><h2 className="font-bold">Yemek ekle</h2><p className="text-xs text-[#65746b]">Hazır yemeklerde tam porsiyon, diğerlerinde adet veya gram seçebilirsin.</p></div></div>
          <fieldset disabled={saving} className="food-entry-fields grid grid-cols-[minmax(0,1fr)_120px_100px_90px_auto] gap-2">
            <div className="relative z-20">
              <Search className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[#7b8d82]" size={17} />
              <input value={query} onChange={(e) => { setQuery(e.target.value); setFood(null); }} placeholder="Besin ara" className="input" style={{ paddingLeft: "2.5rem" }} />
              <div data-open={suggestions.length > 0 && !food} aria-hidden={!(suggestions.length > 0 && !food)} inert={!(suggestions.length > 0 && !food)} className="dropdown-float absolute z-20 mt-2 w-full rounded-xl border bg-white p-1 shadow-xl">
                {suggestions.map((x) => { const serving = x.portions[0]; return <button key={x.id} onClick={() => selectFood(x)} type="button" className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#eef7f0]"><span className="min-w-0"><b className="block truncate">{x.name}</b><small className="block truncate text-[#65746b]">{serving?.label ?? "100 g"} · {x.category}</small></span><b className="shrink-0 text-[#216b50]">{fmt.format(x.kcal * (serving?.grams ?? 100) / 100)} kcal</b></button>; })}
              </div>
            </div>
            <select value={method} onChange={(e) => setMethod(e.target.value)} disabled={!food} className="input"><option value="">Yöntem</option>{food?.preparations.map((x) => <option key={x.method}>{x.method}</option>)}</select>
            <select value={unit} onChange={(e) => { const u = e.target.value as "grams" | "piece"; setUnit(u); setAmount(u === "piece" ? "1" : "100"); }} disabled={!food || !portion} className="input"><option value="grams">Gram</option>{portion && <option value="piece">{portionUnitName}</option>}</select>
            <LabeledInput value={amount} onChange={setAmount} label={unit === "piece" ? (portionUnitName === "Porsiyon" ? "por." : "adet") : "g"} />
            <button onClick={() => void addFood()} type="button" className="rounded-xl bg-[#216b50] px-4 text-sm font-bold text-white"><Plus className="inline" size={16} /> Ekle</button>
          </fieldset>
          {preparation && <div className="mt-3 flex justify-between gap-3 rounded-xl bg-[#f1f7f2] px-3 py-2 text-xs text-[#315745]"><b>{unit === "piece" && portion ? `${portionText(amountNumber, portion.label)} ≈ ${dec.format(equivalentGrams)} g` : `${dec.format(amountNumber)} g`} · {fmt.format(preparation.kcal * equivalentGrams / 100)} kcal</b><span>P {dec.format(preparation.protein * equivalentGrams / 100)}g · K {dec.format(preparation.carbs * equivalentGrams / 100)}g · Y {dec.format(preparation.fat * equivalentGrams / 100)}g</span></div>}
        </section>
        <section className={`relative rounded-3xl border border-[#dbe5dd] bg-white p-5 ${exerciseOpen ? "z-30" : "z-0"}`}>
          <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-3"><IconBox orange><DumbbellMotion size={18} /></IconBox><div><h2 className="font-bold">Aktivite ekle</h2><p className="text-xs text-[#65746b]">Spor ve süreye göre ek yakım otomatik hesaplanır.</p></div></div><b className="text-sm text-[#b66d08]">+{fmt.format(activityTotal)} kcal</b></div>
          <fieldset disabled={saving} className="grid grid-cols-[minmax(0,1fr)_90px_auto] gap-2">
            <div ref={exercisePickerRef} className="relative min-w-0">
              <button type="button" aria-label="Spor seç" aria-expanded={exerciseOpen} aria-controls="exercise-options" onClick={() => { setCustomOpen(false); setExerciseOpen((open) => !open); }} className="input flex min-w-0 items-center justify-between gap-2 text-left"><span className="truncate">{selectedExercise?.name ?? "Spor seç"}</span><ChevronRight size={16} className={`shrink-0 transition-transform duration-200 ${exerciseOpen ? "rotate-90" : ""}`} /></button>
              <div id="exercise-options" data-open={exerciseOpen} aria-hidden={!exerciseOpen} inert={!exerciseOpen} className="dropdown-float absolute left-0 right-0 top-full z-30 mt-2 max-h-60 overflow-y-auto rounded-xl border border-[#dbe5dd] bg-white p-1 shadow-xl">
                {exercises.map((item) => <button key={item.id} type="button" onClick={() => { setExerciseId(item.id); setExerciseOpen(false); }} aria-current={item.id === exerciseId ? "true" : undefined} className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[#eef7f0] ${item.id === exerciseId ? "bg-[#eef7f0] font-bold text-[#216b50]" : ""}`}>{item.name}</button>)}
              </div>
            </div>
            <LabeledInput value={minutes} onChange={setMinutes} label="dk" />
            <button onClick={() => void addActivity()} type="button" className="rounded-xl border border-[#bdd4c4] px-4 text-sm font-bold text-[#216b50]"><Plus className="inline" size={16} /> Ekle</button>
          </fieldset>
          <p className="mt-2 text-xs text-[#65746b]">Bu süre için tahmini ek yakım: <b className="text-[#216b50]">{Number.isInteger(numberOf(minutes)) && numberOf(minutes) > 0 ? fmt.format(estimatedActivityCalories) : "—"} kcal</b></p>
        </section>
        <section className={`relative rounded-2xl border border-dashed border-[#b8cebe] bg-white/75 ${customOpen ? "z-40" : "z-0"}`}>
          <button type="button" aria-expanded={customOpen} onClick={() => { setExerciseOpen(false); setCustomOpen((open) => !open); }} className="flex w-full items-center gap-3 px-4 py-3 text-left"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e4f2e8] text-[#216b50]"><Plus size={17} /></span><span className="min-w-0 flex-1"><b className="block text-sm">Veritabanına besin ekle</b><small className="block text-[#65746b]">Yeni besini kaydet veya aynı isimdekini güncelle</small></span><ChevronRight size={16} className={`transition-transform duration-200 ${customOpen ? "rotate-90" : ""}`} /></button>
          <div data-open={customOpen} aria-hidden={!customOpen} inert={!customOpen} className="dropdown-float absolute left-0 right-0 top-full mt-2 rounded-2xl border border-[#cbded1] bg-white p-4 shadow-[0_18px_45px_rgba(20,37,30,.16)]">
            <p className="mb-3 text-xs font-semibold text-[#65746b]">Aşağıdaki değerlerin tamamı 100 gram içindir. Makroları bilmiyorsan 0 bırakabilirsin.</p>
            <fieldset disabled={saving} className="custom-food-fields grid grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))_auto] gap-2">
              <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Örn. Leblebi" className="input min-w-0" />
              <LabeledInput value={customKcal} onChange={setCustomKcal} label="kcal" />
              <LabeledInput value={customProtein} onChange={setCustomProtein} label="P g" />
              <LabeledInput value={customCarbs} onChange={setCustomCarbs} label="K g" />
              <LabeledInput value={customFat} onChange={setCustomFat} label="Y g" />
              <button type="button" onClick={() => void addCustomFood()} className="min-h-11 rounded-xl bg-[#216b50] px-4 text-sm font-bold text-white">Kaydet</button>
            </fieldset>
            <div className="mt-4 border-t border-[#e3ece6] pt-4">
              <p className="mb-2 text-xs font-semibold text-[#65746b]">Veya fotoğrafla ekle · tek bir besin ya da okunaklı etiket</p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#bdd4c4] px-3 text-sm font-bold text-[#216b50] hover:bg-[#f1f7f2]"><Camera size={16} /> Fotoğraf seç<input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="sr-only" /></label>
                {photoPreview && <img src={photoPreview} alt="Seçilen besin fotoğrafı" className="h-11 w-11 rounded-lg border border-[#dbe5dd] object-cover" />}
                <span className="order-last w-full truncate text-xs text-[#65746b]">{photo?.name ?? "JPG, PNG veya WebP · en fazla 5 MB"}</span>
                <button type="button" onClick={() => void addFoodFromPhoto()} disabled={!photo || analyzingPhoto || saving} className="min-h-11 rounded-xl bg-[#216b50] px-4 text-sm font-bold text-white disabled:opacity-50">{analyzingPhoto ? "Analiz ediliyor…" : "AI ile kaydet"}</button>
              </div>
              <p className="mt-2 text-[11px] text-[#7b8d82]">Fotoğraf saklanmaz; analiz için OpenAI’a gönderilir. Etiket yoksa besin değerleri tahmindir.</p>
            </div>
          </div>
        </section>
      </div>
    </section>

    <aside className="min-h-0 overflow-y-auto border-l border-[#dbe5dd] bg-[#f8faf7] px-5 py-7"><p className="mb-3 text-xs font-bold uppercase tracking-[.16em] text-[#65746b]">Bugünün özeti</p><div className="space-y-3">
      <Drop title="Kayıtlar" subtitle={`${foodLogs.length + activities.length} kayıt`} icon={<UtensilsMotion size={16} />} open={panel === "records"} toggle={() => setPanel(panel === "records" ? null : "records")}><div className="max-h-[48dvh] space-y-2 overflow-y-auto">{foodLogs.map((x) => <Log key={`f${x.id}`} title={x.foodName} detail={`${x.cookingMethod} · ${x.unit === "piece" ? `${portionText(x.amount, x.portionLabel || "1 adet")} · ` : ""}${dec.format(x.grams)} g`} value={`+${fmt.format(x.calories)}`} onDelete={() => void remove("food", x.id)} />)}{activities.map((x) => <Log key={`a${x.id}`} title={x.activityName} detail={`${x.durationMinutes} dk`} value={`−${fmt.format(x.calories)}`} activity onDelete={() => void remove("activity", x.id)} />)}{!foodLogs.length && !activities.length && <p className="p-4 text-center text-xs text-[#65746b]">Henüz kayıt yok.</p>}</div></Drop>
      <Drop title="Makrolar" subtitle="Protein · karbonhidrat · yağ" icon={<FlameMotion size={16} />} open={panel === "macros"} toggle={() => setPanel(panel === "macros" ? null : "macros")} highlight><div className="mb-4 grid grid-cols-3 gap-2"><MacroBox label="Protein" value={totals.protein} tone="text-[#177147]" /><MacroBox label="Karb." value={totals.carbs} tone="text-[#b66d08]" /><MacroBox label="Yağ" value={totals.fat} tone="text-[#c75c41]" /></div><Macro label="Protein" value={totals.protein} max={160} color="#216b50" /><Macro label="Karbonhidrat" value={totals.carbs} max={250} color="#e2a12e" /><Macro label="Yağ" value={totals.fat} max={80} color="#d86f51" /></Drop>
      <Drop title="BMR ve kilo" subtitle={`${fmt.format(bmr)} kcal · ${dec.format(currentWeight)} kg`} icon={<WeightMotion size={16} />} open={panel === "bmr"} toggle={() => setPanel(panel === "bmr" ? null : "bmr")}><Field label="Güncel kilo" value={String(weight?.currentWeight ?? 118)} suffix="kg" onChange={(v) => setWeight({ currentWeight: numberOf(v), targetWeight: 118 })} /><div className="mt-3 rounded-xl bg-[#f1f7f2] p-3 text-xs leading-5"><b className="text-[#216b50]">{dateLabel(date)}</b><p>Girdiğin: <b>{dec.format(currentWeight)} kg</b></p><p>Kalori hesabıyla: <b>{dec.format(predictedWeight)} kg</b></p></div><button onClick={() => void saveWeight()} disabled={saving} className="mt-3 h-10 w-full rounded-xl bg-[#e4f2e8] text-sm font-bold text-[#216b50]">Kiloyu kaydet</button><div className="mt-4 border-t pt-4"><h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Settings2 size={15} /> BMR ayarları</h3><div className="mb-3 grid grid-cols-2 gap-2 text-xs"><span className="rounded-lg bg-[#f4f7f3] p-2"><b className="block">118 kg</b>Sabit başlangıç</span><span className="rounded-lg bg-[#f4f7f3] p-2"><b className="block">185 cm</b>Sabit boy</span></div><div className="grid grid-cols-2 gap-2"><Field label="Yaş" value={String(profile.age)} onChange={(v) => setProfile({ ...profile, age: Math.round(numberOf(v)) })} /><label className="text-xs font-semibold text-[#65746b]">Cinsiyet<select value={profile.sex} onChange={(e) => setProfile({ ...profile, sex: e.target.value as Profile["sex"] })} className="input mt-1.5"><option value="male">Erkek</option><option value="female">Kadın</option></select></label></div><button onClick={() => void saveProfile()} disabled={saving} className="mt-3 h-10 w-full rounded-xl border border-[#bdd4c4] text-sm font-bold text-[#216b50]">BMR ayarlarını kaydet</button></div></Drop>
    </div></aside>
  </div></main>;
}

function Drop({ title, subtitle, icon, open, toggle, highlight, children }: { title: string; subtitle: string; icon: ReactNode; open: boolean; toggle: () => void; highlight?: boolean; children: ReactNode }) {
  return <section className={`relative rounded-2xl border bg-white ${open ? "z-30" : "z-0"} ${highlight ? "border-[#bcd8c4]" : "border-[#dbe5dd]"}`}>
    <button type="button" onClick={toggle} aria-expanded={open} className="flex w-full items-center gap-3 p-4 text-left">
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${highlight ? "bg-[#e4f2e8] text-[#177147]" : "bg-[#f1f5f1] text-[#456553]"}`}>{icon}</span>
      <span className="min-w-0 flex-1"><b className="block text-sm">{title}</b><small className="block truncate text-[#65746b]">{subtitle}</small></span>
      <ChevronRight size={16} className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
    </button>
    <div data-open={open} aria-hidden={!open} inert={!open} className="dropdown-float absolute left-0 right-0 top-full mt-2 rounded-2xl border border-[#dbe5dd] bg-white p-4 shadow-[0_18px_45px_rgba(20,37,30,.16)]">{children}</div>
  </section>;
}

function Toast({ message, onClose }: { message: { text: string; error?: boolean }; onClose: () => void }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    setLeaving(false);
    const timeout = window.setTimeout(() => setLeaving(true), 3000);
    return () => window.clearTimeout(timeout);
  }, [message]);
  useEffect(() => {
    if (!leaving) return;
    const timeout = window.setTimeout(onClose, 180);
    return () => window.clearTimeout(timeout);
  }, [leaving, onClose]);
  return <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4"><div role={message.error ? "alert" : "status"} data-leaving={leaving} className={`toast-motion pointer-events-auto flex w-full max-w-lg items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${message.error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}><span>{message.text}</span><button type="button" onClick={() => setLeaving(true)} aria-label="Bildirimi kapat"><X size={16} /></button></div></div>;
}
function Stat({ title, value, color }: { title: string; value: number; color: "orange" | "green" }) { return <div className="rounded-2xl border border-[#dbe5dd] bg-white p-4"><p className={`text-xs font-bold ${color === "green" ? "text-[#216b50]" : "text-[#b66d08]"}`}>{title}</p><p className="mt-1 text-2xl font-extrabold">{fmt.format(value)} <span className="text-sm text-[#65746b]">kcal</span></p></div>; }
function IconBox({ children, orange }: { children: ReactNode; orange?: boolean }) { return <span className={`icon-badge grid h-9 w-9 place-items-center rounded-xl ${orange ? "bg-[#fff2da] text-[#b66d08]" : "bg-[#e4f2e8] text-[#216b50]"}`}>{children}</span>; }
function UtensilsMotion({ size = 18 }: { size?: number }) {
  return <svg className="utensils-motion" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <g className="utensils-fork"><path d="M5 2v6M7 2v6M9 2v6M5 8c0 2 1 3 2 3s2-1 2-3M7 11v11" /></g>
    <g className="utensils-knife"><path d="M17 2c-2 2-3 5-3 9h3V2ZM17 11v11" /></g>
  </svg>;
}
function FlameMotion({ size = 18 }: { size?: number }) {
  return <svg className="flame-motion" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path className="flame-body" d="M12 2 C12.3 5.2 15.5 6.4 16.1 10.4 C17.1 9.5 17.7 8.2 17.3 6.8 C20 10 21.1 13.4 20.5 16.2 C19.7 20 16.4 22 12 22 C7.8 22 4 19.5 4 15.1 C4 12.2 5.5 9.9 6.8 8 C7.3 10 8.5 11 9.4 12 C9.1 8.6 10.8 5.9 12 2 Z" />
    <path className="flame-core" d="M12 20 C10.2 20 9.2 18.8 9.2 17.2 C9.2 15.7 10.2 14.3 11.5 13 C11.5 14.2 12.2 15 13.2 15.6 C13.2 14.7 13.5 14 13.6 13.5 C14.5 15 15.2 16.4 14.7 18 C14.3 19.3 13.4 20 12 20 Z" />
  </svg>;
}
function DumbbellMotion({ size = 18 }: { size?: number }) {
  return <svg className="dumbbell-motion" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <g transform="rotate(-45 12 12)">
      <path d="M9.3 12h5.4" />
      <g className="dumbbell-left-end">
        <g className="dumbbell-left-outer"><rect x="2.5" y="9.5" width="2" height="5" rx="1" /></g>
        <rect x="5" y="8" width="2.8" height="8" rx="1" />
      </g>
      <g className="dumbbell-right-end">
        <rect x="16.2" y="8" width="2.8" height="8" rx="1" />
        <g className="dumbbell-right-outer"><rect x="19.5" y="9.5" width="2" height="5" rx="1" /></g>
      </g>
    </g>
  </svg>;
}
function WeightMotion({ size = 16 }: { size?: number }) {
  return <svg className="weight-motion" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z" />
    <circle className="weight-head" cx="12" cy="5" r="3" />
  </svg>;
}
function LabeledInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) { return <div className="relative min-w-0"><input value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" className="input pr-12" /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] leading-none text-[#65746b]">{label}</span></div>; }
function Field({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) { return <label className="text-xs font-semibold text-[#65746b]">{label}<div className="relative mt-1.5"><input value={value} onChange={(e) => onChange(e.target.value)} className="input pr-8" />{suffix && <span className="absolute right-2 top-3 text-[10px]">{suffix}</span>}</div></label>; }
function HistoryGroup({ title, entries, minus }: { title: string; entries: HistoryEntry[]; minus?: boolean }) { return <div className="mb-3 last:mb-0"><b className="mb-1 block text-[10px] uppercase text-[#65746b]">{title}</b>{entries.length ? entries.map((x, i) => <div key={`${x.createdAt}${i}`} className="mb-1 flex justify-between text-xs"><span className="min-w-0 truncate">{x.name}<small className="block text-[#7a8b80]">{x.detail}</small></span><b className={minus ? "text-[#177147]" : "text-[#c43f44]"}>{minus ? "−" : "+"}{fmt.format(x.calories)}</b></div>) : <small className="text-[#8a9990]">Kayıt yok</small>}</div>; }
function Log({ title, detail, value, activity, onDelete }: { title: string; detail: string; value: string; activity?: boolean; onDelete: () => void }) { return <div className="log-row flex items-center gap-2 rounded-xl border border-[#edf1ed] p-2.5"><span className={`grid h-7 w-7 place-items-center rounded-lg ${activity ? "bg-[#fff2da] text-[#b66d08]" : "bg-[#e4f2e8] text-[#216b50]"}`}>{activity ? <DumbbellMotion size={14} /> : <UtensilsMotion size={14} />}</span><span className="min-w-0 flex-1"><b className="block truncate text-xs">{title}</b><small className="block truncate text-[#65746b]">{detail}</small></span><b className={`text-xs ${activity ? "text-[#177147]" : "text-[#c43f44]"}`}>{value}</b><button onClick={onDelete} className="text-[#96a59b]"><Trash2 size={14} /></button></div>; }
function MacroBox({ label, value, tone }: { label: string; value: number; tone: string }) { return <div className="rounded-xl bg-[#f5f8f5] p-2 text-center"><b className={`block text-lg ${tone}`}>{dec.format(value)}<small>g</small></b><small className="text-[10px] text-[#65746b]">{label}</small></div>; }
function Macro({ label, value, max, color }: { label: string; value: number; max: number; color: string }) { return <div className="mb-3 last:mb-0"><div className="mb-1 flex justify-between text-xs"><b>{label}</b><b>{dec.format(value)} g</b></div><div className="h-2 overflow-hidden rounded-full bg-[#edf1ed]"><div className="h-full rounded-full" style={{ width: `${Math.min(value / max * 100, 100)}%`, backgroundColor: color }} /></div></div>; }
