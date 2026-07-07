def register_celery_tasks(celery):
    """Register lightweight Celery tasks used by the app.

    Tasks are small wrappers that call into the existing service layer
    (e.g., `app.services.ai_narrator`) so the heavy work runs in the
    background worker process (or eagerly in development).
    """

    @celery.task(name='tasks.generate_url_narrative')
    def generate_url_narrative_task(scan_id, prediction, indicators):
        """Generate narrative for a URL scan and persist it to the Scan record.

        Args:
            scan_id (str): Scan.id to update
            prediction (dict): prediction dict (probability, label)
            indicators (list): list of indicator dicts
        """
        from .services.ai_narrator import generate_url_narrative
        from .models.scan import Scan
        from .extensions import db

        # Load scan to get original input (url)
        scan = Scan.query.get(scan_id)
        if not scan:
            return None

        try:
            narrative = generate_url_narrative(scan.input_data, prediction, indicators)
            scan.ai_analysis = narrative
            db.session.add(scan)
            db.session.commit()
            return narrative
        except Exception as e:
            # Log and re-raise for visibility in worker logs
            from flask import current_app
            current_app.logger.error(f'URL narrative task failed for scan={scan_id}: {e}')
            raise

    @celery.task(name='tasks.generate_website_narrative')
    def generate_website_narrative_task(scan_id, features, prediction, indicators):
        from .services.ai_narrator import generate_website_narrative
        from .models.scan import Scan
        from .extensions import db

        scan = Scan.query.get(scan_id)
        if not scan:
            return None

        try:
            narrative = generate_website_narrative(scan.input_data, features, prediction, indicators)
            scan.ai_analysis = narrative
            db.session.add(scan)
            db.session.commit()
            return narrative
        except Exception as e:
            from flask import current_app
            current_app.logger.error(f'Website narrative task failed for scan={scan_id}: {e}')
            raise

    @celery.task(name='tasks.generate_email_narrative')
    def generate_email_narrative_task(scan_id, email_excerpt, prediction, indicators):
        from .services.ai_narrator import generate_email_narrative
        from .models.scan import Scan
        from .extensions import db

        scan = Scan.query.get(scan_id)
        if not scan:
            return None

        try:
            narrative = generate_email_narrative(email_excerpt, prediction, indicators)
            scan.ai_analysis = narrative
            db.session.add(scan)
            db.session.commit()
            return narrative
        except Exception as e:
            from flask import current_app
            current_app.logger.error(f'Email narrative task failed for scan={scan_id}: {e}')
            raise

    # Expose assigned task functions for direct import if desired
    return {
        'generate_url_narrative': generate_url_narrative_task,
        'generate_website_narrative': generate_website_narrative_task,
        'generate_email_narrative': generate_email_narrative_task,
    }
