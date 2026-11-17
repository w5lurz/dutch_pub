# Card art: source and licence

The card faces in `src/components/cards/` (suit symbols, rank glyphs, pip layouts, the decorated
ace of spades and the 12 court figures) are converted from the **"standard" SVG deck by
Adrian Kennard (RevK®)**.

- Deck (SVG files used): https://www.me.uk/cards/standard/ (e.g. `AS.svg` ... `KD.svg`), downloaded 2026-11-17
- Author's page: https://www.me.uk/cards/ and blog post https://revk.uk/2018/06/svg-vector-playing-cards.html
- Generator source code: https://codeberg.org/RevK/SVG-playing-cards (the *code* is GPL-3.0; we do not use or ship
  any of it, only the generated SVG cards)
- Court figures: traced by the author from a 19th-century Goodall & Son deck (c. 1870, public domain)

## Licence: CC0 1.0 Universal (public domain dedication)

The author's page states: "© Copyright 2018 Adrian Kennard Released under CC0 Public Domain licence"
(https://creativecommons.org/publicdomain/zero/1.0/legalcode), and: "No attribution required. Whilst I'd like a
credit, and I would appreciate it if the link on the Ace of Spades was left intact, that is not a requirement.
You can do what you like with these designs."

CC0 needs no attribution and allows use in a closed-source app; we credit the author here anyway.

## What we changed

- Converted the SVGs into TypeScript data for `react-native-svg` (`src/components/cards/art/*.generated.ts`,
  generated once by `tools/convert-revk.cjs`); the components draw them, there are no SVG files in the bundle.
- Court figure paths rounded to 0.1 units (of a 1300 x 2000 box) to save size; metadata dropped.
- The ace of spades has no QR code and no "cards.revk.uk" text (the decorated pip is kept).
- Colours slightly adjusted (red, black, blue, gold) in `src/components/cards/palette.ts`.
- Our own additions (not from the deck): the compact face for small cards, the card back
  (`CardBackArt`) and the special-card stamp (`CardStamp`).
