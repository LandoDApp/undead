import { randomUUID } from 'crypto';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://undead:undead_dev@localhost:5432/undead';
const sql = postgres(DATABASE_URL);

// Bremen safe zones - parks, landmarks, and popular pedestrian areas
const BREMEN_ZONES = [
  { name: 'Bürgerpark - Haupteingang', lat: 53.0905, lon: 8.8200, radius: 60 },
  { name: 'Bürgerpark - Hollersee', lat: 53.0950, lon: 8.8150, radius: 50 },
  { name: 'Bürgerpark - Café', lat: 53.0930, lon: 8.8180, radius: 40 },
  { name: 'Wallanlagen - Mühle', lat: 53.0750, lon: 8.8050, radius: 45 },
  { name: 'Wallanlagen - Theaterberg', lat: 53.0740, lon: 8.8000, radius: 50 },
  { name: 'Weserpromenade - Schlachte', lat: 53.0720, lon: 8.8060, radius: 55 },
  { name: 'Marktplatz', lat: 53.0759, lon: 8.8074, radius: 40 },
  { name: 'Schnoor', lat: 53.0730, lon: 8.8110, radius: 35 },
  { name: 'Domshof', lat: 53.0756, lon: 8.8050, radius: 40 },
  { name: 'Osterdeich - Weserstadion', lat: 53.0660, lon: 8.8380, radius: 60 },
  { name: 'Osterdeich - Café Sand', lat: 53.0630, lon: 8.8420, radius: 45 },
  { name: 'Rhododendronpark', lat: 53.0850, lon: 8.8950, radius: 70 },
  { name: 'Uni Bremen - Bibliothek', lat: 53.1060, lon: 8.8530, radius: 50 },
  { name: 'Uni Bremen - Mensa', lat: 53.1070, lon: 8.8560, radius: 45 },
  { name: 'Uni Bremen - GW2', lat: 53.1065, lon: 8.8500, radius: 40 },
  { name: 'Werdersee - Nordufer', lat: 53.0600, lon: 8.8200, radius: 55 },
  { name: 'Stadtwald', lat: 53.0550, lon: 8.8650, radius: 60 },
  { name: 'Überseestadt - Hafenmuseum', lat: 53.0880, lon: 8.7750, radius: 50 },
  { name: 'Findorff - Bürgerweide', lat: 53.0870, lon: 8.8130, radius: 55 },
  { name: 'Viertel - Sielwall', lat: 53.0700, lon: 8.8250, radius: 40 },
  { name: 'Viertel - Ostertorsteinweg', lat: 53.0710, lon: 8.8220, radius: 45 },
  { name: 'Focke-Museum Park', lat: 53.0830, lon: 8.8850, radius: 50 },
  { name: 'Knoops Park', lat: 53.1350, lon: 8.7100, radius: 65 },
  { name: 'Wümmewiesen', lat: 53.0980, lon: 8.9150, radius: 70 },
  { name: 'Blockland - Wümmedeich', lat: 53.1150, lon: 8.8250, radius: 55 },
  { name: 'Vegesack - Maritime Meile', lat: 53.1680, lon: 8.6220, radius: 50 },
  { name: 'Stadtwerder', lat: 53.0650, lon: 8.7950, radius: 55 },
  { name: 'Neustadtswall', lat: 53.0680, lon: 8.7970, radius: 45 },
  { name: 'Peterswerder', lat: 53.0620, lon: 8.8450, radius: 50 },
  { name: 'Pauliner Marsch', lat: 53.0640, lon: 8.8500, radius: 60 },
  { name: 'Schwachhausen - Lüneburger Straße', lat: 53.0880, lon: 8.8450, radius: 40 },
  { name: 'Horn-Lehe - Sportpark', lat: 53.0950, lon: 8.8700, radius: 55 },
  { name: 'Waller Park', lat: 53.0950, lon: 8.7800, radius: 55 },
  { name: 'Tenever - Grünzug', lat: 53.0550, lon: 8.9200, radius: 50 },
  { name: 'Habenhausen - Deich', lat: 53.0450, lon: 8.8350, radius: 50 },
];

async function seed() {
  console.log(`Seeding ${BREMEN_ZONES.length} safe zones...`);

  for (const zone of BREMEN_ZONES) {
    await sql`
      INSERT INTO safe_zones (id, name, latitude, longitude, radius, charge, is_fallen, is_approved, created_at)
      VALUES (${randomUUID()}, ${zone.name}, ${zone.lat}, ${zone.lon}, ${zone.radius}, 100, false, true, NOW())
      ON CONFLICT DO NOTHING
    `;
  }

  console.log('Done! Safe zones seeded.');
  await sql.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
