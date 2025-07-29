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

## 1. Repository klonen

  ```bash
  git clone https://github.com/dein-benutzername/user-story-map.git
  cd user-story-map

