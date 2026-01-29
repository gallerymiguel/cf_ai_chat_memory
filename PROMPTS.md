# PROMPTS.md
This file lists the AI-assisted prompts used during development of the
Cloudflare AI Memory Chat application, as required by the assignment.

Only development-related prompts are included. Debugging messages, small fixes,
or unrelated conversation were excluded to keep the file focused.

---

## 1. Worker + Durable Object Prompts

**Prompt:**  
"Help me create a Cloudflare Worker with an `/api/chat` endpoint that sends user
messages to a Durable Object. The Durable Object should store prior messages,
call Workers AI using LLaMA 3.3, append the response, and return it."

**Prompt:**  
"Write a Durable Object class with `fetch()` handling, internal storage,
and logic for loading/saving chat history."

**Prompt:**  
"How do I bind Workers AI and Durable Objects together inside wrangler.jsonc?"

---

## 2. Frontend (React + Vite) Prompts

**Prompt:**  
"Generate a simple React chat interface with an input box, message bubbles,
and a scrolling message window."

**Prompt:**  
"How do I call my Cloudflare Worker endpoint from the frontend using fetch(),
passing sessionId and message?"

**Prompt:**  
"Fix the UI so the chat stays scrolled to the bottom after new messages."

---

## 3. Memory Logic / Debugging Prompts

**Prompt:**  
"Why is my Durable Object not remembering previous messages? Show me how to
debug storage writes/reads."

**Prompt:**  
"How can I make the LLM respond with context from earlier messages?"

**Prompt:**  
"Test queries: How do I verify that the DO memory actually works using curl?"

---

## 4. Deployment Prompts

**Prompt:**  
"Walk me through deploying a Cloudflare Worker with wrangler deploy."

**Prompt:**  
"How do I configure Cloudflare Pages to use my Worker backend using
VITE_API_BASE?"

**Prompt:**  
"What should my Pages build command and output directory be for a Vite app?"

---

## 5. README / Documentation Prompts

**Prompt:**  
"Generate a professional README for a Cloudflare AI app including architecture,
features, deployment instructions, and testing examples."

**Prompt:**  
"Where should screenshot sections go inside the README?"

---

## 6. Notes
Only prompts that directly contributed to building this project are included,
following Cloudflare’s originality rules. All code decisions, debugging,
and final implementation were performed specifically for this assignment.
