/**
 * getUniversalSchemaDDL(schema)
 *
 * Returns the DDL SQL string to provision a tenant schema that works for
 * ANY store type — restaurant, grocery, pharmacy, health & beauty, electronics,
 * or any future category — without ever touching this file again.
 *
 * Design principles:
 *  - All tables use the same names regardless of store type.
 *  - Type-specific product fields (unit, weight, requires_prescription, etc.)
 *    are stored in the JSONB `meta` column on `products`.
 *  - Adding a new store category requires ZERO schema changes; just create the
 *    Store record in the public schema with any storeType string you like.
 *
 * Table layout (per-tenant schema):
 *  store_sections         — menu sections / shelf categories
 *  products               — all sellable items
 *  product_images         — extra gallery images per product
 *  product_option_groups  — option groups (e.g. "Size", "Extras")
 *  product_option_values  — option choices (e.g. "Large", "Extra cheese")
 *  cart_items             — items currently in a user's cart
 *  cart_item_options      — selected options for each cart item
 *  order_items            — snapshot of purchased items
 *  order_item_options     — snapshot of selected options at purchase time
 *  product_wishlists      — user ❤ product saves
 *
 * @param {string} schema — safe schema name, e.g. "store_abc123"
 * @returns {string}
 */
export function getUniversalSchemaDDL(schema) {
    return /* sql */ `
-- ─────────────────────────────────────────────────────────────────
-- UNIVERSAL TENANT SCHEMA: ${schema}
-- Works for: restaurant, grocery, pharmacy, health & beauty, and
-- any future store type — no DDL changes ever needed.
-- ─────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS "${schema}";

-- ── 1. Store sections (menu groups / shelf categories) ────────────
-- Used to group products into logical sections inside the store.
-- e.g. "Burgers", "Drinks" for a restaurant; "Vitamins", "Skin Care"
-- for a pharmacy or health & beauty store.
CREATE TABLE IF NOT EXISTS "${schema}"."store_sections" (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    store_id    TEXT        NOT NULL,
    name        TEXT        NOT NULL,
    image_url   TEXT,
    sort_order  INTEGER     NOT NULL DEFAULT 0,
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(store_id, name)
);
CREATE INDEX IF NOT EXISTS idx_sections_store  ON "${schema}"."store_sections"(store_id);
CREATE INDEX IF NOT EXISTS idx_sections_sort   ON "${schema}"."store_sections"(sort_order);
CREATE INDEX IF NOT EXISTS idx_sections_active ON "${schema}"."store_sections"(is_active);

-- ── 2. Products ───────────────────────────────────────────────────
-- One universal products table.
-- Extra domain-specific fields (unit, weight, barcode, brand,
-- requires_prescription, ingredients, etc.) go in the "meta" JSONB column.
CREATE TABLE IF NOT EXISTS "${schema}"."products" (
    id                TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    store_id          TEXT          NOT NULL,
    section_id        TEXT          REFERENCES "${schema}"."store_sections"(id) ON DELETE SET NULL,
    name              TEXT          NOT NULL,
    description       TEXT,
    price             NUMERIC(10,2) NOT NULL,
    compare_at_price  NUMERIC(10,2),
    quantity          INTEGER       NOT NULL DEFAULT 0,
    primary_image_url TEXT,
    is_available      BOOLEAN       NOT NULL DEFAULT TRUE,
    meta              JSONB         NOT NULL DEFAULT '{}',
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_store     ON "${schema}"."products"(store_id);
CREATE INDEX IF NOT EXISTS idx_products_section   ON "${schema}"."products"(section_id);
CREATE INDEX IF NOT EXISTS idx_products_available ON "${schema}"."products"(is_available);
CREATE INDEX IF NOT EXISTS idx_products_meta      ON "${schema}"."products" USING GIN (meta);

-- ── 3. Product images ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "${schema}"."product_images" (
    id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    product_id  TEXT        NOT NULL REFERENCES "${schema}"."products"(id) ON DELETE CASCADE,
    image_url   TEXT        NOT NULL,
    sort_order  INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON "${schema}"."product_images"(product_id);

-- ── 4. Product option groups ──────────────────────────────────────
-- e.g. "Size", "Sauce", "Extras", "Flavour", "Dosage"
CREATE TABLE IF NOT EXISTS "${schema}"."product_option_groups" (
    id                     TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    product_id             TEXT        NOT NULL REFERENCES "${schema}"."products"(id) ON DELETE CASCADE,
    parent_option_value_id TEXT,
    name                   TEXT        NOT NULL,
    is_required            BOOLEAN     NOT NULL DEFAULT FALSE,
    min_select             INTEGER     NOT NULL DEFAULT 0,
    max_select             INTEGER     NOT NULL DEFAULT 1,
    sort_order             INTEGER     NOT NULL DEFAULT 0,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_opt_groups_product ON "${schema}"."product_option_groups"(product_id);
CREATE INDEX IF NOT EXISTS idx_opt_groups_sort    ON "${schema}"."product_option_groups"(sort_order);

-- ── 5. Product option values ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS "${schema}"."product_option_values" (
    id              TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    option_group_id TEXT          NOT NULL REFERENCES "${schema}"."product_option_groups"(id) ON DELETE CASCADE,
    name            TEXT          NOT NULL,
    extra_price     NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_opt_values_group ON "${schema}"."product_option_values"(option_group_id);

-- FK: self-referencing option groups for conditional/nested option trees
ALTER TABLE "${schema}"."product_option_groups"
    ADD CONSTRAINT fk_parent_option_value
    FOREIGN KEY (parent_option_value_id)
    REFERENCES "${schema}"."product_option_values"(id) ON DELETE SET NULL
    NOT VALID;

-- ── 6. Cart items ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "${schema}"."cart_items" (
    id          TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    cart_id     TEXT          NOT NULL,
    product_id  TEXT          NOT NULL REFERENCES "${schema}"."products"(id) ON DELETE CASCADE,
    quantity    INTEGER       NOT NULL CHECK (quantity > 0),
    base_price  NUMERIC(10,2) NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE(cart_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart    ON "${schema}"."cart_items"(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product ON "${schema}"."cart_items"(product_id);

-- ── 7. Cart item options ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "${schema}"."cart_item_options" (
    id              TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    cart_item_id    TEXT          NOT NULL REFERENCES "${schema}"."cart_items"(id) ON DELETE CASCADE,
    option_value_id TEXT          NOT NULL REFERENCES "${schema}"."product_option_values"(id) ON DELETE CASCADE,
    extra_price     NUMERIC(10,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_cart_item_opts_item ON "${schema}"."cart_item_options"(cart_item_id);

-- ── 8. Order items ────────────────────────────────────────────────
-- Snapshots the product data at purchase time so historical orders
-- remain accurate even if the product is later edited or deleted.
CREATE TABLE IF NOT EXISTS "${schema}"."order_items" (
    id              TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    order_id        TEXT          NOT NULL,
    product_id      TEXT          REFERENCES "${schema}"."products"(id) ON DELETE SET NULL,
    name_snapshot   TEXT          NOT NULL,
    price_snapshot  NUMERIC(10,2) NOT NULL,
    quantity        INTEGER       NOT NULL,
    meta_snapshot   JSONB         NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_items_order   ON "${schema}"."order_items"(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON "${schema}"."order_items"(product_id);

-- ── 9. Order item options ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "${schema}"."order_item_options" (
    id                    TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    order_item_id         TEXT          NOT NULL REFERENCES "${schema}"."order_items"(id) ON DELETE CASCADE,
    option_value_id       TEXT          REFERENCES "${schema}"."product_option_values"(id) ON DELETE SET NULL,
    option_name_snapshot  TEXT          NOT NULL,
    option_value_snapshot TEXT          NOT NULL,
    extra_price_snapshot  NUMERIC(10,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_order_item_opts_item ON "${schema}"."order_item_options"(order_item_id);

-- ── 10. Product wishlists ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "${schema}"."product_wishlists" (
    id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    user_id    TEXT        NOT NULL,
    product_id TEXT        NOT NULL REFERENCES "${schema}"."products"(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_wishlist_user    ON "${schema}"."product_wishlists"(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product ON "${schema}"."product_wishlists"(product_id);
`;
}
