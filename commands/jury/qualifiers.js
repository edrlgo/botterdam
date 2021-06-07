const { Canvas, resolveImage, rgba } = require('canvas-constructor');
const { Command } = require('discord.js-commando');
const { registerFont } = require('canvas');
registerFont('./fonts/Metropolis-Regular.otf', { family: 'Metropolis', weight: 'normal', style: 'normal' });
registerFont('./fonts/Metropolis-Bold.otf', { family: 'Metropolis', weight: 'bold', style: 'normal' });
registerFont('./fonts/Metropolis-Light.otf', {family: 'Metropolis', weight: 'lighter', style: 'normal' });
const countries = require('../../countries.json');
const juryResults = require('../../hangout-jury-2021.json');

module.exports = class QualifiersCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'qualifiers',
			aliases: ['qua'],
			group: 'jury',
			memberName: 'qualifiers',
			description: 'Generates the jury semi-final qualifiers.',
			args: [
				{
					key: 'heat',
					prompt: 'Heat',
					type: 'string',
					oneOf: ['sf1', 'sf2', 'f']
				}
			]
		});
	}

	async getCountryFlag(code) {
		return await resolveImage(`./img/4x3/${code}.svg`);
	}

    async run(message, { heat }) {
		console.log(`Image generating requested by ${message.author.tag}`);
		const msg = await message.say(`*Generating image for **${message.author.tag}**, please wait...*`);

		const userId = message.author.id;

		let ranking = juryResults.filter(x => x.heat === heat).sort((a, b) => b.average - a.average);

		const background = await resolveImage('./img/jury/qualifiers.png');

		let [column, row] = [0, 0];

		const color = '#FFFFFF';

		let heatName = '';

		switch (heat) {
			case 'sf1':
				heatName = 'Semi-Final 1';
				break;
			case 'sf2':
				heatName = 'Semi-Final 2';
				break;
			case 'f':
				heatName = 'Grand Final';
				break;
			default:
				heatName = 'Grand Final';
				break;
		}

		let canvas = new Canvas(1280, 720)
						.printImage(background, 0, 0)
						.setColor(color)
						.setTextAlign('right')
						.setTextFont('20pt Metropolis')
						.printText('The Eurovision Hangout Jury', 1248, 32)
						.setTextFont('bold 32pt Metropolis')
						.printText(`Qualifiers to the Final`, 1248, 80)
						.printText(heatName, 1248, 128);
		
		const [boxWidth, boxHeight] = [400, 40];

		let index = 0;

		for (const rank of ranking) {
			if (index > 9) break;

			const code = countries.find(x => x.name === rank.country).code;
			console.log(`${rank.country} --> ${code}`);

			const [xPos, yPos] = [840 + (column * (boxWidth + 32)), 160 + (row * (boxHeight + 8))];

			const flag = await this.getCountryFlag(code);

			canvas.setColor(rgba(0, 32, 96, 0.95))
				.printRectangle(xPos, yPos, boxWidth, boxHeight)
				.setColor('#FFFFFF')
				.setTextFont('30pt Metropolis')
				.setTextAlign('left')
				.printImage(flag, xPos, yPos, 56, boxHeight)
				.printText(rank.country, xPos + 68, yPos + 32, 320);
			
			row++;
			index++;
		};

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
};