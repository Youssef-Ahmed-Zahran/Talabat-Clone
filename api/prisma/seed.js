import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;
const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function schemaName(storeId) {
  return `store_${storeId.replace(/-/g, '_')}`;
}

async function provisionTenantSchema(storeId, storeType = 'UNIVERSAL') {
  const schema = schemaName(storeId);
  const adminPool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await adminPool.connect();
  try {
    await client.query(`
      CREATE SCHEMA IF NOT EXISTS "${schema}";

      CREATE TABLE IF NOT EXISTS "${schema}"."store_sections" (
        id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        store_id   TEXT        NOT NULL,
        name       TEXT        NOT NULL,
        image_url  TEXT,
        sort_order INTEGER     NOT NULL DEFAULT 0,
        is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(store_id, name)
      );
      CREATE INDEX IF NOT EXISTS idx_sections_store  ON "${schema}"."store_sections"(store_id);
      CREATE INDEX IF NOT EXISTS idx_sections_sort   ON "${schema}"."store_sections"(sort_order);

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
        sort_order        INTEGER       NOT NULL DEFAULT 0,
        meta              JSONB         NOT NULL DEFAULT '{}',
        created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
      ALTER TABLE "${schema}"."products" ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
      CREATE INDEX IF NOT EXISTS idx_products_store     ON "${schema}"."products"(store_id);
      CREATE INDEX IF NOT EXISTS idx_products_section   ON "${schema}"."products"(section_id);
      CREATE INDEX IF NOT EXISTS idx_products_available ON "${schema}"."products"(is_available);

      CREATE TABLE IF NOT EXISTS "${schema}"."product_images" (
        id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        product_id TEXT        NOT NULL REFERENCES "${schema}"."products"(id) ON DELETE CASCADE,
        image_url  TEXT        NOT NULL,
        sort_order INTEGER     NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_product_images_product ON "${schema}"."product_images"(product_id);

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

      CREATE TABLE IF NOT EXISTS "${schema}"."product_option_values" (
        id              TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        option_group_id TEXT          NOT NULL REFERENCES "${schema}"."product_option_groups"(id) ON DELETE CASCADE,
        name            TEXT          NOT NULL,
        extra_price     NUMERIC(10,2) NOT NULL DEFAULT 0,
        created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_opt_values_group ON "${schema}"."product_option_values"(option_group_id);

      ALTER TABLE "${schema}"."product_option_groups"
        ADD CONSTRAINT fk_parent_option_value
        FOREIGN KEY (parent_option_value_id)
        REFERENCES "${schema}"."product_option_values"(id) ON DELETE SET NULL
        NOT VALID;

      CREATE TABLE IF NOT EXISTS "${schema}"."cart_items" (
        id         TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        cart_id    TEXT          NOT NULL,
        product_id TEXT          NOT NULL REFERENCES "${schema}"."products"(id) ON DELETE CASCADE,
        quantity   INTEGER       NOT NULL CHECK (quantity > 0),
        base_price NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        UNIQUE(cart_id, product_id)
      );

      CREATE TABLE IF NOT EXISTS "${schema}"."cart_item_options" (
        id              TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        cart_item_id    TEXT          NOT NULL REFERENCES "${schema}"."cart_items"(id) ON DELETE CASCADE,
        option_value_id TEXT          NOT NULL REFERENCES "${schema}"."product_option_values"(id) ON DELETE CASCADE,
        extra_price     NUMERIC(10,2) NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS "${schema}"."order_items" (
        id             TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        order_id       TEXT          NOT NULL,
        product_id     TEXT          REFERENCES "${schema}"."products"(id) ON DELETE SET NULL,
        name_snapshot  TEXT          NOT NULL,
        price_snapshot NUMERIC(10,2) NOT NULL,
        quantity       INTEGER       NOT NULL,
        meta_snapshot  JSONB         NOT NULL DEFAULT '{}',
        created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "${schema}"."order_item_options" (
        id                    TEXT          PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        order_item_id         TEXT          NOT NULL REFERENCES "${schema}"."order_items"(id) ON DELETE CASCADE,
        option_value_id       TEXT          REFERENCES "${schema}"."product_option_values"(id) ON DELETE SET NULL,
        option_name_snapshot  TEXT          NOT NULL,
        option_value_snapshot TEXT          NOT NULL,
        extra_price_snapshot  NUMERIC(10,2) NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS "${schema}"."product_wishlists" (
        id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
        user_id    TEXT        NOT NULL,
        product_id TEXT        NOT NULL REFERENCES "${schema}"."products"(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      );
    `);
    console.log(`  ✓ Provisioned schema "${schema}" (${storeType})`);
  } finally {
    client.release();
    await adminPool.end();
  }
}

