# Rishmora storefront — Step 1

This is a lightweight Flask starter for the login-first shop flow. It expects PostgreSQL configured with `DATABASE_URL` and the schema in `schema.sql`. The migration creates `product`, `user_account`, `cart`, `wishlist`, `saved_carts`, `search_history`, and `customer_ui_state` tables (existing `product` and `user_account` tables are left intact). Users can create an account at `/signup`; passwords are stored as Werkzeug password hashes.

## Run locally

1. Install dependencies with `pip install -r requirements.txt`.
2. Apply `schema.sql` and `profile_tables.sql` once to your Supabase PostgreSQL database. Put the server-side PostgreSQL connection string in `.env` as `DATABASE_URL` and set `FLASK_SECRET_KEY` to a long random value. Keep both values private.
3. Start the app with `flask --app app run --host 0.0.0.0 --port 5009` (or run `python app.py`).

Product data is read from PostgreSQL. Cart quantities, wishlist entries, search history, saved profile details, order history, and store-credit ledger entries are persisted in PostgreSQL and scoped by the signed-in user. The signed Flask session stores only the authenticated user ID and CSRF token. Saved card records contain display metadata only; never store a full card number, CVV, or UPI PIN. A payment provider must tokenize a card before it can be used for checkout. Product images use designed visual placeholders until image URLs are added to the product schema.

PostgreSQL connections are reused through a small per-process pool, and a single connection is shared across each request. The pure-Python `pg8000` driver avoids native `libpq` DLL loading on Windows. The UI uses system font fallbacks and does not need a remote font request.

For Supabase URLs using `sslmode=require`, the driver encrypts the connection without checking the certificate chain. To verify the server certificate, download the project CA certificate and set `PGSSLMODE=verify-full` and `PGSSLROOTCERT` to its local file path.

## Deploy to Render

1. Push this project to GitHub. The local `.env` file is excluded by `.gitignore`.
2. In Render, choose **New > Blueprint** and select the repository. Render will read `render.yaml`.
3. Enter the Supabase PostgreSQL URL when prompted for `DATABASE_URL`.
4. Optionally enter `GEMINI_API_KEY` for the Store Assistant. It remains optional; the rest of the app continues to work without it.
5. Keep `PGSSLMODE=require` for the hosted PostgreSQL connection.
6. Apply the SQL files once to Supabase in this order:
   - `schema.sql`
   - `phone_auth_migration.sql`
   - `profile_tables.sql`
   - `cart_quantity_limit.sql`
   - `checkout_order_columns.sql`
   - `product_content_tables.sql`
   - `seed_100_products.sql`

The Blueprint build command installs dependencies, the start command runs Gunicorn, and `/health` provides the deployment health check.
