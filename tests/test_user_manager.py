import pytest
from datetime import datetime


def test_user_manager(test_app, test_user_manager):
    # 1) load by name/id
    for user in test_user_manager.load_all():
        print(test_user_manager.load(id = user.id))
        print(test_user_manager.load_by_name(username = user.username))
    # 2) delete
    for user in test_user_manager.load_all():
        test_user_manager.delete(user)
    # 3) load all
    db_users = test_user_manager.load_all()
    print(db_users)
