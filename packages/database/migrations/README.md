# Migrations applied to STT Supabase (`vekrunjeyrvkhkwsxbxm`)

| Migration | Name | Notes |
|---|---|---|
| 0001 | `auth_core_organizations_profiles_roles` | orgs, profiles, roles, members, RLS helpers in `public` |
| 0002 | `mvp_enums_facilities_supply_chain` | facility enums + facilities + chain tables |
| 0003 | `mvp_materials_wallets_mass_balance` | materials seed + wallets + sync trigger |
| 0004 | `mvp_transaction_certificates` | TC + lines + verifications + invitations |

Helpers use `public.current_org_id()` and `public.is_platform_admin()` (not `auth.*` schema — MCP cannot create functions there).

Source reference: `/database/schema.sql`
