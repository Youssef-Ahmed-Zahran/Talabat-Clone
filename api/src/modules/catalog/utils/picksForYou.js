import { tenantQuery } from "../../../lib/tenantDb.js";
import { cache } from "../../../lib/cache.js";

export const syncPicksForYou = async (storeId) => {
    try {
        // 1. Find the "Picks for you" section
        const [section] = await tenantQuery(storeId, `SELECT id FROM store_sections WHERE name = 'Picks for you' LIMIT 1`);
        if (!section) return;
        const picksSectionId = section.id;

        // 2. Get top 6 selling product IDs
        const bestSellers = await tenantQuery(storeId, `
            SELECT product_id, SUM(quantity) as total_sold
            FROM order_items
            WHERE product_id IS NOT NULL
            GROUP BY product_id
            ORDER BY total_sold DESC
            LIMIT 6
        `);
        const bestSellerIds = bestSellers.map(r => r.product_id);

        if (bestSellerIds.length > 0) {
            // 3. Add best sellers to picks section (if not excluded)
            for (const pid of bestSellerIds) {
                const [p] = await tenantQuery(storeId, `SELECT meta FROM products WHERE id = $1`, [pid]);
                if (!p) continue;
                const meta = p.meta || {};
                const secIds = meta.secondarySectionIds || [];
                
                if (!secIds.includes(picksSectionId) && meta.excludedFromPicks !== true) {
                    secIds.push(picksSectionId);
                    const newMeta = { ...meta, secondarySectionIds: secIds };
                    await tenantQuery(storeId, `UPDATE products SET meta = $1 WHERE id = $2`, [newMeta, pid]);
                }
            }
            
            // 4. Remove products that are no longer best sellers (unless manually added)
            const productsInPicks = await tenantQuery(storeId, `
                SELECT id, meta FROM products 
                WHERE meta->'secondarySectionIds' ? $1
            `, [picksSectionId]);

            for (const p of productsInPicks) {
                const isBestSeller = bestSellerIds.includes(p.id);
                const manuallyAdded = p.meta?.manuallyAddedToPicks === true;
                
                if (!isBestSeller && !manuallyAdded) {
                    // Remove it
                    const newSec = (p.meta?.secondarySectionIds || []).filter(id => id !== picksSectionId);
                    const newMeta = { ...p.meta, secondarySectionIds: newSec };
                    await tenantQuery(storeId, `UPDATE products SET meta = $1 WHERE id = $2`, [newMeta, p.id]);
                }
            }
        }

        // 5. Invalidate cache
        await cache.del(`catalog:sections:store_${storeId}`);
    } catch (err) {
        console.error(`[syncPicksForYou] Failed for store ${storeId}:`, err);
    }
};
