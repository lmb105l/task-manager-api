import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
let tasks: any[] = []; 

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/tasks', (req, res) => {
  const { title } = req.body;
  const task = {
    id: Date.now().toString(),
    title,
    completed: false,
    createdAt: new Date()
  };
  tasks.push(task);
  res.json(task);
});

app.put('/tasks/:id', (req, res) => {
  const id = req.params.id;
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    res.json(task);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.delete('/tasks/:id', (req, res) => {
  const id = req.params.id;
  tasks = tasks.filter(t => t.id !== id);
  res.json({ message: 'Task deleted' });
});

app.listen(3000, () => {
  console.log('🚀 Task Manager API: http://localhost:3000/tasks');
});
