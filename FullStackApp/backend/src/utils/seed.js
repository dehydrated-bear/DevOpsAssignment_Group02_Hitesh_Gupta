require('dotenv').config();

const connectDB = require('../config/db');
const User = require('../models/User');
const Task = require('../models/Task');

const sampleUsers = [
  { name: 'Harshit Demo', email: 'harshit@example.com', password: 'password123', role: 'admin' },
  { name: 'Dev User', email: 'dev@example.com', password: 'password123', role: 'user' }
];

const sampleTasks = [
  {
    title: 'Complete Dockerfile for backend',
    description: 'Multi-stage build to keep the image size small and cached layers efficient.',
    status: 'in-progress',
    priority: 'high',
    tags: ['docker', 'devops']
  },
  {
    title: 'Write docker-compose configuration',
    description: 'Wire up backend, frontend, and MongoDB with health checks and named volumes.',
    status: 'pending',
    priority: 'urgent',
    tags: ['devops', 'infra']
  },
  {
    title: 'Add CI pipeline to GitHub Actions',
    description: 'Lint, test, build images and push on every pull request.',
    status: 'completed',
    priority: 'medium',
    tags: ['ci', 'automation']
  },
  {
    title: 'Prepare demo for the assignment review',
    description: 'Show live dockerized app with a short walkthrough of the architecture.',
    status: 'pending',
    priority: 'low',
    tags: ['demo', 'presentation']
  }
];

async function seed() {
  try {
    await connectDB();

    await Promise.all([
      User.deleteMany({}),
      Task.deleteMany({})
    ]);

    const users = await User.insertMany(sampleUsers);
    console.log(`[seed] Created ${users.length} users`);

    const tasks = await Promise.all(
      sampleTasks.map((task, index) =>
        Task.create({
          ...task,
          user: users[index % users.length]._id
        })
      )
    );
    console.log(`[seed] Created ${tasks.length} tasks`);

    console.log('[seed] Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('[seed] Seed failed:', error);
    process.exit(1);
  }
}

seed();