# Fonts

These three families are **self-hosted** so the site never makes a request to a
font CDN. `npm run fonts` downloads them into this directory.

| File | Family | Used for | Licence |
|---|---|---|---|
| `space-grotesk-latin.woff2` | Space Grotesk | English interface and headings | SIL Open Font License 1.1 |
| `vazirmatn-arabic.woff2` | Vazirmatn | Persian content (Arabic script subset) | SIL Open Font License 1.1 |
| `vazirmatn-latin.woff2` | Vazirmatn | Latin characters inside Persian sentences | SIL Open Font License 1.1 |
| `jetbrains-mono-latin.woff2` | JetBrains Mono | Commands, paths, counters | SIL Open Font License 1.1 |

All four are variable fonts, so one file per subset covers every weight the
stylesheet uses.

## Licences

- **Space Grotesk** — © Florian Karsten, SIL Open Font License 1.1.
  <https://github.com/floriankarsten/space-grotesk>
- **Vazirmatn** — © Saber Rastikerdar, SIL Open Font License 1.1.
  <https://github.com/rastikerdar/vazirmatn>
- **JetBrains Mono** — © JetBrains s.r.o., SIL Open Font License 1.1.
  <https://github.com/JetBrains/JetBrainsMono>

The SIL Open Font License permits bundling and self-hosting, including for
commercial use. Full licence text: <https://openfontlicense.org>

## Source of the files

`npm run fonts` pulls each file from the `@fontsource-variable` packages
(MIT-licensed packaging of the above fonts) over jsDelivr, with unpkg as a
fallback mirror. Nothing is fetched at page load — this is a build-time step
only.
