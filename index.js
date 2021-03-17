const Commando = require('discord.js-commando');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const client = new Commando.Client({
    owner: [
        '243677976321982475', 
        '430926076936716288', 
        '576857104099311621',
        '274108826414874626',
        '277375927212834816',
        '292562702067433491',
        '576446374653198336'
    ],
    disableEveryone: true,
    unknownCommandResponse: false,
    commandPrefix: '%%'
});

client.registry
    .registerDefaultTypes()
    .registerDefaultGroups()
    .registerDefaultCommands()
    .registerGroups([
        ['jury', 'Jury commands'],
        ['rankings', 'Ranking commands']
    ])
    .registerCommandsIn(path.join(__dirname, 'commands'));

client.on("ready", async () => {
    console.log("Started!");
});

client.login(process.env.TOKEN);