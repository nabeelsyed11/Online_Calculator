# Online Calculator (Frontend + Backend)

An online calculator with:
- Basic calculator UI (client-side)
- Safe server-side evaluation via mathjs
- Image upload + OCR (Tesseract.js) to extract and solve expressions from pictures
- Notes feature with simple file persistence

## Project Structure

- `backend/`
  - Express server, file uploads, OCR, notes persistence
- `frontend/`
  - React app (CRA structure)

## Prerequisites

- Node.js 18+ and npm

## Setup & Run (Development)

Open two terminals.

Terminal 1 (Backend):
```bash
npm install
npm run dev
```
Run these in the `backend/` directory.

Terminal 2 (Frontend):
```bash
npm install
npm start
```
Run these in the `frontend/` directory. The React dev server proxies API calls to `http://localhost:5000`.

## API Overview (Backend)

- `POST /calculate` { expression: string }
  - Returns `{ result, expression }` using mathjs.
- `POST /upload` (form-data: image)
  - Uploads an image and returns metadata.
- `POST /solve-image` (form-data: image)
  - Runs OCR to extract a math expression and returns `{ recognizedText, expression, result }`.
- `GET /notes`
  - List all notes.
- `POST /notes` { title, content }
  - Create a note.
- `DELETE /notes/:id`
  - Delete a note by id.

## Notes Storage

Notes are persisted to `backend/data/notes.json`. Uploads are stored in `backend/uploads/`.

## Security Notes

- Expression evaluation uses mathjs. Avoid evaluating untrusted input outside of allowed mathjs scope.
- File uploads limited to images and 10 MB. Adjust as needed in `backend/server.js`.

## Troubleshooting

- If OCR is slow on first run, Tesseract will download language data. Internet access is required.
- On Windows camera access, ensure the browser has permission and the device has a camera.

## License

MIT
