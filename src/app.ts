import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { verifyToken, register, login, closePrisma } from './auth';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

interface Task {
  id: string;
  title: string;
  completed: boolean;
  userId: string;
  createdAt: Date;
}

interface ErrorResponse {
  error: string;
  status: number;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ============ AUTH ROUTES ============
app.post('/auth/register', register);
app.post('/auth/login', login);

// ============ PROTECTED TASK ROUTES ============
// All routes below require valid JWT token

// GET /tasks - Get all tasks for authenticated user
app.get('/tasks', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const tasks = await prisma.task.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /tasks - Create new task for authenticated user
app.post('/tasks', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { title } = req.body as { title: string };

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        userId: req.user.id
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(400).json({ error: 'Failed to create task' });
  }
});

// PUT /tasks/:id - Update task (toggle completed)
app.put('/tasks/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;

    // Verify task belongs to user
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (task.userId !== req.user.id) {
      res.status(403).json({ error: 'Not authorized to update this task' });
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { completed: !task.completed }
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /tasks/:id - Delete task
app.delete('/tasks/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { id } = req.params;

    // Verify task belongs to user
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (task.userId !== req.user.id) {
      res.status(403).json({ error: 'Not authorized to delete this task' });
      return;
    }

    await prisma.task.delete({ where: { id } });

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response): void => {
  res.json({ status: 'ok' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Task Manager API running at http://localhost:${PORT}`);
  console.log(`\n📚 API Endpoints:`);
  console.log(`  🔐 POST   http://localhost:${PORT}/auth/register`);
  console.log(`  🔓 POST   http://localhost:${PORT}/auth/login`);
  console.log(`  📝 GET    http://localhost:${PORT}/tasks (protected)`);
  console.log(`  ✏️  POST   http://localhost:${PORT}/tasks (protected)`);
  console.log(`  🔄 PUT    http://localhost:${PORT}/tasks/:id (protected)`);
  console.log(`  🗑️  DELETE http://localhost:${PORT}/tasks/:id (protected)`);
  console.log(`  ❤️  GET    http://localhost:${PORT}/health\n`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  server.close(async () => {
    await closePrisma();
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  server.close(async () => {
    await closePrisma();
    console.log('Server closed');
    process.exit(0);
  });
});
