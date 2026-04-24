# Finales Konzept: Untot (Arbeitstitel)

Social-Fitness-Spiel, das Bewegung durch Zombies und geteilte Orte belohnt. Zielgebiet zum Start: Bremen.

---

## Kern-Idee

Du öffnest die App, siehst dich auf der Karte, und rote Punkte (Zombies) bewegen sich auf dich zu — aber nur auf echten Gehwegen und Straßen, nie durch Häuser oder Wasser. Flieh zu einer Safe Zone. Dort triffst du andere Spieler. Jeder Spielort, den du besuchst, wird für die Community lebendig.

**Das Soziale ist das Spiel, die Zombies sind der Motor.**

---

## Wie es sich spielt

**Start einer Session.** App auf, GPS an, Karte lädt. 3–5 Zombies spawnen im Umkreis von 200–400m auf dem Fußgänger-Netzwerk. Sie berechnen Routen zu dir, du siehst ihre Bewegung in Echtzeit.

**Bewegung.** Du läufst raus. Die App trackt nur im Vordergrund — Handy aus der Tasche heißt Zombies stehen. Adaptives GPS-Polling via Beschleunigungssensor: still = 30 s, gehen = 8 s, laufen = 3 s. Akku hält eine normale Laufrunde problemlos durch.

**Safe Zones.** Auf der Karte als grüne Bereiche sichtbar. Betrittst du eine, frieren Zombies ein, dein Status wird "sicher". An der Zone siehst du, wer sonst noch gerade hier ist (anonymisiert im 200-m-Radius) und wer kürzlich da war ("Marko, vor 2h").

**Meetup-Signal.** An jeder Zone kannst du ein Signal setzen: "Samstag 16:00 am Bürgerpark-Teich". Andere Spieler in Bremen sehen das beim nächsten App-Start. Push-Notification 30 Min vorher für Interessierte. Kein Live-Tracking anderer — Privacy by design.

**Ende.** Du schließt die App, letzte Position wird als "last online" gespeichert. Öffnest du in <10 Min wieder, läuft die Session weiter. Danach Reset mit frischen Spawns.

---

## Architektur

**Client (React Native + Expo, Android-only zum Start)**
- MapLibre React Native für die Karte
- MapTiler Free Tier für Tiles (100k/Monat gratis)
- expo-location (nur Vordergrund) + expo-sensors für adaptives Polling
- Zustand für State Management
- Zombies werden clientseitig simuliert — der Server liefert nur Spawn-Seeds

**Backend (eine Hetzner CX22, Docker-Compose)**
- Fastify-API (Node.js)
- PostgreSQL 16 mit PostGIS für Geo-Queries (Safe Zones, Spieler-Suche im Umkreis)
- Valhalla per Docker, gefüttert mit dem Bremen-OSM-Extract (~20 MB) — liefert Fußgänger-Routen für Zombie-Pathfinding
- Caddy als Reverse Proxy, Let's Encrypt automatisch
- Selbst gebaute Auth mit `better-auth` (Email + Magic Link)
- Expo Push Notifications (gratis)

**Datenquellen**
- OpenStreetMap via Geofabrik (täglich aktualisierter Bremen-Extract)
- Bright Sky / DWD für Wetter (Phase 2)
- Tageszeit clientseitig berechnet

**Warum dieser Stack?** Alles kostenlos oder self-hosted. Eine einzige CX22-Instanz (~4,49 €/Monat) packt API + DB + Pathfinding für die ersten hundert aktiven Spieler. Skalierung durch größere Hetzner-Instanz, wenn nötig.

---

## Zombie-Logik

Zombies spawnen und bewegen sich **ausschließlich auf dem OSM-Fußgänger-Graph**. Das sind Kanten mit `highway=footway|path|pedestrian|living_street|steps` sowie Straßen mit `foot=yes` und ohne `access=private|no`. Damit automatisch gelöst: keine Zombies durch Häuser, über Seen oder auf Privatgrund.

Kantenkosten werden so gewichtet, dass Zombies vielbefahrene Straßen (hoher `maxspeed`, keine Zebrastreifen) meiden. So scheucht dich die App nicht vor Autos.

**Ein Zombie-Typ im MVP** (Walker, 4 km/h, sichtet dich auf 150 m). Weitere Typen (Runner, Crawler, Horde) kommen erst, wenn das Grundspiel läuft.

**Tag/Nacht** im MVP trivial: nach Sonnenuntergang langsamere, aber aufmerksamere Zombies. Wetter-Integration (Bright Sky) in Phase 2 — und wichtig: Wetter **belohnt** Bewegung, es bestraft nicht. Regen = weniger Zombies + XP-Bonus. Nicht umgekehrt.

**Spawn-Blackout 23:00–06:00.** Keine Zombies nachts. Schützt dich und schützt mich juristisch.

---

## Soziale Mechanik

Das ist der USP, deshalb hier in Detail.

**Safe Zones als lebendige Orte.** Jede Zone hat eine "Ladung" (0–100). Spieler-Besuche laden auf, Zombie-Angriffe in der Nähe entladen. Bei 0 ist die Zone "gefallen" und muss physisch zurückerobert werden (hinlaufen, 2 Minuten dort bleiben). Im MVP manuell seed ich 30–50 gute Zonen in Bremen (Bürgerpark, Wallanlagen, Weserpromenade, Stadtteilparks). User können eigene vorschlagen, ich moderiere täglich 5 Min.

