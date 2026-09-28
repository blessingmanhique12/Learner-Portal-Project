const makeQuestions = (questions) => questions.map(([question, options, answer]) => ({ question, options, answer }));

export const stage5 = {
	name: 'JavaScript quiz',
	type: 'quiz',
	passPercentage: 70,
	questions: makeQuestions([
		['Which keyword declares a variable that cannot be reassigned?', ['var', 'let', 'const'], 'C'],
		['Which method adds an item to the end of an array?', ['push()', 'pop()', 'shift()'], 'A'],
		['What does === compare?', ['Only values', 'Values and types', 'Only types'], 'B'],
		['Which event runs when a button is clicked?', ['hover', 'submit', 'click'], 'C'],
		['Which format stores data as key-value pairs?', ['JSON', 'JPEG', 'CSV'], 'A']
	])
};

export const javascriptQuestions = stage5.questions;
