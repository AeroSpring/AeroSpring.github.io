from pydantic import BaseModel



class RecordBase(BaseModel):
    user_id : int
    tab_id  : int
    content : str


class Record(RecordBase):
    id      : int

    class Config:
        orm_mode = True


class RecordCreate(RecordBase):
    pass


class RecordUpdate(RecordBase):
    pass

