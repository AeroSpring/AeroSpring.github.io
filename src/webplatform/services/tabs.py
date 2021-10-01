from typing           import List
from fastapi          import Depends, HTTPException, status
from sqlalchemy.orm   import Session

from ..               import tables
from ..database       import get_session
from ..models.tabs    import TabCreate, TabUpdate


class TabsService:

    def __init__( self, session: Session = Depends(get_session) ):
        self.session = session


    def get_list(self, user_id: int) -> List[tables.Tab]:
        query = (
            self.session
            .query(tables.Tab)
            .filter_by(user_id = user_id)
        )
        tabs = query.all()
        return tabs


    def _get(self, user_id: int, tab_id: int) -> tables.Tab:
        tab = (
            self.session
            .query(tables.Tab)
            .filter_by(
                id      = tab_id,
                user_id = user_id,
            )
            .first()
        )
        if not tab:
            raise HTTPException(status_code = status.HTTP_404_NOT_FOUND)
        return tab


    def get(self, user_id: int, tab_id: int) -> tables.Tab:
        return self._get(user_id, tab_id)


    def create(self, user_id: int, tab_data: TabCreate) -> tables.Tab:
        tab = tables.Tab(
            name      = tab_data.name,
            record_id = tab_data.record_id,
            user_id   = user_id,
        )
        self.session.add(tab)
        self.session.commit()
        return tab


    def update(self, user_id: int, tab_id: int, tab_data: TabUpdate) -> tables.Tab:
        tab = self._get(user_id, tab_id)
        for field, value in tab_data:
            if tab_data.user_id != user_id:
                raise HTTPException(
                    status_code = status.HTTP_400_BAD_REQUEST,
                    detail = {'user_id' : 'cannot be modified'}
                )
            setattr(tab, field, value)
        self.session.commit()
        return tab


    def delete(self, user_id: int, tab_id: int):
        tab = self._get(user_id, tab_id)
        self.session.delete(tab)
        self.session.commit()

