import sqlalchemy as sa
#from sqlalchemy.orm             import relationship
from sqlalchemy.ext.declarative import declarative_base


Base = declarative_base()
tab_record_table = sa.Table(
    'tab_record',
    Base.metadata,
    sa.Column( 'tab_id'   , sa.Integer, sa.ForeignKey("tabs.id"   ) ),
    sa.Column( 'record_id', sa.Integer, sa.ForeignKey("records.id") )
)


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

    record_id     = sa.Column(sa.Integer, sa.ForeignKey('records.id'), nullable = True)


class Record(Base):
    __tablename__ = 'records'

    id            = sa.Column(sa.Integer, primary_key = True)
    user_id       = sa.Column(sa.Integer, sa.ForeignKey('users.id'))
    content       = sa.Column(sa.Text   , unique = True, nullable = False)

#    tab_id        = sa.Column(sa.Integer, sa.ForeignKey('tabs.id' ))
#    tab           = relationship("Tab", secondary = tab_record_table, backref = "records")


class Operation(Base):
    __tablename__ = 'operations'

    id            = sa.Column(sa.Integer, primary_key = True)
    user_id       = sa.Column(sa.Integer, sa.ForeignKey('users.id'))
    date          = sa.Column(sa.Date)
    kind          = sa.Column(sa.String)
    amount        = sa.Column(sa.Numeric(10, 2))
    description   = sa.Column(sa.String , nullable = True)

