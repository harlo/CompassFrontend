import os, yaml, json

COMPASS_BASE_DIR = os.path.abspath(os.path.join(__file__, os.pardir))
COMPASS_CONF_ROOT = os.path.join(COMPASS_BASE_DIR, "conf")

from lib.Frontend.conf import *

def getSecrets(password=None, key=None):
	try:
		with open(os.path.join(COMPASS_CONF_ROOT, "compass.secrets.json"), 'rb') as C:
			try:
				config = json.loads(C.read())
			except TypeError as e:
				if password is None: return None
			except ValueError as e:
				if DEBUG: print "NO SECRETS YET (VALUE ERROR?)\n%s" % e
				return None
				
				# decrypt with password
			
	except IOError as e:
		if DEBUG: print "NO SECRETS YET (IO ERROR?)\n%s" % e
		return None
	
	if key is None: return config
	
	try:
		return config[key]
	except KeyError as e:
		if DEBUG: print "could not find %s in config" % key
		return None

def saveSecret(key, secret, password=None):
	secrets = getSecrets(password=password)
	if secrets is None: secrets = {}
	
	try:
		secrets[key].update(secret)
	except Exception as e:
		return False
	
	try:
		with open(os.path.join(COMPASS_CONF_ROOT, "compass.secrets.json"), 'wb+') as C:
			C.write(json.dumps(secrets))
			return True
	except Exception as e:
		if DEBUG: print "Cannot save secret: %s" % e
	
	return False

try:
	with open(os.path.join(COMPASS_CONF_ROOT, "compass.secrets.json"), 'rb') as C:
		config = json.loads(C.read())
		
		try: UNVEILLANCE_LM_VARS = config['unveillance.local_remote']
		except KeyError as e: pass
except IOError as e:
	if DEBUG: print "NO COMPASS CONF YET"