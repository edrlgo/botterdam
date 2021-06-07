const { Canvas, resolveImage, rgba } = require('canvas-constructor');
const { Command } = require('discord.js-commando');
const { registerFont } = require('canvas');
registerFont('./fonts/Metropolis-Regular.otf', { family: 'Metropolis', weight: 'normal', style: 'normal' });
registerFont('./fonts/Metropolis-Bold.otf', { family: 'Metropolis', weight: 'bold', style: 'normal' });
registerFont('./fonts/Metropolis-Light.otf', {family: 'Metropolis', weight: 'lighter', style: 'normal' });
const countries = require('../../countries.json');
const juryResults = require('../../hangout-jury-2021.json');

module.exports = class ResultsCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'results',
			aliases: [],
			group: 'jury',
			memberName: 'results',
			description: 'Generates the jury results.'
		});
	}

	async getCountryFlag(code) {
		return await resolveImage(`./img/4x3/${code}.svg`);
	}

    async run(message) {
		console.log(`Image generating requested by ${message.author.tag}`);
		const msg = await message.say(`*Generating image for **${message.author.tag}**, please wait...*`);

		const userId = message.author.id;
		let ranking = juryResults.sort((a, b) => b.average - a.average);

		const divide = ranking.length % 3 === 0 ? ranking.length / 3 : Math.ceil(ranking.length / 3);
		let [column, row] = [0, 0];

		const color = '#FFFFFF';

		let canvas = new Canvas(1330, 740)
						.setColor('#260E62')
						.printRectangle(0, 0, 1330, 740)
						.setColor(color)
						.setTextFont('32pt Metropolis')
						.printText(`Hangout Jury Results 2021`, 32, 64);
		
		const [boxWidth, boxHeight] = [404, 32];

		let index = 1;

		for (const rank of ranking) {
			if (row >= divide) {
				column++;
				row = 0;
			}

			const code = countries.find(x => x.name === rank.country).code;
			console.log(`${rank.country} --> ${code}`);

			const [xPos, yPos] = [32 + (column * (boxWidth + 32)), 109 + (row * (boxHeight + 16))];

			const flag = await this.getCountryFlag(code);

			canvas.setColor(rgba(0, 32, 96, 0.95))
				.printRectangle(xPos, yPos, boxWidth, boxHeight)
				.setColor('#FFFFFF')
				.setTextFont('20pt Metropolis')
				.setTextAlign('left')
				.printText(`${index < 10 ? `0${index}` : index}`, xPos + 4, yPos + 24)
				.printImage(flag, xPos + 48, yPos, 48, boxHeight)
				.printText(rank.country, xPos + 100, yPos + 24, 270)
				.setTextFont('bold 20pt Metropolis')
				.setTextAlign('right')
				.printText(rank.average, xPos + boxWidth - 8, yPos + 24, 270);
			
			row++;
			index++;
		};

		const image = canvas.toBuffer();

		await message.say({
			files: [
				{
					attachment: image,
					name: `results-2021-${userId}-${Date.now()}.png`
				}
			]
		});

		await msg.delete();
    }
};