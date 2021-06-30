require('dotenv').config();
const Discord = require('discord.js');
const fs = require('fs');
const request = require('request');
const info = JSON.parse(fs.readFileSync(__dirname + '/info.json'));
const users = JSON.parse(fs.readFileSync(__dirname + '/live.json'));
const bot = new Discord.Client({ partials: ["MESSAGE", "REACTION", "CHANNEL"] });

bot.on('ready', () => {
    setInterval(checkTwitch, 60000, users)
    console.log(`Connected as: ${bot.user.tag}`)
})

bot.on('message', async message => {
    if(message.author.bot) return;
    const args = message.content.substring(process.env.PREFIX.length).split(" ");
    
    if(message.content.toLowerCase().startsWith(`${process.env.PREFIX}twitch`)){
        if(args[1] == "add" || args[1] == "-a"){
            if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send(`You do not have permission to use this command!`);
            if(args.length < 3) return message.channel.send(`Invalid Usage! ${process.env.PREFIX}twitch add <username>`);
            if(args[2].includes('<') || args[1].includes('>')) return message.channel.send(`The brackets were only there for the example. Remove the brackets`);
            add(message, args)
        } else if(args[1] == "remove" || args[1] == "-r"){
            if(!message.member.hasPermission("ADMINISTRATOR")) return message.channel.send(`You do not have permission to use this command!`);
            if(args.length != 3) return message.channel.send(`Invalid usage! ${process.env.PREFIX}twitch remove <username>`)
            if(args[2].includes('<') || args[2].includes('>')) return message.channel.send(`The brackets were only there for the example. Remove the brackets`)
            remove(message, args)
        } else if(args[1] == "list" || "-l"){
            const streamers = getList();
            return message.channel.send(`The list of saved streamers is: **${streamers}**`)
        }
    
    }


})

bot.login(process.env.TOKEN);


function checkTwitch(users){
    var write_arr = []
    var change;
    for(var i=0; i<users.users.length - 1; i++){

        var loadObject = {
            name: users.users[i].name,
            live: users.users[i].live
        }

        const gameOptions = {
            url: `https://api.twitch.tv/helix/search/channels?query=${users.users[i].name}`,
            method: 'GET',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID,
                'Authorization': 'Bearer ' + process.env.TWITCH_TOKEN
            }
        }
        request.get(gameOptions, (err, res, body) => {
            if(err) throw err;
            const data = JSON.parse(body)
            if(data.data[0].is_live === true){
                if(users.users[i].live === false){
                    const live_notify = bot.channels.cache.get("858495704384798771");
                    change = true;
                    if(!live_notify) return;
                    
                    live_notify.send(`@here Come join ${data.data[0].display_name} (${data.data[0].game_name}) https://twitch.tv/${data.data[0].broadcaster_login}`)
                    loadObject[i].live === true;
                }
                loadObject[i].live = true
            } else if(data.data[0].is_live === false){
                if(users.users[i].live != false){
                    loadObject[i].live = false
                    change = true;
                }
            }
        })

        write_arr.push(loadObject)
    }
    
    if(change == true){
        fs.writeFile(__dirname + '/live.json', JSON.stringify(users, null, 4), err => {
            if(err) throw err;
        })
    } else {
        return;
    }
    
}


function add(message, args){
    
    var write_arr = []
    
    for(var i=0; i<users.users.length; i++){
        var objUsers = {
            name: users.users[i].name,
            live: users.users[i].live
        }
        write_arr.push(objUsers)
    }
    for(var x=2; x<=args.length - 1; x++){
        var objArgs = {
            name: args[x],
            live: false
        }
        write_arr.push(objArgs)
    }
    users["users"] = write_arr;
    fs.writeFile(__dirname + '/live.json', JSON.stringify(users, null, 4), err => {
        if(err) throw err;
        console.log(write_arr)
        return message.channel.send(`Added ${args.slice(2).join(", ")}`)
    })
}

function remove(message, args){
    var rm_write_arr = []
    
    for(i in users.users){
        for(x in args.slice(2)){
            const is_same = users.users[i].name == args.slice(2)[x]
            if(!is_same == true){
                rm_write_arr.push(users.users[i])
            }
        }
    }

    users["users"] = rm_write_arr;
    fs.writeFile(__dirname + '/live.json', JSON.stringify(users, null, 4), err => {
        if(err) throw err;
        return message.channel.send(`Removed ${args.slice(2).join(", ")}`)
    })
}

function getList(){
    const return_array = []
    for(var i=0; i<users.users.length; i++){
        return_array.push(users.users[i].name)
    }
    return return_array.join(", ");
}
