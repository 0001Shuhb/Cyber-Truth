# run.py
"""
Application entry point.

For development:
    python run.py

For production (with Gunicorn):
    gunicorn "run:app" --workers 4 --bind 0.0.0.0:5000

WHY GUNICORN IN PRODUCTION?
Flask's built-in server (Werkzeug) is single-threaded. It handles one
request at a time. If two users scan URLs simultaneously, the second
waits. Gunicorn is a production WSGI server that spawns multiple worker
processes (each a full Python interpreter), enabling true parallelism.

--workers 4 means 4 worker processes. Rule of thumb: 2 × CPU cores + 1.
For a 2-core server: 2 × 2 + 1 = 5 workers.
"""

import os
import sys

# Add the backend directory to sys.path so app can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app

# Create the app using the environment from FLASK_ENV (or 'development')
app = create_app(os.environ.get('FLASK_ENV', 'development'))

if __name__ == '__main__':
    # debug=True enables:
    # 1. Auto-reload when code changes
    # 2. Interactive debugger in browser on errors
    # 3. Verbose error messages
    # NEVER run with debug=True in production!
    # Bind only to localhost and disable the interactive debugger for safety
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=False,
    )