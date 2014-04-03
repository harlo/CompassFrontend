import os, yaml

COMPASS_BASE_DIR = os.path.abspath(os.path.join(__file__, os.pardir))
COMPASS_CONF_ROOT = os.path.join(COMPASS_BASE_DIR, "conf")

from lib.Frontend.conf import *