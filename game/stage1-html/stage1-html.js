const makeQuestions = (questions) => questions.map(([question, options, answer]) => ({ question, options, answer }));

export const stage1 = {
	name: 'HTML quiz',
	type: 'quiz',
	passPercentage: 70,
	questions: makeQuestions([
		['Which tag is used for the largest heading?', ['h1', 'p', 'div'], 'A'],
		['What does HTML stand for?', ['HyperText Markup Language', 'HighText Mobile Language', 'Home Tool Markup Language'], 'A'],
		['Which tag creates a clickable link?', ['<button>', '<a>', '<img>'], 'B'],
		['Which section usually holds the page title and metadata?', ['body', 'head', 'footer'], 'B'],
		['What is the correct page structure?', ['html > head > body', 'body > head > html', 'head > body > title'], 'A']
	])
};

export const htmlQuestions = stage1.questions;
