# Fungal Garden

> A Foundry VTT module for Dungeons & Dragons 5th Edition that simulates a living fungal ecosystem growing on a Tortle's shell.

## Overview

Fungal Garden transforms the **Fungal Garden Thesis** into a fully automated simulation for Foundry Virtual Tabletop.

Instead of manually tracking fungal growth, breeding, harvesting, and hybridization on paper, this module maintains a persistent ecosystem that evolves over time. Every colony grows independently, breeds with compatible neighbors, produces unique hybrid species, and records its own history throughout the campaign.

The garden is not an inventory.

It is a living ecosystem.

---

## Installation

**Foundry — Install from Manifest URL**

In Foundry's *Add-on Modules → Install Module*, paste the manifest URL:

```
https://raw.githubusercontent.com/atreyu413-sudo/fungal-garden/main/module.json
```

**Manual install**

Clone (or download) this repository into your Foundry `Data/modules/` folder as a
folder named `fungal-garden`:

```
git clone https://github.com/atreyu413-sudo/fungal-garden.git
```

The built module bundle (`dist/module.js`) is committed, so no build step is
required to run it — enable the module in your world and it works.

**Requirements:** Foundry VTT v13, D&D 5e system.

## Development

```
npm install        # dependencies
npm run build      # rebuild dist/module.js (commit the result)
npm test           # run the engine test suite (Vitest)
npm run typecheck  # tsc --noEmit
```

The simulation engine (`src/engine/`) is pure and Foundry-free; the Foundry
adapter lives in `src/foundry/` and the UI in `src/ui/`. See `docs/` for the full
design (rulebook, design decisions, data schema, automation pipeline).

---

## Features

### Living Ecosystem

- Persistent fungal colonies
- Independent mycelium networks
- Dynamic growth and decay
- Environmental interactions
- Automated lifecycle management

### Genetic Hybridization

- Crossbreeding between compatible fungi
- Trait inheritance
- Randomized genetics
- Permanent hybrid species
- Multi-generation lineage tracking

### Automated Simulation

- Daily growth cycles
- Colony expansion
- Maturation
- Harvest readiness
- Environmental effects
- Event logging

### Player Experience

- Interactive Tortle shell map
- One-click harvesting
- Colony inspection
- Discovery journal
- Species encyclopedia
- Growth reports

### Game Master Tools

- Spawn colonies
- Trigger mutations
- Environmental events
- Debug tools
- Simulation controls

---

## Design Goals

This project follows several guiding principles.

### Automation First

Players should spend their time making decisions instead of bookkeeping.

### Data Driven

Game rules should exist as structured data instead of hard-coded logic whenever possible.

### Extensible

Adding new fungal species or mechanics should require minimal code changes.

### Persistent

The garden exists as part of the character and continues evolving throughout the campaign.

### Deterministic

Every simulation can be reproduced using the same seed and event history.

---

## Technology

- TypeScript
- Foundry VTT v13
- D&D5e System
- Vite
- Handlebars
- CSS

---

## Planned Features

- Living fungal ecosystem
- Hex-grid shell simulation
- Dynamic growth engine
- Crossbreeding system
- Species registry
- Discovery journal
- Harvest inventory
- Event timeline
- Statistics dashboard
- GM controls
- Configuration menu

---

## Project Structure

```
fungal-garden/
│
├── assets/
├── data/
├── docs/
├── lang/
├── src/
├── styles/
├── templates/
├── tests/
│
├── module.json
├── package.json
├── README.md
└── LICENSE
```

---

## Development Roadmap

### Version 0.1

- Project scaffold
- Data model
- Actor integration

### Version 0.2

- Garden simulation
- Tile management
- Colony lifecycle

### Version 0.3

- Growth engine
- Mycelium expansion
- Environmental rules

### Version 0.4

- Breeding engine
- Hybrid generation
- Species registry

### Version 0.5

- Harvesting
- Inventory
- Consumables

### Version 0.6

- User interface
- Shell visualization
- Garden management

### Version 0.7

- Discovery journal
- Statistics
- Timeline

### Version 1.0

Complete implementation of the Fungal Garden Thesis.

---

## Credits

### Original Design

The Fungal Garden Thesis was created for the Tortle druid **Ogeez** by a member of our tabletop gaming group.

### Software Architecture

Designed and implemented as a Foundry VTT module by Damien Burks.

---

## License

This project is currently under development.

A license will be selected before the first public release.
