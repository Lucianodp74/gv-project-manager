# Visconti Work V2 — Operating Model

## Purpose

Visconti Work is the internal work-management layer for Gruppo Visconti. It is intentionally separate from ASK FER. ASK FER can remain the scouting/analysis platform; Visconti Work coordinates people, project execution, deadlines, documents, specialists, authorities and weekly planning.

The design principle is **more control with less stress**.

## Operating roles

| Function | Current responsibility |
|---|---|
| Direction | Antonio — opportunities, legal/regulatory research, strategic decisions, important authority responses and counter-arguments |
| Coordination / quality | Luciano — professionals, collaborator work checks, quality control, support to project coordination and software/tools |
| Operations | Federica — connection requests, CDU, usi civici, organisation and support |
| Project coordination | Vincenzo — Sicily team and operational project coordination; direct technical work when needed |
| GIS / deliverables | Roberto — QGIS and project cartographic deliverables |
| Connection technical | Dario — PTO, Terna process, electrical scheme and connection technical work |
| Projects | Francesco / Carmelo / Noemi according to assignment and availability |
| Territorial external unit | Mariano → Ludovico + wife, supervised by Vincenzo, with Visconti support when needed |
| External PTO support | Gigi — technical support, not full-time |
| Specialists | Geologist, archaeologist, acoustic specialist, VINCA, fauna monitoring, agronomist and others as required |

## Project lifecycle

1. **Opportunity** — Antonio identifies/evaluates an opportunity and may prepare a preliminary KMZ/layout.
2. **Connection request** — Federica handles the request and documentation; Dario handles technical connection/PTO/Terna work; Gigi supports when required.
3. **Connection received** — Visconti evaluates whether to proceed.
4. **GO / NO-GO** — if GO, choose internal, territorial or mixed development.
5. **Second constraints check** — a deeper verification of vincolistica after the connection decision.
6. **Technical development** — plant/layout, cavidotto, roads and Terna SSE (existing or planned) are developed/tracked.
7. **Specialists in parallel** — geologist, archaeologist, acoustic, VINCA, fauna monitoring, agronomist and other required specialists are activated in parallel where possible.
8. **Quality control** — Vincenzo checks completeness and coherence; Luciano supports and reviews complex/critical points.
9. **Presentation** — the completed project is presented.
10. **Authority cycle** — opinions, integration requests, observations and prescriptions are registered, assigned and answered. The cycle can repeat.
11. **Commercial outcome** — the project may enter co-development, be sold/transferred before authorisation, or continue toward authorisation.

## Responsibility model

Every important piece of work should make four things visible:

- **Responsible** — who owns the outcome;
- **Executor** — who performs the work;
- **Supervisor** — who checks it;
- **Decision maker** — who must make the final call, when a decision is required.

The model deliberately avoids a rigid hierarchy. It is a project-based coordination model.

## Authority requests

An authority communication is not treated as one generic task. A single communication can contain several independent requests. Each request can have its own assignee, deadline, status and response document.

Example:

- Authority communication: Soprintendenza — integration request
- Request 1: geological integration → geologist
- Request 2: archaeological clarification → archaeologist
- Request 3: layout revision → project team
- Request 4: electrical clarification → Dario
- Request 5: regulatory/counter-argument → Antonio / Luciano

## Control tower

The direction dashboard should show exceptions, not every detail:

- projects in line;
- projects needing attention;
- critical projects;
- urgent deadlines;
- blocked work;
- pending decisions;
- next actions.

Antonio should be able to understand the situation without asking each collaborator for an update.

## Weekly meeting

The weekly meeting should produce a concrete plan, not a round of status reports:

1. What was planned?
2. What was completed?
3. What was not completed and why?
4. What is blocked?
5. What decisions are needed?
6. What will be done next week?
7. Who owns each action and by when?

The meeting data should remain linked to projects and tasks so the next meeting starts from the previous plan.

## V2 implementation principles

- Keep the existing V1 modules working.
- Extend the existing schema instead of replacing it.
- Keep ASK FER separate.
- Do not seed personal team data in the public repository; enter real people privately in Supabase.
- Prefer one-click status updates and short forms.
- Avoid duplicate data entry.
- Make dependencies and blockers visible.
- Design for desktop and mobile use.
