import { Router } from 'express';
import pool from '../config/db'; // Assuming your pg pool is here

const router = Router();

router.get('/r/:slug', async (req, res) => {
    const { slug } = req.params;
    const referrer = req.get('Referrer') || 'Direct';
    const ipHash = 'hashed_ip_here'; // Use crypto to hash req.ip for privacy

    try {
        // Log the click
        await pool.query(
            `INSERT INTO affiliate_clicks (slug, referrer, ip_hash) VALUES ($1, $2, $3)`,
            [slug, referrer, ipHash]
        );
        
        // In a real scenario, fetch the actual affiliate URL from the DB based on the slug.
        // For now, redirecting to a placeholder
        const targetUrl = `https://affiliate-partner.com/?ref=${slug}`; 
        res.redirect(301, targetUrl);
    } catch (error) {
        res.status(500).json({ error: 'Tracking failed' });
    }
});

export default router;