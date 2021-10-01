# Part 3

from fastapi                    import APIRouter, BackgroundTasks, UploadFile, File, Depends
from fastapi.responses          import StreamingResponse

from ..models.auth       import User
from ..services.auth     import get_current_user
from ..services.reports  import ReportsService

router = APIRouter(
    prefix = '/reports',
    tags   = ['reports'],
)


@router.post('/import')
def import_csv(
    background_tasks: BackgroundTasks,      # Part 4
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    reports_service: ReportsService = Depends(),
):
    #++ Part 4
    background_tasks.add_task(
        reports_service.import_csv,
        user.id,
        file.file,
    )
    #-- Part 4


@router.get('/export')
def export_csv(
        user: User = Depends(get_current_user),
        reports_service: ReportsService = Depends(),
):
    report = reports_service.export_csv(user.id)
    return StreamingResponse(
        report,
        media_type = 'text/csv',
        headers = {
            'Content-Disposition': 'attachment; filename = report.csv'
        },
    )
