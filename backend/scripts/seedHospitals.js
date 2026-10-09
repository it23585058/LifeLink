/**
 * Seed script for Member 3: Hospitals, Blood Inventory & Transfer Coordination.
 * 
 * Idempotent upsert script keyed by:
 * - Hospital name
 * - BloodInventory (hospital, bloodGroup, component)
 * - Transfer (caseCode)
 * 
 * Supports --dry-run flag to preview without writing to the database.
 */

const mongoose = require('mongoose');
const { mongodbUri, databaseName } = require('../src/config/env');
const Hospital = require('../src/models/hospital.model');
const BloodInventory = require('../src/models/blood-inventory.model');
const Transfer = require('../src/models/transfer.model');

const isDryRun = process.argv.includes('--dry-run');

// Demo Colombo-area facilities
const DEMO_HOSPITALS = [
  {
    name: 'Colombo National Hospital — Central Blood Bank',
    type: 'blood_bank',
    accreditation: 'nbts_accredited',
    city: 'Colombo',
    address: 'Regent Street, Colombo 10',
    coordinates: { lat: 6.9198, lng: 79.8687 },
    phone: '+94 11 269 1111',
    wardExtension: 'EXT 201',
    stock: [
      { bloodGroup: 'A+', component: 'whole_blood', units: 24, lowThreshold: 5 },
      { bloodGroup: 'O-', component: 'whole_blood', units: 2, lowThreshold: 5 },
      { bloodGroup: 'B+', component: 'whole_blood', units: 14, lowThreshold: 5 },
      { bloodGroup: 'A+', component: 'platelets', units: 30, lowThreshold: 5 },
    ],
  },
  {
    name: 'City General Hospital — Trauma Wing B',
    type: 'hospital',
    accreditation: 'hospital_verified',
    city: 'Colombo',
    address: 'De Saram Place, Colombo 10',
    coordinates: { lat: 6.9271, lng: 79.8612 },
    phone: '+94 11 269 3510',
    wardExtension: 'EXT 412',
    stock: [
      { bloodGroup: 'O+', component: 'whole_blood', units: 19, lowThreshold: 5 },
      { bloodGroup: 'A-', component: 'whole_blood', units: 3, lowThreshold: 5 },
      { bloodGroup: 'AB+', component: 'whole_blood', units: 8, lowThreshold: 5 },
    ],
  },
  {
    name: 'National Maternity Hospital — Castle Street',
    type: 'hospital',
    accreditation: 'hospital_verified',
    city: 'Colombo',
    address: 'Castle Street, Colombo 08',
    coordinates: { lat: 6.9115, lng: 79.8821 },
    phone: '+94 11 269 6224',
    wardExtension: 'EXT 104',
    portalUrl: 'https://castlestreet.health.gov.lk',
    stock: [
      { bloodGroup: 'O+', component: 'whole_blood', units: 16, lowThreshold: 5 },
      { bloodGroup: 'B-', component: 'whole_blood', units: 4, lowThreshold: 5 },
      { bloodGroup: 'O+', component: 'ffp', units: 32, lowThreshold: 5 },
    ],
  },
  {
    name: 'Sri Jayewardenepura General Hospital Blood Center',
    type: 'hospital',
    accreditation: 'nbts_accredited',
    city: 'Kotte',
    address: 'Thalapathpitiya, Nugegoda',
    coordinates: { lat: 6.8833, lng: 79.9167 },
    phone: '+94 11 277 8610',
    wardExtension: 'EXT 330',
    stock: [
      { bloodGroup: 'A+', component: 'whole_blood', units: 18, lowThreshold: 5 },
      { bloodGroup: 'B+', component: 'whole_blood', units: 22, lowThreshold: 5 },
      { bloodGroup: 'O+', component: 'whole_blood', units: 14, lowThreshold: 5 },
      { bloodGroup: 'O-', component: 'whole_blood', units: 1, lowThreshold: 5 }, // 2 + 1 = 3 O- in district
    ],
  },
  {
    name: 'Lanka Hospitals Blood Bank',
    type: 'blood_bank',
    accreditation: 'hospital_verified',
    city: 'Colombo',
    address: '578 Elvitigala Mawatha, Colombo 05',
    coordinates: { lat: 6.8942, lng: 79.8784 },
    phone: '+94 11 543 0000',
    wardExtension: 'EXT 510',
    stock: [
      { bloodGroup: 'A+', component: 'whole_blood', units: 10, lowThreshold: 5 },
      { bloodGroup: 'B+', component: 'whole_blood', units: 12, lowThreshold: 5 },
      { bloodGroup: 'AB-', component: 'whole_blood', units: 5, lowThreshold: 5 },
      { bloodGroup: 'O+', component: 'whole_blood', units: 20, lowThreshold: 5 },
    ],
  },
  {
    name: 'Asiri Central Hospital Transfusion Unit',
    type: 'hospital',
    accreditation: 'hospital_verified',
    city: 'Colombo',
    address: '114 Norris Canal Road, Colombo 10',
    coordinates: { lat: 6.9189, lng: 79.8665 },
    phone: '+94 11 466 5500',
    wardExtension: 'EXT 240',
    stock: [
      { bloodGroup: 'A+', component: 'whole_blood', units: 15, lowThreshold: 5 },
      { bloodGroup: 'B+', component: 'whole_blood', units: 11, lowThreshold: 5 },
      { bloodGroup: 'AB+', component: 'whole_blood', units: 6, lowThreshold: 5 },
      { bloodGroup: 'O+', component: 'whole_blood', units: 18, lowThreshold: 5 },
    ],
  },
  {
    name: 'Colombo South Teaching Hospital — Kalubowila',
    type: 'hospital',
    accreditation: 'nbts_accredited',
    city: 'Dehiwala',
    address: 'Hospital Road, Kalubowila',
    coordinates: { lat: 6.8722, lng: 79.8828 },
    phone: '+94 11 276 3064',
    wardExtension: 'EXT 115',
    stock: [
      { bloodGroup: 'A+', component: 'whole_blood', units: 12, lowThreshold: 5 },
      { bloodGroup: 'A-', component: 'whole_blood', units: 6, lowThreshold: 5 },
      { bloodGroup: 'B+', component: 'whole_blood', units: 15, lowThreshold: 5 },
      { bloodGroup: 'O+', component: 'whole_blood', units: 10, lowThreshold: 5 },
    ],
  },
  {
    name: 'Rotaract / Red Cross Colombo Emergency Camp',
    type: 'ngo_camp',
    accreditation: 'unverified',
    city: 'Colombo',
    address: '106 Dharmapala Mawatha, Colombo 07',
    coordinates: { lat: 6.9312, lng: 79.8554 },
    phone: '+94 11 269 5185',
    stock: [
      { bloodGroup: 'A+', component: 'whole_blood', units: 8, lowThreshold: 5 },
      { bloodGroup: 'B+', component: 'whole_blood', units: 9, lowThreshold: 5 },
      { bloodGroup: 'O+', component: 'whole_blood', units: 12, lowThreshold: 5 },
    ],
  },
];

