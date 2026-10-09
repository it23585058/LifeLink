const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');

const Hospital = require('../src/models/hospital.model');
const BloodInventory = require('../src/models/blood-inventory.model');
const Reservation = require('../src/models/reservation.model');
const Transfer = require('../src/models/transfer.model');

let mongod;
let app;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // Point MONGODB_URI to memory server before loading app
  process.env.MONGODB_URI = uri;
  process.env.MONGODB_DB_NAME = 'LifeLinkTest';

  await mongoose.connect(uri, { dbName: 'LifeLinkTest' });
  app = require('../src/app');
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

test.beforeEach(async () => {
  await Hospital.deleteMany({});
  await BloodInventory.deleteMany({});
  await Reservation.deleteMany({});
  await Transfer.deleteMany({});
});

test('TC-M3-01 [FR-10, NFR-06] List and filter hospitals by city, type, and search query', async () => {
  const h1 = await Hospital.create({
    name: 'Colombo National Hospital — Central Blood Bank',
    type: 'blood_bank',
    accreditation: 'nbts_accredited',
    city: 'Colombo',
    address: 'Regent Street, Colombo 10',
    coordinates: { lat: 6.9198, lng: 79.8687 },
    phone: '+94 11 269 1111',
  });

  const h2 = await Hospital.create({
    name: 'Kalubowila Teaching Hospital',
    type: 'hospital',
    accreditation: 'nbts_accredited',
    city: 'Dehiwala',
    address: 'Hospital Road, Kalubowila',
    coordinates: { lat: 6.8722, lng: 79.8828 },
    phone: '+94 11 276 3064',
  });

  await BloodInventory.create({
    hospital: h1._id,
    bloodGroup: 'A+',
    component: 'whole_blood',
    units: 20,
    lowThreshold: 5,
  });

  const response = await request(app).get('/api/hospitals?city=Colombo');
  assert.equal(response.status, 200);
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].name, 'Colombo National Hospital — Central Blood Bank');
  assert.equal(response.body[0].stock.length, 1);
  assert.equal(response.body[0].stock[0].status, 'available');
  assert.ok(typeof response.body[0].distanceKm === 'number');
});

test('TC-M3-02 [FR-02, FR-03, FR-04] Filter hospitals by blood group with available stock', async () => {
  const h1 = await Hospital.create({
    name: 'Hospital Alpha',
    type: 'hospital',
    city: 'Colombo',
    address: 'Address 1',
    phone: '+94 11 111 1111',
  });

  const h2 = await Hospital.create({
    name: 'Hospital Beta',
    type: 'hospital',
    city: 'Colombo',
    address: 'Address 2',
    phone: '+94 11 222 2222',
  });

  await BloodInventory.create({
    hospital: h1._id,
    bloodGroup: 'B-',
    component: 'whole_blood',
    units: 4,
  });

  await BloodInventory.create({
    hospital: h2._id,
    bloodGroup: 'B-',
    component: 'whole_blood',
    units: 0,
  });

  const response = await request(app).get('/api/hospitals?bloodGroup=B-');
  assert.equal(response.status, 200);
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].name, 'Hospital Alpha');
});

test('TC-M3-03 [FR-04, NFR-04] Aggregate district summary and identify critical shortages (<= 4 units)', async () => {
  const h1 = await Hospital.create({
    name: 'Hospital Central',
    type: 'hospital',
    city: 'Colombo',
    address: 'Central',
    phone: '+94 11 000 0000',
  });

  await BloodInventory.create([
    { hospital: h1._id, bloodGroup: 'A+', component: 'whole_blood', units: 25 },
    { hospital: h1._id, bloodGroup: 'O-', component: 'whole_blood', units: 3 },
    { hospital: h1._id, bloodGroup: 'B-', component: 'whole_blood', units: 4 },
  ]);

  const response = await request(app).get('/api/hospitals/summary');
  assert.equal(response.status, 200);
  assert.equal(response.body.facilities, 1);
  assert.equal(response.body.totalUnits, 32);

  const shortageGroups = response.body.criticalShortages.map((s) => s.bloodGroup);
  assert.ok(shortageGroups.includes('O-'));
  assert.ok(shortageGroups.includes('B-'));
  assert.ok(!shortageGroups.includes('A+'));
});

