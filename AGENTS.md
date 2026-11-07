<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Architecture rules
- eSIM plans and prices come live from eSIM Access via server-only `src/lib/esim.server.ts`; the order price is re-fetched server-side and supplier fulfilment runs only after a verified `payment_records` paid row (why: never trust client prices or issue unpaid eSIMs).
- In-app voice calls use Cloudflare Realtime SFU via server functions in `src/lib/calls.functions.ts`, with Supabase Realtime presence for signalling; rooms are booking/order references joinable only by the owner or staff (why: CF token stays server-side, rooms are access-checked).