async function seed() {
  console.log(`\n==============================================`);
  console.log(`Target Database: [${databaseName}]`);
  console.log(`Collections touched: [hospitals, bloodinventories, transfers]`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no database writes)' : 'LIVE SEED'}`);
  console.log(`==============================================\n`);

  if (isDryRun) {
    console.log(`[DRY RUN] Will upsert ${DEMO_HOSPITALS.length} hospitals and their inventory rows:`);
    let totalStockRows = 0;
    for (const h of DEMO_HOSPITALS) {
      console.log(` - ${h.name} (${h.type}, ${h.accreditation}) -> ${h.stock.length} inventory items`);
      totalStockRows += h.stock.length;
    }
    console.log(`Total inventory items to upsert: ${totalStockRows}`);
    console.log(`[DRY RUN] Will upsert 1 demo Transfer: BL-4921 (arrived_at_gate, donor: Nimal Perera, ETA: 8m)`);
    console.log(`\n[DRY RUN] Simulation complete. No changes made.\n`);
    return;
  }

  await mongoose.connect(mongodbUri, {
    dbName: databaseName,
    serverSelectionTimeoutMS: 10_000,
  });

  console.log(`Connected to MongoDB Atlas: ${databaseName}`);

  let hospitalCount = 0;
  let inventoryCount = 0;
  let cityHospitalId = null;

  for (const hData of DEMO_HOSPITALS) {
    const { stock, ...hospitalFields } = hData;
    const hospital = await Hospital.findOneAndUpdate(
      { name: hospitalFields.name },
      { $set: hospitalFields },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );
    hospitalCount += 1;

    if (hospital.name === 'City General Hospital — Trauma Wing B') {
      cityHospitalId = hospital._id;
    }

    for (const item of stock) {
      await BloodInventory.findOneAndUpdate(
        {
          hospital: hospital._id,
          bloodGroup: item.bloodGroup,
          component: item.component,
        },
        {
          $set: {
            units: item.units,
            lowThreshold: item.lowThreshold || 5,
            updatedBy: 'seed-script',
          },
        },
        { upsert: true, returnDocument: 'after', runValidators: true }
      );
      inventoryCount += 1;
    }
  }

  console.log(`Successfully upserted ${hospitalCount} hospitals and ${inventoryCount} inventory rows.`);

  // Seed demo Transfer matching prototype page 9
  if (cityHospitalId) {
    const now = Date.now();
    await Transfer.findOneAndUpdate(
      { caseCode: 'BL-4921' },
      {
        $set: {
          hospital: cityHospitalId,
          ward: 'ICU Bay 12',
          attendingStaff: 'Dr. Samantha W.',
          donorName: 'Nimal Perera',
          bloodGroup: 'A+',
          component: 'whole_blood',
          units: 1,
          transitMode: 'Personal Vehicle',
          vehicleInfo: 'White Prius (WP-CAB-4912) • Security Pre-Cleared',
          etaMinutes: 8,
          status: 'arrived_at_gate',
          events: [
            {
              label: 'Donor accepted code-red dispatch',
              kind: 'status_change',
              by: 'Nimal P.',
              at: new Date(now - 25 * 60 * 1000),
            },
            {
              label: 'Hospital gate clearance pass generated',
              kind: 'pass_generated',
              by: 'System',
              at: new Date(now - 20 * 60 * 1000),
            },
            {
              label: 'Donor entered hospital perimeter (500m)',
              kind: 'perimeter_entry',
              by: 'System',
              at: new Date(now - 10 * 60 * 1000),
            },
            {
              label: 'Arrived at Hospital Gate',
              kind: 'status_change',
              by: 'Security',
              at: new Date(now - 2 * 60 * 1000),
            },
          ],
        },
      },
      { upsert: true, returnDocument: 'after', runValidators: true }
    );
    console.log(`Successfully upserted demo Transfer: BL-4921.`);
  }

  await mongoose.disconnect();
  console.log(`\nSeed completed successfully.\n`);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
