from celery import Celery


def make_celery(app):
    """Create and configure a Celery instance tied to the Flask app."""
    broker = app.config.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    celery = Celery(app.import_name, broker=broker)

    # Copy relevant config values
    celery.conf.update({k: v for k, v in app.config.items() if isinstance(k, str)})

    # Respect a simple development flag to run tasks eagerly (no broker required)
    celery.conf.task_always_eager = app.config.get('CELERY_TASK_ALWAYS_EAGER', False)

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery
