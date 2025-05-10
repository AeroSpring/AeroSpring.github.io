from sqlalchemy            import create_engine
from sqlalchemy.orm        import sessionmaker
from sqlalchemy.engine.url import URL
#from sqlalchemy.exc       import psycopg2
# import psycopg2
from .settings             import settings

# sqlite database connection:
#engine = create_engine(
#    settings.database_url,
#    connect_args = {'check_same_thread': False},
#)

# postgres database connection:
engine = create_engine(
#    URL( **settings.connection_data ) # 20230228 after update sqlalchemy to 2.0.4 : don't work
    'postgresql+psycopg2://' + settings.connection_data['username'] + ':' +
                               settings.connection_data['password'] + '@' +
                               settings.connection_data['host']     + '/' +
                               settings.connection_data['database']
)

Session = sessionmaker(
    engine,
    autocommit = False,
    autoflush  = False,
)


def get_session() -> Session:
    session = Session()
    try:
        yield session
    finally:
        session.close()

