# Kotiruoka-kirja

Kirsin ja Leon yhteinen arkiruokakirja: terveellisiä lounaita ja iltapaloja tavallisista lähikaupan aineksista.
Yksi HTML-sivu (`index.html`), tietokantana Supabase.

- Sovellus: GitHub Pages (tämä repo) → https://leoleijona.github.io/kotiruoka-kirja/
- Tietokanta: Supabase-projekti `nkhfqgyxronrfsdbeddn`, taulut etuliitteellä `ruoka_`
- Reseptit: taulu `ruoka_recipes` on totuus. Sovellus lukee niitä vain; kirjoitus kulkee edge functionin kautta.
- Uudet reseptit tulevat aina ehdotuksina (`status: "ehdotus"`) ja päätyvät kirjaan vasta kun käyttäjä painaa *Pidetään*.

## Rakenne

| Tiedosto | Mitä |
|---|---|
| `index.html` | Koko sovellus: tyylit, näkymät, Supabase-haku, Kokki-chat |
| `sw.js` | Service worker: sovellus aukeaa ilman nettiä |
| `manifest.json` | PWA: kotivalikkoon asennettava sovellus |
| `icons/` | Sovelluskuvakkeet |
| `supabase/functions/ruoka-chef/index.ts` | Kokki-chatin edge function (API-avain pysyy palvelimella) |
| `rutiini.md` | Ohje päivittäiselle ehdotusrutiinille (pilviagentti lukee tämän joka aamu) |
| `data/seed.json` | Kirjan 30 aloitusreseptiä samassa muodossa kuin tietokannassa |

## Taulut (Supabase)

| Taulu | Mitä | Oikeudet (anon) |
|---|---|---|
| `ruoka_recipes` | reseptit (`id`, `data` jsonb) | vain luku |
| `ruoka_reviews` | arviot (tähdet, miten onnistui, muistiinpano) | luku + lisäys, poisto alle tunnin vanhoista |
| `ruoka_shopping` | ostoslista (yksi rivi `main`) | luku + lisäys + päivitys |
| `ruoka_prefs` | piilotetut / suosikit / hyväksytyt / poistetut | luku + lisäys + päivitys |
| `ruoka_plan` | viikon suunnitelma (yksi rivi `main`) | luku + lisäys + päivitys |
| `ruoka_chef_log` | Kokin käyttöloki ja päiväkatto | ei pääsyä (vain service role) |
| `ruoka_chef_prompt` | Kokin ohjeistus (`id='main'`) | ei pääsyä (vain service role) |

Kokin ohjeistus on tietokannassa, ei koodissa — sitä voi hienosäätää yhdellä SQL-päivityksellä ilman uutta julkaisua:

```sql
update ruoka_chef_prompt set text = '…', updated_at = now() where id = 'main';
```

## Reseptin tietomalli (`data` jsonb)

```json
{"id":"uunipinsa-kanalla","name":"Uunipinsa kanalla ja fetalla","cat":"lounas",
 "who":["aiti"],"time":"25 min","active":"10 min työtä","servings":2,"oven":"225 °C kiertoilma",
 "tags":["kana","uuni","nopea"],"macros":{"kcal":520,"protein":38},
 "ing":[{"n":"Pinsapohja","a":"2 kpl","s":"Pirkka pinsapohja 2 kpl"},{"n":"Suola","a":"ripaus","p":true}],
 "steps":["Lämmitä uuni 225 asteeseen."],"tips":"…","order":0,"status":"ehdotus","added":1731600000000}
```

`p: true` = kaapissa aina (suola, pippuri, öljyt, kuivatut mausteet, sokeri, vehnäjauhot) → ei mene ostoslistalle.
Makrot ovat **per annos**.

## Päivittäinen ehdotusrutiini

Pilviagentti ajetaan joka aamu (cron `0 4 * * *` UTC) ja lisää 4 uutta reseptiä ehdotuksina –
2 lounasta ja 2 iltapalaa. Se lukee ohjeensa tiedostosta [`rutiini.md`](rutiini.md), joten rutiinia
säädetään muokkaamalla sitä tiedostoa. Rutiinin tila: https://claude.ai/code/routines