test('TC-M3-04 [FR-08, NFR-03] Role gate blocks non-staff roles from modifying inventory (HTTP 403)', async () => {
  const hospital = await Hospital.create({
    name: 'Hospital Secure',
    type: 'hospital',
    city: 'Colombo',
    address: 'Sec Ave',
    phone: '+94 11 333 4444',
  });

  const resWithoutRole = await request(app)
    .post('/api/blood-inventory')
    .send({ hospital: hospital._id, bloodGroup: 'A+', units: 10 });
  assert.equal(resWithoutRole.status, 403);

  const resAsDonor = await request(app)
    .post('/api/blood-inventory')
    .set('x-demo-role', 'donor')
    .send({ hospital: hospital._id, bloodGroup: 'A+', units: 10 });
  assert.equal(resAsDonor.status, 403);
});

test('TC-M3-05 [FR-08, NFR-04] Staff creates blood inventory and prevents duplicate compound keys (HTTP 409)', async () => {
  const hospital = await Hospital.create({
    name: 'Hospital Stock',
    type: 'hospital',
    city: 'Colombo',
    address: 'Stock Rd',
    phone: '+94 11 555 6666',
  });

  const createRes = await request(app)
    .post('/api/blood-inventory')
    .set('x-demo-role', 'hospital_staff')
    .set('x-demo-user', 'staff_user_1')
    .send({
      hospital: hospital._id,
      bloodGroup: 'AB+',
      component: 'whole_blood',
      units: 12,
      lowThreshold: 5,
    });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.body.units, 12);
  assert.equal(createRes.body.status, 'available');

  const duplicateRes = await request(app)
    .post('/api/blood-inventory')
    .set('x-demo-role', 'hospital_staff')
    .send({
      hospital: hospital._id,
      bloodGroup: 'AB+',
      component: 'whole_blood',
      units: 5,
    });
  assert.equal(duplicateRes.status, 409);
});

test('TC-M3-06 [FR-08, NFR-05] Staff updates units and deletes mistaken inventory entry', async () => {
  const hospital = await Hospital.create({
    name: 'Hospital Edit',
    type: 'hospital',
    city: 'Colombo',
    address: 'Edit Rd',
    phone: '+94 11 777 8888',
  });

  const inv = await BloodInventory.create({
    hospital: hospital._id,
    bloodGroup: 'O+',
    component: 'whole_blood',
    units: 10,
    lowThreshold: 5,
  });

  const putRes = await request(app)
    .put(`/api/blood-inventory/${inv._id}`)
    .set('x-demo-role', 'hospital_staff')
    .send({ units: 2 });
  assert.equal(putRes.status, 200);
  assert.equal(putRes.body.units, 2);
  assert.equal(putRes.body.status, 'low');

  const delRes = await request(app)
    .delete(`/api/blood-inventory/${inv._id}`)
    .set('x-demo-role', 'hospital_staff');
  assert.equal(delRes.status, 204);

  const check = await BloodInventory.findById(inv._id);
  assert.equal(check, null);
});

