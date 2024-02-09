import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Server from "../../main";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set_alert_message')
		.setDescription('Set the alert message')
		.addStringOption(option =>
			option.setName('message')
				.setDescription('The alert message displayed, use {0} for username, example: "{0} is streaming!"')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		const message = interaction.options.getString('message');

		if(Server.settings[interaction.guildId] == null)
		{
			Server.settings[interaction.guildId] = {
				alertChannel: null,
				message: message,
				users: []
			}
		}
		else
			Server.settings[interaction.guildId].message = message;

		Server.saveSettings();
		await interaction.reply(`Message updated.`);
	},
};