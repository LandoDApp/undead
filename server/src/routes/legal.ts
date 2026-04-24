import type { FastifyInstance } from 'fastify';

const LEGAL_PAGES = {
  impressum: {
    slug: 'impressum',
    title: 'Impressum',
    content: `
Angaben gemäß § 5 TMG:

[Name des Betreibers]
[Straße und Hausnummer]
[PLZ und Stadt]

Kontakt:
E-Mail: kontakt@undead.app

Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:
[Name des Verantwortlichen]
[Anschrift]
    `.trim(),
    updatedAt: '2026-01-01T00:00:00Z',
  },
  agb: {
    slug: 'agb',
    title: 'Allgemeine Geschäftsbedingungen',
    content: `
# AGB für Undead

Stand: Januar 2026

## § 1 Geltungsbereich
Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der App "Undead" (nachfolgend "App").

## § 2 Mindestalter
Die Nutzung der App ist erst ab einem Alter von 16 Jahren gestattet.

## § 3 Nutzungsbedingungen
- Die App dient der Unterhaltung und Fitness-Förderung
- Nutzer sind verpflichtet, während der Nutzung auf ihre Umgebung und den Straßenverkehr zu achten
- Die Nutzung erfolgt auf eigene Verantwortung

## § 4 Standortdaten
- Standortdaten werden nur im aktiven Vordergrund-Betrieb erhoben
- Keine Aufzeichnung von Bewegungshistorien
- Daten werden ausschließlich in Deutschland gespeichert

## § 5 Account-Löschung
Nutzer können ihren Account jederzeit vollständig löschen. Alle personenbezogenen Daten werden dabei unwiderruflich entfernt.

## § 6 Haftungsausschluss
Der Betreiber haftet nicht für Schäden, die durch unaufmerksame Nutzung der App im Straßenverkehr entstehen.
    `.trim(),
    updatedAt: '2026-01-01T00:00:00Z',
  },
  datenschutz: {
    slug: 'datenschutz',
    title: 'Datenschutzerklärung',
    content: `
# Datenschutzerklärung

Stand: Januar 2026

## 1. Verantwortlicher
[Name und Kontaktdaten des Verantwortlichen]

## 2. Erhobene Daten
- E-Mail-Adresse (für Login)
- Anzeigename (frei wählbar)
- Standortdaten (nur im aktiven App-Betrieb)

## 3. Zweck der Datenverarbeitung
- Bereitstellung des Spieldienstes
- Berechnung von Zombie-Routen und Safe-Zone-Interaktionen
- Push-Benachrichtigungen (optional)

## 4. Speicherung
- Hosting: Hetzner Online GmbH, Nürnberg, Deutschland
- Standortdaten: Nur aktuelle Position, keine Historien
- Aufbewahrung: Bis zur Account-Löschung

## 5. Ihre Rechte
- Auskunft, Berichtigung, Löschung
- Widerspruch gegen Verarbeitung
- Datenportabilität
- Beschwerde bei der Aufsichtsbehörde

## 6. Drittanbieter
- MapTiler: Kartenkacheln (AV-Vertrag vorhanden)
- Expo Push: Benachrichtigungsdienst

## 7. Account-Löschung
Vollständige Löschung aller Daten mit einem Klick in den App-Einstellungen.

## 8. Kontakt
E-Mail: datenschutz@undead.app
    `.trim(),
    updatedAt: '2026-01-01T00:00:00Z',
  },
};

export async function legalRoutes(app: FastifyInstance) {
  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const page = LEGAL_PAGES[slug as keyof typeof LEGAL_PAGES];

    if (!page) {
      return reply.status(404).send({ success: false, error: 'Page not found' });
    }

    return { success: true, data: page };
  });
}
