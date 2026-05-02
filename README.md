# Inventory Management System

## Setup

### Backend

1. Create and activate a Python virtual environment.
2. Install dependencies:

```powershell
pip install -r backend/requirements.txt
```

3. Create a local env file:

```powershell
Copy-Item backend/.env.example backend/.env
```

4. Update `backend/.env` with your PostgreSQL credentials.
5. Run migrations:

```powershell
cd backend
python manage.py migrate
```

6. Start the backend server:

```powershell
python manage.py runserver
```

### Frontend

1. Install frontend dependencies:

```powershell
cd frontend
npm install
```

2. Start the frontend:

```powershell
npm run dev
```

## Notes

- Backend dependencies are in `backend/requirements.txt`.
- Frontend dependencies are in `frontend/package.json`.
- The project uses PostgreSQL, so your local database must exist before starting the backend.
