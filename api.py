import json

from Models.cp_drive_client import CompassDriveClient
from conf import DEBUG, COMPASS_CONF_ROOT, getConfig

class CompassAPI():
	def __init__(self):
		if DEBUG: print "Compass API started..."

		self.drive_client = CompassDriveClient()		