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
- Pure business rules (estimates, status flow, validation) live in `src/lib/domain`; keep them I/O-free and tested.
- Data access lives in `src/lib/api`; routes/components only render.
- Pickup submission goes through the `submit_pickup_request` DB function so request IDs and estimates are computed server-side from current rates.
- Scrap rates are append-only (`scrap_rates`); the current rate is read from the `current_scrap_rates` view, keeping history.
- Status transitions are enforced by a DB trigger; `nextStatuses` in the domain module must mirror it.
- Admin is a role in `user_roles` checked via `has_role`; never on profiles or client storage.
