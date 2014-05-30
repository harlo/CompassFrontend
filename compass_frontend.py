import json, signal, os, logging, tornado.web, urllib, requests
from sys import exit, argv
from multiprocessing import Process
from time import sleep

from api import CompassAPI
from lib.Frontend.lib.Core.Utils.funcs import startDaemon, stopDaemon, passesParameterFilter, parseRequestEntity
from lib.Frontend.unveillance_frontend import UnveillanceFrontend
from lib.Frontend.Models.uv_fabric_process import UnveillanceFabricProcess
from lib.Frontend.Utils.fab_api import netcat
from lib.Frontend.lib.Core.vars import Result

from conf import COMPASS_BASE_DIR, COMPASS_CONF_ROOT, DEBUG, buildServerURL

class CompassFrontend(UnveillanceFrontend, CompassAPI):
	def __init__(self):
		UnveillanceFrontend.__init__(self)
		CompassAPI.__init__(self)
		
		# sketchy...
		from conf import UNVEILLANCE_LM_VARS
		self.UNVEILLANCE_LM_VARS.update(UNVEILLANCE_LM_VARS)	

		self.reserved_routes.extend(["auth", "commit"])
		self.routes.extend([
			(r"/auth/(drive|globaleaks)", self.AuthHandler),
			(r"/commit/", self.DriveOpenHandler)
		])
		
		self.default_on_loads = [
			'/web/js/lib/sammy.js',
			'/web/js/compass.js', 
			'/web/js/models/cp_user.js']
		self.on_loads['setup'].extend(['/web/js/modules/cp_setup.js'])
		self.on_loads.update({
			'main' : [
				'/web/js/lib/crossfilter.min.js',
				'/web/js/lib/d3.min.js',
				'/web/js/lib/visualsearch.js',
				'/web/js/lib/jquery.ui.core.js',
				'/web/js/lib/jquery.ui.position.js',
				'/web/js/lib/jquery.ui.widget.js',
				'/web/js/lib/jquery.ui.menu.js',
				'/web/js/lib/jquery.ui.autocomplete.js',
				'/web/js/lib/jquery.csv.js',
				'/web/js/viz/uv_viz.js',
				'/web/js/models/uv_csv.js',
				'/web/js/models/cp_visual_search.js',
				'/web/js/models/cp_document_browser.js',
				'/web/js/models/cp_batch.js',
				'/web/js/models/cp_document.js',
				'/web/js/modules/main.js']
		})
		
		with open(os.path.join(COMPASS_CONF_ROOT, "compass.init.json"), 'rb') as IV:
			self.init_vars.update(json.loads(IV.read())['web'])
	
	"""
		Custom handlers
	"""
	class AuthHandler(tornado.web.RequestHandler):
		@tornado.web.asynchronous
		def get(self, auth_type):
			endpoint = "/"
			
			if auth_type == "drive":
				try:
					if self.application.drive_client.authenticate(
						parseRequestEntity(self.request.query)['code']):
							if self.application.initDriveClient(restart=True):
								self.application.do_send_public_key(self)
				except KeyError as e:
					if DEBUG: print "no auth code. do step 1\n%s" % e
					endpoint = self.application.drive_client.authenticate()
				except AttributeError as e:
					if DEBUG: print "no drive client even started! do that first\n%s" % e

					if not self.application.initDriveClient():
						if DEBUG: print "client has no auth. let's start that"
						
						from conf import getSecrets, SECRET_PATH
						endpoint = getSecrets(SECRET_PATH,
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
			
			if DEBUG: print res.emit()
			
			self.set_status(res.result)
			self.finish(res.emit())
	
	class DriveOpenHandler(tornado.web.RequestHandler):
		def get(self):
			endpoint = "/"			
			res = self.application.routeRequest(Result(), "open_drive_file", self)
			
			if DEBUG: print res.emit()
			
			if res.result == 200 and hasattr(res, "data"):
				endpoint += "#analyze=%s" % json.dumps(res.data)
			
			self.redirect(endpoint)
	"""
		Frontend-accessible methods
	"""
	def do_open_drive_file(self, handler):
		if DEBUG: print "commiting some google drive files..."
		if not self.initDriveClient(restart=True): return None
		
		files = None
			
		for _id in parseRequestEntity(handler.request.query)['_ids']:
			_id = urllib.unquote(_id).replace("'", "")[1:]
			file_name = self.drive_client.getFileName(_id)

			if file_name is None: return None
			url = "%s/documents/?file_name=%s" % (buildServerURL(), file_name)

			entry = None
			handled_file = None
		
			if DEBUG: print url
			
			# look up the file in annex. (annex/documents/?file_name=file)
			# if this file exists in annex, return its _id for opening in-app
			try:
				entry = json.loads(requests.get(
					url, verify=False).content)['data']['documents'][0]
			except Exception as e:
				if DEBUG: print "COULD NOT GET ENTRY:\n%s" % e
			
			if entry is not None:
				print type(entry['_id'])
				handled_file = { '_id' : entry['_id'] }
			else:
				entry = self.drive_client.download(_id, save=False)
				if entry is not None:
					from conf import getSecrets, SECRET_PATH
					
					pwd = getSecrets(SECRET_PATH, key="unveillance.local_remote")['pwd']
					print "HEY HERE IS YOUR PASSSWORD %s" % pwd
					
					if pwd is None: return None
										
					p = UnveillanceFabricProcess(netcat, {
						'file' : entry[0],
						'save_as' : entry[1],
						'password' : pwd
					})
					p.join()
			
					if p.output is not None:
						if DEBUG: print p.output
						handled_file = { 'file_name' : entry[1] }
					
					if DEBUG and p.error is not None: print p.error
			
			if handled_file is not None:
				if files is None: files = []
				files.append(handled_file)
		
		return files		
	
	def do_get_drive_status(self, handler=None):
		print "getting drive status"
		if not hasattr(self, "drive_client"):
			return self.initDriveClient()
		else:
			print "has drive_client..."
			if hasattr(self.drive_client, "service"):
				return True
			print "but no service..."

		# /Users/LvH/Proj/KMFellows/Danse/unveillance_remote
		return False
	
	def do_drive_client(self, handler):
		try:
			action = parseRequestEntity(handler.request.body)['action']
		except Exception as e:
			if DEBUG: print e
			return None
		
		if not self.do_get_drive_status(): 
			if DEBUG: print "NO DRIVE CLIENT?"
			return None
		
		if action == "list_all":
			return self.drive_client.listAssets()
		
		return None
	
	"""
		Overrides
	"""
	def do_send_public_key(self, handler):
		super(CompassFrontend, self).do_send_public_key(handler)
		
		from conf import getConfig
		upload = self.drive_client.upload("%s.pub" % getConfig('unveillance.local_remote.pub_key'),
			title="unveillance.local_remote.pub_key")
		
		if DEBUG: print upload
		
		try:
			return self.drive_client.share(upload['id'])
		except KeyError as e:
			if DEBUG: print e
		except TypeError as e:
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