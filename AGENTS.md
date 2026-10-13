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
- Credential encryption lives in `src/lib/crypto/credentials.ts` as pure functions taking key material; only server handlers read `CREDENTIALS_ENCRYPTION_KEY` (via `credential-key.server.ts`). Why: portable to the future desktop app and keeps the key out of client bundles.
- `provider_credentials` has no grants or policies for browser roles; only server code using the admin client touches it, after verifying the caller owns the config. Why: decrypted or encrypted keys must never reach the browser.
- Every user-owned table has a `user_id` column with owner-only RLS for select/insert/update/delete; files go in the private `assets` bucket under `<user_id>/`. Why: simple, uniformly testable isolation.
- `src/test/rls-isolation.integration.test.ts` runs against the real database only with `RUN_DB_TESTS=1`; extend it whenever a user-owned table is added. Why: proves cross-user isolation with real accounts.
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate). Why: session is in browser storage.
