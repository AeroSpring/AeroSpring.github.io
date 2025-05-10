from pydantic import BaseSettings


class Settings(BaseSettings):
    server_host     : str  = '0.0.0.0'
    server_port     : int  = 81

#   database_url    : str  = 'sqlite:///./database.sqlite3'
    connection_data : dict = {
        # 'drivername': 'postgresql+psycopg2',    # тут можно задать другой драйвер: 'postgres' (указав порт), или MySQL
        'host'      : 'localhost',
        'port'      : '5432',
        'username'  : 'postgres',
        'password'  : '271828',
        'database'  : 'notes_db'
    }

    jwt_secret      : str             # [from .env]
    jwt_algorithm   : str  = 'HS256'
    jwt_expiration  : int  = 3600      # [sec]


class SettingsLocalServer(BaseSettings):
    server_host     : str  = '127.0.0.1'
    server_port     : int  = 8000
    database_url    : str  = 'sqlite:///./database.sqlite3'

    jwt_secret      : str             # [from .env]
    jwt_algorithm   : str  = 'HS256'
    jwt_expiration  : int  = 3600      # [sec]


settings = Settings(
    _env_file             = '.env',
    _env_file_encoding    = 'utf-8',
)
