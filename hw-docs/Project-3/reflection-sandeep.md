# Personal Reflection — Joining Prova Mid-Project

**Author:** Sandeep Samuel Jayakumar

---

## Coming In Late

I joined the Prova project mid-sprint, which meant walking into a codebase that was already alive. The architecture was already decided, the design system was in place, the Supabase tables had RLS policies, and the three-agent SR 11-7 assessment pipeline was already running. There was no blank slate to reason from — just a lot of existing decisions I had to understand quickly, and a team that had been moving without me.

That's a humbling position to be in. You can't pretend you were there for the reasoning behind every choice. You either catch up or you slow everyone down.

---

## What Abhishek and Derek Made Possible

Catching up as fast as I did wasn't something I could have managed on my own. Abhishek and Derek had built something unusually well-documented for a project at this stage. The `CLAUDE.md` file, the `docs/` directory with dedicated files for architecture, scoring, agent design, error states — these weren't written for a course submission. They read like something written by people who actually expected to come back to this codebase six months later and still understand it.

That documentation was the first thing I read when I joined, and it saved me. Instead of spending a week reverse-engineering how the scoring formula worked or why the Supabase client was split into browser, server, and middleware versions, I could just read `ARCHITECTURE.md` and `SCORING.md`. I went from knowing nothing about Prova to being able to make a real contribution significantly faster than I had any right to expect.

Beyond the documentation, both Abhishek and Derek were straightforwardly helpful when I had questions. There's a version of joining a mid-project team where the existing members are protective of what they've built and quietly skeptical of the newcomer. That wasn't my experience here. When I needed to understand how the agent orchestrator handled failures, or why certain validation rules were structured the way they were in `schemas.ts`, I got clear explanations. No friction.

---

## What I Actually Did

My work centered on extending what the team had built rather than building from scratch — which felt like the right scope given when I joined.

On the validation side, I worked through a full TDD cycle on the Zod schemas that validate inputs across the application: login, signup, and document uploads. The file existed but was empty (`export {}`). Writing the tests first — 14 of them, all failing before any implementation — forced me to think carefully about exactly what the schema needed to guarantee. It was a slower way to work than I was used to, but the constraint was useful. When I finally wrote the implementation, I had a precise specification to hit, not a vague sense of "this should work."

On the workflow side, I built and iterated on a custom slash command (`/validate-agents`) for Claude Code that structured how I ran the AI regression suite. The v1 version was functional but naive — it didn't help much when tests failed. The v2 version introduced a failure taxonomy that forced me to classify what kind of failure I was looking at before touching any code. That single addition saved a significant amount of debugging time. The specific case that prompted it: I spent 45 minutes adjusting an agent prompt when the actual problem was a `max_tokens` truncation that had nothing to do with the prompt content. The taxonomy would have caught that in under five minutes.

I also connected the Supabase MCP server to give Claude Code direct read access to the database. The practical benefit was eliminating the context switch between making a code change and verifying what actually got persisted. That back-and-forth between the IDE and the Supabase dashboard was a small friction point, but it compounded. Having it all in one session changed how I debugged data-layer issues.

---

## What I Learned About Joining Mid-Project

There's a specific skill to joining a project after it's already running that I hadn't thought of as a distinct skill before this. It's not just "get up to speed quickly." It's closer to: learn to read the existing decisions charitably before you start having opinions about them.

Early on, I had a moment where I thought the split between the browser and server Supabase clients seemed unnecessarily complicated. My first instinct was that it could be simplified. After reading the architecture documentation more carefully, I understood why the split existed — server-side session verification on every API route, defense in depth against client-side auth bypasses, RLS as a fallback layer. The complexity was load-bearing. The instinct to simplify it would have broken something.

That's the lesson I'm carrying forward: the cost of a late join is that you don't have the context for why things are the way they are. The correct response to that is curiosity, not judgment. Read everything. Ask the people who were there. Form opinions slowly.

---

## Going Forward

The work I contributed fits into a larger arc that Abhishek and Derek established: a codebase where the feedback loop between making a change and knowing whether it worked is as short and cheap as possible. The custom skill and MCP integration were two more steps in that direction. The pre-commit hooks, read-only score queries, and isolated sub-agent retries I outlined in my retrospective would push it further.

I'm glad I joined when I did, even if the timing was awkward. Working within a system that Abhishek and Derek had thought through carefully was a better learning experience than building something simpler from scratch would have been. The constraints they'd already set — strict TypeScript, centralized schemas, no `dangerouslySetInnerHTML`, meaningful commit messages — are the kind of decisions that feel like overhead until you need them.

---

*Prova: SR 11-7 model documentation compliance checker. Next.js 16 · TypeScript · Supabase · Anthropic Claude Haiku 4.5.*