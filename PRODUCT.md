# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences of equal weight, each arriving with a different job:

- **Engineering recruiters and hiring managers** for VLSI, RTL design, verification, and digital design internships. They want to judge technical depth quickly and leave with the RTL Design resume.
- **Creative clients and collaborators** for video editing and graphic design work. They want to see the edits and visual taste, and leave with the Graphic Design resume or a contact.

Club members, event collaborators, and peers also visit, but neither path is designed around them.

## Product Purpose

A personal portfolio for Divesh Reddy, an Electronics & Communication Engineering student at Manav Rachna University. It shows his work across VLSI/RTL design, technical community leadership (Coordinator, Digital Nexus), and video editing, and routes each visitor to the right resume or to contact.

Success: a visitor from either audience finds their side of the work fast, sees enough real evidence to take it seriously, and reaches out or downloads the matching resume.

## Positioning

Range is the point. Divesh is genuinely multi-disciplinary: hardware design, building communities, and creative work count equally rather than one being the "real" job and the others hobbies. The portfolio should make that breadth read as one coherent person, not three unrelated CVs stapled together.

## Operating Context

- Visitors typically arrive from a resume, LinkedIn, a job application, or an event, often on a phone.
- Two resumes are offered side by side: `assets/resume-rtl-design.pdf` and `assets/resume-graphic-design.pdf`.
- Contact happens via email, LinkedIn, and GitHub.
- Content is kept in `js/data/portfolio-data.js` (VLSI projects, leadership events, journey, event gallery); video and photo media are hosted on Cloudinary.

## Capabilities and Constraints

- Single-page site. Sections today: hero, About, VLSI & Digital Design, Leadership & Events (with event gallery), Video Editing, Contact.
- **Explore Me paths are a fixed commitment.** Choosing a path (VLSI / RTL, Events & Leadership, Freelancing, Video Editing) stays as the core navigation idea, since it directly expresses the two-audience, range-first positioning. The owner approved (2026-11-13) presenting the paths as always-visible choices on the first screen rather than behind a dialog. A fourth path, Freelancing (gold, `--work`, section `#work`), was added on 2026-11-15.
- The current stack (static HTML, Tailwind, vanilla JS, Vite) works and is the default, but the owner has not made it binding.
- The current dark theme, 3D lanyard, and Spline robot are incumbent features, not commitments; future work may keep or replace them on their merits.
- Open to: internships, collaborations, creative projects.

## Brand Commitments

- Name: Divesh Reddy. Tagline in use: "Engineer · Creator · Builder".
- Voice in current copy: first person, plain, confident without hype ("I build digital systems, lead technical communities, and turn ideas into visual stories.").

## Evidence on Hand

- **VLSI / embedded projects** (`js/data/portfolio-data.js`): UART TX/RX, Traffic Light Controller and 4-bit ALU (public repos, with simulation waveforms in `assets/vlsi/`), Smart Radar System (Arduino), 6 DOF Robotic Arm.
- **Leadership / events** (Digital Nexus): Arduino Workshop, Flyer Making Competition, C-Race, Startup Autopsy, IOTvate, Creovate, and other technical events; event gallery photos on Cloudinary.
- **Freelancing** (section `#work`, films in `assets/freelance/`; personal project films in `assets/projects/`). *Client work:* VENOMOS, VenoPatch Medical Technology Ecosystem (Healthcare / MedTech, 2026): website, React Native app and launch film; live site on a temporary `tmp.now` URL. Brainy Circuits, Virtual Arduino Lab (EdTech, 2026): 2:43 launch ad for brainycircuits.com; tools not yet confirmed. **Projects** (section `#projects`; personal work, never presented as freelance or client work; each card links to its GitHub repo; the repos were still private on 2026-11-15, so the links 404 for visitors until made public): Agrinex (smart urban farming dashboard, live at agrinex-eight.vercel.app), Seekora (offline semantic file search; its DriveCore FPGA part is not built yet, so it is not claimed), EcoLens (AI waste classifier), Assignment Portal (uploads with emailed confirmation codes).
- **Video**: one featured edit plus five shorts (Elevate Yourself, Video Edit, Sir Lewis Hamilton, Mad Maxxx, El Clásico), hosted on Cloudinary.
- **Resumes**: RTL Design and Graphic Design PDFs in `assets/`.
- **Links**: GitHub (diveshreddy-ece), LinkedIn, email.

Absences future work must not fill with invented content: RTL diagrams are not yet available (every VLSI/embedded project now has a waveform or build photo); the event gallery is incomplete; there are no testimonials, metrics, employer names, or awards beyond the one listed below. Do not fabricate any of these.

**Recognition on hand:** Certificate of Appreciation and plaque, Creovate 2K25 Tech Fest (ECE department), for managing the fest's social media and marketing (`assets/leadership/creovate-award.jpg`). This is the only award; do not imply others.

## Product Principles

1. **Two front doors, one person.** Each audience should reach its side of the work and its resume without wading through the other, while still sensing the full range.
2. **Breadth is the claim, so each side must hold up alone.** VLSI work must read as credible to an engineer and video work as credible to a creative client; range only impresses when no side looks like filler.
3. **Show the real artifact.** Real projects, real edits, real event photos. Where evidence is missing, leave a clear gap rather than a placeholder that pretends.
4. **Fast to evaluate.** Recruiters and clients skim; the path from landing to proof to resume or contact should be short on any device.
