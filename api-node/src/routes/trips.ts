import { Router, Response } from 'express';
import { getTripsCollection, getCheckInsCollection } from '../db';
import { randomUUID } from 'crypto';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /trips - Retrieve all trips for the authenticated user
router.get('/', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const trips = await getTripsCollection()
      .find({ user_id }, { projection: { _id: 0 } })
      .toArray();

    return res.json(trips);
  } catch (error: any) {
    console.error('Error fetching trips:', error);
    return res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred.'
    });
  }
});

// POST /trips - Create a new trip itinerary shell/plan
router.post('/', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const { name, description, planned_brewery_ids } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        code: 'BAD_REQUEST',
        message: 'Trip name is required.'
      });
    }

    const tripsCol = getTripsCollection();

    // Check if trip with this name already exists for the user
    const existing = await tripsCol.findOne({ user_id, name: name.trim() });
    if (existing) {
      return res.status(400).json({
        code: 'BAD_REQUEST',
        message: `A trip named "${name.trim()}" already exists.`
      });
    }

    const newTrip = {
      id: randomUUID(),
      user_id,
      name: name.trim(),
      description: description || null,
      planned_brewery_ids: Array.isArray(planned_brewery_ids) ? planned_brewery_ids : [],
      created_at: new Date().toISOString()
    };

    await tripsCol.insertOne(newTrip);

    const { _id, ...responseBody } = newTrip as any;
    return res.status(201).json(responseBody);
  } catch (error: any) {
    console.error('Error creating trip:', error);
    return res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred.'
    });
  }
});

// PUT /trips/:id - Update an existing trip (rename or modify planned stops)
router.put('/:id', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    const user_id = req.user!.id;
    const { name, description, planned_brewery_ids } = req.body;

    const tripsCol = getTripsCollection();
    const existing = await tripsCol.findOne({ id, user_id });

    if (!existing) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: `Trip with ID ${id} not found.`
      });
    }

    const updates: any = {};
    const oldName = existing.name;

    if (description !== undefined) {
      updates.description = description || null;
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          code: 'BAD_REQUEST',
          message: 'Trip name must be a valid string.'
        });
      }
      const newName = name.trim();
      
      // Prevent duplicate names
      if (newName !== oldName) {
        const dup = await tripsCol.findOne({ user_id, name: newName });
        if (dup) {
          return res.status(400).json({
            code: 'BAD_REQUEST',
            message: `A trip named "${newName}" already exists.`
          });
        }
      }
      updates.name = newName;
    }

    if (planned_brewery_ids !== undefined) {
      if (!Array.isArray(planned_brewery_ids)) {
        return res.status(400).json({
          code: 'BAD_REQUEST',
          message: 'planned_brewery_ids must be an array of string IDs.'
        });
      }
      updates.planned_brewery_ids = planned_brewery_ids;
    }

    if (Object.keys(updates).length > 0) {
      await tripsCol.updateOne({ id, user_id }, { $set: updates });

      // If the trip is renamed, cascade rename all linked check-ins' trip_names
      if (updates.name && updates.name !== oldName) {
        await getCheckInsCollection().updateMany(
          { user_id, trip_name: oldName },
          { $set: { trip_name: updates.name } }
        );
      }
    }

    const updated = await tripsCol.findOne({ id, user_id }, { projection: { _id: 0 } });
    return res.json(updated);
  } catch (error: any) {
    console.error('Error updating trip:', error);
    return res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred.'
    });
  }
});

// DELETE /trips/:id - Delete a trip itinerary (unlinks associated check-ins)
router.delete('/:id', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    const user_id = req.user!.id;

    const tripsCol = getTripsCollection();
    const existing = await tripsCol.findOne({ id, user_id });

    if (!existing) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: `Trip with ID ${id} not found.`
      });
    }

    // Unlink any associated check-ins
    await getCheckInsCollection().updateMany(
      { user_id, trip_name: existing.name },
      { $set: { trip_name: null } }
    );

    // Delete the trip
    await tripsCol.deleteOne({ id, user_id });

    return res.json({
      message: `Trip "${existing.name}" successfully deleted and associated check-ins disassociated.`
    });
  } catch (error: any) {
    console.error('Error deleting trip:', error);
    return res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred.'
    });
  }
});

export default router;
