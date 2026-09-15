process.env.NODE_ENV = 'test';

const chai = require('chai');
const request = require('supertest');

const app = require('../src/app');
const User = require('../src/models/User');
const { setupTestDB, teardownDB, clearCollections } = require('./db');

const { expect } = chai;

describe('User API', function () {
  before(async function () {
    await setupTestDB();
  });

  beforeEach(async function () {
    await clearCollections();
  });

  after(async function () {
    await teardownDB();
  });

  describe('POST /api/users/register', function () {
    it('should register a new user and return a token', async function () {
      const res = await request(app)
        .post('/api/users/register')
        .send({ name: 'Test User', email: 'test@example.com', password: 'password123' });

      expect(res.status).to.equal(201);
      expect(res.body.success).to.be.true;
      expect(res.body).to.have.property('token');
      expect(res.body.user).to.have.property('email', 'test@example.com');
      expect(res.body.user).to.not.have.property('password');
    });

    it('should reject duplicate email registration', async function () {
      const payload = { name: 'Test User', email: 'dup@example.com', password: 'password123' };
      await request(app).post('/api/users/register').send(payload);

      const res = await request(app).post('/api/users/register').send(payload);
      expect(res.status).to.equal(409);
      expect(res.body.success).to.be.false;
    });

    it('should require all fields', async function () {
      const res = await request(app).post('/api/users/register').send({ email: 'no@name.com' });
      expect(res.status).to.equal(400);
    });
  });

  describe('POST /api/users/login', function () {
    it('should log in a registered user', async function () {
      const payload = { name: 'Login User', email: 'login@example.com', password: 'password123' };
      await request(app).post('/api/users/register').send(payload);

      const res = await request(app)
        .post('/api/users/login')
        .send({ email: 'login@example.com', password: 'password123' });

      expect(res.status).to.equal(200);
      expect(res.body.token).to.be.a('string');
    });

    it('should reject invalid credentials', async function () {
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: 'who@example.com', password: 'wrongpass' });

      expect(res.status).to.equal(401);
    });
  });

  describe('GET /api/users/me', function () {
    it('should return the profile when authenticated', async function () {
      const reg = await request(app)
        .post('/api/users/register')
        .send({ name: 'Me User', email: 'me@example.com', password: 'password123' });

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${reg.body.token}`);

      expect(res.status).to.equal(200);
      expect(res.body.user.email).to.equal('me@example.com');
    });

    it('should reject requests without a token', async function () {
      const res = await request(app).get('/api/users/me');
      expect(res.status).to.equal(401);
    });
  });

  describe('PATCH /api/users/password', function () {
    it('should change password with correct current password', async function () {
      const reg = await request(app)
        .post('/api/users/register')
        .send({ name: 'Pw User', email: 'pw@example.com', password: 'password123' });

      const res = await request(app)
        .patch('/api/users/password')
        .set('Authorization', `Bearer ${reg.body.token}`)
        .send({ currentPassword: 'password123', newPassword: 'newpassword123' });

      expect(res.status).to.equal(200);
      expect(res.body.message).to.include('updated');

      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ email: 'pw@example.com', password: 'newpassword123' });

      expect(loginRes.status).to.equal(200);
    });

    it('should reject wrong current password', async function () {
      const reg = await request(app)
        .post('/api/users/register')
        .send({ name: 'Wrong User', email: 'wrong@example.com', password: 'password123' });

      const res = await request(app)
        .patch('/api/users/password')
        .set('Authorization', `Bearer ${reg.body.token}`)
        .send({ currentPassword: 'nope', newPassword: 'newpassword123' });

      expect(res.status).to.equal(401);
    });
  });

  describe('User model helpers', function () {
    it('hashes passwords on save and compares correctly', async function () {
      const user = await User.create({
        name: 'Hash User',
        email: 'hash@example.com',
        password: 'password123'
      });

      expect(user.password).to.not.equal('password123');
      const found = await User.findByEmail('HASH@example.com');
      expect(await found.comparePassword('password123')).to.be.true;
      expect(await found.comparePassword('wrong')).to.be.false;
    });
  });
});