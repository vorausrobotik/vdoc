# The frame contract

What vdoc and a framed documentation site agree on. Deliberately generator-neutral: nothing here
names a specific documentation generator, and any of them can implement it.

`@voraus/docusaurus-theme` is the reference implementation. The requirement numbers below are shared
with that theme's own copy of this contract, so a review can cite them across both repositories.

## The signal

Query parameters on the URL the frame is loaded with, and one attribute back. That is the whole wire
format.

1. vdoc appends **`vdoc-theme=<light|dark>`** -- **unconditionally and on every load**, including the
   first. It is always a resolved mode, never `system`.
2. A frame that understands the parameter applies that mode **before its first paint** and sets
   **`data-vdoc-theme="<mode>"`** on its `<html>` element to declare that it did.
3. vdoc reads that attribute and nothing else. Without it, it falls back to the legacy conventions it
   used before this contract existed (`localStorage.darkMode` plus a Tailwind `dark` class, or
   Doxygen's `*-mode` classes).
4. vdoc also appends **`vdoc-inset=<px>`**, the horizontal offset it insets its own header content
   by. Optional in both directions: vdoc may omit it, and a frame may ignore it. See R9.

There is no message channel and no handshake, and deliberately no way for the frame to answer beyond
that one attribute. Everything below specifies what these names *oblige*, not what else is sent.

```{mermaid}
sequenceDiagram
    participant R as Reader
    participant V as vdoc
    participant F as Framed document
    R->>V: opens /proj/1.0/page.html
    V->>F: loads /static/projects/proj/1.0/page.html?vdoc-theme=dark&vdoc-inset=24
    Note over F: Inline script in <head> applies the mode<br/>and the inset before the first paint
    F->>F: sets data-vdoc-theme="dark" on <html>
    V->>F: reads data-vdoc-theme
    Note over V: Present and equal to the requested mode,<br/>so no reload is needed
    R->>V: switches to light
    V->>F: reloads with ?vdoc-theme=light
    Note over V: Scroll position is captured before the<br/>reload and restored after it
```

## Requirements on the frame

### R1 -- Render nothing the host already provides

While `data-vdoc-theme` is set, the frame must not render its own version of anything vdoc supplies
around it. As of today that is:

| The frame must hide | Because vdoc |
| --- | --- |
| Its brand mark or logo | carries the voraus wordmark in its header, directly above the frame |
| Its color-mode control | owns that switch, and it themes vdoc's own header too, which the frame cannot reach |
| Its footer with legal links and copyright | renders the imprint, the privacy policy and the copyright below the frame |
| Its scroll-to-top control | renders one for the scroll position it owns |
| Its version selector | renders the version picker |
| Any portal-wide search | provides search across all documentation |

**The rule matters more than the list:** if vdoc shows it, the frame must not show a second one. New
elements on vdoc's side extend this list without changing the contract.

### R2 -- Hide before the first paint

The hiding must be CSS keyed on the attribute, not a condition evaluated at runtime.

A framework that decides this while rendering decides it *after* the page has been painted, so every
element appears and then vanishes -- on every single page load. An attribute set ahead of the first
paint has nothing to flash.

### R3 -- Hide, do not stop rendering

The elements must stay in the document and only be hidden. A reader who opens the site directly,
without vdoc around it, has no other source for its branding, its color-mode control or its copyright
line.

This follows from R2 anyway, and it is the reason R1 is a list of CSS rules rather than of conditions.

### R4 -- Do not detect the frame; read the parameter

The frame must not derive "am I framed" from `window.self !== window.top` or any other inspection of
its surroundings.

Because vdoc appends the parameter unconditionally, its presence *is* the statement that a contract
host is rendering its own interface around the page. An iframe check is a guess, and a wrong one for
every other embedding: documentation dropped into a wiki page or a product help panel would lose its
branding and its only way to change mode, with nothing rendering a replacement.

### R5 -- Never persist the mode

The frame must not write the requested mode to browser storage.

The URL carries it on every load, so storage adds nothing -- and it would leak vdoc's mode into a
standalone visit to the same origin.

### R6 -- Apply an explicit mode, not a preference

The frame must apply the mode as an explicit light or dark, not as "follow the system".

Left as a system preference, a later change to the operating system's setting overrules vdoc, and the
frame and the interface around it disagree until the next load.

### R7 -- Carry the parameters through the frame's own navigations

If the frame performs a navigation that discards its document, it must carry `vdoc-theme` over.

Client-side navigation keeps the attribute, because the document is never replaced. A hard navigation
the frame triggers itself starts a new document, which sees no parameter, declares no attribute, and
drops back to the legacy path -- a visible flash of the wrong mode with vdoc's own elements duplicated
inside the frame.

vdoc composes the parameters for the navigations it performs on the frame's behalf.

### R8 -- Paint an opaque background

The frame must paint its own page background in both modes.

Several generators leave the light-mode background transparent and rely on the browser's white
canvas. An embedded document has no canvas of its own, so vdoc shows through and the page renders
dark text on a dark surface.

### R9 -- Take the host's content inset from `vdoc-inset`

Having hidden its own logo (R1), the frame has nothing left to position its remaining header content
against. Lining that content up with vdoc's header requires knowing where vdoc's header content
starts, and only vdoc knows that.

So vdoc sends it: **`vdoc-inset=<px>`**, an integer in CSS pixels. A frame that implements this must
apply it as its own horizontal header padding while framed, and must fall back to its normal layout
when the parameter is absent.

Both sides may skip it. A frame that ignores it is merely misaligned, not broken.

**Why a parameter rather than a number written down here.** vdoc keeps every published version
forever. A fixed number would be baked into each site's stylesheet at build time, so vdoc could never
change its own gutter again without stranding every site published before the change. A parameter
arrives on every load, so a snapshot built years ago follows vdoc's current layout. vdoc measures the
value from its own header rather than hardcoding it, for the same reason.

**What does not work, so nobody tries it again.** Aligning the frame's header content to the frame's
*own* page content: generators center their content column once the viewport is wider than it, so the
content drifts away from the fixed sidebar edge a header rule can track. Measured in Docusaurus, the
content sits at 316px in a 1400px viewport and at 706px in a 2400px one, while the header rule stays
at 316px either way -- leaving the header content stranded in the gap.

### R10 -- Do not route links from their DOM `href`

The frame's router must not decide where a link goes by reading `anchor.href`.

vdoc rewrites the `href` of every anchor in the framed document to its readable form, so that
hovering, copying and the browser's own new-tab shortcuts name the page rather than the file behind
it. A component-based router that carries its target in a prop -- the usual case -- is unaffected. A
router that reads `anchor.href` and compares it against its own base path will not recognize its own
links, and every one of them will fall through to a full document load.

## Why a page has two addresses

The requirement above follows from this, so it is worth stating once.

vdoc's backend serves the published files under `/static/projects/<project>/<version>/…` and answers
the bare `/<project>/<version>/…` with its own application, which frames those files. The prefix is
not decoration: a relative link inside `/static/projects/proj/1.0/page.html` resolves to
`/static/projects/proj/1.0/other.html` and stays inside the file namespace. Without a namespace of its
own, a click inside the frame would load vdoc's application *into* the frame, recursively.

So every page has two addresses, and mapping between them is a pure function in both directions
(`toReadableHref` and `toFrameHref` in `src/ui/helpers/RouteHelpers.ts`):

| | Address |
| --- | --- |
| The file, loaded into the frame | `/static/projects/proj/1.0/page.html` |
| The readable one, in vdoc's address bar and on every link | `/proj/1.0/page.html` |

vdoc's own parameters never appear in the readable form. They are requests to the frame, not part of
a page's address.

`latest` stands in for a version in the static form as well, so `/static/projects/proj/latest/page.html`
redirects to whichever version is newest. A redirect rather than the file itself, because a relative
link inside the page resolves against the address the browser ended up on, and that has to be the
resolved version for the link to stay inside it.

**A request for something unpublished is answered honestly.** vdoc serves its own application under a
**404** when the path names no project it has, or no version it published. A reader still gets vdoc's
not-found page; a crawler, a link checker or an agent is told the truth. Answering 200 for every path
made the fallback route the one that never fails, which left `/robots.txt` and every typo looking like
a published document.

## What vdoc does around the frame

Descriptive, not normative -- a framework does not have to do anything for this. It is here so that
the behavior is not mistaken for interference.

**Navigation.** vdoc wraps `history.pushState` and `history.replaceState` on the framed window and
listens for `popstate`, because a single-page generator swaps pages without a document load and
neither method emits an event. That is how vdoc's address bar follows client-side routing. It also
watches the framed `<head>`, since a client-side router sets the title after navigating.

**Links.** Clicks are handled by two delegated listeners on the framed document, never per anchor, so
that links rendered after the document loaded are covered too:

```{mermaid}
flowchart TD
    C[Click on a link in the frame] --> M{"Modified click<br/>or download?"}
    M -->|yes| B[Left to the browser]
    M -->|no| O{"Other origin, other project<br/>or target=_blank?"}
    O -->|yes| N["vdoc opens the readable<br/>address in a new tab"]
    O -->|no| P{"Did the framework call<br/>preventDefault()?"}
    P -->|yes| R[The framework routes it itself]
    P -->|no| F[vdoc navigates the frame]
```

## Adopting the contract

For a framework that has none of this yet, in order:

1. One inline script in `<head>`: read `vdoc-theme` and `vdoc-inset` from `window.location.search`,
   apply the mode the way the framework already applies modes, apply the inset as horizontal header
   padding, and set `data-vdoc-theme` to the mode actually in effect (R2, R6, R9).
2. CSS keyed on `[data-vdoc-theme]` that hides everything in R1 -- hiding it, not omitting it (R3).
3. Make sure the mode is not written to storage (R5) and that no code asks whether it is framed (R4).
4. Give the page an opaque background in both modes (R8).
5. Carry `vdoc-theme` through any hard navigation the framework performs itself (R7).
6. Check that link routing does not read the DOM `href` (R10).

Nothing else is required, and nothing may be added: the contract is these two parameters and one
attribute. Resist growing it into a message-passing protocol -- a value on the URL, applied before the
first paint, already does the job, and every addition is something every future framework has to
implement.
