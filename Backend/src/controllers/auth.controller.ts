// auth.controller.js
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import * as jwtWebToken from 'jsonwebtoken';
import { pool } from '../config/db';

const generateTokens = (userId: number, role: string) => {
    const accessToken = jwtWebToken.sign({ userId, role }, process.env.JWT_SECRET as string, { expiresIn: '15m' });
    const refreshToken = jwtWebToken.sign({ userId, role }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response): Promise<any> => {
    try {
        const { name, email, password } = req.body;

        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) return res.status(400).json({ error: 'Email already registered'});

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
            [name, email, hashedPassword]
        );
        res.status(201).json({ message: "User registered successfully!", user: newUser.rows[0]});
    } catch (err) {
        console.error('Register Error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
};

export const login = async (req: Request, res: Response): Promise<any> => {
    try{
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid Credentials' });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Invalid Credentials' });

        const { accessToken, refreshToken } = generateTokens(user.id, user.role);

        // Send refresh token in httpOnly cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'PRODUCTION',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// 🔒 User Logout
export const logout = (req: Request, res: Response) => {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
};