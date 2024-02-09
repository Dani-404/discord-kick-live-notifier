# kick-discord-notifier
Notify discord users of Kick.com livestreams launches

### Installation
```sh
$ npm install
$ npm start
```

### Developer mode
```sh
$ npm run dev
```

### Commands availables
* <b>/add_streamer</b> Add streamer to alert list
* <b>/remove_streamer</b> Remove streamer from alert list
* <b>/set_alert_channel</b> Set the alert channel
* <b>/set_alert_message</b> Set the alert message
* <b>/settings</b> Display your settings
* <b>/test_alert</b> Test an alert to the alert channel

### Config
[Config/Config.ts](https://github.com/Dani-404/kick-discord-notifier/blob/main/Config/Config.ts)<br>
<b>DISCORD_TOKEN</b> is your Discord bot tokenID<br />
<b>DISCORD_CLIENT_ID</b> is your Discord bot client/application ID<br />
<b>UPDATE_INTERVAL</b> is the update request interval in minutes

### Invitation URL
Your discord bot need permissions <b>2147483648</b> on your server for create commands.

### API URL used
* [https://kick.com/api/v2/channels/username](https://kick.com/api/v2/channels/username)
* [https://kick.com/api/v2/channels/username/livestream](https://kick.com/api/v2/channels/username/livestream)

### Bypassing Cloudflare recaptcha
Solve the captcha at the launching of puppeteer, you can adapt this in <b>init()</b> method in main.ts 
```ts
await page.goto('https://kick.com');
console.log("Waiting for resolve cloudflare captcha...");
await page.waitForSelector('#search-input-field');
console.log("Captcha successfully solved.");
```

### Output example
![image](https://i.imgur.com/rrmCRoN.png)

### Dependencies 
* typescript
* tsx
* discord.js
* fs
* path
* puppeteer
* puppeteer-extra
* puppeteer-extra-plugin-stealth
