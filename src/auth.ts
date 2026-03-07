import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Extend Express Request to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET! || 'your-secret-key-change-this';
const JWT_EXPIRY = process.env.JWT_EXPIRY! || '7d';

interface RegisterRequest {
  email?: string;
  password?: string;
}

interface LoginRequest {
  email?: string;
  password?: string;
}

interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * JWT Middleware - Verify token from Authorization header
 * Usage: app.use('/tasks', verifyToken);
 */
export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid authorization header' });
      return;
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Attach user to request for use in route handlers
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * POST /auth/register
 * Create new user account with email and password
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as RegisterRequest;

    // Validation
    if (!email || !email.trim()) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      } as JWTPayload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY } as SignOptions
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * POST /auth/login
 * Authenticate user and return JWT token
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      } as JWTPayload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY } as SignOptions
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Cleanup Prisma connection
 */
export const closePrisma = async (): Promise<void> => {
  await prisma.$disconnect();
};
