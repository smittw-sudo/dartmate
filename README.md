# DartMate

Een volledig offline Progressive Web App (PWA) voor darts-scorekeeping. Geoptimaliseerd voor iPad (touch, landscape en portrait). Geen server nodig, installeerbaar via Safari.

## Functionaliteiten

- **501 / 301 / 101** – X01-spellen met double-out
- **Cricket Countdown** – Van 20 t/m 10 + Bull
- **Spelerprofielen** – Stats, gemiddelden, checkout%, favoriete dubbels
- **Checkout-suggesties** – Dynamisch bijgewerkt na elke pijl, met voorkeursleren
- **Interactief SVG dartbord** – Tik per segment, single/double/triple
- **Animaties** – 180!, Gebroken, Leg gewonnen
- **Pauze/Hervat** – Tot 5 simultane potjes
- **Geschiedenis** – Alle potjes opgeslagen in IndexedDB
- **PWA** – Offline-first, installeerbaar als iPad-app

## Setup

```bash
npm install
npm run dev
```

De app draait op `http://localhost:5173`

## Builden

```bash
npm run build
npm run preview
```

## Deploy naar Vercel

1. Push naar GitHub repository
2. Ga naar [vercel.com](https://vercel.com) → "Add New Project"
3. Selecteer je GitHub repository
4. Klik "Deploy" — Vercel detecteert Vite automatisch
5. Na deploy: kopieer de URL (bijv. `https://dartmate.vercel.app`)

## Installeren op iPad

1. Open de gehoste URL in **Safari** op je iPad
2. Tik op het **Deel-knopje** (vierkant met pijltje omhoog)
3. Scroll naar beneden → **"Voeg toe aan beginscherm"**
4. Tik **"Voeg toe"** — de app staat nu op je beginscherm
5. Open de app: hij start in volledig scherm, zonder adresbalk

## Spelregels

### X01 (501 / 301 / 101)
- Beide spelers beginnen op de startwaarde (bijv. 501)
- Spelers gooien beurtelings 3 pijlen
- Doel: score terug naar precies nul
- **Double out verplicht**: de laatste pijl moet op een dubbel of bullseye landen
- **Bust**: als je score onder 0 of op 1 uitkomt, vervalt de beurt en wordt de score hersteld
- **Bogey-nummers** (159, 162, 163, 165, 166, 168, 169): niet uitgooi-baar

### Cricket Countdown
- Doelgetallen in volgorde: 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, Bull
- 3 hits nodig om elk getal af te sluiten
- Single = 1 hit, Double = 2 hits, Triple = 3 hits
- Outer Bull = 1 hit, Bullseye = 2 hits
- Eerste speler die alle getallen afsluit wint

### Gebroken systeem
Als de speler die als **eerste** gooide in een potje het potje **verliest**, is hij/zij gebroken. Dit wordt bijgehouden in de statistieken.

## Architectuur

```
src/
├── components/
│   ├── dartboard/       # SVG dartbord component
│   ├── game/            # Score-invoer (totaal, dartbord, cricket)
│   ├── ui/              # Herbruikbare UI-elementen
│   └── animations/      # Framer Motion animaties
├── screens/             # Alle schermen (Home, Spelers, Spel, etc.)
├── store/               # Zustand state management
├── data/                # TypeScript types, IndexedDB, checkout-tabel
├── engine/              # Spellogica (X01, Cricket, checkout, stats)
├── hooks/               # React hooks
└── utils/               # Haptics, helpers
```

**Tech stack:** React 18 + TypeScript · Vite · Tailwind CSS v4 · Zustand · IndexedDB (idb) · Framer Motion · PWA (vite-plugin-pwa)
