import os, json
from sys import exit
from farbic.operations import prompt

from lib.Frontend.lib.Core.Utils.funcs import generateNonce
from conf import CONF_ROOT, API_PORT, buildServerURL

if __name__ == "__main__":
	try:
		with open(os.path.join(CONF_ROOT, "unveillance.secrets.json", 'rb') as CONF:
			config = json.loads(CONF.read())
	except Exception as e:
		print "NO CONF?"
		exit(1)
	
	if 'documentcloud_no_ask' in config.keys() and config['documentcloud_no_ask']:
		exit(0)
	
	if 'documentcloud_auth_str' not in config.keys():
		print "****************************"
		print "Link DocumentCloud account?  y or n?"
		use_dc = prompt("[DEFAULT: n]")
		
		if use_dc == "y":
			dc_user = prompt("Username: ")
			dc_pwd = prompt("Password: ")
			config['documentcloud_auth_str'] = "%s:%s@" % (dc_user.replace("@", "%40"),
				dc_pwd)
	
	with open(os.path.join(COMPASS_CONF_ROOT, "compass.init.json"), 'wb+') as WEB:
		WEB.write(json.dumps({
			'web' : {
				'BATCH_SALT' : generateNonce(),
				'API_PORT' : API_PORT,
				'REMOTE_HOST' : buildServerURL()
			}
		})
	
	with open(os.path.join(CONF_ROOT, "unveillance.secrets.json", 'wb+') as CONF:
		CONF.write(json.dumps(config))
	
	exit(0)