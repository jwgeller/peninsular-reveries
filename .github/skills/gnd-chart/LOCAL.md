# gnd-chart — Peninsular Reveries Local Extensions

These extend the base `SKILL.md` for this project. Applied after base instructions; override on conflict.

## Additional Workshop Checks

**Art and placeholder audit:** For any leg with visual assets, sprite files, or `art.ts` as a read-only reference, scan for emoji or other placeholder art. List each placeholder explicitly in the leg intent as "placeholder — sourcing deferred" or open a companion `creative-assets` leg. Reference the `creative-assets` skill in the intent if sourcing work is in scope.

**Gameplay at viewport (new-mechanic legs):** When a leg introduces or changes a gameplay mechanic, ask: *"Does this mechanic remain clear and comfortable at 390×844 portrait and 844×390 landscape?"* Add responsive gameplay confirmation to the intent alongside layout checkpoints — not just layout correctness. For game-panel layouts with a playfield, add an explicit board-area floor: "the playfield must fill ≥50% of remaining viewport height at 390×844 portrait after all chrome elements." Cramped controls or playfields that work visually but feel awkward are a UX concern, not just a layout concern.

**Game design lenses (optional, new-mechanic legs):** For legs introducing a new loop or mechanic, run a quick lens check before finalising the intent: Does it satisfy basic Feedback and Loop lenses (Schell)? Is it simple enough for the youngest intended player? Is there enough "toy" quality that experimenting is rewarding without instruction?

**iOS long-press mechanics:** When a leg specifies long-hold, long-press, or sustained-touch mechanics, explicitly require `-webkit-touch-callout: none; user-select: none` on the affected interactive elements in the leg intent. iOS Safari's native copy callout fires at a similar threshold and will intrude on the game UI otherwise.

**Background music legs:** When a leg specifies a background or ambient music profile, require an explicit target volume character in the intent — e.g., "ambient texture, not foreground melody" — or a numeric bus gain reference. The shared `createMusicBus` defaults to 0.20 bus gain; per-event gains of 0.06–0.10 are still perceptible as foreground at that level.

## Visual Verification

For visual legs (CSS layout, art, animation): lint alone is insufficient — add a Playwright screenshot assertion, a `page.screenshot` step, or a clearly labeled "manual visual check required" note in the leg intent so the navigator has acceptance criteria beyond lint.
