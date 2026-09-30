# MarketLink frontend

The public React site uses the Express/MongoDB API in `../backend`. Admin, farmer and customer HTML panels are served from the backend `/panels/` paths. The Login button opens the backend login form.

Run the backend first, then run `npm run dev` in this folder. The first frontend run installs missing packages automatically. Open the URL printed by Vite, usually `http://localhost:5173`.

If the backend selected a port other than 5000, create `frontend/.env` with `VITE_BACKEND_URL=http://localhost:5001` using the actual port. Restart Vite afterward. Vite forwards `/api`, `/panels` and panel assets to the backend.

For Netlify, first host the Express backend and MongoDB online. Set the Netlify build variable `BACKEND_URL` to the backend HTTPS origin (without `/api`). `npm run build` generates proxy routes and a React page fallback in `dist/_redirects`. Set backend `CLIENT_ORIGIN` to your Netlify URL. Netlify hosts the static React site and proxies API and HTML panels; it does not run this Express server or MongoDB.

Also set public `VITE_TEAM_EMAIL`, `VITE_TEAM_PHONE` and `VITE_TEAM_ADDRESS` before building. They are shown on Contact Us; keep admin and SMTP secrets only on the backend host.
