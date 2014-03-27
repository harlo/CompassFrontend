import json, signal, os, logging, tornado.web
from sys import exit, argv
from multiprocessing import Process
from time import sleep

from api import CompassAPI
from lib.Frontend.unveillance_frontend import UnveillanceFrontend
from lib.Frontend.lib.Core.Utils.uv_result import Result
from lib.Frontend.lib.Core.Utils.funcs import startDaemon, stopDaemon, passesParameterFilter
from conf import COMPASS_BASE_DIR

class CompassFrontend(UnveillanceFrontend, CompassAPI):
	def __init__(self):
		UnveillanceFrontend.__init__(self)
		
		self.routes.extend([
			(r"/externals/([a-zA-Z0-9\-/\._]+)", tornado.web.StaticFileHandler,
				{"path" : os.path.join(COMPASS_BASE_DIR, "web")})])
		
		self.on_loads.update({
			'get_context' : [
				"/web/js/modules/get_context.js"
			],
			'run_script' : [
				"/web/js/models/compass_run_log.js",
				"/web/js/modules/run_script.js"
			]
		})
		
		CompassAPI.__init__(self)		

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