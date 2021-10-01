from typing                import List, Optional
from fastapi               import APIRouter
from fastapi               import Depends
from fastapi               import Response
from fastapi               import status

from ..models.auth         import User
from ..models.operations   import Operation, OperationKind, OperationCreate, OperationUpdate
from ..services.auth       import get_current_user
from ..services.operations import OperationsService


router = APIRouter(
    prefix = '/operations',
    tags   = ['operations'],
)


@router.get('/', response_model = List[Operation])
def get_operations(
        kind:    Optional[OperationKind] = None,
        user:    User                    = Depends(get_current_user),
        service: OperationsService       = Depends(),
):
    return service.get_list(user_id = user.id, kind = kind)


@router.get('/{operation_id}', response_model = Operation)
def get_operation(
        operation_id: int,
        user:         User              = Depends(get_current_user),
        service:      OperationsService = Depends(),
) -> object:
    return service.get(user_id = user.id, operation_id = operation_id)


@router.post('/', response_model = Operation)
def create_operation(
        operation_data: OperationCreate,
        user:           User              = Depends(get_current_user),
        service:        OperationsService = Depends(),
):
    return service.create(user_id = user.id, operation_data = operation_data)


@router.put('/{operation_id}', response_model = Operation)
def update_operation(
        operation_id:   int,
        operation_data: OperationUpdate,
        user:           User              = Depends(get_current_user),
        service:        OperationsService = Depends(),
):
    return service.update(
        user_id        = user.id,
        operation_id   = operation_id,
        operation_data = operation_data
    )


@router.delete('/{operation_id}')
def delete_operation(
        operation_id: int,
        user:         User              = Depends(get_current_user),
        service:      OperationsService = Depends(),
):
    service.delete(user_id = user.id, operation_id = operation_id)
    return Response(status_code = status.HTTP_204_NO_CONTENT)
