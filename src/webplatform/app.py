from fastapi import FastAPI
from .api    import router


tags_metadata = [
    {
        'name': 'auth',
        'description': 'Авторизация/регистрация',
    },
    {
        'name': 'records',
        'description': 'Записи',
    },
    {
        'name': 'tabs',
        'description': 'Вкладки',
    },
]


app = FastAPI(
    title        = 'WebPlatform',
    description  = 'Web platform',
    version      = '1.0.0',
    openapi_tags = tags_metadata,
)
app.include_router(router)
