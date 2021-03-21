const { Command } = require('discord.js-commando');
const { Canvas, resolveImage, rgba } = require('canvas-constructor');
const fetch = require('node-fetch');
const { registerFont } = require('canvas');
registerFont('./fonts/Metropolis-Regular.otf', {family: 'Metropolis'});
const countries = require('../../countries.json');
const dotenv = require('dotenv');
dotenv.config();

module.exports = class ViewCommand extends Command {
    constructor(client) {
		super(client, {
			name: 'view',
			aliases: [],
			group: 'rankings',
			memberName: 'rankings',
			description: 'View your ranking of 2021.',
			args: [{
				key: 'code',
				prompt: 'Contest code',
				type: 'string',
				default: '2021',
				oneOf: ['2021', '2020']
			}]
		});
	}

	async getCountryFlag(code) {
		return await resolveImage(`./img/4x3/${code}.svg`);
	}

    async run(message, { code }) {
		console.log(`Image generating requested by ${message.author.tag}`);
		const msg = await message.say(`*Generating image for **${message.author.tag}**, please wait...*`);

		const userId = message.author.id;
		let ranking;

		await fetch(`${process.env.ENDPOINT}/ranking/${userId}/${code}`)
			.then(res => res.json())
			.then(result => {
				if (!result) return;

				ranking = result.ranking;
			})
			.catch(err => {
				console.log(err);
				return message.say("Couldn't fetch your ranking! Are you sure you have made a ranking?");
			});

		if (!ranking) {
			await message.reply("couldn't fetch your ranking! Are you sure you have made a ranking?");
			return await msg.delete();
		}

		const divide = ranking.length % 3 === 0 ? ranking.length / 3 : Math.ceil(ranking.length / 3);
		let [column, row] = [0, 0];

		let background = await resolveImage('./img/ranking/venue2021.jpg');
		let canvas = new Canvas(1280, 720)
						.printImage(background, 0, 0, 1280, 720)
						.setColor('#FFFFFF')
						.setTextFont('32pt Metropolis')
						.printText(`Ranking of ${message.author.tag}`, 32, 48)
						.setTextFont('20pt Metropolis')
						.printText(`Eurovision Song Contest ${code}`, 32, 80);
		
		const [boxWidth, boxHeight] = [384, 32];

		for (const rank of ranking) {
			if (row >= divide) {
				column++;
				row = 0;
			}

			const country = countries.find(x => x.code === rank.code).name;

			const [xPos, yPos] = [32 + (column * (boxWidth + 16)), 109 + (row * (boxHeight + 8))];

			const flag = await this.getCountryFlag(rank.code);

			canvas.setColor(rgba(0, 32, 96, 0.95))
				.printRectangle(xPos, yPos, boxWidth, boxHeight)
				.setColor('#FFFFFF')
				.setTextFont('20pt Metropolis')
				.printText(`${rank.position < 10 ? `0${rank.position}` : rank.position}`, xPos + 4, yPos + 24)
				.printImage(flag, xPos + 48, yPos, 48, boxHeight)
				.printText(country, xPos + 100, yPos + 24, 270);
			
			row++;
		}

		const image = canvas.toBuffer();

		await message.say({
			files: [
				{
					attachment: image,
					name: `ranking-2021-${userId}-${Date.now()}.png`
				}
			]
		});

		await msg.delete();
    }
}