import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Server from "../../main";

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add_streamer')
		.setDescription('Add streamer to alert list')
		.addStringOption(option =>
			option.setName('username')
				.setDescription('The Kick streamer username')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
        const username = interaction.options.getString('username');

		if(Server.settings[interaction.guildId] != null && Server.settings[interaction.guildId].users.filter((user) => user.username.toLowerCase() == username.toLowerCase())[0])
            return await interaction.reply(`This streamer is already in list.`);

		let page = (await Server.browser.pages())[0];
		await page.goto(`https://kick.com/api/v2/channels/${username}`);

		const body = await page.waitForSelector('body');
		if(body == null) {
			await interaction.reply(`An error occured.`);
			return;
		}

		const value = await body.evaluate(el => el.textContent);
		if(value == null) {
			await interaction.reply(`An error occured.`);
			return;
		}

		let infos;
		try {
			infos = JSON.parse(value)
		}
		catch {
			return await interaction.reply(`Invalid username.`);
		}

		if(infos == null || infos.user == null) {
			await interaction.reply(`An error occured.`);
			return;
		}

		if(Server.settings[interaction.guildId] == null)
		{
			Server.settings[interaction.guildId] = {
				alertChannel: null,
				message: "{0} is streaming!",
				users: [{username: infos.user.username, isLive: null}]
			}

            Server.saveSettings();
		}
		else {
            Server.settings[interaction.guildId].users.push({
				username: infos.user.username,
				isLive: null
			});
            Server.saveSettings();
        }

		await interaction.reply(`${infos.user.username} has been added to the streamer list.`);
	},
};