import os, yaml, json

COMPASS_BASE_DIR = os.path.abspath(os.path.join(__file__, os.pardir))
COMPASS_CONF_ROOT = os.path.join(COMPASS_BASE_DIR, "conf")
SECRET_PATH = os.path.join(COMPASS_CONF_ROOT, "compass.secrets.json")

from lib.Frontend.conf import *

try:
	with open(SECRET_PATH, 'rb') as C:
		config = json.loads(C.read())
		
		try: UNVEILLANCE_LM_VARS = config['unveillance.local_remote']
		except KeyError as e: pass
except IOError as e:
	if DEBUG: print "NO COMPASS CONF YET"