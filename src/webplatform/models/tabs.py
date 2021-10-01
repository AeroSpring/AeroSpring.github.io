from pydantic import BaseModel
from typing   import Optional



class TabBase(BaseModel):
    name      : str
    user_id   : int
    record_id : Optional[int]


class Tab(TabBase):
    id        : int

    class Config:
        orm_mode = True


class TabCreate(TabBase):
    pass


class TabUpdate(TabBase):
    pass

