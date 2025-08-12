# Imkertrainer 🐝

Mobiele webapp (HTML/CSS/JS) zonder build tools. Werkt lokaal (dubbelklik `index.html`) en op Vercel (Hobby) zonder configuratie.

## Structuur
```
/
├─ index.html
├─ styles.css
├─ app.js
├─ data/
│  └─ oefenvragen_nbv.json
└─ README.md
```

## Dataformaat
Bron:
```json
{ "thema": "string", "vraag": "string", "opties": ["a) …","b) …","c) …","d) …"], "antwoord": "a|b|c|d", "difficulty": 1, "explanation": "" }
```
Adapter in app:
- category ← thema
- question ← vraag
- choices ← opties (zonder `a) `)
- answer ← index (a→0, b→1, c→2, d→3)
- difficulty ← 1–3 (default 1)
- explanation ← ''

**Dedup:** (thema+vraag). **Thema-lijst:** uniek, alfabetisch. **Laden:** JSON pas na keuze.

## Gebruik

### Oefenen
- Themakeuze + aantal vragen (5–50).
- **Feedback:** direct zichtbaar.
- **Gedrag na antwoord:**
  - **Goed:** antwoord wordt vergrendeld; ga handmatig door met *Volgende*
  - **Fout:** antwoord wordt vergrendeld; ga handmatig door met *Volgende*
- Uitleg wordt getoond indien beschikbaar.
- Voortgangsbalk + tussenscore zichtbaar.
- Hervatten van een oefensessie is mogelijk (zelfde apparaat/browser).

### Proefexamen
- 30 vragen uit **alle** thema’s, gewogen via *Largest Remainder*.
- **Tijdens het invullen géén feedback** (geen groen/rood, geen uitleg, geen score).
- Resultatenpagina toont:
  - Totale score + advies per zwakste thema’s.
  - **Alleen fout beantwoorde vragen**, gegroepeerd per thema, met jouw antwoord en het juiste antwoord (voluit).

### Startscherm en historie
- Startscherm toont **alleen** het resultatenoverzicht (historie) van dit apparaat.
- Vorige “laatste resultaat”-regel is verwijderd.
- **Reset-knop** aanwezig om het resultatenoverzicht te wissen.

## Verdeling vragen
Evenredig met verdeling in JSON per (geselecteerd) thema via *Largest Remainder*.

## Persistentie (localStorage)
- `imker:practiceCount` → voorkeursaantal oefenvragen.
- `imker:resume` → snapshot om oefensessie te hervatten.
- `imker:sessions` → resultatenoverzicht (alle sessies).
- **Verwijderd:** `imker:last` wordt niet meer gebruikt.

### Reset
- Via de knop **Reset resultaten** (startscherm) wordt alleen `imker:sessions` gewist.
- Handmatig herstellen:
  ```js
  localStorage.removeItem('imker:sessions');   // reset overzicht
  localStorage.removeItem('imker:resume');     // verwijder hervat-snapshot
  localStorage.removeItem('imker:practiceCount');
  ```

## Lokaal starten
1) Plaats bestanden in map → 2) Dubbelklik `index.html`.

## Deploy (Vercel)
GitHub → New Project → **Other/Static**. Build command: leeg. Output dir: `/`.

## Changelog (relevant)
- **Oefenmodus**: bij goed of fout wordt je keuze vergrendeld; je gaat **handmatig** door met *Volgende*.
- **Proefexamen**: geen live feedback; spanning pas breekt op resultatenpagina.
- **Startscherm**: alleen historie zichtbaar; reset-knop toegevoegd.
- **Opslag**: `imker:last` uitgefaseerd.
