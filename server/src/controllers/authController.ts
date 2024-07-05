import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = async (req: Request, res: Response) => {
    const { email, password, confirmPassword } = req.body;

    console.log('Received data:', { email, password, confirmPassword });

    if (!email || !password || !confirmPassword) {
        console.log('Missing fields');
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    if (password !== confirmPassword) {
        console.log('Passwords do not match');
        return res.status(400).json({ msg: 'Passwords do not match' });
    }

    try {
        let user = await User.findOne({ email });

        if (user) {
            console.log('User already exists');
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({ email, password });

        await user.save();

        const payload = {
            user: {
                id: user.id,
            },
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET!, {
            expiresIn: '1h',
        });

        console.log('User registered successfully');
        res.status(201).json({ token });
    } catch (err: any) {
        console.error('Error during registration:', err.message);
        res.status(500).send('Server error');
    }
};


export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id,
            },
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET!, {
            expiresIn: '1h',
        });

        res.json({ token });
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error(err.message);
            res.status(500).send('Server error');
        } else {
            console.error('Unexpected error', err);
            res.status(500).send('Unexpected error');
        }
    }
};
