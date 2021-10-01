import uvicorn
from .settings import settings


uvicorn.run(
    'webplatform.app:app',
    host = settings.server_host,    #    host  = '0.0.0.0',
    port = settings.server_port,    #    port  = 81
    reload = True,
)