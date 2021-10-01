from fastapi     import APIRouter

from .auth       import router as auth_router
from .records    import router as records_router
from .tabs       import router as tabs_router
#from .operations import router as operations_router
#from .reports    import router as reports_router


router = APIRouter()
router.include_router(auth_router)
router.include_router(records_router)
router.include_router(tabs_router)

#router.include_router(operations_router)
#router.include_router(reports_router)
