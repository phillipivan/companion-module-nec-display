const { combineRgb } = require('@companion-module/base')

module.exports = {
	initFeedbacks: function () {
		let self = this
		let feedbacks = {}

		const foregroundColor = combineRgb(255, 255, 255) // White
		const backgroundColorRed = combineRgb(255, 0, 0) // Red

		feedbacks.power = {
			type: 'boolean',
			name: 'Power is in X State',
			description: 'Change colors of the bank if the Power is in X State',
			defaultStyle: {
				color: foregroundColor,
				bgcolor: backgroundColorRed,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Power State',
					id: 'power',
					default: 'on',
					choices: [
						{ id: 'on', label: 'On' },
						{ id: 'off', label: 'Off' },
					],
				}
			],
			callback: function (feedback, bank) {
				if (self.data.power == feedback.options.power) {
					return true
				}

				return false
			},
		}

		feedbacks.input = {
			type: 'boolean',
			name: 'Input is Selected',
			description: 'Change colors of the bank if the Input is selected',
			defaultStyle: {
				color: foregroundColor,
				bgcolor: backgroundColorRed,
			},
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
				},
			],
			callback: function (feedback, bank) {
				if (self.data.input === feedback.options.input) {
					return true
				}

				return false
			},
		}

		feedbacks.audiomute = {
			type: 'boolean',
			name: 'Audio is Muted',
			description: 'Change colors of the bank if the volume is muted',
			defaultStyle: {
				color: foregroundColor,
				bgcolor: backgroundColorRed,
			},
			options: [],
			callback: function (feedback) {
				if (self.data.audiomute === true) {
					return true
				}

				return false
			},
		}

		self.setFeedbackDefinitions(feedbacks);
	}
}