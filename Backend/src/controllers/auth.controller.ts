// auth.controller.js
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jwt-simple';
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

        const userExists = await pool.query('SELECT * FROOM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) return res.status(400).json({ error: 'Email already registered'});

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'I'
        )
    } catch (err) {
        
    }
}