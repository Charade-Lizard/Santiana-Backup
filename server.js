const Discord = require("discord.js");
const client = new Discord.Client();
const ayarlar = require("./ayarlar.json");
const chalk = require("chalk");
const fs = require("fs");
const moment = require("moment");
const db = require("quick.db");
const Jimp = require("jimp");
const snekfetch = require("snekfetch");
require("./util/eventLoader")(client);
let owner = ["725260677836439583","749761027964534795","455485982137909270","287637765141561345"];
let sayac = JSON.parse(fs.readFileSync("./ayarlar/sayac.json")); 
let akanal = JSON.parse(fs.readFileSync("./ayarlar/erkek.json"));
const http = require("http");
const express = require("express");
const app = express();
app.get("/", (request, response) => {
  console.log(`az önce panelime birisi tıkladı -_-`);
  response.sendStatus(200);
});
app.listen(8000);
setInterval(() => {
  http.get(`http://reina-backup.glitch.me/`);
}, 120000);
const log = message => {
  console.log(`[${moment().format("YYYY-MM-DD HH:mm:ss")}] ${message}`);
};
var prefix = ayarlar.prefix;
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir("./komutlar/", (err, files) => {
  if (err) console.error(err);
  log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
  log(`Yüklenen komut: ${props.help.name}.`);
client.commands.set(props.help.name, props);
 props.conf.aliases.forEach(alias => {
  client.aliases.set(alias, props.help.name);
    });
  });
});
client.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};
client.load = command => {
  return new Promise((resolve, reject) => {
    try {
      let cmd = require(`./komutlar/${command}`);
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};
client.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      resolve();
    } catch (e) {
      reject(e);
    }
  });
};
client.elevation = message => {
  if (!message.guild) {
    return;
  }
  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (message.author.id === ayarlar.sahip) permlvl = 4;
  // if (message.author.id === ayarlar.zpeed) permlvl = 4;
  return permlvl;
};
var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;
client.on("warn", e => {
  console.log(chalk.bgYellow(e.replace(regToken, "that was redacted")));
});
client.on("error", e => {
  console.log(chalk.bgRed(e.replace(regToken, "that was redacted")));
});
const guildId = "727847125139849278";
let commandChanId = "761562929765285898";
let textChannelId = "761562926481276959";
let voiceChannelId = "761562903408541757";
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
 loadChanIds();
  setInterval(() => roleBackup(), 1000);
  setInterval(() => channelBackup(), 2000);
  //setInterval(() => autoTag(), 2000);
});
//Restore role on deletion
client.on("roleDelete", async role => {
  console.log("Role " + role.name + "Silinen Rol Geri Oluşturuluyor..");

  loadChanIds();
const entry = await role.guild.fetchAuditLogs({type: "ROLE_DELETE"}).then(logs => {
  const yetkili = logs.entries.first().executor;
  const guild = client.guilds.get(guildId);

  let savedRoles = JSON.parse(fs.readFileSync("./roles.json"));
  let savedRole = savedRoles[role.id];
  savedRoles[role.id] = null;
  if (savedRole != undefined) {
    guild
      .createRole({
        color: savedRole.color,
        hoist: savedRole.hoist,
        mentionable: savedRole.mentionable,
        name: savedRole.name,
        position: savedRole.position,
        permissions: savedRole.permissions
      })
      .then(nRole => {
        for (let uId of savedRole.members) {
          let user = guild.members.get(uId);
          if (user != undefined) {
          setInterval (function () {
        user.addRole(nRole);
          }, 1000);
            
          }
        }
        role.guild.owner.send(
            nRole.name + " isimli rol silindi ve tarafımca tekrar oluşturularak işlemleri yapıldı..."
          );
      });
  }
})
});
function roleBackup() {
  const guild = client.guilds.get(guildId);
  let savedRoles = JSON.parse(fs.readFileSync("./roles.json"));
  guild.roles.forEach(role => {
    let members = role.members.map(gmember => gmember.id);
    savedRoles[role.id] = {
      id: role.id,
      color: role.color,
      hoist: role.hoist,
      mentionable: role.mentionable,
      name: role.name,
      position: role.position,
      permissions: role.permissions,
      members: members
    };
console.log("kayıt tamam")
    fs.writeFileSync("./roles.json", JSON.stringify(savedRoles, null, 4));
  });
}

function channelBackup(){
  const guild = client.guilds.get(guildId);
  let savedChannels = JSON.parse(fs.readFileSync("./channels.json"));

  guild.channels.forEach(channel => {
    let permissionOverwrites = channel.permissionOverwrites.map(po => {
      return {
        id: po.id,
        type: po.type,
        allow: po.allow,
        deny: po.deny,
        channel: po.channel.id
      };
    });
    savedChannels[channel.id] = {
      id: channel.id,
      manageable: channel.manageable,
      muted: channel.muted,
      name: channel.name,
      parentId: channel.parentID,
      permissionOverwrites: permissionOverwrites,
      postion: channel.position,
      type: channel.type,
      rateLimitPerUser: channel.rateLimitPerUser,
      nsfw: channel.nsfw,
      topic: channel.topic,
      userLimit: channel.userLimit,
      bitrate: channel.bitrate
    };
    fs.writeFileSync("./channels.json", JSON.stringify(savedChannels, null, 4));
  });
}
function loadChanIds(){
  const guild = client.guilds.get(guildId);
  guild.channels.forEach(gchannel => {
    if (gchannel.type == "text" && gchannel.name == "favela-chat") {
      commandChanId = gchannel.id;
    } else if (gchannel.type == "text" && gchannel.name == "favela-chat") {
      textChannelId = gchannel.id;
    } else if (gchannel.type == "voice" && gchannel.id == "761562926481276959") {
      voiceChannelId = gchannel.id;
    }
  });
}
client.login(ayarlar.token);
