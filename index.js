const { Client, GatewayIntentBits, Events } = require('discord.js');
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus, 
    VoiceConnectionStatus,
    StreamType
} = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');

// --- KONFIGURASI ---
const TOKEN = 'DISCORD_SECRET_TOKEN';
const CHANNEL_ID = 'DISCORD_VOICE_CHANNEL_ID';
const MUSIC_FOLDER = './music'; 

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] 
});

let connection;
let player;

client.once(Events.ClientReady, c => {
    console.log(`✅ Bot Online: ${c.user.tag}`);
    startBot();
});

function startBot() {
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) return console.error("❌ Error: Channel ID tidak ditemukan!");

    connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: true,
	selfMute: true
    });

    player = createAudioPlayer();
    connection.subscribe(player);

    function playRandom() {
        try {
            const files = fs.readdirSync(MUSIC_FOLDER).filter(f => f.endsWith('.mp3'));
            if (files.length === 0) return console.log("⚠️ Folder music kosong!");

            const randomSong = files[Math.floor(Math.random() * files.length)];
            const songPath = path.resolve(MUSIC_FOLDER, randomSong);
            
            // Resource Stream Paling Ringan untuk ARMv8l
            const resource = createAudioResource(fs.createReadStream(songPath), {
                inlineVolume: false
            });

            player.play(resource);
            console.log(`🎵 Memutar: ${randomSong}`);
        } catch (err) {
            console.error("❌ Error Play:", err.message);
            setTimeout(playRandom, 5000);
        }
    }

    player.on(AudioPlayerStatus.Idle, () => {
        console.log("⏹️ Lagu selesai, lanjut...");
        playRandom();
    });

    player.on('error', error => {
        console.error(`❌ Player Error: ${error.message}`);
        playRandom();
    });

    connection.on(VoiceConnectionStatus.Disconnected, () => {
        console.log("⚠️ Terputus, mencoba menyambung kembali...");
        setTimeout(startBot, 5000);
    });

    playRandom();
}

// Handler Ctrl+C agar keluar instan
process.on('SIGINT', () => {
    console.log("\n⚡ Keluar...");
    if (connection) connection.destroy();
    process.exit(0);
});

client.login(TOKEN);
