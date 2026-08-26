import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getUsersCollection } from '../db';

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
      created_at: new Date().toISOString()
    };

    await usersCol.insertOne(newUser);

    // Generate JWT access token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
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
      { id: user.id, email: user.email, role: user.role },
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

export default router;
