process.env.NODE_ENV = 'test';

const chai = require('chai');
const request = require('supertest');

const app = require('../src/app');
const { setupTestDB, teardownDB, clearCollections } = require('./db');

const { expect } = chai;

let authToken;

async function registerUser() {
  const res = await request(app)
    .post('/api/users/register')
    .send({ name: 'Task User', email: 'task@example.com', password: 'password123' });
  authToken = res.body.token;
}

describe('Task API', function () {
  before(async function () {
    await setupTestDB();
  });

  beforeEach(async function () {
    await clearCollections();
    await registerUser();
  });

  after(async function () {
    await teardownDB();
  });

  describe('POST /api/tasks', function () {
    it('should create a task for an authenticated user', async function () {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'First task', priority: 'high', tags: ['work'] });

      expect(res.status).to.equal(201);
      expect(res.body.data.title).to.equal('First task');
      expect(res.body.data.user).to.be.a('string');
    });

    it('should require a title', async function () {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ priority: 'high' });

      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/tasks', function () {
    it('should list tasks for the user only', async function () {
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Task A' });

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.length(1);
      expect(res.body.pagination.total).to.equal(1);
    });

    it('should filter tasks by status', async function () {
      const created = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Do it now' });

      await request(app)
        .patch(`/api/tasks/${created.body.data._id}/complete`)
        .set('Authorization', `Bearer ${authToken}`);

      const res = await request(app)
        .get('/api/tasks?status=pending')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.body.data).to.have.length(0);

      const done = await request(app)
        .get('/api/tasks?status=completed')
        .set('Authorization', `Bearer ${authToken}`);

      expect(done.body.data).to.have.length(1);
    });
  });

  describe('GET /api/tasks/:id', function () {
    it('should fetch a single task', async function () {
      const created = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Fetch me' });

      const res = await request(app)
        .get(`/api/tasks/${created.body.data._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.title).to.equal('Fetch me');
    });

    it('should return 404 for a missing task', async function () {
      const res = await request(app)
        .get('/api/tasks/000000000000000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).to.equal(404);
    });
  });

  describe('PATCH /api/tasks/:id', function () {
    it('should update fields on a task', async function () {
      const created = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Rename me', status: 'pending' });

      const res = await request(app)
        .patch(`/api/tasks/${created.body.data._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Renamed', status: 'in-progress', priority: 'urgent' });

      expect(res.status).to.equal(200);
      expect(res.body.data.title).to.equal('Renamed');
      expect(res.body.data.status).to.equal('in-progress');
    });
  });

  describe('DELETE /api/tasks/:id', function () {
    it('should delete a task', async function () {
      const created = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Delete me' });

      const res = await request(app)
        .delete(`/api/tasks/${created.body.data._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).to.equal(200);

      const list = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(list.body.data).to.have.length(0);
    });
  });

  describe('GET /api/tasks/stats', function () {
    it('should return status counts', async function () {
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Pending task' });

      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Another pending task' });

      const res = await request(app)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).to.equal(200);
      expect(res.body.data.pending).to.equal(2);
      expect(res.body.data.total).to.equal(2);
    });
  });
});