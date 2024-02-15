const { InstanceStatus, TCPHelper } = require('@companion-module/base');

module.exports = {
	initConnection: function () {
		let self = this;

		try {
			self.log('info', `Opening connection to ${self.config.host}:${self.config.port}`);
	
			self.socket = new TCPHelper(self.config.host, self.config.port);
	
			self.socket.on('error', function (err) {
				if (self.config.verbose) {
					self.log('warn', 'Error: ' + err);
				}
	
				self.stopPolling();
				self.updateStatus(InstanceStatus.ConnectionFailure);
				console.log(err);
			});
	
			self.socket.on('connect', function () {
				self.updateStatus(InstanceStatus.Ok);

				self.getInformation();
				self.startPolling();
			});
	
			self.socket.on('data', function(buffer) {
				let indata = buffer.toString();

				self.processData(buffer)
			});
		}
		catch(error) {
			self.log('error', `Failed to connect to display: ${error}`);
			self.updateStatus(InstanceStatus.ConnectionFailure);
		}
	},

	startPolling: function () {
		let self = this;

		self.stopPolling(); //clear any existing timer

		if (self.config.enablePolling) {
			self.timer = setInterval(self.getInformation, self.config.rate, self);
		}
	},

	stopPolling: function () {
		let self = this;

		if (self.timer) {
			clearInterval(self.timer)
			delete self.timer
		}
	},

	getInformation: function (scope) {
		let self = scope ? scope : this

		if (self.config.protocol == 'ascii') {
			self.sendCommand('power ?')
			self.sendCommand('input ?')
			self.sendCommand('volume ?')
			self.sendCommand('avmute audio ?')
		}
		else if (self.config.protocol == 'hex') {
			self.sendCommand('\x01\x30\x41\x30\x41\x30\x36\x02\x30\x31\x44\x36\x03\x74\x0D'); //power
			self.sendCommand('\x01\x30\x41\x30\x43\x30\x36\x02\x30\x30\x36\x30\x03\x03\x0D'); //input
			self.sendCommand('\x01\x30\x41\x30\x43\x30\x36\x02\x30\x30\x36\x32\x03\x01\x0D'); //volume
		}
	},

	sendCommand: function (command) {
		let self = this;

		let hex = command;

		if (self.config.verbose) self.log('info', 'Sending command: ' + command);
		if (self.config.protocol == 'ascii') {
			//convert to hexadecimal and send
			hex = Buffer.from(command + '\r', 'ascii')
		}
		else {
			//hex = parseInt(command, 16);
		}

		self.socket.send(hex)
	},

	processData: function (data) {
		let self = this;

		if (self.config.protocol == 'ascii') {
			//convert hex response to ascii
			let response = data.toString('ascii');

			//self.log('info', 'Processing ASCII data: ' + response);

			let matches = response.match(/>([\w\s]+)\scur=(\w+)/)
			if (matches == null) return
			let command = matches[1]
			let cur = matches[2]

			//console.log('command', command, 'data', cur)

				switch(command) {
					case 'power':
						self.data.power = cur;
						self.checkFeedbacks('power');
						break;
					case 'input':
						self.data.input = cur;
						self.checkFeedbacks('input');
						break;
					case 'volume':
						self.data.volume = parseInt(cur);
						
						break;
					case 'avmute audio':
						if (cur === 'on') self.data.audiomute = true 
						else self.data.audiomute = false
						self.checkFeedbacks('audiomute');
						break;
					default:
						break;
				}
			// }
		}
		else if (self.config.protocol == 'hex') {
			//process hex responses here
			let hex = data.toString('hex').toLowerCase();
			if 		(hex == '01303041423132023032303044363030303030343030303403710d') {
				//power is off
				self.data.power = 'off';
			}
			else if (hex == '01303041423132023032303044363030303030343030303103740d') {
				self.data.power = 'on';
			}
			else if (hex == '01303041443132023030303036303030303038383030313103010d') {
				self.data.input = 'hdmi1';
			}
			else if (hex == '01303041443132023030303036303030303038383030313203020d') {
				self.data.input = 'hdmi2';
			}
			else {
				//split the hex string every 2 characters into an array
				let hexArray = hex.match(/.{1,2}/g);
				//find STX and ETX in the array
				let stxIndex = hexArray.indexOf('02');
				let etxIndex = hexArray.indexOf('03');
				//now show payload in between STX and ETX
				let payload = hexArray.slice(stxIndex+1, etxIndex).join('').match(/.{1,2}/g);
				
				console.log(payload);
				//find the opPage and opCode
				let opPage = String.fromCharCode(parseInt(payload[2], 16)) + String.fromCharCode(parseInt(payload[3], 16));
				let opCode = String.fromCharCode(parseInt(payload[4], 16)) + String.fromCharCode(parseInt(payload[5], 16));

				if (opPage == '00' && opCode == '62') { //volume
					//current value is last 4 bytes of payload
					let length = payload.length;
					let byte1 = String.fromCharCode(parseInt(payload[length-4], 16));
					let byte2 = String.fromCharCode(parseInt(payload[length-3], 16));
					let byte3 = String.fromCharCode(parseInt(payload[length-2], 16));
					let byte4 = String.fromCharCode(parseInt(payload[length-1], 16));
					//add these 4 strings up and convert to hex, then to decimal
					let cur = parseInt(byte1 + byte2 + byte3 + byte4, 16);
					self.data.volume = cur;
				}

			}
			self.checkFeedbacks();
		}
		self.checkVariables();

	},

	setPower: function (inpower) {
		let self = this;
		let power = 'on'

		if (inpower === 'toggle' && self.data.power === 'on') {
			power = 'off'
		} else if (inpower === 'toggle') {
			power = 'on'
		} else {
			power = inpower
		}

		if (self.config.protocol == 'ascii') {
			self.sendCommand('power ' + power);
		}
		else if (self.config.protocol == 'hex') {
			if (power == 'on') {
				self.sendCommand('\x01\x30\x41\x30\x41\x30\x43\x02\x43\x32\x30\x33\x44\x36\x30\x30\x30\x31\x03\x73\x0D');
			}
			else {
				self.sendCommand('\x01\x30\x41\x30\x41\x30\x43\x02\x43\x32\x30\x33\x44\x36\x30\x30\x30\x34\x03\x76\x0D');
			}
		}
	},

	setInput: function (input) {
		let self = this;

		if (self.config.protocol == 'ascii') {
			self.sendCommand('input ' + input);
		}
		else if (self.config.protocol == 'hex') {
			switch(input) {
				case 'hdmi1':
					self.sendCommand('\x01\x30\x41\x30\x45\x30\x41\x02\x30\x30\x36\x30\x30\x30\x31\x31\x03\x72\x0D');							 
					break;
				case 'hdmi2':
					self.sendCommand('\x01\x30\x41\x30\x45\x30\x41\x02\x30\x30\x36\x30\x30\x30\x31\x32\x03\x71\x0D');
					break;
				case 'hdmi3':
					
					break;
				case 'displayport1':
					
					break;
				case 'displayport2':
					
					break;
				case 'displayport3':
					
					break;
				case 'mp':
					
					break;
				case 'compute_module':
					
					break;
				case 'option':
					
					break;
				default:
					break;
			}
		}
	},

	setVolume: function (volume) {
		let self = this;

		if (self.config.protocol == 'ascii') {
			self.sendCommand('volume ' + volume);
		} else if (self.config.protocol == 'hex') {
			let hexStringStart = '\x01\x30\x41\x30\x45\x30\x41\x02';
			let hexOpPageCode = '\x30\x30\x36\x32';

			//convert decimal volume to hex
			let hexVol = '00' + volume.toString(16);

			//now convert this as a string to hex
			let hexVolArray = hexVol.split('');
			let hexVolString = '';
			hexVolArray.forEach(element => {
				hexVolString += '\\x' + element.charCodeAt(0).toString(16) + '';
			});

			let hexStringFinish = '\x03\x71\x0D';

			let hexTotal = hexStringStart + hexOpPageCode + hexVolString + hexStringFinish;
			self.sendCommand(hexTotal);
		}
	},

	setAudioMute: function(mute) {
		let self = this

		if (self.data.audiomute !== true && self.data.audiomute !== false) {
			self.data.audiomute = false
		}

		if (mute === 'toggle') {
			if (self.data.audiomute) {
				self.data.audiomute = false
			} else {
				self.data.audiomute = true
			}
		} else {
			switch (mute) {
				case 'on':
					self.data.audiomute = true
					break;
				case 'off':
					self.data.audiomute = false
					break;
			}
		}

		if (self.config.protocol == 'ascii') {
			self.sendCommand(`avmute audio  ${self.data.audiomute ? 'on' : 'off'}`)
		}

	}
}