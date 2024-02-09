import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Server from "../../main";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set_alert_channel')
		.setDescription('Set the alert channel')
		.addChannelOption(option =>
			option.setName('channel')
				.setDescription('The channel wh/sere the alert will be')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		const channel = interaction.options.getChannel('channel');
		if(channel.type != 0)
			return await interaction.reply('Sorry, this channel is invalid!');

		if(Server.settings[channel.guildId] == null)
		{
			Server.settings[channel.guildId] = {
				alertChannel: channel.id,
				message: "{0} is streaming!",
				users: []
			}
		}
		else
			Server.settings[channel.guildId].alertChannel = channel.id;

		Server.saveSettings();
		await interaction.reply(`Alerts set in channel <#${channel.id}>`);
	},
};