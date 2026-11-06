# 🏷  URL Shortener

> A REST API that allows users to turn long URLs into short links, redirect visitors to the original pages, and track how many times the links are clicked.

---

## 📌 Problem Statement

Long URLs can sometimes be inconvenient to share, especially when they contain many characters. They can be difficult to copy, remember, or share with others.

I built this project to make sharing links easier. It allows users to convert long URLs into shorter ones that can be shared easily. When someone opens a short link, they are redirected to the original page. It also allows users to keep track of clicks, view click history, and set expiration dates for their links.

---

## 🎯 Project Goals

- Allow users to create short links from long URLs.
- Allow users to choose their own short codes.
- Redirect visitors to the original URLs.
- Keep track of the number of clicks on each link.
- Allow users to view click history.
- Allow users to set expiration dates for links.
- Allow users to export click history as CSV.
- Allow users to view link details and delete links.

---

## 🛠 Tech Stack

**Backend:**
- Node.js
- Express.js

**Database:**
- PostgreSQL

**Validation:**
- Zod

**Testing:**
- Node.js `node:test`

**Other Tools:**
- Git & GitHub
- Postman
- Swagger UI / OpenAPI
- ESLint
- npm

---

## 🖥 Features

- Create short links from long URLs.
- Choose custom short codes.
- Redirect visitors to the original pages.
- Track clicks and maintain a click counter.
- View link details and click history.
- Navigate through click history using keyset pagination.
- Set expiration dates for links.
- Return the correct response for expired or unknown links.
- Export click history as CSV.
- Delete links and their associated click records.
- Validate incoming data using Zod.
- Use PostgreSQL constraints and parameterized queries.
- Handle multiple clicks without losing counter updates.
- Access API documentation through Swagger UI.
- Check API availability through the health endpoint.

---

## 📷 Screenshots

(Add screenshots here)

- Short link creation in Postman.
- Successful redirection to the original URL.
- Link details and click count.
- Click history.
- CSV export.
- Swagger UI.
- Automated test results.

---

## 🔗 Live Demo

Backend API: Not deployed yet.
API Documentation: `http://localhost:3000/docs`
Health Check: `http://localhost:3000/health`

---

## ⚙ Installation & Setup

Clone the repository:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd URL_Shortener
```

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root:

```env
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/url_shortener
TEST_DATABASE_URL=postgresql://username:password@localhost:5432/url_shortener_test
```

Replace the database credentials with your PostgreSQL details.

Create the `url_shortener` and `url_shortener_test` databases, then run the SQL schema in `src/db/schema.sql` against both databases.

Run the project:

```bash
npm start
```

For development:

```bash
npm run dev
```

Run automated tests:

```bash
npm test
```

Run ESLint:

```bash
npm run lint
```

---

🧠 Challenges Faced

- Making sure the click counter works correctly when multiple visitors access the same link at the same time.
- Keeping click records and the click counter consistent using database transactions.
- Implementing keyset pagination for click history.
- Handling expired links and returning the correct HTTP status codes.
- Preventing SQL injection by using parameterized queries.
- Setting up a separate database for automated testing.

---

📚 What I Learned

- How to build REST APIs using Node.js and Express.
- How to work with PostgreSQL and database constraints.
- How to validate incoming data using Zod.
- How to write parameterized SQL queries.
- How to work with database transactions.
- How to handle concurrent requests.
- How to implement keyset pagination.
- How to write automated tests using `node:test`.
- How to document APIs using OpenAPI and Swagger UI.
- How to use Git, GitHub, and ESLint in a backend project.

---

Future Improvements

- Add top-referrer analytics.
- Implement rate limiting.
- Add a background process to handle expired links.
- Generate QR codes for short URLs.
- Deploy the API.

---

👨🏽‍💻 Author

**Losha Stanice**

Junior Backend Developer

📩 Email: Your email address

🌍 Based in Cameroon | Open to remote opportunities