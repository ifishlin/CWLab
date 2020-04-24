import pytest
from cwlab import create_app
import tempfile
import os
from datetime import datetime
from cwlab import db_connector


@pytest.fixture(scope='session')
def test_app():
    app = create_app("tests/myconfig.yaml", webapp=False)
    app.config['TESTING'] = True
    with app.test_client() as testing_client:
        ctx = app.app_context()
        ctx.push()
        yield testing_client

@pytest.fixture(scope='session')
def test_connector(test_app):
    yield db_connector
    #db_connector.clean_db()

@pytest.fixture(scope='module')
def test_user_manager(test_connector):
    new_user = test_connector.user_manager.create(
        username="u2cxyc", 
        email="m@i.l",
        level="user", 
        status="active",
        date_register = datetime.now(),
        date_last_login = datetime.now())
    new_user.set_password("geheim") 
    test_connector.user_manager.store(new_user)
    yield test_connector.user_manager
