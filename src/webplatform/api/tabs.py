from typing          import List
from fastapi         import APIRouter
from fastapi         import Depends
from fastapi         import Response
from fastapi         import status

from ..models.auth   import User
from ..models.tabs   import Tab, TabCreate, TabUpdate
from ..services.auth import get_current_user
from ..services.tabs import TabsService


router = APIRouter(
    prefix = '/tabs',
    tags   = ['tabs'],
)


@router.get('/', response_model = List[Tab])
def get_tabs(
        user    : User        = Depends(get_current_user),
        service : TabsService = Depends(),
):
    return service.get_list(user_id = user.id)


@router.get('/{tab_id}', response_model = Tab)
def get_tab(
        tab_id  : int,
        user    : User        = Depends(get_current_user),
        service : TabsService = Depends(),
) -> object:
    return service.get(user_id = user.id, tab_id = tab_id)


@router.post('/', response_model = Tab)
def create_tab(
        tab_data : TabCreate,
        user     : User        = Depends(get_current_user),
        service  : TabsService = Depends(),
):
    return service.create(user_id = user.id, tab_data = tab_data)


@router.put('/{tab_id}', response_model = Tab)
def update_tab(
        tab_id   : int,
        tab_data : TabUpdate,
        user     : User        = Depends(get_current_user),
        service  : TabsService = Depends(),
):
    return service.update(
        user_id  = user.id,
        tab_id   = tab_id,
        tab_data = tab_data
    )


@router.delete('/{tab_id}')
def delete_tab(
        tab_id  : int,
        user    : User        = Depends(get_current_user),
        service : TabsService = Depends(),
):
    service.delete(user_id = user.id, tab_id = tab_id)
    return Response(status_code = status.HTTP_204_NO_CONTENT)
