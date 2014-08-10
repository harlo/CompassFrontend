import os

from lib.Frontend.conf import *

COMPASS_BASE_DIR = os.path.abspath(os.path.join(__file__, os.pardir))
COMPASS_CONF_ROOT = os.path.join(COMPASS_BASE_DIR, "conf")

WEB_TITLE = "Compass 0.1"

PERMISSIONS['upload_local'].extend([2,3])
PERMISSIONS['upload_global'].extend([2,3])