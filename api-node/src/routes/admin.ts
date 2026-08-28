import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import {
  getUsersCollection,
  getBreweriesCollection,
  getCheckInsCollection,
  getTripsCollection
} from '../db';

const router = Router();

// Middleware: Verify JWT and verify administrator role status
const adminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user as any;
  if (!user || (user.role !== 'admin' && !user.is_admin)) {
    res.status(403).json({
      code: 'FORBIDDEN',
      message: 'Access denied. Administrator privileges required.'
    });
    return;
  }
  next();
};

// Helper to resolve MongoDB collections dynamically by string parameter
function getCollectionByName(name: string) {
  switch (name.trim().toLowerCase()) {
    case 'users':
      return getUsersCollection();
    case 'breweries':
      return getBreweriesCollection();
    case 'checkins':
      return getCheckInsCollection();
    case 'trips':
      return getTripsCollection();
    default:
      return null;
  }
}

// GET /admin/collections/:collection - Retrieve, search, and paginate collection documents
router.get('/collections/:collection', authMiddleware as any, adminMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { collection } = req.params;
    const { q, limit = '20', skip = '0' } = req.query;

    const col = getCollectionByName(collection);
    if (!col) {
      return res.status(400).json({
        code: 'BAD_REQUEST',
        message: `Invalid collection name: '${collection}'. Available: users, breweries, checkins, trips.`
      });
    }

    const query: any = {};
    const searchStr = q ? String(q).trim() : '';

    if (searchStr) {
      const regex = { $regex: searchStr, $options: 'i' };
      
      switch (collection.toLowerCase()) {
        case 'users':
          query.$or = [{ email: regex }, { full_name: regex }, { id: regex }];
          break;
        case 'breweries':
          query.$or = [{ name: regex }, { city: regex }, { state: regex }, { id: regex }];
          break;
        case 'checkins':
          query.$or = [{ notes: regex }, { trip_name: regex }, { id: regex }];
          break;
        case 'trips':
          query.$or = [{ name: regex }, { description: regex }, { id: regex }];
          break;
      }
    }

    const limitVal = parseInt(limit as string, 10);
    const skipVal = parseInt(skip as string, 10);

    const data = await col
      .find(query, { projection: { password_hash: 0 } }) // Always exclude password hashes
      .skip(skipVal)
      .limit(limitVal)
      .toArray();

    const total = await col.countDocuments(query);

    return res.json({
      collection,
      data,
      total,
      limit: limitVal,
      skip: skipVal
    });

  } catch (error: any) {
    console.error('Admin GET collection error:', error);
    return res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred.'
    });
  }
});

// PUT /admin/collections/:collection/:id - Update dynamic document fields
router.put('/collections/:collection/:id', authMiddleware as any, adminMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { collection, id } = req.params;
    const fieldsToSet = req.body;

    const col = getCollectionByName(collection);
    if (!col) {
      return res.status(400).json({
        code: 'BAD_REQUEST',
        message: `Invalid collection name: '${collection}'.`
      });
    }

    const existing = await col.findOne({ id });
    if (!existing) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: `Document with ID '${id}' not found in '${collection}'.`
      });
    }

    // Safety checks: strip immutable parameters
    const safeUpdates = { ...fieldsToSet };
    delete safeUpdates._id;
    delete safeUpdates.id;
    delete safeUpdates.password_hash; // never let json updates alter hashes directly here

    // Normalise role attributes if is_admin is toggled
    if (collection === 'users' && safeUpdates.is_admin !== undefined) {
      safeUpdates.role = safeUpdates.is_admin ? 'admin' : 'user';
    }

    await col.updateOne({ id }, { $set: safeUpdates });

    const updated = await col.findOne({ id }, { projection: { password_hash: 0 } });
    return res.json(updated);

  } catch (error: any) {
    console.error('Admin PUT document error:', error);
    return res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred.'
    });
  }
});

// DELETE /admin/collections/:collection/:id - Purge dynamic document record from MongoDB
router.delete('/collections/:collection/:id', authMiddleware as any, adminMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { collection, id } = req.params;

    const col = getCollectionByName(collection);
    if (!col) {
      return res.status(400).json({
        code: 'BAD_REQUEST',
        message: `Invalid collection name: '${collection}'.`
      });
    }

    const existing = await col.findOne({ id });
    if (!existing) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: `Document with ID '${id}' not found in '${collection}'.`
      });
    }

    // Prevent self-deletion
    if (collection === 'users' && id === req.user!.id) {
      return res.status(400).json({
        code: 'BAD_REQUEST',
        message: 'Self-deletion of administrator credentials is strictly prohibited.'
      });
    }

    await col.deleteOne({ id });

    return res.json({
      message: `Document with ID '${id}' successfully purged from collection '${collection}'.`
    });

  } catch (error: any) {
    console.error('Admin DELETE document error:', error);
    return res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred.'
    });
  }
});

export default router;
