# The frame contract

vdoc serves every published documentation site inside an iframe and renders its own user interface
around it: address bar, page title, version dropdown and color-mode switch. Two names are all a
documentation framework needs to know in order to take part in that.

This page is the source of truth for the contract. It is deliberately generator-neutral -- nothing
in it is specific to Sphinx, Doxygen or Docusaurus.

## Why a page has two addresses

vdoc's backend serves the published files under `/static/projects/<project>/<version>/…` and answers
the bare `/<project>/<version>/…` with its own single-page application, which frames the files.

The prefix is not decoration, it is what makes relative links work. A relative link inside
`/static/projects/proj/1.0/page.html` resolves to `/static/projects/proj/1.0/other.html` and stays
inside the file namespace. Without a namespace of its own, a click inside the frame would load
vdoc's application *into* the frame, recursively.

So every page has two addresses, and mapping between them is a pure function in both directions
(`toReadableHref` and `toFrameHref` in `src/ui/helpers/RouteHelpers.ts`):

| | Address |
| --- | --- |
| The file, loaded into the frame | `/static/projects/proj/1.0/page.html` |
| The readable one, in vdoc's address bar and on every link | `/proj/1.0/page.html` |

## The contract

Three statements, and nothing else. No `postMessage`, no handshake.

1. vdoc appends **`vdoc-theme=<light|dark>`** to the URL it loads the frame with -- unconditionally
   and on every load, including the first.
2. A frame that understands the parameter applies that mode **before its first paint** and sets
   **`data-vdoc-theme="<mode>"`** on its `<html>` element to say so.
3. vdoc reads that attribute and nothing else. If it is absent, vdoc falls back to reaching into the
   framed document the way it always has (`localStorage.darkMode` plus a Tailwind `dark` class, or
   Doxygen's `*-mode` classes).

```{mermaid}
sequenceDiagram
    participant R as Reader
    participant V as vdoc
    participant F as Framed document
    R->>V: opens /proj/1.0/page.html
    V->>F: loads /static/projects/proj/1.0/page.html?vdoc-theme=dark
    Note over F: Pre-body script reads the parameter and<br/>applies the mode before the first paint
    F->>F: sets data-vdoc-theme="dark" on <html>
    V->>F: reads data-vdoc-theme
    Note over V: Present and equal to the requested mode,<br/>so no reload is needed
    R->>V: switches to light
    V->>F: reloads with ?vdoc-theme=light
    Note over V: Scroll position is captured before the<br/>reload and restored after it
```

Because vdoc appends the parameter unconditionally, a frame that ignores it is unaffected -- an
unknown query parameter is inert. That is why no generator detection is needed anywhere.

### Applying the mode before the first paint

Applying it later is visible as a flash of the wrong mode. A framework therefore has to do this in a
blocking inline script in `<head>`, before any styled content, rather than in whatever runs after
hydration. Reading the parameter from `window.location.search` is enough; nothing has to be stored.

A stored preference cannot replace the parameter, because on a reader's very first visit there is
nothing stored yet -- which is precisely the case the parameter fixes.

## The parameter also means "a host renders the surrounding interface"

Since vdoc appends the parameter on every load, its presence is proof that a contract-aware host
frames the page. A framework should therefore hide the parts of its own user interface that vdoc
already shows in its header -- typically the site logo and the color-mode switch -- keyed on
`[data-vdoc-theme]`.

Key it on that attribute, not on `window.self !== window.top`. Being framed is not the same as being
framed *by vdoc*: documentation embedded in some other page would lose its branding and its mode
switch with nothing put in their place.

## What vdoc does around the frame

Descriptive, not normative -- a framework does not have to do anything for this. It is here so that
the behavior is not mistaken for interference.

**Navigation.** vdoc wraps `history.pushState` and `history.replaceState` on the framed window and
listens for `popstate`, because a single-page generator swaps pages without a document load and
neither method emits an event. That is how vdoc's address bar follows client-side routing. It also
watches the framed `<head>`, since a client-side router sets the title after navigating.

**Links.** On each document load vdoc rewrites the `href` of every anchor to the readable form, so
that hovering, copying and the browser's own new-tab shortcuts name the page rather than the file.
Navigation resolves the address back, so a link whose `href` a framework restores on re-render still
leads to the same place. Anchors carrying `download` are left alone.

Clicks are handled by two delegated listeners on the framed document, never per anchor:

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

The consequence for a framework: **routing a link must not depend on reading its DOM `href`**, since
vdoc has rewritten it. A component-based router that carries its target in a prop -- the usual case
-- is unaffected. A router that reads `anchor.href` and compares it against its own base path will
not recognize its own links.

## Adopting the contract

A framework needs one inline script in `<head>` and one CSS rule:

1. Read `vdoc-theme` from `window.location.search`.
2. If present, apply that mode the way the framework applies modes -- its `data-theme` attribute, its
   class, its storage key, whatever it already uses -- and do it before the first paint.
3. Set `data-vdoc-theme` on `<html>` to the mode that was applied. Its value is what vdoc compares
   against, so it has to name the mode actually in effect, not the mode requested.
4. Hide the logo and the color-mode switch under `[data-vdoc-theme]`.
5. Make sure link routing does not read the DOM `href`.

Nothing else is required, and nothing may be added: the contract is these two names. Resist growing
it into a message-passing protocol -- the query parameter already does the job, and every addition
is something every future framework has to implement.

`@voraus/docusaurus-theme` implements the whole of it in roughly 30 lines.
