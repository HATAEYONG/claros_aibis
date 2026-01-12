# Gunicorn Configuration File for NetPlus MIS-AI Dashboard
# AWS Lightsail 배포용 설정

import multiprocessing
import os

# Server socket
bind = "127.0.0.1:8000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 2

# Process naming
proc_name = "netplus_mis"

# Logging
accesslog = "/var/log/netplus-mis/access.log"
errorlog = "/var/log/netplus-mis/error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process management
daemon = False
pidfile = "/var/run/netplus-mis/gunicorn.pid"
user = None
group = None
tmp_upload_dir = None

# SSL (HTTPS를 사용할 경우)
# keyfile = "/path/to/ssl/key.pem"
# certfile = "/path/to/ssl/cert.pem"

# Server mechanics
preload_app = True
sendfile = True
reuse_port = True
chdir = "/var/www/netplus-mis/backend"
