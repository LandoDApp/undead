# Untot — Fantasy-Update: Übersicht der Änderungen

## Setting-Wechsel: Vom Zombie-Apokalypse zum dunklen Fantasy

Aus der modernen Zombie-Welt wird ein **dunkles Fantasy-Setting**. Bremen ist nicht mehr eine Stadt mit Untoten-Problem, sondern ein verseuchtes Reich, in dem **Ghoule** umherstreifen und drei rivalisierende Clans um die Vorherrschaft kämpfen. Die Atmosphäre ist klassisches 16-Bit-JRPG: düster, mystisch, aber mit warmen Lichtern an sicheren Orten.

**Aus Zombies werden Ghoule.** Ein einziger Gegner-Typ — keine Walker/Runner/Crawler-Differenzierung. Optisch: ausgemergelte untote Wesen mit grau-grüner Haut, zerlumpten Roben, glühenden gelben Augen. Sie bewegen sich weiter exklusiv auf dem OSM-Fußgängernetz.

**Aus Safe Zones werden Stadtstaaten.** Statt generischer "sicherer Punkte" hast du befestigte Tore mit Bannern, die zu jeweils einem der drei Clans gehören. Die Mechanik (heilen, Reichweite ausbauen) bleibt, aber sie sind jetzt visuell und narrativ Teil der Clan-Welt.

**Aus Spielerfigur wird Abenteurer.** Der Spieler ist ein Mitglied eines Clans, gekleidet in farbcodierte Kapuzenrobe mit Lederrüstung, trägt eine kleine leuchtende Laterne. Der Look erinnert an klassische JRPG-Helden.

## Neue Spielmechaniken

**Drei Clans als Koop-Fraktionen:**
- **Glut (Rot)** — Symbol: stilisierte Flamme
- **Frost (Blau)** — Symbol: Schneeflocke oder Eiszapfen
- **Hain (Grün)** — Symbol: Eichenblatt

Beim Onboarding wählst du einen Clan und bleibst dabei (Wechsel mit Cooldown). **Wichtig: kein PvP.** Clans konkurrieren nur statistisch um Saison-Ziele wie "wer heilt das meiste Stadtgebiet" — kein Spieler verliert je Fortschritt durch andere Spieler.

**Persönliche Bastion.** Jeder Spieler hat eine Heim-Bastion an einem selbst gewählten Ort. Sie wird mit gesammelten Ressourcen ausgebaut über drei Stufen: Hütte → Holzfestung → Steinfestung. Andere Spieler können sie **nicht angreifen**, nur Ghoule belagern sie passiv (langsamer HP-Verlust, wenn du offline bist). Verbündete können dich an deiner Bastion wiederbeleben und sie verstärken.

**Drei Ressourcen-Typen statt generische Punkte:**
- **Kräuter** (häufig) — für Heilung von Stadtstaaten und Bastionen
- **Kristalle** (selten) — für Bastion-Upgrades
- **Relikte** (sehr selten) — für Spezial-Fähigkeiten

Diese spawnen an zufälligen Punkten in der Welt, ähnlich wie vorher die Heil-Punkte, nur differenziert.

**Schritte zählen als XP.** Über expo-pedometer mit Server-seitiger Plausibilitäts-Prüfung. XP geht in Charakter-Level, das wiederum freischaltet bessere Bastion-Optionen und stärkere Heil-Effekte.

**Saisonale Ziele.** Alle vier Wochen ein gemeinsames Map-Ziel ("Heilt 80% des Bremer Stadtgebiets"). Alle Clans tragen bei, der größte Beitrag bekommt einen Bonus-Skin oder ein Banner. Konkurrenz auf Stat-Ebene, nicht durch direkte Konfrontation.

**Soziale Tiefe in drei Stufen.** Solo-spielbar (alles alleine machbar), asynchron-helfend (Ressourcen schicken, fremde Bastionen boosten, an Stadtstaaten Heil-Aktionen starten), live-zusammen (Treffen-Signale + Raid-Modus, wenn mehrere gleichzeitig an einer Zone sind).

## Design-Wechsel: Pixel Art im Octopath-Stil

Das ist die größte visuelle Entscheidung und betrifft jedes Asset.

**Octopath-Traveler-Look — 2.5D.** Die Karte (MapLibre) wird mit Kamera-Pitch von 50–55° gekippt dargestellt, sodass man perspektivisch schräg darauf schaut. Auf dieser geneigten 3D-Welt stehen die 2D-Pixel-Sprites als **Billboards** — sie drehen sich automatisch zur Kamera, sodass man immer ihre Frontalansicht sieht, egal wie die Karte rotiert oder kippt. Genau die Logik aus Octopath Traveler.

**Konsequenz für jedes einzelne Sprite:** Charaktere und Strukturen werden **frontal stehend** gemalt, nicht von oben. Du siehst dem Ghoul ins Gesicht, nicht auf seinen Kopf. Bastionen zeigen ihre Fassade mit leichtem 3/4-Tilt, nicht den Grundriss.

