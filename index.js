const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField } = require('discord.js');
const config = require('./config');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

// Bot aktif olduğunda çalışır
client.once('ready', () => {
    console.log(`${client.user.tag} Başarıyla Aktif Hale Geldi!`);
    console.log(`${client.user.tag} Developer "uzisex"`);
    console.log(`${client.user.tag} Botun tüm hakkları saklıdır!`);
});

// Ticket butonu için
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const { customId, guild, member } = interaction;

    // Ticket açma işlemi
    if (customId === 'create_ticket') {
        const existingChannel = guild.channels.cache.find(
            (channel) => channel.name === `ticket-${member.id}`
        );

        if (existingChannel) {
            return interaction.reply({
                content: 'Zaten açık bir ticketiniz var.',
                ephemeral: true,
            });
        }

        const ticketChannel = await guild.channels.create({
            name: `ticket-${member.id}`,
            type: 0, // Text channel
            parent: config.ticketCategoryId,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: member.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ],
                },
                {
                    id: config.roleId,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ],
                },
            ],
        });

        console.log(`Ticket Channel Created: ${ticketChannel.name} (ID: ${ticketChannel.id})`);

        const embed = new EmbedBuilder()
            .setColor('#7912ff')
            .setTitle('Ticket Açıldı!')
            .setDescription(
                'Yetkili ekibimiz kısa süre içinde sizinle ilgilenecektir. Bu kanal üzerinden iletişim kurabilirsiniz.\n\nEğer yanlışlıkla ticket açtıysanız, ticketinizi kapatabilirsiniz.'
            )
            .setFooter({ text: 'Destek Sistemi', iconURL: client.user.displayAvatarURL() });

        // Ticket kanalına kapatma butonu ekliyoruz
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Ticket Kapat')
                .setStyle(ButtonStyle.Danger)
        );

        ticketChannel.send({
            content: `<@${member.id}> <@&${config.roleId}>`,
            embeds: [embed],
            components: [row],
        });

        interaction.reply({
            content: `Ticket kanalınız oluşturuldu: ${ticketChannel}`,
            ephemeral: true,
        });
    }

    // Ticket kapatma işlemi
    if (customId === 'close_ticket') {
        // Kapatma butonunu sadece yetkili rolüne sahip kişilerin kullanabilmesi için kontrol ekleniyor
        if (!member.roles.cache.has(config.roleId)) {
            return interaction.reply({
                content: 'Bu ticketi kapatma yetkiniz yok. Sadece yetkililer ticketi kapatabilir.',
                ephemeral: true,
            });
        }

        // Ticket kanalını kapatma işlemi
        const ticketChannel = interaction.channel;

        if (!ticketChannel.name.startsWith('ticket-')) {
            return interaction.reply({
                content: 'Bu kanal bir ticket kanalı değil.',
                ephemeral: true,
            });
        }

        try {
            // Kapanma mesajını tek bir kez gönderiyoruz
            await interaction.reply({
                content: 'Ticket başarıyla kapatılıyor...',
                ephemeral: true,
            });

            // Ticket kanalını 3 saniye içinde sileceğiz
            setTimeout(async () => {
                // Kanalı tamamen siliyoruz
                await ticketChannel.delete();

                console.log(`Ticket Kanalı Silindi: ${ticketChannel.name}`);
            }, 3000); // 3 saniye gecikme

        } catch (error) {
            console.error('Ticket Kapatma Hatası:', error);
            interaction.reply({
                content: 'Ticket kapatılırken bir hata oluştu.',
                ephemeral: true,
            });
        }
    }
});

// Ticket mesajı oluşturma
client.on('ready', async () => {
    const guild = client.guilds.cache.get(config.guildId);
    const channel = guild.channels.cache.find((ch) => ch.name === '・ticket');

    if (!channel) {
        console.error('Ticket kanalı bulunamadı.');
        return;
    }

    const embed = new EmbedBuilder()
        .setColor('#7912ff')
        .setTitle(' <:TicketButton:1329153498645925938> Destek Sistemi')
        .setDescription(
            `Merhaba! Aşağıdaki **"Ticket Aç"** butonuna tıklayarak destek talebi oluşturabilirsiniz. Destek talebiniz açıldığında, sizinle ilgilenecek yetkili en kısa sürede yanıt verecektir.\n\n
**Ticket Ne İçin Kullanılır?**
- Bir sorun bildirimi yapmak için.
- Hesap sorunlarınız hakkında yardım almak için.
- Genel sorularınızı yetkililere iletmek için.
            
- Lütfen sabırlı olun, tüm talepler sırayla cevaplanacaktır.`
        )
        .setImage('https://cdn.discordapp.com/attachments/1132466679411118101/1329227314159943700/tickets-png-crisp-quality_2.png?ex=678992e7&is=67884167&hm=8a9b1a29712bc756f5273228514f548b9570bb8f6c1448b9a687326e037a8635&') // Banner gibi görünmesi için resim URL'si
        .setFooter({ text: 'DevSync Network © 2025 Destek Sistemi', iconURL: client.user.displayAvatarURL() });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Ticket Aç')
            .setStyle(ButtonStyle.Primary)
    );

    await channel.send({ embeds: [embed], components: [row] });
});

// Bot tokeni ile giriş yap
client.login(config.token);