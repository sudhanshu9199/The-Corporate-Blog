// auth.controller.js
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { queryDb } from '../config/db';
import { OAuth2Client } from 'google-auth-library';

const BCRYPT_ROUNDS = 12;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const clientId = process.env.GOOGLE_CLIENT_ID;

const generateTokens = (userId: number, role: string) => {
    const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET as string,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { userId, role },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const existing = await queryDb('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      // Generic message to prevent user enumeration
      return res.status(400).json({ success: false, error: 'Invalid registration details' });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await queryDb(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name, email, hashedPassword]
    );

    return res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const result = await queryDb('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    // Unified message prevents user enumeration
    const invalidMsg = { success: false, error: 'Invalid credentials' };
    if (!user) return res.status(401).json(invalidMsg);

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json(invalidMsg);

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    setRefreshCookie(res, refreshToken);

    return res.json({
      success: true,
      accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
};

export const googleLogin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { credential } = req.body;

    if (!clientId) {
  return res.status(500).json({ error: "Google Client ID is missing in env variables" });
}

const ticket = await googleClient.verifyIdToken({
  idToken: credential,
  audience: clientId, // Ab yeh completely error-free hai
});

const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(400).json({ success: false, error: 'Invalid Google token' });
    }

    const { email, name } = payload;

    let userResult = await queryDb('SELECT * FROM users WHERE email = $1', [email]);
    let user = userResult.rows[0];

    if (!user) {
      // null password_hash — Google users never do password auth
      const insertResult = await queryDb(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, NULL, 'author') RETURNING *`,
        [name, email]
      );
      user = insertResult.rows[0];
    }

    // Same access + refresh token pattern as regular login
    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    setRefreshCookie(res, refreshToken);

    return res.json({
      success: true,
      accessToken,                    // ← consistent key with /login
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('[Google Auth Error]', err);
    return res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};