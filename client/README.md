# Remindme client

React 19 + TypeScript + Vite frontend for the Car Service Reminder System. Start the development server from this folder with `npm run dev`; create a production build with `npm run build`.

The client uses Redux Toolkit and RTK Query for authentication state and all Express API data, including records, reports, appointment slots, and bookings. It uses `http://localhost:5000/api` during development; set `VITE_API_URL` to use a different API origin.

## SEO files

The production build publishes `sitemap.xml` and `robots.txt` from `client/public`. Before deploying, replace `http://localhost:5173` in both files with the public frontend URL.
