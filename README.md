# 🏷 A URL shortener with Analytics

> Short one-line description of what this project does.

Example:
A fullstack web application that allows users to book medical appointments online.

---

## 📌 Turn long URLs into short codes, redirect visitors, and track the clicks. The surface is small, but it forces a fast indexed lookup and a click counter that must not lose updates under load. Build it from an empty folder to a deployed, tested, documented service.

Describe the real-world problem this project solves.

Example:
Many small clinics in Cameroon manage appointments manually, leading to double bookings and lost patient records. This application digitizes the booking process.

---


## 🎯 Project Goals

- POST /links — create a short link from { target_url, code?, expires_at? }. 201 · 400 invalid URL · 409 code already taken.
GET /:code — redirect to the target and record a click. 302 · 404 unknown code · 410 expired.
GET /links/:code — link metadata (target, click count, timestamps). 200 · 404.
GET /links/:code/clicks?after=&limit= — keyset-paginated click log. 200 · 404.
GET /links/:code/clicks.csv — streamed CSV of the click log. 200.
DELETE /links/:code — remove a link and its clicks. 204 · 404.
Data model
links (
 id          IDENTITY PRIMARY KEY,
 code        VARCHAR(16) UNIQUE NOT NULL,          -- the indexed lookup key
 target_url  TEXT NOT NULL,
 created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
 expires_at  TIMESTAMPTZ,                          -- NULL = never expires
 click_count INTEGER NOT NULL DEFAULT 0 CHECK (click_count >= 0)
)

clicks (
 id         IDENTITY PRIMARY KEY,
 link_id    INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
 clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 referrer   TEXT,
 user_agent TEXT
)
-- add an index on clicks(link_id, clicked_at) for the log query

Signature feature
The click counter must be atomic and lossless under concurrency — increment in a single statement, never read-then-write:

UPDATE links SET click_count = click_count + 1 WHERE id = $1;

…together with the INSERT into clicks. Lookups by code must hit the unique index (be ready to show it with EXPLAIN). Redirect and expiry semantics must be correct: 302 while live, 410 Gone once expires_at has passed.

---

## 🛠 Tech Stack

**Backend:**  
- Node.js  
- Express  

---
