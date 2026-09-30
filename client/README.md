# AXON Admin Client

This is the consolidated AXON frontend client. The previous duplicate root `src/` application has been separated from this client; this folder contains the current Admin Panel implementation and its shared mock data.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL shown by Vite, normally `http://localhost:5173/`.

## Structure

```text
client/
├── public/
├── src/
│   ├── assets/
│   ├── components/admin/
│   ├── layouts/
│   ├── mockData/
│   ├── pages/admin/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

The duplicate `src/mockData/mockData/` folder is intentionally removed. The canonical mock-data folder is `src/mockData/`.