**Größen-Anpassung wegen vertikaler Sprites:**
- Spieler/Ghoul: 32×48 Pixel (statt 32×32)
- Bastionen und Stadtstaat-Marker: 96×96 Pixel
- Ressourcen: 24×24 Pixel, mit leichter Schwebe-Animation
- Schatten als separates Sprite (32×12) flach auf dem Boden, damit Sprites nicht "schweben"

**Strenge Pixel-Disziplin.** Maximal 8–12 Farben pro Sprite, harte Kanten, kein Anti-Aliasing, keine weichen Verläufe. Das ist der entscheidende Faktor, damit die Assets nicht nach KI-generierter "Fake-Pixel-Art" aussehen.

**Drei feste Clan-Paletten** (4 Farben pro Clan), die konsequent durch alle Assets durchgezogen werden — Avatare, Wappen, Stadtstaat-Banner, UI-Akzente.

**Karte stark entsättigt und abgedunkelt.** Damit die farbigen Pixel-Sprites maximal hervorstechen. MapLibre-Style-JSON dafür anpassen — Octopath macht das genauso, die 3D-Welt ist gedämpft, die Charaktere knallen.

## HUD und UI

**Grundprinzip: UI wird gebaut, nicht generiert.** Buttons und Panels macht Nano Banana nicht zuverlässig genug. Stattdessen:

**Pixel-Schriften** über expo-font: m6x11 für UI-Text, Press Start 2P für Headlines.

**9-Slice-Frames** als Basis aller UI-Elemente. Drei Frame-Stile reichen für die ganze App:
- Holz-Frame (Standard-Panels, Inventar)
- Stein-Frame (wichtige Modals)
- Banner-Frame (Headlines, Erfolge)

Diese drei Frames werden einmal als Pixel-Art generiert und dann in React Native via 9-Slice-Scaling auf jede beliebige Größe gestreckt. Dasselbe Frame ist Hintergrund für jeden Button, jedes Panel, jedes Modal.

**Buttons sind Komponenten, keine Bilder.** Eine wiederverwendbare `PixelButton`-Komponente kombiniert: 9-Slice-Frame als Hintergrund + Pixel-Icon (16×16) + optional Pixel-Text. State-Varianten (normal/pressed/disabled/active) durch Tönung und 1-Pixel-Verschiebung beim Drücken. Einmal geschrieben, überall verwendet — automatisch konsistent.

**HUD-Layout im Spiel-Screen, minimal gehalten:**
- Oben links: Avatar-Portrait + Lebensherzen + XP-Balken
- Oben rechts: drei Ressourcen-Counter mit Icons
- Unten Mitte: kontextueller Aktions-Button (groß, daumenfreundlich, 96×96)
- Unten links: Pfeil zur nächsten Stadtstaat
- Unten rechts: Menü-Button

Mehr nicht. Die Welt soll dominieren, nicht das Interface.

**Vollbild-Menüs** mit Tabs für Inventar, Bastion, Clan, Karte, Einstellungen — alle aus 9-Slice-Frames + Pixel-Icons gebaut.

**Toasts und Alerts** ebenfalls aus den 9-Slice-Frames: kleine Banner oben für Sammel-Feedback ("+1 Kristall"), größere Stein-Modals in der Mitte für wichtige Events ("Du wurdest erwischt").

## Master-Farbpalette für die ganze App

Eine zentrale `theme.ts` mit allen Farben — Hintergründe (Nachtblau, Stein-Grau, Pergament), Akzenten (drei Clan-Farben + Gold-Highlight) und funktionalen Farben (Erfolg/Warnung/Fehler/Disabled). Alle UI-Komponenten greifen nur auf diese Palette zu. Das garantiert, dass die App farblich kohärent bleibt, auch wenn du später noch 50 Screens dazubaust.

## Was sich nicht ändert

**Kern-Loop bleibt:** Bewegen, Ressourcen einsammeln, Stadtstaaten heilen und ausbauen, Ghoule meiden, Pause nach zwei Leben. Das ist deine 1.0-Mechanik, sie funktioniert, sie wird nur eingebettet in die Fantasy-Welt.

**Tech-Stack bleibt:** React Native + Expo, MapLibre, Hetzner CX22, Postgres+PostGIS, Valhalla mit Bremen-OSM-Extract. Nur MapLibre bekommt Kamera-Pitch und einen entsättigten Style, sonst ändert sich nichts an der Infrastruktur.

**Privacy und Sicherheit bleiben:** Keine Live-Tracking anderer Spieler, Spawn-Blackout 23–6 Uhr, Mindestalter 16, Hosting in Deutschland, keine Adressdaten.

**Roadmap bleibt phasenweise.** Re-Theme zuerst (1.1), dann Ressourcen-System (1.2), dann Bastion (1.3), dann Clans und Saisonen (2.0), dann Raids (2.1). Jeder Schritt einzeln releasebar, alle 3–6 Wochen ein sichtbarer Sprung.

---

**Effektiv änderst du drei Dinge gleichzeitig:** Theme (Zombie → Fantasy), Tiefe (lineares Lauf-Spiel → Bastion+Clan+Saisonen), Look (Top-Down-Konzept → Octopath-2.5D-Pixel-Art). Das Kern-Spielgefühl bleibt erhalten, gewinnt aber an Persistenz und visueller Identität.