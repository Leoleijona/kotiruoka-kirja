// Hakee reseptit Supabasesta ja kirjoittaa paikallisen kopion data/seed.json.
// Tietokanta on totuus; tämä tiedosto on repon luettava varmuuskopio.
//   node data/sync_from_live.js
const fs = require("fs"), path = require("path");
const URL = "https://nkhfqgyxronrfsdbeddn.supabase.co/rest/v1/ruoka_recipes?select=id,data";
const KEY = "sb_publishable_YgV-RORNesAaMS--00Gz6Q_HB_3C7kk";   // julkinen avain, sama kuin sovelluksessa

(async () => {
  const res = await fetch(URL, { headers: { apikey: KEY, authorization: "Bearer " + KEY } });
  if (!res.ok) { console.error("Haku epäonnistui:", res.status, await res.text()); process.exit(1); }
  const rows = await res.json();
  const recipes = rows.map((r) => r.data).filter(Boolean)
    .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  const out = path.join(__dirname, "seed.json");
  fs.writeFileSync(out, JSON.stringify(recipes, null, 2) + "\n");
  const cats = {};
  for (const r of recipes) cats[r.cat] = (cats[r.cat] || 0) + 1;
  console.log(`${recipes.length} reseptiä → ${out}`);
  console.log(Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(" · "));
})();
