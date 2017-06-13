import os
import json
import smtplib
from email.mime.text import MIMEText


class EmailTemplates:
	PropertyTrigger = 'Property {0} [{1}] changed to value {2}'
	PropertyTriggerSubject = 'Property Changed'

	def get(self, template):
		if hasattr(self, template):
			return [getattr(self, template+'Subject'), getattr(self, template)]


class Email:

	_config = None

	_subject = None
	_msg = None
	_to = None
	_from = None

	def __init__(self, to):
		self.templates = EmailTemplates()

		path = os.path.dirname(os.path.realpath(__file__))
		conf = '{path}/../configs/email.json'.format(path=path)
		print conf, os.path.exists(conf)
		if os.path.exists(conf):
			file = open(conf)
			self._config = json.load(file)
			file.close()

			self._to = to
			self._from = self._config['from']

			self.s = smtplib.SMTP_SSL(self._config['smtp_server'])
			self.s.login(self._config['username'], self._config['password'])

	def set_message(self, template, values):
		t = self.templates.get(template)
		if t:
			self._msg = MIMEText(t[1].format(*values))
			self._msg['Subject'] = 'Homie Control: Alert - '+t[0]
			self._msg['From'] = self._config['fromname']
			self._msg['To'] = self._to

	def send(self):
		if self._config is not None:
			self.s.sendmail(self._from, [self._to], self._msg.as_string())



if __name__ == '__main__':
	m = Email('you@yourserver.com')
	m.set_message('PropertyTrigger', ['a property', 'dev/node/property', '1.0'])
	m.send()
