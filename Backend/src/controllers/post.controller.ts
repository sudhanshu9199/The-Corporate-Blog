import { Request, Response } from "express";
import { pool } from "../config/db";
import slugify from "slugify";

export const createPost = async (req: Request, res: Response): Promise<any> => {
    try {
        // Hum yahan posts insert karne ka logic daalenge baad mein
        res.status(200).json({ message: "Post creation endpoint is ready to be built! 🚀" });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({ error: 'Server Error' });
    }
};