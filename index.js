// Packages
const {
	Client,
	GatewayIntentBits,
	ActivityType,
	codeBlock,
	EmbedBuilder,
	Events,
} = require("discord.js");
const fetch = require("node-fetch");
const fs = require("node:fs");
const logger = require("./logger");

// Environment Variables
require("dotenv").config();

// Create Discord Client
const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

// Discord Client Additions
client.EmbedBuilder = EmbedBuilder;
client.codeBlock = codeBlock;
client.fetch = fetch;

// Discord Ready Event
client.once(Events.ClientReady, async () => {
	client.user.setActivity("food videos.", {
		type: ActivityType.Watching,
	});

	client.user.setStatus("idle");

	logger.success("Discord", `Connected!`);
});

// Discord Debug Event
client.on(Events.Debug, (info) => logger.debug("Discord", info));

// Discord Error Event
client.on(Events.Error, (error) => logger.error("Discord", error));

// Commands
client.commands = new Map();
const commandFiles = fs
	.readdirSync("./commands")
	.filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

// Modals
client.modals = new Map();
const modalFiles = fs
	.readdirSync("./modals")
	.filter((file) => file.endsWith(".js"));

for (const file of modalFiles) {
	const modal = require(`./modals/${file}`);
	client.modals.set(modal.data.name, modal);
}

// Discord Interaction Event
client.on(Events.InteractionCreate, async (interaction) => {
	// Slash Command
	if (interaction.isChatInputCommand()) {
		const command = client.commands.get(interaction.commandName);

		if (!command)
			return interaction.reply(
				"It seems that the command you are looking for, does not exist at this time."
			);

		try {
			await command.execute(client, interaction);
		} catch (error) {
			logger.error(`Command (${interaction.commandName})`, error);

			interaction.reply(
				`An error has occured.\n\n${codeBlock("js", error)}`
			);
		}
	}

	// Modals
	if (interaction.isModalSubmit()) {
		const modal = client.modals.get(interaction.customId);

		if (!modal)
			return interaction.reply(
				"It seems that the modal that you are trying to use, has not been created yet."
			);

		try {
			await modal.execute(client, interaction);
		} catch (error) {
			logger.error(`Modal (${interaction.customId})`, error);

			interaction.reply(
				`I just had a massive amount of Brain Damage, hold up.\n\n${codeBlock(
					"js",
					error
				)}`
			);
		}
	}

	// Autocomplete
	if (interaction.isAutocomplete()) {
		const command = interaction.client.commands.get(
			interaction.commandName
		);
		if (!command)
			return logger.error(
				`Autocomplete (${interaction.commandName})`,
				"Command does not exist"
			);

		try {
			await command.autocomplete(interaction);
		} catch (error) {
			return logger.error(
				`Autocomplete (${interaction.commandName})`,
				error
			);
		}
	}
});

// Login to Discord
client.login(process.env.TOKEN);
