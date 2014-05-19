import json, signal, os, logging, tornado.web
from sys import exit, argv
from multiprocessing import Process
from time import sleep

from api import CompassAPI
from lib.Frontend.lib.Core.Utils.funcs import startDaemon, stopDaemon, passesParameterFilter, parseRequestEntity
from lib.Frontend.unveillance_frontend import UnveillanceFrontend
from lib.Frontend.lib.Core.vars import Result
from conf import COMPASS_BASE_DIR, COMPASS_CONF_ROOT, DEBUG

class CompassFrontend(UnveillanceFrontend, CompassAPI):
	def __init__(self):
		UnveillanceFrontend.__init__(self)
		CompassAPI.__init__(self)
		
		# sketchy...
		from conf import UNVEILLANCE_LM_VARS
		self.UNVEILLANCE_LM_VARS.update(UNVEILLANCE_LM_VARS)	

		self.reserved_routes.extend(["auth"])
		self.routes.extend([
			(r"/auth/(drive|globaleaks)", self.AuthHandler)
		])
		
		self.default_on_loads = [
			'/cdn/apis.google.com/js/api.js',
			'/web/js/compass.js', 
			'/web/js/lib/sammy.js']
		self.on_loads['setup'].extend(['/web/js/modules/cp_setup.js'])
		self.on_loads.update({
			'documents' : ['/web/js/modules/documents.js'],
			'document' : ['/web/js/lib/crossfilter.min.js',
				'/web/js/models/cp_document.js', '/web/js/modules/document.js',
				'/web/js/viz/uv_viz.js'],
			'main' : [
				'/web/js/lib/d3.min.js',
				'/web/js/lib/visualsearch.js',
				'/web/js/lib/jquery.ui.core.js',
				'/web/js/lib/jquery.ui.position.js',
				'/web/js/lib/jquery.ui.widget.js',
				'/web/js/lib/jquery.ui.menu.js',
				'/web/js/lib/jquery.ui.autocomplete.js',
				'/web/js/viz/uv_viz.js',
				'/web/js/viz/cp_document_browser.js',
				'/web/js/modules/cp_document_browser.js']
		})
		
		with open(os.path.join(COMPASS_CONF_ROOT, "compass.init.json"), 'rb') as IV:
			self.init_vars = json.loads(IV.read())['web']
	
	class AuthHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def get(self, auth_type):
			endpoint = "/"
			
			if auth_type == "drive":
				try:
					if self.application.drive_client.authenticate(
						parseRequestEntity(self.request.query)['code']):
							self.application.do_send_public_key(self)
				except KeyError as e:
					if DEBUG: print "no auth code. do step 1\n%s" % e
					endpoint = self.application.drive_client.authenticate()
				except AttributeError as e:
					if DEBUG: print "no drive client even started! do that first\n%s" % e

					if not self.application.initDriveClient():
						if DEBUG: print "client has no auth. let's start that"
						
						from conf import getSecrets
						endpoint = getSecrets(
							key="compass.sync")['google_drive']['redirect_uri']
					else:
						if DEBUG: print "client has been authenticated already."
					
			self.redirect(endpoint)
		
		@tornado.web.asynchronous
		def post(self, auth_type):
			res = Result()
			
			if auth_type == "drive":
				status_check = "get_drive_status"
			
			if status_check is not None:
				res = self.application.routeRequest(res, status_check, self)
			
			self.set_status(res.result)
			self.finish(res.emit())
	
	"""
		Frontend-accessible methods
	"""
	def do_get_drive_status(self, handler=None):
		if hasattr(self, "drive_client"):
			if hasattr(self.drive_client, "service"):
				return True

		return False
	
	"""
		Overrides
	"""
	def do_send_public_key(self, handler):
		super(CompassFrontend, self).do_send_public_key(handler)
		
		from conf import getConfig
		upload = self.drive_client.upload(getConfig('unveillance.local_remote.pub_key'),
			title="unveillance.local_remote.pub_key")
		
		try:
			return self.drive_client.share(upload['id'])
		except KeyError as e:
			if DEBUG: print e
		
		return None
	
	def do_link_annex(self, handler):
		super(CompassFrontend, self).do_link_annex(handler)
		
		print "LINKING OUR ANNEX SOMEHOW!"

if __name__ == "__main__":
	compass_frontend = CompassFrontend()
	
	if len(argv) != 2: exit("Usage: compass_frontend.py [-start, -stop, -restart]")
	
	if argv[1] == "-start" or argv[1] == "-firstuse":
		compass_frontend.startup()
	elif argv[1] == "-stop":
		compass_frontend.shutdown()
	elif argv[1] == "-restart":
		compass_frontend.shutdown()
		sleep(5)
		compass_frontend.startup()