import { Router } from 'express';
import cloudinary, { UPLOAD_FOLDER } from '../config/cloudinary.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/uploads/signature
 * Returns a short-lived signature so the browser can upload DIRECTLY to
 * Cloudinary without ever seeing the API secret.
 * body: { kind: 'resume' | 'jd' | 'proof' | 'avatar' }
 */
router.post('/signature', requireAuth, (req, res) => {
  try {
    const kind = ['resume', 'jd', 'proof', 'avatar'].includes(req.body?.kind)
      ? req.body.kind
      : 'misc';

    const timestamp = Math.round(Date.now() / 1000);
    // Scope each user's files under their own uid for tidiness + traceability
    const folder = `${UPLOAD_FOLDER}/${kind}/${req.user.id}`;

    const paramsToSign = { timestamp, folder };
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      signature,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (err) {
    console.error('[uploads] signature error', err);
    res.status(500).json({ error: 'Could not create upload signature' });
  }
});

export default router;
