from pydantic import BaseModel



class RecordBase(BaseModel):
    content : str
    user_id : int

#    tab_id  : int
#    tab     : str


class Record(RecordBase):
    id      : int

    class Config:
        orm_mode = True


class RecordCreate(RecordBase):
    pass


class RecordUpdate(RecordBase):
    pass

