# n-gon account integration (feature branch)

This branch adds `auth.js` (the reusable Supabase auth module) and `js/login-system.js` (the account UI and F8 admin-menu controller).

**Integration status:** these files are staged on this feature branch, but the existing `index.html` has not yet been wired to load them. Do not merge as complete until the script tags are added and tested.

Add these scripts near the end of `index.html`, before the existing game scripts or otherwise before `js/login-system.js` executes:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="auth.js"></script>
<script src="js/login-system.js"></script>
```

The module checks the existing Supabase `profiles.role` field for the exact value `admin`. Admin-only shortcut: F8. The shortcut only opens the client-side admin panel; it is not a substitute for server-side authorization.

The integration uses the Supabase project and publishable key configured in the source Login-n-multiplayer-systems repository. No service-role key is included.
