# Linux Setup: Connect Frontend to Backend (Ground & Crew)

## 1. Prerequisites

- Node.js (v18+ recommended)
- npm (comes with Node.js)
- git

## 2. Clone the Repository

```
git clone https://github.com/Blackphenixlord/full-NASA.git
cd full-NASA
```

## 3. Install Dependencies (Backend & Frontend)

```
# Backend
cd dlsm-temp/dlsm-inv-sys-client-main/services/edge-server
npm install

# Frontend (Ground)
cd ../../../../web
npm install

# Frontend (Crew)
cd ../../../../nasa-hunch
npm install
```

## 4. Configure Backend for Linux

- Edit `.env` in `dlsm-temp/dlsm-inv-sys-client-main/services/edge-server/` if needed.
- Make sure the server listens on all interfaces:
  - In `server.mjs`, the line should be:
    ```js
    await app.listen({ port, host: "0.0.0.0" });
    ```
- For demo data, set `NO_DB=1` in your environment or `.env` file.

## 5. Start the Backend

```
cd dlsm-temp/dlsm-inv-sys-client-main/services/edge-server
NO_DB=1 node src/server.mjs
```

## 6. Set Frontend API Base URLs

- In both `web/src` (Ground) and `nasa-hunch/src` (Crew), edit the API base:
  - Open `lib/apiBase.ts` in each frontend.
  - Set:
    ```ts
    export const API_BASE = "http://<JETSON_IP>:8080/api";
    ```
    Replace `<JETSON_IP>` with your Jetson's actual IP address (e.g., 192.168.1.98).

## 7. Start the Frontends

```
# Ground
cd web
npm run dev -- --host

# Crew
cd nasa-hunch
npm run dev -- --host
```

- The `--host` flag allows access from other devices on the network.

## 8. Access the Apps

- On any device on the same network, open:
  - Ground: `http://<JETSON_IP>:5173/ground`
  - Crew: `http://<JETSON_IP>:5173/crew`

## 9. Troubleshooting

- If you see CORS errors, make sure the backend always sends CORS headers for all routes.
- If you can't connect, check firewalls and that the Jetson's IP is correct.
- Use `curl http://<JETSON_IP>:8080/api/config?mode=crew` to test backend from another machine.

---

This setup ensures both the ground and crew frontends connect to the backend using the correct IP, and works on Linux.
