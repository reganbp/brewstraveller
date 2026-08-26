# BrewsTraveller 🍻

An architecture-focused, polyglot travel passport application designed to showcase interchangeability, contract-first API design, and MongoDB aggregation pipelines across distinct backend runtimes.

![Vue 3](https://img.shields.io/badge/Frontend-Vue%203%20%7C%20TypeScript-4FC08D)
![Node.js](https://img.shields.io/badge/Backend%201-Node.js%20%7C%20Express-339933)
![Python](https://img.shields.io/badge/Backend%202-Python%20%7C%20FastAPI-3776AB)
![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248)

---

## 🏛 System Architecture

The application decouples presentation from data services using an identical **OpenAPI 3.0 specification**. A single SPA instance seamlessly toggles between two isolated backend runtimes in real time:

- **Frontend:** Vue 3 (Composition API, TypeScript, Vite, Tailwind CSS). Features live backend ping benchmarks and reactive state persistence.
- **Node.js API (/api-node):** Express + TypeScript using the official native MongoDB driver.
- **Python API (/api-python):** FastAPI + Async Motor driver with Pydantic V2 schema validation.
- **Database:** Shared MongoDB Atlas cluster utilizing GeoJSON geospatial indexing and dynamic multi-stage aggregation pipelines.

## 💡 Principal Software Engineering Highlights

* **Contract-First Interchangeability:** Neither backend relies on custom client logic. The Vue frontend switches endpoints on the fly while computing round-trip HTTP latency metrics.
* **Crowd-Sourced Amenity Aggregations:** Amenities are recorded at the check-in level rather than hardcoded to brewery profiles. Both APIs execute $unwind and $group MongoDB aggregation pipelines to calculate dynamic "User-Reported" tags.
* **Type Safety Across Ecosystems:** Strict typing contracts maintained via TypeScript interfaces in Node and Pydantic models in FastAPI.
* **Legacy Prototype Reference:** Prior single-stack React iteration preserved for historical reference [here](https://github.com/reganbp/brewstraveller-react-legacy).

## 🚀 Running Locally

`ash
# 1. Clone repository
git clone [https://github.com/reganbp/brewstraveller.git](https://github.com/reganbp/brewstraveller.git)
cd brewstraveller

# 2. Run Node.js API (Port 8080)
cd api-node
npm install
npm run dev

# 3. Run Python FastAPI (Port 8000)
cd ../api-python
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 4. Run Vue 3 Frontend
cd ../frontend-vue
npm install
npm run dev
