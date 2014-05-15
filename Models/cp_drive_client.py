import httplib2, json

from oauth2client.file import Storage
from apiclient import errors
from apiclient.discovery import build
from apiclient.http import MediaFileUpload

from conf import DEBUG, API_PORT, saveSecret, COMPASS_CONF_ROOT, getSecrets

class CompassDriveClient(object):
	def __init__(self):
		self.config = getSecrets(key="compass.sync")['google_drive']
		
		try:
			from oauth2client.file import Storage
			
			credentials = Storage(self.config['auth_storage']).get()
			http = httplib2.Http()
			http = credentials.authorize(http)
			
			self.service = build('drive', 'v2', http=http)
			
		except KeyError as e:
			print "NO AUTH YET!"
			return
	
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
		
	def upload(self, data, as_binary=False, **metadata):
		if not hasattr(self, "service"): return None
		if not as_binary:
			try:
				with open(data, 'rb') as d: body = d.read()
			except IOError as e:
				if DEBUG: print e
				return False
		else: body = data
		
		try:
			return self.service.files().insert(
				body=body, media_body=metadata).execute() 
		except errors.HttpError as e:
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
			Storage(auth_storage).put(credentials)
			self.config['auth_storage'] = auth_storage
			
			sync_config = getSecrets(key="compass.sync")
			sync_config['google_drive'].update(self.config)
			saveSecret("compass.sync", sync_config)
			
			del self.flow
			return True
		
		return False