test('TC-M3-07 [FR-04, NFR-05] Atomic reserve decrements available inventory stock', async () => {
  const hospital = await Hospital.create({
    name: 'Reserve Hospital',
    type: 'hospital',
    city: 'Colombo',
    address: 'Reserve St',
    phone: '+94 11 999 0000',
  });

  await BloodInventory.create({
    hospital: hospital._id,
    bloodGroup: 'A+',
    component: 'whole_blood',
    units: 10,
  });

  const res = await request(app)
    .post('/api/reservations')
    .set('x-demo-user', 'patient_jane')
    .send({
      hospital: hospital._id,
      bloodGroup: 'A+',
      component: 'whole_blood',
      units: 2,
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.status, 'pending');
  assert.equal(res.body.reservedBy, 'patient_jane');

  const inv = await BloodInventory.findOne({ hospital: hospital._id, bloodGroup: 'A+' });
  assert.equal(inv.units, 8);
});

test('TC-M3-08 [FR-04, NFR-05] Reserve more units than available returns HTTP 409 and keeps stock unchanged', async () => {
  const hospital = await Hospital.create({
    name: 'Exceed Hospital',
    type: 'hospital',
    city: 'Colombo',
    address: 'Exceed St',
    phone: '+94 11 123 4567',
  });

  await BloodInventory.create({
    hospital: hospital._id,
    bloodGroup: 'O+',
    component: 'whole_blood',
    units: 5,
  });

  const res = await request(app)
    .post('/api/reservations')
    .send({
      hospital: hospital._id,
      bloodGroup: 'O+',
      units: 20,
    });

  assert.equal(res.status, 409);
  assert.equal(res.body.error, 'INSUFFICIENT_STOCK');
  assert.equal(res.body.availableUnits, 5);

  const inv = await BloodInventory.findOne({ hospital: hospital._id, bloodGroup: 'O+' });
  assert.equal(inv.units, 5);
});

test('TC-M3-09 [FR-04, NFR-05] Cancelling pending reservation restores stock exactly once', async () => {
  const hospital = await Hospital.create({
    name: 'Cancel Hospital',
    type: 'hospital',
    city: 'Colombo',
    address: 'Cancel Way',
    phone: '+94 11 987 6543',
  });

  await BloodInventory.create({
    hospital: hospital._id,
    bloodGroup: 'B+',
    component: 'whole_blood',
    units: 7,
  });

  // Make reservation of 3 units
  const reserveRes = await request(app)
    .post('/api/reservations')
    .send({ hospital: hospital._id, bloodGroup: 'B+', units: 3 });
  assert.equal(reserveRes.status, 201);

  let inv = await BloodInventory.findOne({ hospital: hospital._id, bloodGroup: 'B+' });
  assert.equal(inv.units, 4);

  // Cancel reservation
  const cancelRes = await request(app)
    .put(`/api/reservations/${reserveRes.body._id}`)
    .send({ status: 'cancelled' });
  assert.equal(cancelRes.status, 200);
  assert.equal(cancelRes.body.status, 'cancelled');

  inv = await BloodInventory.findOne({ hospital: hospital._id, bloodGroup: 'B+' });
  assert.equal(inv.units, 7);

  // Attempt duplicate cancellation -> should fail with 409
  const secondCancel = await request(app)
    .put(`/api/reservations/${reserveRes.body._id}`)
    .send({ status: 'cancelled' });
  assert.equal(secondCancel.status, 409);

  // Stock must still be 7
  inv = await BloodInventory.findOne({ hospital: hospital._id, bloodGroup: 'B+' });
  assert.equal(inv.units, 7);
});

test('TC-M3-10 [FR-08, NFR-03] Transfer enforces sequential forward-only state transitions', async () => {
  const hospital = await Hospital.create({
    name: 'Transfer Hospital',
    type: 'hospital',
    city: 'Colombo',
    address: 'Transfer Rd',
    phone: '+94 11 444 3333',
  });

  const createRes = await request(app)
    .post('/api/transfers')
    .set('x-demo-role', 'hospital_staff')
    .set('x-demo-user', 'Nurse_Kamal')
    .send({
      hospital: hospital._id,
      donorName: 'Sunil Silva',
      bloodGroup: 'A+',
      etaMinutes: 15,
      ward: 'Ward 4 Triage',
    });
  assert.equal(createRes.status, 201);
  assert.equal(createRes.body.status, 'dispatched');
  assert.ok(createRes.body.caseCode.startsWith('BL-'));
  assert.equal(createRes.body.events.length, 1);

  const transferId = createRes.body._id;

  // Attempt illegal skip: dispatched -> triage_crossmatch
  const skipRes = await request(app)
    .put(`/api/transfers/${transferId}/status`)
    .send({ status: 'triage_crossmatch' });
  assert.equal(skipRes.status, 409);

  // Legal forward step: dispatched -> arrived_at_gate
  const legalRes = await request(app)
    .put(`/api/transfers/${transferId}/status`)
    .send({ status: 'arrived_at_gate', note: 'Arrived at Main Gate' });
  assert.equal(legalRes.status, 200);
  assert.equal(legalRes.body.status, 'arrived_at_gate');
  assert.equal(legalRes.body.events.length, 2);

  // Quick action: update ETA with delay
  const delayRes = await request(app)
    .put(`/api/transfers/${transferId}`)
    .send({ etaMinutes: 20, note: 'Traffic delay (+5 mins)' });
  assert.equal(delayRes.status, 200);
  assert.equal(delayRes.body.etaMinutes, 20);
  assert.equal(delayRes.body.events.length, 3);
});

test('TC-M3-11 [NFR-02, NFR-05] Invalid ObjectId parameters return HTTP 400 Bad Request', async () => {
  const res1 = await request(app).get('/api/hospitals/invalid-object-id');
  assert.equal(res1.status, 400);
  assert.equal(res1.body.error, 'Invalid hospital ID.');

  const res2 = await request(app).put('/api/reservations/bad-id').send({ status: 'cancelled' });
  assert.equal(res2.status, 400);
  assert.equal(res2.body.error, 'Invalid reservation ID.');

  const res3 = await request(app)
    .delete('/api/blood-inventory/not-a-mongo-id')
    .set('x-demo-role', 'hospital_staff');
  assert.equal(res3.status, 400);
  assert.equal(res3.body.error, 'Invalid inventory ID.');
});
