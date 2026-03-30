"""
Structured logging configuration for ERP MIS-AI system
Compatible with Windows and Linux environments.
"""

import logging
from pythonjsonlogger.jsonlogger import JsonFormatter


class StructuredFormatter(JsonFormatter):
    """Custom JSON formatter with additional context"""

    def add_fields(self, log_record, record, message_dict):
        super(StructuredFormatter, self).add_fields(log_record, record, message_dict)
        log_record['app'] = 'erp-mis-ai'
        
        import os
        log_record['environment'] = os.getenv('ENVIRONMENT', 'development')
        
        if not log_record.get('timestamp'):
            from datetime import datetime
            log_record['timestamp'] = datetime.utcnow().isoformat()
        
        log_record['thread_name'] = record.threadName
        log_record['process_id'] = record.process


class ElasticsearchIndexFilter(logging.Filter):
    """Filter for Elasticsearch log indexing"""
    
    def filter(self, record):
        import os
        from datetime import datetime
        
        date_suffix = datetime.now().strftime('%Y.%m.%d')
        record.es_index = f"erp-mis-ai-{date_suffix}"
        record.es_environment = os.getenv('ENVIRONMENT', 'development')
        record.es_app = 'erp-mis-ai'
        
        return True


def get_structured_logger(name):
    """Get a logger configured for structured logging"""
    return logging.getLogger(name)
