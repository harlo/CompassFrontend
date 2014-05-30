import httplib2, json, os, re
from subprocess import Popen
from cStringIO import StringIO

from apiclient import errors
from apiclient.discovery import build

from lib.Frontend.Models.uv_annex_client import UnveillanceAnnexClient

from conf import DEBUG, API_PORT, saveSecret, COMPASS_CONF_ROOT, SECRET_PATH, getSecrets

class CompassDriveClient(UnveillanceAnnexClient):
	def __init__(self):
		UnveillanceAnnexClient.__init__(self)
		
		credentials = None
		
		try:
			self.config = getSecrets(SECRET_PATH, key="compass.sync")['google_drive']
			
			if self.config['account_type'] == "service":
				from oauth2client.client import SignedJwtAssertionCredentials
				
				try:
					with open(self.config['p12'], 'rb') as key:
						with open(self.config['client_secrets'], 'rb') as secrets:
							secrets = json.loads(secrets.read())
				
							credentials = SignedJwtAssertionCredentials(
								secrets['web']['client_email'], key.read(), 
								self.config['scopes'])

				except KeyError as e:
					print e
					print "cannot authenticate with service account."
			elif self.config['account_type'] == "user":
				from oauth2client.file import Storage	
				credentials = Storage(self.config['auth_storage']).get()
			
		except KeyError as e:
			if DEBUG: print "NO AUTH YET!"
		
		if credentials is None:
			self.usable = False
			return
				
		http = httplib2.Http()
		http = credentials.authorize(http)
		
		self.service = build('drive', 'v2', http=http)
		self.setInfo()
	
	def setInfo(self):
		print "setting user info"
	
	def getAssetMimeType(self, fileId):
		return self.getFile(fileId)['mimeType']
	
	def getFileName(self, file):
		if type(file) is str or type(file) is unicode:
			return self.getFileName(self.getFile(file))
					
		return str(file['title'])
	
	def share(self, fileId, email=None):
		if not hasattr(self, "service"): return None
		if email is None: email = self.config['client_email']
		
		body = {
			'role' : "writer",
			'value' : email,
			'type' : "user"
		}
		
		try:
			return self.service.permissions().insert(fileId=fileId, body=body).execute()
		except errors.HttpError as e:
			if DEBUG: print e
		
		return None
		
	def upload(self, data, mime_type=None, as_binary=False, **body):
		if not hasattr(self, "service"):
			if DEBUG: print "NO SERVICE FOR DRIVE!!!!"
			return None
		
		if not as_binary:
			try:
				with open(data, 'rb') as d: data = d.read()
			except IOError as e:
				if DEBUG: print e
				return False
		
		import io, sys
		from apiclient.http import MediaIoBaseUpload
		
		if mime_type is None:
			mime_type = "application/octet-stream"
			
		chunk_size = 1024*1024	# unless data is tiny. check first
		data = io.BytesIO(data)

		if sys.getsizeof(data) < chunk_size:
			chunk_size = -1
		
		media_body = MediaIoBaseUpload(data, mimetype=mime_type,
			chunksize=chunk_size, resumable=True)
		
		try:
			upload = self.service.files().insert(
				body=body, media_body=media_body).execute()
			
			if DEBUG: print upload
			return upload
		except errors.HttpError as e:
			if DEBUG: print e
		
		return None
	
	def getFile(self, fileId):
		if not hasattr(self, "service"): return None
		
		try:
			return self.service.files().get(fileId=fileId).execute()
		except errors.HttpError as e:
			if DEBUG: print e
		
		return None
	
	def download(self, file, save_as=None, save=False):
		if not hasattr(self, "service"): return None
		
		if type(file) is str or type(file) is unicode:
			return self.download(self.getFile(file))
		
		url = file.get('downloadUrl')
		if url:
			if save_as is None:
				save_as = self.getFileName(file)
			
			# fuck you. (path traversal)
			if len(re.findall(r'\.\.', save_as)) > 0:
				return None
			
			response, content = self.service._http.request(url)
			if response.status != 200: 
				return None
			
			if not save:
				container = StringIO()
				container.write(content)
				return (container, save_as)
			else:				
				from conf import ANNEX_DIR
				destination_path = os.path.join(ANNEX_DIR, save_as)
				
				try:
					with open(destination_path, 'wb+') as C:
						C.write(content)
						return destination_path
				except IOError as e:
					if DEBUG: print e					
			
		return None
	
	def listAssets(self):
		try:
			return self.service.files().list().execute()['items']
		except errors.HttpError as e:
			print "WTF"
			if DEBUG: print e
		except Exception as e:
			print "LIST ASSETS ERROR:"
			if DEBUG: print e
		
		return None
	
	def authenticate(self, auth_token=None):
		if auth_token is None:
			from oauth2client.client import OAuth2WebServerFlow
			
			self.flow = OAuth2WebServerFlow(
				self.config['client_id'], self.config['client_secret'],
				self.config['scopes'], 
				"http://localhost:%d%s" % (API_PORT, self.config['redirect_uri']))

			return self.flow.step1_get_authorize_url()
		else:
			credentials = self.flow.step2_exchange(auth_token)

			auth_storage = os.path.join(COMPASS_CONF_ROOT, "drive.secrets.json")
			
			from oauth2client.file import Storage
			Storage(auth_storage).put(credentials)
			
			self.config.update({
				'auth_storage' : auth_storage,
				'account_type' : "user"
			})
			
			sync_config = getSecrets(SECRET_PATH, key="compass.sync")
			sync_config['google_drive'].update(self.config)
			saveSecret("compass.sync", sync_config)
			
			del self.flow
			return True
		
		return False