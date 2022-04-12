from pydantic import BaseModel



class TabBase(BaseModel):
    name      : str
    user_id   : int


class Tab(TabBase):
    id        : int

    class Config:
        orm_mode = True


class TabCreate(TabBase):
    pass


class TabUpdate(TabBase):
    pass

