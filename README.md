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
- **Oefenen (10):** themakeuze, directe feedback, voortgang, live score, analyse + advies.
- **Proefexamen (30):** alle thema’s, feedback na afloop + volledige lijst.
- **Retry:** Oefenen → opnieuw met zelfde/andere selectie. Examen → start nieuw examen.

## Verdeling vragen
Evenredig met verdeling in JSON per (geselecteerd) thema via *Largest Remainder*.

## Persistentie
- `imker:last` → laatste resultaat (string)
- `imker:sessions` → lijst sessies (id, mode, dateISO, themes, questionCount, answers[], score)

## Lokaal starten
1) Plaats bestanden in map → 2) Dubbelklik `index.html`.

## Deploy (Vercel)
GitHub → New Project → **Other/Static**. Build command: leeg. Output dir: `/`.

## Reset localStorage
```js
localStorage.removeItem('imker:last');
localStorage.removeItem('imker:sessions');
```


## Nieuw in deze versie

- **Oefenmodus**: Bij een goed antwoord wordt direct feedback getoond en automatisch naar de volgende vraag gegaan (na ±0,5s). Bij een fout antwoord wordt feedback getoond en moet je zelf op *Volgende* klikken om door te gaan.
- **Proefexamen**: Tijdens het examen wordt geen live score getoond; alleen de vraagnummer-voortgang. Op de resultatenpagina zie je uitsluitend de fout beantwoorde vragen, gesorteerd per thema, inclusief je gegeven antwoord en het juiste antwoord (voluit).
- **Tijdens het maken van vragen** (in beide modi): Eerdere sessieresultaten worden niet getoond onder de vraagweergave.
- **Sessiehistorie**: Op het startscherm wordt een overzicht getoond van eerdere sessies (per browser), met type (Oefenen/Proefexamen), score en datum/tijd.
- **Lichte stijl**: De app gebruikt altijd het lichte thema, geschikt voor gebruik binnen GitHub Pages, Hobby, of Vercel.

