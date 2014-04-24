import json, signal, os, logging, tornado.web
from sys import exit, argv
from multiprocessing import Process
from time import sleep

from api import CompassAPI
from lib.Frontend.unveillance_frontend import UnveillanceFrontend
from lib.Frontend.lib.Core.vars import Result
from lib.Frontend.lib.Core.Utils.funcs import startDaemon, stopDaemon, passesParameterFilter
from conf import COMPASS_BASE_DIR

class CompassFrontend(UnveillanceFrontend, CompassAPI):
	def __init__(self):
		UnveillanceFrontend.__init__(self)
		CompassAPI.__init__(self)		

		self.default_on_loads = [
			'/web/js/compass.js', 
			'/web/js/lib/sammy.js']
		self.on_loads.update({
			'documents' : ['/web/js/modules/documents.js'],
			'document' : ['/web/js/lib/crossfilter.min.js',
				'/web/js/models/cp_document.js', '/web/js/modules/document.js',
				'/web/js/viz/uv_viz.js']
		})


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