**Meetup-Signale.** Asynchron, keine Live-Chat-Komplexität. Du setzt ein Signal mit Zeitpunkt, andere sehen es beim App-Start, können einchecken. Bei ≥2 Check-Ins aktiviert sich später der Gruppenmodus.

**Gruppenmodus (Phase 2).** Spieler an derselben Zone können zusammen losziehen: Zombies spawnen aggressiver, Belohnung skaliert. Das löst das Einsteiger-Problem — du triffst Fremde durch geteilte Routen, nicht durch Chat.

**Henne-Ei-Problem.** Ohne kritische Masse kein Sozial-Effekt. Deshalb Launch als **geschlossene Beta im Uni-Bremen-Umfeld** (Wiwi, Sport, Werkstudenten-Netzwerk). ~50 aktive Spieler in Bremen reichen, damit zufällige Begegnungen stattfinden. Öffentlicher Launch erst danach.

---

## Rechtliches & Sicherheit

**DSGVO.**
- Hosting in Deutschland (Hetzner Nürnberg), alles DSGVO-konform
- Standortdaten nur in der aktiven Session im Klartext, Historie nur aggregiert ("hat Zone X besucht", keine Koordinaten-Logs)
- Account-Löschung in einem Klick, vollständig
- Keine Adresse/PLZ/Klarname — nur Displayname + Email
- AV-Vertrag mit MapTiler

**Sorgfaltspflicht.**
- Mindestalter 16 laut AGB
- Explizites Opt-in zu Location-Tracking mit Safety-Disclaimer beim Onboarding ("Achte auf Verkehr und Umgebung")
- Zombie-Blackout 23:00–06:00
- Meldefunktion an jeder User-Zone und jedem markanten Pfad, täglich moderiert
- Kein Scheuchen in als riskant gemeldete Gebiete

**Pflichtseiten.** Impressum, AGB, Datenschutzerklärung — generiert über eRecht24 oder ähnlich, selbst geprüft. Für den Launch reichen Standard-Templates, Anwalt erst bei ernstem Traffic.

---

## Budget

**Einmalig:**
- Google Play Developer: $25 (~23 €)
- Domain `.de`: ~10 €
- **Total: ~33 €**

**Laufend:**
- Hetzner CX22: 4,49 €/Monat (ab 1. April 2026)
- **Total: ~54 €/Jahr**

**Gratis enthalten:** MapLibre, PostgreSQL, PostGIS, Valhalla, Bright Sky, OSM-Daten, Let's Encrypt, Expo EAS Free Tier, Expo Push.

**Jahr 1 komplett: ~85 €.** Apple Developer ($99/Jahr) bewusst rausgelassen, kommt wenn Android-Version läuft und Traction da ist.

---

## Roadmap

**MVP (3–4 Monate neben Werkstudium)**
- Android-App mit Live-Location + MapLibre
- Valhalla auf Hetzner mit Bremen-Extract
- Ein Zombie-Typ, Tag/Nacht-Unterschied, clientseitige Simulation
- 30–50 manuell geseedete Safe Zones
- User-Zonen mit Moderation
- Meetup-Signale + Push-Notifications
- Freundesliste, Last-Seen an Zonen
- Auth, Impressum, Datenschutz
- Geschlossene Beta mit 20–50 Uni-Leuten

**Phase 2 (3–6 Monate danach)**
- Server-seitige Zombie-Simulation (Anti-Cheat)
- Zombie-Typen: Runner, Crawler, Horde
- Wetter-Integration via Bright Sky
- Zone-Ladung und Erobern als echte Mechanik
- Gruppenmodus
- iOS-Build (Apple Developer $99)
- Öffentlicher Launch Bremen

**Phase 3 (wenn Traction da ist)**
- Rollout Niedersachsen (467 MB Extract, läuft noch auf CX22)
- Seasons, Events, Achievements
- Integration mit Krankenkassen-Bonusprogrammen (TK, AOK zahlen für Schritte — reales Monetarisierungspotenzial)
- Optional AR-Elemente

---

## Nächste 3 Schritte

**1. Valhalla mit Bremen-Extract lokal testen.**
Bremen-PBF von Geofabrik ziehen, Valhalla per Docker starten, erste Fußgänger-Routen A→B abfragen und als GeoJSON auf einer Karte darstellen. *Ziel: Proof-of-Concept, dass Pathfinding für dein Szenario funktioniert.* Aufwand: 1–2 Abende.

**2. Expo-App mit MapLibre und Live-Location.**
Leeres Expo-Projekt, MapLibre React Native einbinden, MapTiler-Key, eigene Position als Marker, adaptives Polling via expo-sensors. Noch kein Backend, nur lokal. *Ziel: flüssiges Karten-Erlebnis mit akzeptablem Akkuverbrauch.* Aufwand: 1 Wochenende.

**3. Backend-Skelett auf Hetzner CX22.**
Ubuntu 24.04, Docker Compose mit Fastify + Postgres/PostGIS + Valhalla + Caddy. Erste Route: `GET /zombies?lat=&lon=` gibt 3 zufällige Spawn-Punkte auf dem Gehwegnetz im Umkreis zurück. *Ziel: Client und Server sprechen zum ersten Mal miteinander und simulieren einen echten Spielmoment.* Aufwand: 2–3 Abende.

Wenn diese drei laufen, hast du das Fundament. Alles Weitere ist dann normale Entwicklung, keine offenen Fragen mehr.