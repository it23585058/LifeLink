const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

let mongod;
let app;
let Donor;
let Recipient;
let BloodRequest;

test.before(async () => {
  process.env.JWT_SECRET = 'role-auth-test-secret';
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_DB_NAME = 'LifeLinkRoleAuthTest';
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  Donor = require('../src/models/donor.model');
  Recipient = require('../src/models/recipient.model');
  BloodRequest = require('../src/models/blood-request.model');
  app = require('../src/app');
});

test.after(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

test.beforeEach(async () => {
  await Donor.deleteMany({});
  await Recipient.deleteMany({});
  await BloodRequest.deleteMany({});
});

test('donor profile requires a valid donor JWT and returns the own profile', async () => {
  const donor = await Donor.create({
    name: 'Test Donor',
    bloodGroup: 'A+',
    phone: '0710000000',
    city: 'Colombo',
    nic: '900000000V',
    password: 'password123',
  });
  const token = jwt.sign({ id: donor._id, role: 'donor' }, process.env.JWT_SECRET);

  const response = await request(app)
    .get(`/api/donors/${donor._id}`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body._id.toString(), donor._id.toString());
  assert.equal(response.body.password, undefined);
});

test('missing donor IDs and cross-role donor access are rejected', async () => {
  const donor = await Donor.create({
    name: 'Donor',
    bloodGroup: 'O+',
    phone: '0711111111',
    city: 'Colombo',
    nic: '910000000V',
    password: 'password123',
  });
  const donorToken = jwt.sign({ id: donor._id, role: 'donor' }, process.env.JWT_SECRET);
  const invalid = await request(app)
    .get('/api/donors/not-an-object-id')
    .set('Authorization', `Bearer ${donorToken}`);
  const absent = await request(app)
    .get(`/api/donors/${new mongoose.Types.ObjectId()}`)
    .set('Authorization', `Bearer ${donorToken}`);
  assert.equal(invalid.status, 400);
  assert.equal(absent.status, 404);

  const recipient = await Recipient.create({
    name: 'Recipient',
    phone: '0720000000',
    city: 'Kandy',
    email: 'recipient@example.com',
    password: 'password123',
  });
  const recipientToken = jwt.sign({ id: recipient._id, role: 'recipient' }, process.env.JWT_SECRET);

  const missing = await request(app)
    .get(`/api/donors/${new mongoose.Types.ObjectId()}`)
    .set('Authorization', `Bearer ${recipientToken}`);
  const crossRole = await request(app)
    .get(`/api/donors/${new mongoose.Types.ObjectId()}`)
    .set('Authorization', `Bearer ${recipientToken}`);

  assert.equal(missing.status, 403);
  assert.equal(crossRole.status, 403);
});

test('recipient registration, profile retrieval, and update use JWT ownership', async () => {
  const registration = await request(app).post('/api/auth/recipients/register').send({
    name: 'New Recipient',
    phone: '0730000000',
    city: 'Galle',
    email: 'new.recipient@example.com',
    password: 'password123',
  });

  assert.equal(registration.status, 201);
  assert.ok(registration.body.token);
  assert.equal(registration.body.recipient.password, undefined);

  const login = await request(app).post('/api/auth/recipients/login').send({
    email: 'NEW.RECIPIENT@example.com',
    password: 'password123',
  });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);

  const profile = await request(app)
    .get('/api/auth/recipients/me')
    .set('Authorization', `Bearer ${registration.body.token}`);
  assert.equal(profile.status, 200);
  assert.equal(profile.body.email, 'new.recipient@example.com');

  const update = await request(app)
    .put('/api/auth/recipients/me')
    .set('Authorization', `Bearer ${registration.body.token}`)
    .send({ name: 'Updated Recipient', city: 'Matara' });
  assert.equal(update.status, 200);
  assert.equal(update.body.name, 'Updated Recipient');
  assert.equal(update.body.city, 'Matara');

  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const unauthenticated = await request(app).get('/api/auth/recipients/me');
  process.env.NODE_ENV = previousNodeEnv;
  assert.equal(unauthenticated.status, 401);
});

test('unavailable donors are excluded from search, including alternate availability queries', async () => {
  await Donor.create([
    {
      name: 'Available Donor',
      bloodGroup: 'A+',
      phone: '0710000001',
      city: 'Colombo',
      nic: '920000001V',
      password: 'password123',
      available: true,
    },
    {
      name: 'Unavailable Donor',
      bloodGroup: 'A+',
      phone: '0710000002',
      city: 'Colombo',
      nic: '920000002V',
      password: 'password123',
      available: false,
    },
  ]);

  const all = await request(app).get('/api/donors');
  const unavailableQuery = await request(app).get('/api/donors?available=false');

  assert.equal(all.status, 200);
  assert.equal(unavailableQuery.status, 200);
  assert.deepEqual(all.body.map((donor) => donor.name), ['Available Donor']);
  assert.deepEqual(unavailableQuery.body.map((donor) => donor.name), ['Available Donor']);
});

test('unavailable donors cannot create new donor responses', async () => {
  const donor = await Donor.create({
    name: 'Unavailable Responder',
    bloodGroup: 'O+',
    phone: '0710000010',
    city: 'Colombo',
    nic: '920000010V',
    password: 'password123',
    available: false,
  });
  const bloodRequest = await BloodRequest.create({
    patientName: 'Patient',
    bloodGroup: 'O+',
    hospital: 'Test Hospital',
    city: 'Colombo',
    unitsNeeded: 1,
    contactNumber: '0710000099',
  });
  const token = jwt.sign({ id: donor._id, role: 'donor' }, process.env.JWT_SECRET);

  const response = await request(app)
    .post(`/api/blood-requests/${bloodRequest._id}/responses`)
    .set('Authorization', `Bearer ${token}`)
    .send({ donor: donor._id, status: 'offered' });

  assert.equal(response.status, 403);
});
