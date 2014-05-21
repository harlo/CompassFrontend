import json
from time import sleep
from sys import argv

from Models.cp_drive_client import CompassDriveClient
from conf import DEBUG, COMPASS_CONF_ROOT, getConfig

class CompassAPI():
	def __init__(self):
		if DEBUG: print "Compass API started..."
		
		if argv[1] == "-start":
			if DEBUG: print "initing drive client here (-start)"
			self.initDriveClient()
	
	def initDriveClient(self, restart=False):
		if DEBUG: print "INITING DRIVE CLIENT"
		if not hasattr(self, "drive_client") or restart:
			self.drive_client = CompassDriveClient()
			sleep(2)

		return self.do_get_drive_status()