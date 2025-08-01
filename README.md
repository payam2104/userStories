# User Story Map – Angular 19 App

## Überblick

Diese Angular-19-Anwendung dient zur Verwaltung einer **User Story Map** mit lokalem Persistenzspeicher über **IndexedDB (Dexie.js)**. Ziel ist es, User Journeys, User Steps, Issues (Mock-Daten) und Releases interaktiv zu verwalten – komplett offlinefähig, modern und performant.

Die Anwendung verwendet:
- Angular 19 mit `standalone components`
- Signal-basierter State
- Dexie.js für IndexedDB
- Drag & Drop zur Story-Zuordnung
- Dark Mode Switch
- Undo-Funktion
- Unit Tests (Jasmine/Karma)

---

## Installation & Starten

### Voraussetzungen

- Node.js ≥ 18
- npm ≥ 9
- Angular CLI (global installiert):  
  ```bash
  npm install -g @angular/cli
  ```

### 1. Repository klonen
  ```bash
  git clone https://github.com/payam2104/userStories.git
  cd user-story-map
  ```

### 2. Abhängigkeiten installieren
  ```bash
  npm install
  ```

### 3. Anwendung starten (Dev-Modus)
  ```bash
  npm start
  ```
-------
### 4. Öffne anschließend im Browser:
http://localhost:4200

-------
-------

## Funktionsübersicht

### 1. User Story Map
- User Journeys als Spalten erstellen
- Steps unterhalb der Journeys anlegen
- Drag & Drop von GitLab Issues auf Steps
- Persistent über IndexedDB gespeichert

### 2. Issues (Mock)
- 15 Issues werden initial angezeigt
- Zuordnung per Drag & Drop auf Steps
- „Nicht zugeordnet“-Spalte für offene Issues

### 3. Release-Planung
- Releases erstellen (z. B. „Release Q3 2025“)
- Issues aus Steps Releases zuweisen
- Tabellarische Ansicht aller Releases + zugehörige Issues

-------
-------

## Features

### Feature	Beschreibung
- Undo	Rückgängig-Funktion bei Verschieben/Löschen von Issues
- Dark Mode	Theme-Umschalter für Light/Dark
- JSON Export und Import	(JSON-Datei)
- Unit Tests	Unit-Tests mit karma und jasmine (npm test)

------
## Tests ausführen
  ```bash
  npm test
  ```

------

## Projektstruktur (Auszug)
```
src/
├── app/
│ ├── components/
│ ├── core/
│   ├── models/
│   ├── services/
│   ├── stores/
├── assets/
│   ├── data/
│     ├── json-dateien
├── styles/
├── styles.scss
└── main.ts
```

------

## Hinweise für Entwickler
- Es werden keine NgModule verwendet (standalone: true)
- Styling erfolgt mit SCSS, keine Tailwind-Klassen
- Moderne Angular Syntax: @for, @if, signal(), computed()
- Das Drag & Drop System basiert auf dem Angular CDK und nutzt dessen abstrahierte Drag & Drop-Implementierung (basierend auf der HTML5-API).
- Lokale Datenhaltung über Dexie.js (IndexedDB Wrapper)

------

## Autor
Payam Koushkbaghi
