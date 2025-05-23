import sqlalchemy as sa
from sqlalchemy.ext.declarative import declarative_base


Base = declarative_base()


class User(Base):
    __tablename__ = 'users'

    id            = sa.Column(sa.Integer, primary_key = True)
    email         = sa.Column(sa.Text   , unique = True)
    username      = sa.Column(sa.Text   , unique = True)
    password_hash = sa.Column(sa.Text)


class Tab(Base):
    __tablename__ = 'tabs'

    id            = sa.Column(sa.Integer, primary_key = True)
    name          = sa.Column(sa.String , nullable = True)
    user_id       = sa.Column(sa.Integer, sa.ForeignKey('users.id'))


class Record(Base):
    __tablename__ = 'records'

    id            = sa.Column(sa.Integer, primary_key = True)
    user_id       = sa.Column(sa.Integer, sa.ForeignKey('users.id'))
    tab_id        = sa.Column(sa.Integer, sa.ForeignKey('tabs.id' ))
    content       = sa.Column(sa.Text   , unique = True, nullable = False)


