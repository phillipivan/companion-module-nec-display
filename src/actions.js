module.exports = {
	initActions: function () {
		let self = this;
		let actions = {};

		actions.setPower = {
			name: 'Power',
			options: [
				{
					type: 'dropdown',
					label: 'Power',
					id: 'power',
					default: 'on',
					choices: [
						{ id: 'on', label: 'On' },
						{ id: 'off', label: 'Off' },
						{ id: 'toggle', label: 'Toggle' },
					]
				}
			],
			callback: async function (action) {
				self.setPower(action.options.power);
			}
		}

		actions.setInput = {
			name: 'Set Input',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: 'hdmi1',
					choices: [
						{ id: 'hdmi1', label: 'HDMI1' },
						{ id: 'hdmi2', label: 'HDMI2' },
						{ id: 'hdmi3', label: 'HDMI3' },
						{ id: 'displayport1', label: 'Display Port 1' },
						{ id: 'displayport2', label: 'Display Port 2' },
						{ id: 'displayport3', label: 'Display Port 3' },
						{ id: 'mp', label: 'MP' },
						{ id: 'compute_module', label: 'Compute Module' },
						{ id: 'option', label: 'Option' },
					]
				}
			],
			callback: async function (action) {
				self.setInput(action.options.input);
			}
		}

		actions.setVolume = {
			name: 'Set Volume',
			options: [
				{
					type: 'number',
					label: 'Volume',
					id: 'volume',
					min: 0,
					max: 100,
					default: 50,
					required: true,
					range: false,
					regex: self.REGEX_NUMBER,
				}
			],
			callback: async function (action) {
				self.setVolume(action.options.volume);
			}
		}

		actions.setAudioMute = {
			name: 'Set Audio Mute',
			options: [
				{
					type: 'dropdown',
					label: 'Mute',
					id: 'mute',
					choices: [
						{id: 'on', label: 'Mute'},
						{id: 'off', label: 'Unmute'},
						{id: 'toggle', label: 'Toggle'},
					],
					default: 'toggle'
				}
			],
			callback: async function (action) {
				self.setAudioMute(action.options.mute);
			}
		}

		self.setActionDefinitions(actions);
	}
}