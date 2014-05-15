import json, signal, os, logging, tornado.web
from sys import exit, argv
from multiprocessing import Process
from time import sleep

from api import CompassAPI
from lib.Frontend.lib.Core.Utils.funcs import startDaemon, stopDaemon, passesParameterFilter, parseRequestEntity
from lib.Frontend.unveillance_frontend import UnveillanceFrontend
from lib.Frontend.lib.Core.vars import Result
from conf import COMPASS_BASE_DIR, DEBUG

class CompassFrontend(UnveillanceFrontend, CompassAPI):
	def __init__(self):
		UnveillanceFrontend.__init__(self)
		CompassAPI.__init__(self)		

		self.reserved_routes.extend(["auth"])
		self.routes.extend([
			(r"/auth/(drive|globaleaks)", self.AuthHandler)
		])
		
		self.default_on_loads = [
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
	
	class AuthHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def get(self, auth_type):
			endpoint = "/"
			
			if auth_type == "drive":
				try:
					if self.application.drive_client.authenticate(
						parseRequestEntity(self.request.query)['code']):
							self.application.do_send_public_key()
				except KeyError as e:
					if DEBUG: print "no auth code. do step 1\n%s" % e
					endpoint = self.application.drive_client.authenticate()
					
			self.redirect(endpoint)

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