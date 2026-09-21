const makeQuestions = (questions) => questions.map(([question, options, answer]) => ({ question, options, answer }));

export const stage3 = {
	name: 'CSS quiz',
	type: 'quiz',
	passPercentage: 70,
	questions: makeQuestions([
		['Which property changes text colour?', ['font-style', 'color', 'background'], 'B'],
		['Which selector targets an element with the id "main"?', ['.main', '#main', 'main'], 'B'],
		['Which property controls space inside an element?', ['padding', 'margin', 'display'], 'A'],
		['Which value makes an element a flex container?', ['position: flex', 'display: flex', 'flex: display'], 'B'],
		['Which unit is relative to the root font size?', ['px', 'rem', '%'], 'B']
	])
};

export const cssQuestions = stage3.questions;
