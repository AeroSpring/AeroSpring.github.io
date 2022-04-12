from pydantic import BaseModel

#from typing   import List, Optional
#from ..models.tabs import TabBase, Tab


class RecordBase(BaseModel):
    user_id : int
    tab_id  : int
    content : str
#   tab     : str
#   tabs    : List[Tab]


class Record(RecordBase):
    id      : int

    class Config:
        orm_mode = True


class RecordCreate(RecordBase):
    pass


class RecordUpdate(RecordBase):
    pass

