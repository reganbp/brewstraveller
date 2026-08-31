import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getUsersCollection } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'brewstraveller_super_secret_key_123!';

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'email is required.' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'password is required.' });
    }
    if (!full_name || typeof full_name !== 'string') {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'full_name is required.' });
    }

    const usersCol = getUsersCollection();
    const existing = await usersCol.findOne({ email: email.toLowerCase() });

    if (existing) {
      return res.status(400).json({
        code: 'BAD_REQUEST',
        message: 'A user with this email address already exists.'
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = {
      id: randomUUID(),
      email: email.toLowerCase(),
      password_hash,
      full_name,
      role: 'user' as 'user' | 'admin',
      is_admin: false,
      created_at: new Date().toISOString()
    };

    await usersCol.insertOne(newUser);

    // Generate JWT access token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, is_admin: false },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      access_token: token,
      token_type: 'Bearer',
      user: {
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        role: newUser.role,
        is_admin: false,
        created_at: newUser.created_at
      }
    });
  } catch (error: any) {
    console.error('Error during user registration:', error);
    return res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred.'
    });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'email is required.' });
    }
    if (!password || typeof password !== 'string') {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'password is required.' });
    }

    const usersCol = getUsersCollection();
    const user = await usersCol.findOne({ email: email.toLowerCase() });

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT access token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, is_admin: user.is_admin || user.role === 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      access_token: token,
      token_type: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_admin: user.is_admin || user.role === 'admin',
        home_city: user.home_city || null,
        home_coordinates: user.home_coordinates || null,
        created_at: user.created_at
      }
    });
  } catch (error: any) {
    console.error('Error during user login:', error);
    return res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred.'
    });
  }
});

// PUT /auth/profile - Update user display name or home location (with auto-geocoding)
router.put('/profile', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user_id = req.user!.id;
    const { username, home_city, home_coordinates } = req.body;

    const updates: any = {};
    if (username !== undefined) {
      if (typeof username !== 'string' || !username.trim()) {
        return res.status(400).json({ code: 'BAD_REQUEST', message: 'username must be a valid string.' });
      }
      updates.full_name = username.trim();
    }

    if (home_city !== undefined) {
      if (home_city === null || home_city === '') {
        updates.home_city = null;
        updates.home_coordinates = null;
      } else {
        if (typeof home_city !== 'string') {
          return res.status(400).json({ code: 'BAD_REQUEST', message: 'home_city must be a string.' });
        }
        
        updates.home_city = home_city.trim();
        
        // Accept home_coordinates if explicitly sent from frontend (prevents extra Nominatim queries)
        if (home_coordinates && Array.isArray(home_coordinates) && home_coordinates.length === 2 && typeof home_coordinates[0] === 'number' && typeof home_coordinates[1] === 'number') {
          updates.home_coordinates = home_coordinates;
        } else {
          // Fetch GPS coordinates from Nominatim
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(home_city)}&format=json&limit=1`);
            const geoData = await geoRes.json() as any;
            if (geoData && geoData.length > 0) {
              const lat = parseFloat(geoData[0].lat);
              const lon = parseFloat(geoData[0].lon);
              updates.home_coordinates = [lon, lat];
            } else {
              return res.status(400).json({ code: 'BAD_REQUEST', message: `Could not geocode home location: ${home_city}` });
            }
          } catch (geoErr) {
            console.warn('Nominatim geocoding failed:', geoErr);
          }
        }
      }
    }

    const usersCol = getUsersCollection();
    
    if (Object.keys(updates).length > 0) {
      await usersCol.updateOne({ id: user_id }, { $set: updates });
    }

    const updatedUser = await usersCol.findOne({ id: user_id });
    if (!updatedUser) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found.' });
    }

    // Return profile matching OpenAPI User schema (no password_hash)
    return res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      full_name: updatedUser.full_name,
      role: updatedUser.role,
      is_admin: updatedUser.is_admin || updatedUser.role === 'admin',
      home_city: updatedUser.home_city || null,
      home_coordinates: updatedUser.home_coordinates || null,
      created_at: updatedUser.created_at
    });

  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred.'
    });
  }
});

// POST /auth/reset-password - Simplified password reset flow (Test App Mode)
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { username, new_password } = req.body;

    if (!username || typeof username !== 'string' || !username.trim()) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'username is required.' });
    }
    if (!new_password || typeof new_password !== 'string' || !new_password.trim()) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'new_password is required.' });
    }

    const usersCol = getUsersCollection();
    const queryStr = username.trim().toLowerCase();
    
    // Look up by email (primary username) or full_name (fallback username)
    const user = await usersCol.findOne({
      $or: [
        { email: queryStr },
        { full_name: username.trim() }
      ]
    });

    if (!user) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'User not found.'
      });
    }

    const password_hash = await bcrypt.hash(new_password.trim(), 10);
    await usersCol.updateOne({ id: user.id }, { $set: { password_hash } });

    return res.json({ message: 'Password updated successfully.' });

  } catch (error: any) {
    console.error('Error resetting password:', error);
    return res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred.'
    });
  }
});

export default router;
