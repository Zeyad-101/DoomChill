<div align="center">

<img src="Assets/logo.png" alt="DoomChill logo" width="96" />

# DoomChill

**Mood-first music discovery**

[![Live Demo](https://img.shields.io/badge/demo-doom--chill.vercel.app-1e4d3f?style=flat-square)](https://doom-chill.vercel.app)
![Node](https://img.shields.io/badge/node-%3E%3D18-3c873a?style=flat-square&logo=node.js&logoColor=white)
![Deployed on Vercel](https://img.shields.io/badge/deployed-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Stack](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS-f7df1e?style=flat-square&logo=javascript&logoColor=black)

</div>

---

DoomChill matches a mood to a song instead of the other way around. Drag a dial to a feeling, and it pulls matching tracks from a locally tagged set of 40,000+ songs. Or skip the dial and look up any song directly to see its genre, popularity tier, and backstory.

**Try it live:** [doom-chill.vercel.app](https://doom-chill.vercel.app)

## ✨ Features

- 🎛️ **Mood dial** — drag a ring across nine atmospheres: Chill, Happy, Sad, Energetic, Intense, Romantic, Focus, Dark, Neutral
- 🎸 **Genre filter** — Pop, Rock, Hip-Hop, Electronic, R&B, Indie, Metal, Jazz, Classical, Lo-fi, Folk, Arabic
- 🔎 **Song lookup** — search any track for its genre, popularity tier, and story
- 🌑 **Dark, atmosphere-first UI** built to match the mood you're picking
- 🗃️ **40,000+ pre-tagged songs**, sourced from Last.fm and Apple Music metadata

## 🧱 Tech stack

No framework — vanilla HTML, CSS, and JavaScript, plus a small Node build step and a couple of serverless functions for lookups.

| Layer | Tool |
|---|---|
| Frontend | HTML / CSS / vanilla JS |
| Data build | Node (`scripts/build-dataset.js`) |
| Backend | Vercel serverless functions (`/api`) |
| Hosting | Vercel |
| Metadata | Last.fm & Apple Music |

## 📁 Project structure

```
DoomChill/
├── Assets/     # logo and static images
├── api/        # serverless functions backing song lookup
├── css/        # stylesheets
├── js/         # frontend logic (mood dial, lookup, rendering)
├── data/       # the tagged song dataset
├── scripts/    # build-dataset.js — compiles the dataset
├── index.html
├── 404.html
├── vercel.json
└── package.json
```

## 🚀 Running it locally

```bash
git clone https://github.com/Zeyad-101/DoomChill.git
cd DoomChill
npm install
npm run build-data   # rebuilds data/ from source metadata
```

Serve `index.html` with any static server for the frontend. Since the song lookup depends on the functions in `/api`, run it through the [Vercel CLI](https://vercel.com/docs/cli) instead so those routes actually work:

```bash
vercel dev
```

## 🎧 How it works

The mood dial isn't hitting an API on every drag — it's matching your position on the ring against the pre-tagged local dataset built by `build-dataset.js`, so suggestions come back instantly. Song lookup is the part that talks to the outside world: it calls the `/api` functions, which pull genre, popularity, and story data from Last.fm and Apple Music.

## 🙏 Credits

Song metadata powered by **Last.fm** and **Apple Music**.

## 📄 License

No license file yet — reach out to [@Zeyad-101](https://github.com/Zeyad-101) before reusing this.
