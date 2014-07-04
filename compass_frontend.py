import json, signal, os, logging, tornado.web, urllib, requests
from sys import exit, argv
from multiprocessing import Process
from time import sleep

from lib.Frontend.lib.Core.Utils.funcs import startDaemon, stopDaemon, passesParameterFilter, parseRequestEntity
from lib.Frontend.unveillance_frontend import UnveillanceFrontend
from lib.Frontend.Models.uv_fabric_process import UnveillanceFabricProcess
from lib.Frontend.Utils.fab_api import netcat
from lib.Frontend.lib.Core.vars import Result

from conf import COMPASS_BASE_DIR, COMPASS_CONF_ROOT, DEBUG, buildServerURL

class CompassFrontend(UnveillanceFrontend):
	def __init__(self):
		UnveillanceFrontend.__init__(self)
		
		self.reserved_routes.extend(["auth", "commit"])
		self.routes.extend([
			(r"/commit/", self.DriveOpenHandler)
		])
		
		self.default_on_loads.extend([
			'/web/js/lib/sammy.js',
			'/web/js/compass.js', 
			'/web/js/lib/crossfilter.min.js',
			'/web/js/lib/d3.min.js',
			'/web/js/viz/uv_viz.js',
			'/web/js/models/cp_document.js',
			'/web/js/models/cp_batch.js',
			'/web/js/models/cp_user.js'])

		self.on_loads.update({
			'main' : [
				'/web/js/lib/visualsearch.js',
				'/web/js/lib/jquery.ui.core.js',
				'/web/js/lib/jquery.ui.position.js',
				'/web/js/lib/jquery.ui.widget.js',
				'/web/js/lib/jquery.ui.menu.js',
				'/web/js/lib/jquery.ui.autocomplete.js',
				'/web/js/lib/jquery.csv.js',
				'/web/js/models/uv_csv.js',
				'/web/js/models/cp_visual_search.js',
				'/web/js/models/cp_document_browser.js',
				'/web/js/modules/main.js']
		})
		
		with open(os.path.join(COMPASS_CONF_ROOT, "compass.init.json"), 'rb') as IV:
			self.init_vars.update(json.loads(IV.read())['web'])
	
	"""
		Custom handlers
	"""
	class DriveOpenHandler(tornado.web.RequestHandler):
		def get(self):
			endpoint = "/"			
			res = self.application.routeRequest(Result(), "open_drive_file", self)
			
			if DEBUG: print res.emit()
			
			if res.result == 200 and hasattr(res, "data"):
				endpoint += "#analyze=%s" % json.dumps(res.data)
			
			self.redirect(endpoint)

if __name__ == "__main__":
	compass_frontend = CompassFrontend()
	
	openurl = False
	if len(argv) == 3 and argv[2] == "-webapp":
		openurl = True
		argv.pop()
		
	if len(argv) != 2: exit("Usage: compass_frontend.py [-start, -stop, -restart]")
	
	if argv[1] == "-start" or argv[1] == "-firstuse":
		compass_frontend.startup(openurl)
	elif argv[1] == "-stop":
		compass_frontend.shutdown()
	elif argv[1] == "-restart":
		compass_frontend.shutdown()
		sleep(5)
		compass_frontend.startup(openurl)