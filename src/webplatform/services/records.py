from typing              import List, Optional
from fastapi             import Depends, HTTPException, status
from sqlalchemy.orm      import Session

from ..                  import tables
from ..database          import get_session
from ..models.records    import RecordCreate, RecordUpdate


class RecordsService:

    def __init__( self, session: Session = Depends(get_session) ):
        self.session = session


    def get_list(self, user_id: int, tab_id: Optional[int] = None) -> List[tables.Record]:
        if tab_id is None:
            query = self.session.query(tables.Record).filter_by(
                user_id = user_id
            )
        else:
            query = self.session.query(tables.Record).filter_by(
                user_id = user_id,
                tab_id  = tab_id
            )
        records = query.all()
        return records


    def _get(self, user_id: int, record_id: int, tab_id: Optional[int] = None) -> tables.Record:
        if tab_id is None:
            record = self.session.query(tables.Record).filter_by(
                id      = record_id,
                user_id = user_id
            ).first()
        else:
            record = self.session.query(tables.Record).filter_by(
                id      = record_id,
                user_id = user_id,
                tab_id  = tab_id
            ).first()
        if not record:
            raise HTTPException(status_code = status.HTTP_404_NOT_FOUND)
        return record


    def get(self, user_id: int, record_id: int) -> tables.Record:
        return self._get(user_id, record_id)


    def create(self, user_id: int, record_data: RecordCreate, tab_id: int) -> tables.Record:
        record = tables.Record(
            content = record_data.content,
            user_id = user_id,
            tab_id  = tab_id
        )
        self.session.add(record)
        self.session.commit()
        return record


    def update(self, user_id: int, record_id: int, record_data: RecordUpdate, tab_id: Optional[int] = None) -> tables.Record:
        if tab_id is None:
            record = self._get(user_id, record_id)
        else:
            record = self._get(user_id, record_id, tab_id)
        for field, value in record_data:
            if record_data.user_id != user_id:
                raise HTTPException(
                    status_code = status.HTTP_400_BAD_REQUEST,
                    detail = {'user_id' : 'cannot be modified'}
                )
            setattr(record, field, value)
        self.session.commit()
        return record


    def delete(self, user_id: int, record_id: int):
        record = self._get(user_id, record_id)
        self.session.delete(record)
        self.session.commit()

