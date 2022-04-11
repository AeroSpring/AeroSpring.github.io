from typing             import List
from fastapi            import APIRouter
from fastapi            import Depends
from fastapi            import Response
from fastapi            import status

from ..models.auth      import User
from ..models.records   import Record, RecordCreate, RecordUpdate
from ..services.auth    import get_current_user
from ..services.records import RecordsService


router = APIRouter(
    prefix = '/records',
    tags   = ['records'],
)


@router.get('/{tab_id}', response_model = List[Record])
def get_records(
        tab_id  : int,
        user    : User           = Depends(get_current_user),
        service : RecordsService = Depends(),
):
    return service.get_list(user_id = user.id, tab_id = tab_id)


#@router.get('/{tab_id}&{record_id}', response_model = Record)
@router.get('/{record_id}', response_model = Record)
def get_record(
#       tab_id      : int,
        record_id   : int,
        user        : User           = Depends(get_current_user),
        service     : RecordsService = Depends(),
) -> object:
    return service.get(
        user_id   = user.id,
#       tab_id    = tab_id,
        record_id = record_id
    )


@router.post('/', response_model = Record)
def create_record(
        record_data : RecordCreate,
        user        : User           = Depends(get_current_user),
        service     : RecordsService = Depends(),
):
    return service.create(user_id = user.id, record_data = record_data)


@router.put('/{record_id}', response_model = Record)
def update_record(
        record_id   : int,
        record_data : RecordUpdate,
        user        : User           = Depends(get_current_user),
        service     : RecordsService = Depends(),
):
    return service.update(
        user_id     = user.id,
        record_id   = record_id,
        record_data = record_data
    )


@router.delete('/{record_id}')
def delete_record(
        record_id: int,
        user     : User           = Depends(get_current_user),
        service  : RecordsService = Depends(),
):
    service.delete(user_id = user.id, record_id = record_id)
    return Response(status_code = status.HTTP_204_NO_CONTENT)
