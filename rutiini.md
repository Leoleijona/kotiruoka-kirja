# Päivittäinen ehdotusrutiini

Tämän tiedoston lukee pilvirutiini "Kotiruoka-kirja: paivan reseptiehdotukset", joka ajetaan joka
aamu klo 7 Suomen aikaa (cron `0 4 * * *` UTC). Rutiinia voi säätää muokkaamalla tätä tiedostoa —
uutta julkaisua ei tarvita.

## Tehtävä

Lisää Kotiruoka-kirjaan uusia reseptejä **ehdotuksina**. Kirjoita kaikki suomeksi.

## Tietokanta

Supabase-projekti `nkhfqgyxronrfsdbeddn`. Käytä **aina Supabase MCP -liitintä** (`execute_sql`).
Suora `curl` supabase.co:hon on estetty pilviympäristössä – älä yritä sitä. Jos Supabase MCP ei ole
käytettävissä, lopeta ja raportoi se; älä keksi kiertotietä.

## 1. Lue nykytila

```sql
select id, data->>'name' as nimi, data->>'cat' as cat, status from ruoka_recipes order by id;
select recipe_id, who, stars, taste, comment from ruoka_reviews order by at desc limit 30;
select who, hidden, favorites, kept, deleted from ruoka_prefs;
```

Avoimet ehdotukset = rivit joissa `status = 'ehdotus'` JA joiden `id` ei ole `who='shared'` -rivin
`kept`- eikä `deleted`-listassa.

## 2. Päätä määrä

- Avoimia ehdotuksia **yli 8** → lisää vain **yksi** resepti.
- Muuten lisää **neljä**: kaksi lounasta ja kaksi iltapalaa, neljässä eri kategoriassa ja
  vaihtelevilla ajoilla (esim. 10–15 min, 20–25 min, 30–40 min ja yksi pidempi viikonlopuksi).

## 3. Ideat

Hae WebSearchilla tuoreita ideoita suomalaisista arkiruokalähteistä (Valio, K-Ruoka, Yhteishyvä,
Soppa365, Kotikokki). Älä kopioi tekstiä, vaan kirjoita oma resepti.

- **Älä koskaan ehdota uudelleen reseptiä, joka on `deleted`-listassa**, eikä sellaista, joka on jo
  kirjassa (sama nimi tai käytännössä sama idea).
- Huomioi arviot: jos jokin resepti on saanut 1–2 tähteä tai kommentin "liian suolaista" /
  "liian mautonta", vältä samaa linjaa.
- Suosi sitä, mistä on tykätty (4–5 tähteä, suosikit).

## 4. Reseptin säännöt

- Terveellinen on oletus: kasviksia mukana, järkevä proteiini, ei turhaa rasvaa tai sokeria – mutta
  maistuu tavalliselta kotiruoalta, ei terveysruoalta.
- Tavalliset lähikaupan ainekset (K-kauppa, S-market; Pirkka, Rainbow, Valio, Atria, Saarioinen,
  Elovena). Erikoisempi aines käy, jos se tekee ruoasta selvästi paremman – kerro silloin vinkissä
  mistä sen saa ja mitä tilalle voi vaihtaa.
- `p: true` vain kaappiaineksille: suola, pippuri, rypsi- ja oliiviöljy, kuivatut mausteet, sokeri,
  vehnäjauhot. Kaikki muu (myös kananmunat, valkosipuli, tomaattimurska, pasta, riisi) menee
  ostoslistalle, eli ilman `p`-kenttää ja mieluiten suomalaisella tuotenimellä `s`-kentässä.
- Makrot **per annos**. `servings` aina mukana. `time` = kokonaisaika, `active` = työaika.
  `oven` vain jos uunia käytetään, muodossa `"225 °C kiertoilma"`.
- Kategoriat: `lounas`, `iltapala`, `keitto`, `salaatti`, `uuniruoka`, `pasta`, `leivonta`,
  `aamiainen`. `who` on `["leo","aiti"]`. Vaiheita 4–7, lyhyitä käskylauseita.
- Kirsi ei syö sisäelimiä eikä pidä erikoisraaka-aineista (tofu, tempeh, härkis). Ei allergioita.

## 5. Tallenna

Jokaiselle reseptille, `id` kebab-case-ascii:

```sql
insert into ruoka_recipes (id, data)
select x->>'id', x from jsonb_array_elements($$[ ...reseptit JSON-taulukkona... ]$$::jsonb) x
on conflict (id) do nothing;
```

`data`-objektissa on oltava `"status":"ehdotus"`, `"added"` = nykyhetki millisekunteina ja
`"order"` = kirjan nykyinen suurin `order` + 1, 2, 3… Tarkista lopuksi, että rivit menivät perille:

```sql
select id, data->>'name' from ruoka_recipes where status='ehdotus' order by added desc limit 5;
```

Raportoi lopuksi lyhyesti, mitkä reseptit lisättiin ja miksi juuri ne.
