const { InstanceBase, InstanceStatus, runEntrypoint } = require('@companion-module/base');
const UpgradeScripts = require('./src/upgrades');

const config = require('./src/config');
const actions = require('./src/actions');
const feedbacks = require('./src/feedbacks');
const variables = require('./src/variables');
const presets = require('./src/presets');

const utils = require('./src/utils');

class necDisplayInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Assign the methods from the listed files to this class
		Object.assign(this, {
			...config,
			...actions,
			...feedbacks,
			...variables,
			...presets,
			...utils,
		})

		this.timer = undefined; //used for polling the device
		this.display = undefined; //used for the connection
		
		this.data = {
			model: '',
			serial: '',
			power: false,
			input: 'HDMI1',
			volume: 0,
		};
	}

	async destroy() {
		this.clearTimer();
	}

	async init(config) {
		this.configUpdated(config);
	}

	async configUpdated(config) {
		this.config = config;
		
		this.initActions();
		this.initFeedbacks();
		this.initVariables();
		this.initPresets();

		this.updateStatus(InstanceStatus.Connecting);

		this.initConnection();
	}
}

runEntrypoint(necDisplayInstance, UpgradeScripts);