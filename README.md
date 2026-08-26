# 🍻 BrewsTraveller

A full-stack, passport-style brewery tracking web application engineered with **dual-backend parity**. BrewsTraveller allows users to seamlessly switch runtime backends on the fly between **Node.js (Express)** and **Python (FastAPI)** while sharing a single **MongoDB Atlas** database and **Vue 3** frontend.

---

## 🚀 Live Deployments

* **Frontend (Vue 3 SPA):** [https://reganbp.github.io/brewstraveller/](https://reganbp.github.io/brewstraveller/)
* **Node.js API (Render):** `https://brewstraveller-node-api.onrender.com`
* **Python API (Render):** `https://brewstraveller-python-api.onrender.com`
* **Interactive OpenAPI Specs:** [FastAPI Swagger Docs](https://brewstraveller-python-api.onrender.com/docs)

---

## 🏗️ Architecture & Stack Overview

```
                        ┌────────────────────────────────────────┐
                        │        Vue 3 + TypeScript SPA         │
                        │       (Hosted on GitHub Pages)         │
                        └───────────────────┬────────────────────┘
                                            │
                                  Runtime Switcher Header
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
       ┌───────────────────────────┐                 ┌───────────────────────────┐
       │   Node.js / Express API   │                 │   Python / FastAPI API    │
       │    (Hosted on Render)     │                 │    (Hosted on Render)     │
       └─────────────┬─────────────┘                 └─────────────┬─────────────┘
                     │                                             │
                     └──────────────────────┬──────────────────────┘
                                            │
                                            ▼
                                ┌───────────────────────┐
                                │  MongoDB Atlas Cloud  │
                                └───────────────────────┘
```

### **Frontend**
* **Framework:** Vue 3 (Composition API, `<script setup>`)
* **Build Tool & Language:** Vite, TypeScript
* **HTTP Client:** Axios with custom timing interceptors for live latency metrics
* **CI/CD:** GitHub Actions deploying to GitHub Pages

### **Backends (Dual Parity)**
* **Node.js Engine:** Express, TypeScript, MongoDB Native Driver (`mongodb`)
* **Python Engine:** FastAPI, Pydantic v2, PyMongo
* **Shared DB Indexing:** 2D Sphere GeoJSON spatial indexing, unique constraint indexes on Google Place IDs

---

## ✨ Key Features

* **Dual-Backend Switcher:** Toggle between Node.js and Python backends in real-time from the top navbar without state loss or page reloads.
* **Passport Analytics:** Tracks total unique breweries visited, travel distance in miles, guided tours taken, and states explored.
* **Location Explorer:** Displays registered brewery locations with GeoJSON coordinates and crowd-sourced amenity lists.
* **Check-In Log:** Complete visit records detailing ratings, notes, transportation mode, trip naming, and observed venue amenities.
* **Live Latency Benchmarking:** Built-in HTTP request timing badge comparing response times across runtimes.

---

## 🛠️ Local Development Setup

### **Prerequisites**
* Node.js v20+
* Python 3.10+
* MongoDB Atlas Cluster (or local MongoDB instance)

### **1. Repository Setup**
```bash
git clone [https://github.com/reganbp/brewstraveller.git](https://github.com/reganbp/brewstraveller.git)
cd brewstraveller
```

### **2. Environment Configuration**
Create a `.env` file in both `api-node` and `api-python`:

**`api-node/.env`**
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
CORS_ORIGIN=http://localhost:5173
```

**`api-python/.env`**
```env
PORT=8000
MONGO_URI=your_mongodb_atlas_connection_string
CORS_ORIGIN=http://localhost:5173
```

### **3. Running the App**

#### **Database Seeding**
```bash
cd api-node
npm install
npx ts-node src/seed.ts
```

#### **Node.js Backend (Port 5000)**
```bash
cd api-node
npm run dev
```

#### **Python Backend (Port 8000)**
```bash
cd api-python
python -m venv .venv
# Activate virtual environment (.venv\Scripts\Activate.ps1 on Windows)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### **Vue 3 Frontend (Port 5173)**
```bash
cd frontend-vue
npm install
npm run dev
```

---

## 📜 API Endpoints

Both backends implement the identical REST contract:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Server status and database health check |
| `GET` | `/breweries` | List all registered breweries |
| `POST` | `/breweries` | Register a new brewery venue |
| `GET` | `/checkins` | Fetch all user passport check-in logs |
| `POST` | `/checkins` | Log a new visit with ratings and amenities |
| `GET` | `/stats` | Aggregated user metrics (miles, tours, states) |
| `GET` | `/amenities` | Aggregated crowd-sourced amenity breakdown |

---

## 📄 License
Distributed under the MIT License.