import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Server from "../../main";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove_streamer')
		.setDescription('Remove streamer from alert list')
		.addStringOption(option =>
			option.setName('username')
				.setDescription('The Kick streamer username')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
        const username = interaction.options.getString('username');

		if(Server.settings[interaction.guildId] == null || Server.settings[interaction.guildId].users.filter((user) => user.username.toLowerCase() == username.toLowerCase())[0] == null)
            return await interaction.reply(`This username is not in your streamers list.`);

		for(let i = 0; i < Server.settings[interaction.guildId].users.length; i++) {
            const user = Server.settings[interaction.guildId].users[i];

            if(user.username.toLowerCase() == username.toLowerCase())
            {
                Server.settings[interaction.guildId].users.splice(i, 1);
                break;
            }
        }
        Server.saveSettings();

		await interaction.reply(`${username} has been removed from your streamer list.`);
	},
};