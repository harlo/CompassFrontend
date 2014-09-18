import json, os, tornado.web
from sys import exit, argv
from time import sleep

from lib.Frontend.unveillance_frontend import UnveillanceFrontend
from lib.Frontend.lib.Core.vars import Result

from conf import COMPASS_BASE_DIR, COMPASS_CONF_ROOT, DEBUG, buildServerURL
from vars import MIME_TYPE_TASK_REQUIREMENTS

class CompassFrontend(UnveillanceFrontend):
	def __init__(self):
		UnveillanceFrontend.__init__(self)
		
		self.reserved_routes.extend(["auth", "commit"])
		self.routes.extend([
			(r"/commit/", self.DriveOpenHandler)
		])
		
		self.default_on_loads.extend([
			'/web/js/lib/visualsearch.js',
			'/web/js/lib/jquery.ui.core.js',
			'/web/js/lib/jquery.ui.position.js',
			'/web/js/lib/jquery.ui.widget.js',
			'/web/js/lib/jquery.ui.menu.js',
			'/web/js/lib/jquery.ui.autocomplete.js',
			'/web/js/lib/sammy.js',
			'/web/js/lib/crossfilter.min.js',
			'/web/js/lib/d3.min.js',
			'/web/js/lib/md5.js',
			'/web/js/viz/uv_viz.js',
			'/web/js/models/cp_document.js',
			'/web/js/models/cp_batch.js',
			'/web/js/compass.js'
		])
		
		self.on_loads_by_status[1].extend([
			'/web/js/modules/cp_login.js',
			'/web/js/models/unveillance_user.js'
		])
		
		self.on_loads_by_status[2].extend([
			'/web/js/models/unveillance_user.js',
			'/web/js/modules/cp_logout.js',
			'/web/js/models/cp_user.js'
		])
		
		self.on_loads_by_status[3].extend([
			'/web/js/lib/skulpt.min.js',
			'/web/js/lib/skulpt-stdlib.js',
			'/web/js/models/unveillance_user.js',
			'/web/js/modules/cp_logout.js',
			'/web/js/models/cp_user.js',
			'/web/js/models/cp_user_admin.js',
			'/web/js/models/cp_console.js'
		])

		self.on_loads.update({
			'main' : [
				'/web/js/lib/visualsearch.js',
				'/web/js/lib/jquery.ui.core.js',
				'/web/js/lib/jquery.ui.position.js',
				'/web/js/lib/jquery.ui.widget.js',
				'/web/js/lib/jquery.ui.menu.js',
				'/web/js/lib/jquery.ui.autocomplete.js',
				'/web/js/lib/jquery.csv.js',
				'/web/js/viz/uv_csv.js',
				'/web/js/models/cp_visual_search.js',
				'/web/js/models/cp_document_browser.js',
				'/web/js/modules/main.js'],
			'search' : [
				'/web/js/models/cp_keyword_search.js',
				'/web/js/models/cp_result_browser.js',
				'/web/js/modules/simple_search.js'
			],
			'document' : [
				'/web/js/models/cp_document_header.js',
				'/web/js/models/cp_document_viewer.js',
				'/web/js/models/cp_page_window.js',
				'/web/js/modules/uv_unveil.js',
				'/web/js/modules/cp_document_viewer.js'
			],
			'unveil' : [
				'/web/js/lib/jquery.csv.js',
				'/web/js/viz/uv_csv.js',
				'/web/js/models/cp_document_header.js',
				'/web/js/modules/uv_unveil.js',
				'/web/js/modules/cp_unveil.js'
			]
		})
		
		viz_root = os.path.join(COMPASS_BASE_DIR, "web", "js", "viz")		
		for _, _, files in os.walk(viz_root):
			viz_js = ["/%s" % os.path.join("web", "js", "viz", v) for v in files]

			if DEBUG: print "adding all vizez:\n%s" % viz_js
			
			self.on_loads['main'].extend(viz_js)				
			break
		
		with open(os.path.join(COMPASS_CONF_ROOT, "compass.init.json"), 'rb') as IV:
			init_vars = json.loads(IV.read())['web']
			init_vars['MIME_TYPE_TASK_REQUIREMENTS'] = MIME_TYPE_TASK_REQUIREMENTS
			
			self.init_vars.update(init_vars)
		
		tmpl_root = os.path.join(COMPASS_BASE_DIR, "web", "layout", "tmpl")
		self.INDEX_HEADER = os.path.join(tmpl_root, "header.html")
		self.INDEX_FOOTER = os.path.join(tmpl_root, "footer.html")
		self.MODULE_HEADER = self.INDEX_HEADER
		self.MODULE_FOOTER = self.INDEX_FOOTER
	
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
		
	if len(argv) != 2: exit("Usage: compass_frontend.py [-start, -stop]")
	
	if argv[1] == "-start" or argv[1] == "-firstuse":
		compass_frontend.startup(openurl)
	elif argv[1] == "-stop":
		compass_frontend.shutdown()