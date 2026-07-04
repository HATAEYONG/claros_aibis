# Gunicorn Configuration File for Claros MIS-AI Dashboard
# AWS Lightsail 배포용 설정

import multiprocessing
import os

# Server socket
bind = "0.0.0.0:8000"
backlog = 2048

# Worker processes
# Override with GUNICORN_WORKERS for memory-constrained hosts; each worker
# loads the full app (AI agent framework, models) independently in memory.
workers = int(os.getenv("GUNICORN_WORKERS", multiprocessing.cpu_count() * 2 + 1))
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2

# Process naming
proc_name = "claros_mis"

# Logging
accesslog = "-"  # stdout
errorlog = "-"   # stderr
loglevel = "info"

# Process management
daemon = False
pidfile = None
user = None
group = None
tmp_upload_dir = None

# SSL (HTTPS를 사용할 경우)
# keyfile = "/path/to/ssl/key.pem"
# certfile = "/path/to/ssl/cert.pem"

# Server mechanics
preload_app = False
sendfile = True
reuse_port = True
chdir = "/app"