async function seedCatalog(storeId, sections) {
  const schema = schemaName(storeId);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL search_path TO "${schema}", public`);

    const { rows: [picksSection] } = await client.query(`
      INSERT INTO store_sections (store_id, name, sort_order)
      VALUES ($1, 'Picks for you', -1)
      ON CONFLICT (store_id, name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, [storeId]);

    const allProductIds = [];

    for (let si = 0; si < sections.length; si++) {
      const sec = sections[si];

      const { rows: [section] } = await client.query(`
        INSERT INTO store_sections (store_id, name, image_url, sort_order)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (store_id, name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [storeId, sec.name, sec.imageUrl || null, si]);

      for (let pi = 0; pi < sec.products.length; pi++) {
        const p = sec.products[pi];

        const { rows: [product] } = await client.query(`
          INSERT INTO products (
            store_id, section_id, name, description,
            price, compare_at_price, quantity,
            primary_image_url, is_available, sort_order, meta
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          RETURNING id
        `, [
          storeId,
          section.id,
          p.name,
          p.description || null,
          p.price,
          p.compareAtPrice || null,
          p.quantity !== undefined ? p.quantity : 100,
          p.primaryImage,
          true,
          pi,
          JSON.stringify(p.meta || {}),
        ]);

        if (p.extraImages && p.extraImages.length > 0) {
          for (let ii = 0; ii < p.extraImages.length; ii++) {
            await client.query(`
              INSERT INTO product_images (product_id, image_url, sort_order)
              VALUES ($1, $2, $3)
            `, [product.id, p.extraImages[ii], ii]);
          }
        }

        if (p.optionGroups && p.optionGroups.length > 0) {
          for (let gi = 0; gi < p.optionGroups.length; gi++) {
            const g = p.optionGroups[gi];
            const { rows: [group] } = await client.query(`
              INSERT INTO product_option_groups (
                product_id, name, is_required, min_select, max_select, sort_order
              ) VALUES ($1,$2,$3,$4,$5,$6)
              RETURNING id
            `, [
              product.id,
              g.name,
              g.isRequired !== undefined ? g.isRequired : false,
              g.minSelect !== undefined ? g.minSelect : 0,
              g.maxSelect !== undefined ? g.maxSelect : 1,
              gi,
            ]);

            for (const v of g.values) {
              await client.query(`
                INSERT INTO product_option_values (option_group_id, name, extra_price)
                VALUES ($1,$2,$3)
              `, [group.id, v.name, v.extraPrice !== undefined ? v.extraPrice : 0]);
            }
          }
        }
        
        allProductIds.push(product.id);
      }
    }

    const shuffled = allProductIds.sort(() => 0.5 - Math.random());
    const selectedPicks = shuffled.slice(0, 6);
    for (const pid of selectedPicks) {
       await client.query(`
           UPDATE products 
           SET meta = jsonb_set(
               COALESCE(meta, '{}'::jsonb),
               '{secondarySectionIds}',
               COALESCE(meta->'secondarySectionIds', '[]'::jsonb) || $1::jsonb
           )
           WHERE id = $2
       `, [JSON.stringify([picksSection.id]), pid]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// ─── Catalog Data ─────────────────────────────────────────────────────────────

const PIZZA_HUT_CATALOG = [
  {
    name: 'Pizzas',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
    products: [
      {
        name: 'Pepperoni Passion',
        description: 'Loaded with two layers of premium pepperoni, a rich tomato sauce and 100% mozzarella cheese.',
        price: 159.00,
        compareAtPrice: 189.00,
        primaryImage: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
          'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
          'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Size',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Personal (6")', extraPrice: 0 },
              { name: 'Medium (9")', extraPrice: 30 },
              { name: 'Large (12")', extraPrice: 60 },
              { name: 'Family (15")', extraPrice: 90 },
            ],
          },
          {
            name: 'Crust',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Classic Hand-Tossed', extraPrice: 0 },
              { name: 'Thin & Crispy', extraPrice: 0 },
              { name: 'Stuffed Crust', extraPrice: 25 },
              { name: 'Cheesy Bites', extraPrice: 35 },
            ],
          },
          {
            name: 'Extra Toppings',
            isRequired: false,
            minSelect: 0,
            maxSelect: 5,
            values: [
              { name: 'Extra Cheese', extraPrice: 20 },
              { name: 'Jalapenos', extraPrice: 10 },
              { name: 'Black Olives', extraPrice: 10 },
              { name: 'Mushrooms', extraPrice: 10 },
              { name: 'Extra Pepperoni', extraPrice: 20 },
            ],
          },
        ],
      },
      {
        name: 'Margherita Classic',
        description: 'The timeless classic with vine-ripened tomato sauce, fresh mozzarella, and fragrant basil.',
        price: 129.00,
        compareAtPrice: 149.00,
        primaryImage: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
          'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Size',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Personal (6")', extraPrice: 0 },
              { name: 'Medium (9")', extraPrice: 30 },
              { name: 'Large (12")', extraPrice: 60 },
              { name: 'Family (15")', extraPrice: 90 },
            ],
          },
          {
            name: 'Crust',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Classic Hand-Tossed', extraPrice: 0 },
              { name: 'Thin & Crispy', extraPrice: 0 },
              { name: 'Stuffed Crust', extraPrice: 25 },
            ],
          },
        ],
      },
      {
        name: 'BBQ Chicken Supreme',
        description: 'Grilled chicken strips, smoky BBQ sauce, caramelised onions, mixed peppers and mozzarella.',
        price: 169.00,
        primaryImage: 'https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
          'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Size',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Personal (6")', extraPrice: 0 },
              { name: 'Medium (9")', extraPrice: 30 },
              { name: 'Large (12")', extraPrice: 60 },
              { name: 'Family (15")', extraPrice: 90 },
            ],
          },
          {
            name: 'Sauce',
            isRequired: false,
            minSelect: 0,
            maxSelect: 1,
            values: [
              { name: 'Classic BBQ', extraPrice: 0 },
              { name: 'Honey BBQ', extraPrice: 5 },
              { name: 'Spicy BBQ', extraPrice: 5 },
            ],
          },
          {
            name: 'Extra Toppings',
            isRequired: false,
            minSelect: 0,
            maxSelect: 4,
            values: [
              { name: 'Extra Cheese', extraPrice: 20 },
              { name: 'Jalapenos', extraPrice: 10 },
              { name: 'Mushrooms', extraPrice: 10 },
              { name: 'Extra Chicken', extraPrice: 25 },
            ],
          },
        ],
      },
      {
        name: 'Veggie Supreme',
        description: 'A garden of freshness: roasted peppers, red onions, mushrooms, sweetcorn and black olives.',
        price: 139.00,
        primaryImage: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=800&q=80',
        optionGroups: [
          {
            name: 'Size',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Personal (6")', extraPrice: 0 },
              { name: 'Medium (9")', extraPrice: 30 },
              { name: 'Large (12")', extraPrice: 60 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Sides & Starters',
    imageUrl: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&q=80',
    products: [
      {
        name: 'Garlic Bread',
        description: 'Oven-baked ciabatta bread brushed with garlic herb butter. Perfectly golden.',
        price: 39.00,
        primaryImage: 'https://images.unsplash.com/photo-1619734086067-24bf8889ea7d?w=800&q=80',
        optionGroups: [
          {
            name: 'Add-ons',
            isRequired: false,
            minSelect: 0,
            maxSelect: 2,
            values: [
              { name: 'Cheese Dip', extraPrice: 15 },
              { name: 'Marinara Dip', extraPrice: 15 },
              { name: 'Extra Butter', extraPrice: 5 },
            ],
          },
        ],
      },
      {
        name: 'Chicken Wings (6 pcs)',
        description: 'Crispy fried chicken wings tossed in your choice of sauce.',
        price: 89.00,
        primaryImage: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Sauce',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Buffalo Hot', extraPrice: 0 },
              { name: 'Honey Garlic', extraPrice: 0 },
              { name: 'BBQ Smoky', extraPrice: 0 },
              { name: 'Lemon Pepper', extraPrice: 0 },
            ],
          },
          {
            name: 'Dipping Sauce',
            isRequired: false,
            minSelect: 0,
            maxSelect: 1,
            values: [
              { name: 'Ranch', extraPrice: 10 },
              { name: 'Blue Cheese', extraPrice: 10 },
            ],
          },
        ],
      },
      {
        name: 'Mozzarella Sticks (6 pcs)',
        description: 'Golden-fried mozzarella sticks with a crispy breadcrumb coating. Served with marinara.',
        price: 69.00,
        primaryImage: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=800&q=80',
      },
    ],
  },
  {
    name: 'Drinks',
    imageUrl: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80',
    products: [
      {
        name: 'Soft Drink',
        description: 'Your choice of chilled soft drink.',
        price: 25.00,
        primaryImage: 'https://images.unsplash.com/photo-1499638673689-79a0b5115d87?w=800&q=80',
        optionGroups: [
          {
            name: 'Flavour',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Pepsi', extraPrice: 0 },
              { name: 'Diet Pepsi', extraPrice: 0 },
              { name: '7UP', extraPrice: 0 },
              { name: 'Mountain Dew', extraPrice: 0 },
              { name: 'Mirinda Orange', extraPrice: 0 },
            ],
          },
          {
            name: 'Size',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Regular (330ml)', extraPrice: 0 },
              { name: 'Large (500ml)', extraPrice: 10 },
              { name: '1.5L Bottle', extraPrice: 25 },
            ],
          },
        ],
      },
      {
        name: 'Water',
        description: 'Still mineral water.',
        price: 15.00,
        primaryImage: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80',
      },
    ],
  },
];

const MCDONALDS_CATALOG = [
  {
    name: 'Burgers',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    products: [
      {
        name: 'Big Mac',
        description: 'Two all-beef patties, special sauce, lettuce, cheese, pickles and onions on a sesame seed bun.',
        price: 89.00,
        compareAtPrice: 99.00,
        primaryImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
          'https://images.unsplash.com/photo-1586816001966-79b736744398?w=800&q=80',
          'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Meal',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Sandwich Only', extraPrice: 0 },
              { name: 'Medium Meal (Fries + Drink)', extraPrice: 40 },
              { name: 'Large Meal (Fries + Drink)', extraPrice: 55 },
            ],
          },
          {
            name: 'Customise',
            isRequired: false,
            minSelect: 0,
            maxSelect: 6,
            values: [
              { name: 'No Pickles', extraPrice: 0 },
              { name: 'No Onions', extraPrice: 0 },
              { name: 'No Sauce', extraPrice: 0 },
              { name: 'Extra Cheese', extraPrice: 10 },
              { name: 'Extra Patty', extraPrice: 30 },
              { name: 'Jalapenos', extraPrice: 5 },
            ],
          },
        ],
      },
      {
        name: 'Quarter Pounder with Cheese',
        description: 'A 100% fresh beef patty cooked right when you order, with two slices of melted cheese.',
        price: 99.00,
        primaryImage: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
          'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Meal',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Sandwich Only', extraPrice: 0 },
              { name: 'Medium Meal', extraPrice: 40 },
              { name: 'Large Meal', extraPrice: 55 },
            ],
          },
        ],
      },
      {
        name: 'McChicken',
        description: 'A crispy chicken patty with shredded lettuce and creamy mayo on a toasted bun.',
        price: 69.00,
        primaryImage: 'https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=800&q=80',
        optionGroups: [
          {
            name: 'Meal',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Sandwich Only', extraPrice: 0 },
              { name: 'Medium Meal', extraPrice: 40 },
              { name: 'Large Meal', extraPrice: 55 },
            ],
          },
          {
            name: 'Spice Level',
            isRequired: false,
            minSelect: 0,
            maxSelect: 1,
            values: [
              { name: 'Regular', extraPrice: 0 },
              { name: 'Spicy', extraPrice: 0 },
              { name: 'Extra Spicy', extraPrice: 0 },
            ],
          },
        ],
      },
      {
        name: 'Crispy Chicken Sandwich',
        description: 'Thick, crispy chicken fillet with crinkle-cut pickles and a buttered potato bun.',
        price: 79.00,
        primaryImage: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Meal',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Sandwich Only', extraPrice: 0 },
              { name: 'Medium Meal', extraPrice: 40 },
              { name: 'Large Meal', extraPrice: 55 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Sides',
    imageUrl: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=400&q=80',
    products: [
      {
        name: 'World Famous Fries',
        description: "Crispy, golden and perfectly salted. McDonald's iconic fries.",
        price: 29.00,
        primaryImage: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Size',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Small', extraPrice: 0 },
              { name: 'Medium', extraPrice: 10 },
              { name: 'Large', extraPrice: 18 },
            ],
          },
        ],
      },
      {
        name: 'McNuggets',
        description: 'Tender, juicy chicken nuggets made from 100% chicken breast meat.',
        price: 59.00,
        primaryImage: 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=800&q=80',
        optionGroups: [
          {
            name: 'Pieces',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: '6 Pieces', extraPrice: 0 },
              { name: '9 Pieces', extraPrice: 25 },
              { name: '20 Pieces', extraPrice: 60 },
            ],
          },
          {
            name: 'Dipping Sauce',
            isRequired: false,
            minSelect: 0,
            maxSelect: 2,
            values: [
              { name: 'BBQ Sauce', extraPrice: 5 },
              { name: 'Sweet & Sour', extraPrice: 5 },
              { name: 'Honey Mustard', extraPrice: 5 },
              { name: 'Ranch', extraPrice: 5 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Desserts & McCafe',
    imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80',
    products: [
      {
        name: 'McFlurry',
        description: 'Creamy soft-serve swirled with your favourite topping.',
        price: 45.00,
        primaryImage: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800&q=80',
        optionGroups: [
          {
            name: 'Flavour',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Oreo', extraPrice: 0 },
              { name: 'Caramel', extraPrice: 0 },
              { name: 'Strawberry', extraPrice: 0 },
              { name: 'Kit Kat', extraPrice: 0 },
            ],
          },
          {
            name: 'Size',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Regular', extraPrice: 0 },
              { name: 'Large', extraPrice: 15 },
            ],
          },
        ],
      },
    ],
  },
];

const MORI_SUSHI_CATALOG = [
  {
    name: 'Signature Rolls',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80',
    products: [
      {
        name: 'Dragon Roll',
        description: 'Shrimp tempura inside topped with avocado slices, eel sauce and sesame.',
        price: 149.00,
        compareAtPrice: 169.00,
        primaryImage: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
          'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&q=80',
          'https://images.unsplash.com/photo-1562802378-063ec186a863?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Pieces',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: '8 pcs', extraPrice: 0 },
              { name: '16 pcs', extraPrice: 120 },
            ],
          },
          {
            name: 'Extras',
            isRequired: false,
            minSelect: 0,
            maxSelect: 3,
            values: [
              { name: 'Extra Eel Sauce', extraPrice: 10 },
              { name: 'Spicy Mayo', extraPrice: 10 },
              { name: 'Flying Fish Roe', extraPrice: 20 },
            ],
          },
        ],
      },
      {
        name: 'Rainbow Roll',
        description: 'California roll topped with assorted sashimi: tuna, salmon, yellowtail and avocado.',
        price: 179.00,
        primaryImage: 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
          'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Sauce',
            isRequired: false,
            minSelect: 0,
            maxSelect: 2,
            values: [
              { name: 'Ponzu', extraPrice: 0 },
              { name: 'Spicy Mayo', extraPrice: 5 },
              { name: 'Teriyaki', extraPrice: 5 },
            ],
          },
        ],
      },
      {
        name: 'Spider Roll',
        description: 'Soft-shell crab, cucumber, avocado, spicy mayo and masago.',
        price: 159.00,
        primaryImage: 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=800&q=80',
        optionGroups: [
          {
            name: 'Spice Level',
            isRequired: false,
            minSelect: 0,
            maxSelect: 1,
            values: [
              { name: 'Mild', extraPrice: 0 },
              { name: 'Medium', extraPrice: 0 },
              { name: 'Hot', extraPrice: 0 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Sashimi & Nigiri',
    imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&q=80',
    products: [
      {
        name: 'Salmon Sashimi',
        description: 'Premium Atlantic salmon sliced thin. Served with wasabi, ginger and soy sauce.',
        price: 129.00,
        primaryImage: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Portion',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: '5 pcs', extraPrice: 0 },
              { name: '10 pcs', extraPrice: 100 },
            ],
          },
        ],
      },
      {
        name: 'Mixed Nigiri Platter',
        description: "Chef's selection of 10 hand-pressed nigiri: tuna, salmon, yellowtail, shrimp and eel.",
        price: 199.00,
        primaryImage: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&q=80',
          'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&q=80',
        ],
      },
    ],
  },
  {
    name: 'Mains & Soups',
    imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80',
    products: [
      {
        name: 'Miso Soup',
        description: 'Traditional dashi broth with silken tofu, wakame seaweed and green onions.',
        price: 35.00,
        primaryImage: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&q=80',
        optionGroups: [
          {
            name: 'Add-ons',
            isRequired: false,
            minSelect: 0,
            maxSelect: 2,
            values: [
              { name: 'Clams', extraPrice: 20 },
              { name: 'Shrimp', extraPrice: 20 },
            ],
          },
        ],
      },
      {
        name: 'Chicken Teriyaki Don',
        description: 'Grilled chicken glazed with teriyaki sauce over steamed Japanese rice with pickled vegetables.',
        price: 119.00,
        primaryImage: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&q=80',
        optionGroups: [
          {
            name: 'Size',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Regular', extraPrice: 0 },
              { name: 'Large', extraPrice: 25 },
            ],
          },
          {
            name: 'Add-ons',
            isRequired: false,
            minSelect: 0,
            maxSelect: 2,
            values: [
              { name: 'Extra Rice', extraPrice: 15 },
              { name: 'Miso Soup', extraPrice: 35 },
              { name: 'Edamame', extraPrice: 25 },
            ],
          },
        ],
      },
    ],
  },
];

const EL_EZABY_CATALOG = [
  {
    name: 'Pain Relief & Fever',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
    products: [
      {
        name: 'Panadol Extra (24 Tablets)',
        description: 'Fast and effective relief from headache, toothache, backache, period pain and cold/flu symptoms.',
        price: 32.00,
        compareAtPrice: 38.00,
        primaryImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80',
        ],
        meta: { requiresPrescription: false, brand: 'Panadol', activeIngredient: 'Paracetamol 500mg + Caffeine 65mg' },
        optionGroups: [
          {
            name: 'Pack Size',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: '24 Tablets', extraPrice: 0 },
              { name: '48 Tablets', extraPrice: 28 },
            ],
          },
        ],
      },
      {
        name: 'Brufen 400mg (20 Tablets)',
        description: 'Ibuprofen for fast, effective relief from pain and inflammation.',
        price: 28.00,
        primaryImage: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80',
        meta: { requiresPrescription: false, brand: 'Brufen', activeIngredient: 'Ibuprofen 400mg' },
      },
      {
        name: 'Cataflam 50mg (30 Tablets)',
        description: 'Diclofenac for relief of acute pain and inflammation. Prescription required.',
        price: 55.00,
        primaryImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
        meta: { requiresPrescription: true, brand: 'Cataflam', activeIngredient: 'Diclofenac Potassium 50mg' },
      },
    ],
  },
  {
    name: 'Skincare & Beauty',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
    products: [
      {
        name: 'Neutrogena Hydro Boost Water Gel',
        description: 'Lightweight, oil-free moisturiser with hyaluronic acid. Instantly quenches skin.',
        price: 249.00,
        compareAtPrice: 289.00,
        primaryImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80',
          'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
        ],
        meta: { brand: 'Neutrogena', skinType: 'All Skin Types', requiresPrescription: false },
        optionGroups: [
          {
            name: 'Size',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: '50ml', extraPrice: 0 },
              { name: '100ml', extraPrice: 80 },
            ],
          },
        ],
      },
      {
        name: 'La Roche-Posay Anthelios SPF 50+',
        description: 'Ultra-light fluid sunscreen. Invisible, non-greasy protection against UVA & UVB rays.',
        price: 349.00,
        primaryImage: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80',
        ],
        meta: { brand: 'La Roche-Posay', spf: 50, requiresPrescription: false },
        optionGroups: [
          {
            name: 'Type',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Invisible Fluid', extraPrice: 0 },
              { name: 'Tinted Fluid', extraPrice: 30 },
              { name: 'Matte Finish', extraPrice: 20 },
            ],
          },
        ],
      },
      {
        name: 'CeraVe Moisturising Cream',
        description: 'Rich, non-greasy moisturising cream with ceramides and hyaluronic acid. Dermatologist developed.',
        price: 199.00,
        primaryImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
        meta: { brand: 'CeraVe', skinType: 'Dry to Very Dry', requiresPrescription: false },
        optionGroups: [
          {
            name: 'Size',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: '177ml', extraPrice: 0 },
              { name: '340ml', extraPrice: 80 },
              { name: '539ml', extraPrice: 150 },
            ],
          },
        ],
      },
    ],
  },
];

const SEIF_CATALOG = [
  {
    name: 'Vitamins & Supplements',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
    products: [
      {
        name: 'Centrum Adults Multivitamin (100 Tablets)',
        description: 'Complete A-to-Zinc multivitamin with 24 micronutrients. Supports energy, immunity and bone health.',
        price: 189.00,
        compareAtPrice: 220.00,
        primaryImage: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
        ],
        meta: { brand: 'Centrum', requiresPrescription: false },
        optionGroups: [
          {
            name: 'Variant',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Adults (18+)', extraPrice: 0 },
              { name: 'Adults 50+', extraPrice: 20 },
              { name: 'Women', extraPrice: 15 },
              { name: 'Men', extraPrice: 15 },
            ],
          },
        ],
      },
      {
        name: 'Vitamin C 1000mg Effervescent (20 Tablets)',
        description: 'High-dose Vitamin C for immune support. Orange flavour. Dissolve in water and drink.',
        price: 89.00,
        primaryImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
        meta: { requiresPrescription: false, activeIngredient: 'Ascorbic Acid 1000mg' },
        optionGroups: [
          {
            name: 'Flavour',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Orange', extraPrice: 0 },
              { name: 'Lemon', extraPrice: 0 },
              { name: 'Blackcurrant', extraPrice: 0 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Cold, Flu & Allergy',
    imageUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&q=80',
    products: [
      {
        name: 'Claritin 10mg (10 Tablets)',
        description: 'Non-drowsy antihistamine for 24-hour allergy relief: sneezing, runny nose, itchy eyes.',
        price: 45.00,
        primaryImage: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&q=80',
        meta: { requiresPrescription: false, activeIngredient: 'Loratadine 10mg' },
      },
      {
        name: 'Otrivin Nasal Spray',
        description: 'Fast-acting nasal decongestant. Provides relief within 2 minutes and lasts up to 10 hours.',
        price: 55.00,
        primaryImage: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800&q=80',
        meta: { requiresPrescription: false, activeIngredient: 'Xylometazoline 0.1%' },
        optionGroups: [
          {
            name: 'Strength',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: '0.05% (Children)', extraPrice: 0 },
              { name: '0.1% (Adults)', extraPrice: 0 },
            ],
          },
        ],
      },
    ],
  },
];

const CARREFOUR_CATALOG = [
  {
    name: 'Fresh Fruits & Vegetables',
    imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80',
    products: [
      {
        name: 'Banana (1kg)',
        description: 'Fresh, ripe Cavendish bananas. Naturally sweet, rich in potassium.',
        price: 19.00,
        compareAtPrice: 25.00,
        primaryImage: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&q=80',
        ],
        meta: { unit: 'kg', isOrganic: false },
      },
      {
        name: 'Royal Gala Apples (1kg)',
        description: 'Crisp and sweet Royal Gala apples. Freshly sourced and hand-selected.',
        price: 35.00,
        primaryImage: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80',
        meta: { unit: 'kg', isOrganic: false },
        optionGroups: [
          {
            name: 'Weight',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: '1 kg', extraPrice: 0 },
              { name: '2 kg', extraPrice: 35 },
              { name: '5 kg', extraPrice: 80 },
            ],
          },
        ],
      },
      {
        name: 'Cherry Tomatoes (500g)',
        description: 'Sweet, bite-size cherry tomatoes. Perfect for salads, pasta and snacking.',
        price: 29.00,
        primaryImage: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800&q=80',
        meta: { unit: 'bag', isOrganic: false },
      },
    ],
  },
  {
    name: 'Snacks & Confectionery',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80',
    products: [
      {
        name: "Lay's Classic (Large Bag)",
        description: "Thin, crunchy and perfectly salted potato crisps.",
        price: 32.00,
        primaryImage: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Flavour',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Classic Salted', extraPrice: 0 },
              { name: 'Cheese', extraPrice: 0 },
              { name: 'BBQ', extraPrice: 0 },
              { name: 'Salt & Vinegar', extraPrice: 0 },
              { name: 'Paprika', extraPrice: 0 },
            ],
          },
        ],
      },
      {
        name: 'Kitkat Chunky (40g)',
        description: 'Thick milk chocolate bar with a wafer centre.',
        price: 18.00,
        primaryImage: 'https://images.unsplash.com/photo-1581700188571-e87cdc58a71d?w=800&q=80',
        optionGroups: [
          {
            name: 'Variant',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Milk Chocolate', extraPrice: 0 },
              { name: 'Dark Chocolate', extraPrice: 2 },
              { name: 'White Chocolate', extraPrice: 2 },
              { name: 'Peanut Butter', extraPrice: 3 },
            ],
          },
        ],
      },
      {
        name: 'Oreo Original (432g)',
        description: 'The world favourite cookie. Crisp cocoa biscuit with a creamy vanilla filling.',
        price: 59.00,
        primaryImage: 'https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1581700188571-e87cdc58a71d?w=800&q=80',
        ],
      },
    ],
  },
  {
    name: 'Beverages',
    imageUrl: 'https://images.unsplash.com/photo-1497534547324-0ebb3c6d01f4?w=400&q=80',
    products: [
      {
        name: 'Coca-Cola (6 x 330ml Cans)',
        description: 'The original and iconic taste. Pack of 6 chilled cans.',
        price: 55.00,
        compareAtPrice: 65.00,
        primaryImage: 'https://images.unsplash.com/photo-1497534547324-0ebb3c6d01f4?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1561758033-7e924f619b47?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Variant',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Original', extraPrice: 0 },
              { name: 'Zero Sugar', extraPrice: 0 },
              { name: 'Diet', extraPrice: 0 },
            ],
          },
        ],
      },
      {
        name: 'Mineral Water (1.5L)',
        description: 'Pure, refreshing still mineral water.',
        price: 9.00,
        primaryImage: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=800&q=80',
        optionGroups: [
          {
            name: 'Brand',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Baraka', extraPrice: 0 },
              { name: 'Siwa', extraPrice: 2 },
              { name: 'Evian', extraPrice: 10 },
            ],
          },
        ],
      },
      {
        name: 'Nescafe 3-in-1 (20 Sticks)',
        description: 'Instant coffee with creamer and sugar in convenient single-serve sticks.',
        price: 89.00,
        primaryImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
      },
    ],
  },
];

const METRO_CATALOG = [
  {
    name: 'Bakery & Breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    products: [
      {
        name: 'Sliced White Bread (600g)',
        description: 'Soft, fluffy sliced white bread. Perfect for toasting, sandwiches and more.',
        price: 19.00,
        primaryImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
        meta: { weight: '600g' },
        optionGroups: [
          {
            name: 'Type',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'White', extraPrice: 0 },
              { name: 'Whole Wheat', extraPrice: 3 },
              { name: 'Seeded', extraPrice: 5 },
            ],
          },
        ],
      },
      {
        name: 'Free-Range Eggs (12 Pack)',
        description: 'Farm-fresh free-range eggs from happy hens. Rich golden yolks.',
        price: 65.00,
        compareAtPrice: 79.00,
        primaryImage: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Pack Size',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: '6 Eggs', extraPrice: -32 },
              { name: '12 Eggs', extraPrice: 0 },
              { name: '30 Eggs', extraPrice: 97 },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Snacks & Chips',
    imageUrl: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=400&q=80',
    products: [
      {
        name: 'Pringles Original (165g)',
        description: 'Saddle-shaped stackable crisps in the iconic Pringles tube.',
        price: 49.00,
        primaryImage: 'https://images.unsplash.com/photo-1621447504864-d8686e12698c?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Flavour',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Original', extraPrice: 0 },
              { name: 'Sour Cream & Onion', extraPrice: 0 },
              { name: 'Cheddar Cheese', extraPrice: 0 },
              { name: 'BBQ', extraPrice: 0 },
              { name: 'Hot & Spicy', extraPrice: 0 },
            ],
          },
        ],
      },
      {
        name: 'Galaxy Smooth Milk Chocolate (200g)',
        description: 'Irresistibly smooth and silky milk chocolate. A moment of pure bliss.',
        price: 55.00,
        primaryImage: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&q=80',
        meta: { brand: 'Galaxy', weight: '200g' },
      },
    ],
  },
  {
    name: 'Cold Drinks',
    imageUrl: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=400&q=80',
    products: [
      {
        name: 'Tropicana Orange Juice (1L)',
        description: '100% pure squeezed orange juice. No added sugar, no preservatives.',
        price: 65.00,
        primaryImage: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=800&q=80',
        extraImages: [
          'https://images.unsplash.com/photo-1497534547324-0ebb3c6d01f4?w=800&q=80',
        ],
        optionGroups: [
          {
            name: 'Variant',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Original (No Pulp)', extraPrice: 0 },
              { name: 'High Pulp', extraPrice: 0 },
              { name: 'Calcium & Vitamin D', extraPrice: 5 },
            ],
          },
        ],
      },
      {
        name: 'Red Bull Energy Drink (250ml)',
        description: 'Red Bull gives you wings. Contains caffeine, taurine and B-vitamins.',
        price: 45.00,
        primaryImage: 'https://images.unsplash.com/photo-1621347913009-5b14a16dc8f4?w=800&q=80',
        optionGroups: [
          {
            name: 'Variant',
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            values: [
              { name: 'Original', extraPrice: 0 },
              { name: 'Sugar Free', extraPrice: 0 },
              { name: 'Watermelon Edition', extraPrice: 5 },
              { name: 'Tropical Edition', extraPrice: 5 },
            ],
          },
        ],
      },
    ],
  },
];

const ELECTRONICS_CATALOG = [
  {
    name: 'Smartphones',
    imageUrl: 'https://img.icons8.com/fluency/256/iphone.png',
    products: [
      {
        name: 'iPhone 15 Pro Max',
        description: 'Titanium design, A17 Pro chip, 48MP main camera.',
        price: 55000.00,
        primaryImage: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=800&q=80',
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'AI features, Titanium frame, 200MP camera.',
        price: 50000.00,
        primaryImage: 'https://images.unsplash.com/photo-1707327244955-467201c10710?w=800&q=80'
      }
    ]
  },
  {
    name: 'Accessories',
    imageUrl: 'https://img.icons8.com/fluency/256/headphones.png',
    products: [
      {
        name: 'AirPods Pro 2',
        description: 'Active Noise Cancellation, Adaptive Audio.',
        price: 12000.00,
        primaryImage: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800&q=80'
      }
    ]
  }
];

const COFFEE_CATALOG = [
  {
    name: 'Espresso & Americano',
    imageUrl: 'https://img.icons8.com/fluency/256/espresso-cup.png',
    products: [
      {
        name: 'Classic Espresso',
        description: 'Rich, full-bodied espresso shot.',
        price: 45.00,
        primaryImage: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=800&q=80'
      },
      {
        name: 'Americano',
        description: 'Espresso shots topped with hot water.',
        price: 55.00,
        primaryImage: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=800&q=80'
      }
    ]
  },
  {
    name: 'Coffee Beans',
    imageUrl: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=800&q=80',
    products: [
      {
        name: 'Colombian Roast 250g',
        description: 'Medium roast whole beans from Colombia.',
        price: 350.00,
        primaryImage: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=800&q=80'
      }
    ]
  }
];

const STORE_CATALOGS = {
  'Pizza Hut':         PIZZA_HUT_CATALOG,
  'McDonalds':         MCDONALDS_CATALOG,
  'Mori Sushi':        MORI_SUSHI_CATALOG,
  'El-Ezaby Pharmacy': EL_EZABY_CATALOG,
  'Seif Pharmacies':   SEIF_CATALOG,
  'Carrefour':         CARREFOUR_CATALOG,
  'Metro Market':      METRO_CATALOG,
  'Tradeline':         ELECTRONICS_CATALOG,
  '2B Electronics':    ELECTRONICS_CATALOG,
  'Starbucks':         COFFEE_CATALOG,
  'Espresso Lab':      COFFEE_CATALOG,
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting seed process...');

  console.log('1. Clearing old data...');
  const tablenames = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations' && name !== 'spatial_ref_sys')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    if (tables.length > 0) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    }
    console.log('All tables truncated successfully.');
  } catch (error) {
    console.error('Error truncating tables, falling back to deleteMany...', error);
    await prisma.storeZone.deleteMany();
    await prisma.driverZone.deleteMany();
    await prisma.zone.deleteMany();
    await prisma.order.deleteMany().catch(() => {});
    await prisma.cart.deleteMany().catch(() => {});
    await prisma.storeSubCategory.deleteMany();
    await prisma.subCategory.deleteMany();
    await prisma.mainCategory.deleteMany();
    await prisma.store.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.user.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.ownerAccount.deleteMany();
    await prisma.city.deleteMany();
    await prisma.governorate.deleteMany();
    await prisma.country.deleteMany();
  }

  console.log('1b. Dropping tenant schemas...');
  const schemas = await prisma.$queryRaw`
    SELECT schema_name FROM information_schema.schemata
    WHERE schema_name LIKE 'store_%'
  `;
  for (const { schema_name } of schemas) {
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema_name}" CASCADE`);
    console.log(`  Dropped schema "${schema_name}"`);
  }

  console.log('2. Creating geography...');
  const country = await prisma.country.create({
    data: { name: 'Egypt', code: 'EG' }
  });
  const governorate = await prisma.governorate.create({
    data: { name: 'Cairo', countryId: country.id }
  });
  const city = await prisma.city.create({
    data: { name: 'Cairo', countryId: country.id, governorateId: governorate.id }
  });
  const cityId = city.id;

  console.log('3. Creating categories...');
  const restaurantCat = await prisma.mainCategory.create({
    data: {
      name: 'Restaurants',
      imageUrl: 'https://img.icons8.com/fluency/256/hamburger.png',
      subCategories: {
        create: [
          { name: 'Pizza', imageUrl: 'https://img.icons8.com/fluency/256/pizza.png' },
          { name: 'Burger', imageUrl: 'https://img.icons8.com/fluency/256/hamburger.png' },
          { name: 'Sushi', imageUrl: 'https://img.icons8.com/fluency/256/sushi.png' }
        ]
      }
    },
    include: { subCategories: true }
  });

  const groceryCat = await prisma.mainCategory.create({
    data: {
      name: 'Groceries',
      imageUrl: 'https://img.icons8.com/fluency/256/grocery-bag.png',
      subCategories: {
        create: [
          { name: 'Fruits & Veg', imageUrl: 'https://img.icons8.com/fluency/256/apple.png' },
          { name: 'Snacks', imageUrl: 'https://img.icons8.com/fluency/256/potato-chips.png' },
          { name: 'Beverages', imageUrl: 'https://img.icons8.com/fluency/256/soda-can.png' }
        ]
      }
    },
    include: { subCategories: true }
  });

  const pharmacyCat = await prisma.mainCategory.create({
    data: {
      name: 'Pharmacy',
      imageUrl: 'https://img.icons8.com/fluency/256/pharmacy.png',
      subCategories: {
        create: [
          { name: 'Medicine', imageUrl: 'https://img.icons8.com/fluency/256/pill.png' },
          { name: 'Skincare', imageUrl: 'https://img.icons8.com/fluency/256/cosmetic-brush.png' }
        ]
      }
    },
    include: { subCategories: true }
  });

  const coffeeCat = await prisma.mainCategory.create({
    data: {
      name: 'Coffee & Roastery',
      imageUrl: 'https://img.icons8.com/fluency/256/coffee-to-go.png',
      subCategories: {
        create: [
          { name: 'Espresso', imageUrl: 'https://img.icons8.com/fluency/256/espresso-cup.png' },
          { name: 'Coffee Beans', imageUrl: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=200&h=200&q=80' }
        ]
      }
    },
    include: { subCategories: true }
  });

  const electronicsCat = await prisma.mainCategory.create({
    data: {
      name: 'Electronics',
      imageUrl: 'https://img.icons8.com/fluency/256/mac-client.png',
      subCategories: {
        create: [
          { name: 'Smartphones', imageUrl: 'https://img.icons8.com/fluency/256/iphone.png' },
          { name: 'Accessories', imageUrl: 'https://img.icons8.com/fluency/256/headphones.png' }
        ]
      }
    },
    include: { subCategories: true }
  });

  console.log('4. Creating stores and linking subcategories...');
  const restaurantStores = [
    {
      name: 'Pizza Hut',
      mainCategoryId: restaurantCat.id,
      storeType: 'RESTAURANT',
      subCategoryIds: [restaurantCat.subCategories.find(s => s.name === 'Pizza').id],
      lat: 30.0444, lng: 31.2357,
      logoUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=200&h=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'McDonalds',
      mainCategoryId: restaurantCat.id,
      storeType: 'RESTAURANT',
      subCategoryIds: [restaurantCat.subCategories.find(s => s.name === 'Burger').id],
      lat: 30.0500, lng: 31.2400,
      logoUrl: 'https://images.unsplash.com/photo-1610440042657-612c34d95e9f?auto=format&fit=crop&w=200&h=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Mori Sushi',
      mainCategoryId: restaurantCat.id,
      storeType: 'RESTAURANT',
      subCategoryIds: [restaurantCat.subCategories.find(s => s.name === 'Sushi').id],
      lat: 30.0600, lng: 31.2500,
      logoUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=200&h=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const pharmacyStores = [
    {
      name: 'El-Ezaby Pharmacy',
      mainCategoryId: pharmacyCat.id,
      storeType: 'PHARMACY',
      subCategoryIds: [pharmacyCat.subCategories.find(s => s.name === 'Medicine').id, pharmacyCat.subCategories.find(s => s.name === 'Skincare').id],
      lat: 30.0400, lng: 31.2300,
      logoUrl: 'https://img.icons8.com/color/256/clinic.png',
      coverUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Seif Pharmacies',
      mainCategoryId: pharmacyCat.id,
      storeType: 'PHARMACY',
      subCategoryIds: [pharmacyCat.subCategories.find(s => s.name === 'Medicine').id],
      lat: 30.0550, lng: 31.2450,
      logoUrl: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=200&h=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const groceryStores = [
    {
      name: 'Carrefour',
      mainCategoryId: groceryCat.id,
      storeType: 'GROCERY',
      subCategoryIds: [groceryCat.subCategories.find(s => s.name === 'Fruits & Veg').id, groceryCat.subCategories.find(s => s.name === 'Snacks').id, groceryCat.subCategories.find(s => s.name === 'Beverages').id],
      lat: 30.0700, lng: 31.2600,
      logoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&h=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Metro Market',
      mainCategoryId: groceryCat.id,
      storeType: 'GROCERY',
      subCategoryIds: [groceryCat.subCategories.find(s => s.name === 'Snacks').id, groceryCat.subCategories.find(s => s.name === 'Beverages').id],
      lat: 30.0300, lng: 31.2200,
      logoUrl: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=200&h=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const electronicsStores = [
    {
      name: 'Tradeline',
      mainCategoryId: electronicsCat.id,
      storeType: 'ELECTRONICS',
      subCategoryIds: [electronicsCat.subCategories.find(s => s.name === 'Smartphones').id, electronicsCat.subCategories.find(s => s.name === 'Accessories').id],
      lat: 30.0650, lng: 31.2450,
      logoUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=200&h=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: '2B Electronics',
      mainCategoryId: electronicsCat.id,
      storeType: 'ELECTRONICS',
      subCategoryIds: [electronicsCat.subCategories.find(s => s.name === 'Accessories').id],
      lat: 30.0550, lng: 31.2350,
      logoUrl: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&w=200&h=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const coffeeStores = [
    {
      name: 'Starbucks',
      mainCategoryId: coffeeCat.id,
      storeType: 'COFFEE',
      subCategoryIds: [coffeeCat.subCategories.find(s => s.name === 'Espresso').id, coffeeCat.subCategories.find(s => s.name === 'Coffee Beans').id],
      lat: 30.0450, lng: 31.2250,
      logoUrl: 'https://images.unsplash.com/photo-1555507036-ab1f40ce88cb?auto=format&fit=crop&w=200&h=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Espresso Lab',
      mainCategoryId: coffeeCat.id,
      storeType: 'COFFEE',
      subCategoryIds: [coffeeCat.subCategories.find(s => s.name === 'Espresso').id],
      lat: 30.0350, lng: 31.2150,
      logoUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&h=200&q=80',
      coverUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const allStoresData = [...restaurantStores, ...pharmacyStores, ...groceryStores, ...electronicsStores, ...coffeeStores];
  const createdStores = [];

  for (const sData of allStoresData) {
    const store = await prisma.store.create({
      data: {
        name: sData.name,
        mainCategoryId: sData.mainCategoryId,
        cityId: cityId,
        storeType: sData.storeType,
        deliveryType: 'TALABAT_DELIVERY',
        logoUrl: sData.logoUrl,
        coverUrl: sData.coverUrl,
        latitude: sData.lat,
        longitude: sData.lng,
        ratingSum: Math.floor(Math.random() * 100) + 20,
        totalReviews: Math.floor(Math.random() * 20) + 5,
        averageRating: parseFloat((Math.random() * 1.5 + 3.5).toFixed(1)),
        isActive: true,
        openTime: '08:00',
        closeTime: '23:59',
        deliveryTimeMinutes: Math.floor(Math.random() * 20) + 20,
        storeCategories: {
          create: sData.subCategoryIds.map(subCatId => ({ subCategoryId: subCatId }))
        }
      }
    });
    createdStores.push({ ...store, storeName: sData.name });
  }

  console.log('5. Provisioning tenant schemas and seeding products...');
  for (const store of createdStores) {
    console.log(`  -> Provisioning schema for "${store.storeName}"...`);
    await provisionTenantSchema(store.id, store.storeType);
    const catalog = STORE_CATALOGS[store.storeName];
    if (catalog) {
      console.log(`  -> Seeding ${catalog.length} sections for "${store.storeName}"...`);
      await seedCatalog(store.id, catalog);
      console.log(`  OK Products seeded for "${store.storeName}"`);
    }
  }

  console.log('6. Creating Users, Drivers, Admin...');
  const passwordHash = await bcrypt.hash('123456', 10);

  await prisma.user.create({
    data: {
      fullName: 'Test User',
      email: 'user@test.com',
      phone: '+201234567890',
      passwordHash,
      role: 'CUSTOMER',
      isVerified: true,
      wallet: { create: { balance: 1000 } }
    }
  });

  await prisma.driver.create({
    data: {
      email: 'driver@test.com',
      phone: '+201098765432',
      passwordHash,
      cityId: cityId,
      status: 'ONLINE',
      isOnline: true,
      latitude: 30.0450,
      longitude: 31.2360,
      wallet: { create: { balance: 0 } }
    }
  });

  const adminPasswordHash = await bcrypt.hash('12345#Joe', 10);
  await prisma.admin.create({
    data: {
      fullName: 'Super Admin',
      email: 'admin@talabat.com',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
    }
  });

  console.log('7. Creating zones and linking to stores...');
  const cairoZoneId = 'zone-' + Date.now() + '-cairo';
  await prisma.$executeRawUnsafe(`
    INSERT INTO "zones" ("id", "cityId", "name", "isActive", "updatedAt", "boundary")
    VALUES (
      '${cairoZoneId}',
      '${cityId}',
      'Greater Cairo Zone',
      true,
      NOW(),
      ST_GeomFromText('POLYGON((31.2 30.0, 31.3 30.0, 31.3 30.1, 31.2 30.1, 31.2 30.0))', 4326)
    );
  `);

  for (const store of createdStores) {
    await prisma.storeZone.create({
      data: { storeId: store.id, zoneId: cairoZoneId }
    });
  }

  console.log('\nSeeding complete!');
  console.log('-----------------------------------------');
  console.log('Test Accounts:');
  console.log('  User:   user@test.com    / 123456');
  console.log('  Driver: driver@test.com  / 123456');
  console.log('  Admin:  admin@talabat.com / 12345#Joe');
  console.log('-----------------------------------------');
  console.log('Stores created:  ' + createdStores.length);
  console.log('Stores with products: ' + Object.keys(STORE_CATALOGS).length);
  console.log('-----------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
