"""Celery entrypoint for the project.

Create a module-level `celery` object so the Celery CLI can import it
with `-A celery_worker.celery`.
"""
import os
import sys

# Add the backend directory to sys.path so app can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.celery_app import make_celery


# Create Flask app and Celery for the CLI to import
flask_app = create_app('development')
celery = make_celery(flask_app)
