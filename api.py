import json

from Models.cp_drive_client import CompassDriveClient
from conf import DEBUG, getConfig

class CompassAPI():
	def __init__(self):
		if DEBUG: print "Compass API started..."
		try:
			self.drive_client = CompassDriveClient()
	
	def do_send_public_key(self):
		if DEBUG: print "sending off public key"

		if hasattr(self, "drive_client"):
			upload = self.drive_client.upload(
				getConfig('unveillance.local_remote.pub_key'), {
					'title' : "my_public_key.pub"
				})	
			try:
				return self.drive_client.share(upload['id'])
			except KeyError as e:
				if DEBUG: print e
		
		return False
		