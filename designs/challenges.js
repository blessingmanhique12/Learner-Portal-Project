document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('userInput');
  const button = document.getElementById('analyzeBtn');
  const output = document.getElementById('output');
  const coercionOutput = document.getElementById('coercionOutput');
  const executionOutput = document.getElementById('executionOutput');

  const writeLines = (element, title, lines) => {
    if (element) {
      element.textContent = [title, ...lines].join('\n');
    }

    console.log(title);
    lines.forEach((line) => console.log(line));
  };

  if (button && input && output) {
    button.addEventListener('click', () => {
      const rawValue = input.value;
      const value = rawValue.trim();

      if (value === '') {
        output.textContent = 'Please enter a value to analyze.';
        output.className = 'not-number';
        return;
      }

      let type = 'string';
      let detail = `Text length: ${value.length}`;

      if (value === 'true' || value === 'false') {
        type = 'boolean';
        detail = `Boolean value: ${value === 'true'}`;
      } else if (!Number.isNaN(Number(value))) {
        type = 'number';
        detail = `Numeric value: ${Number(value)}`;
      }

      output.textContent = `Input: "${value}" | Type: ${type} | ${detail}`;
      output.className = type === 'number' ? 'valid-number' : 'not-number';
    });
  }

  const coercionLines = [
    `'5' + 2 = ${'5' + 2}`,
    `'5' - 2 = ${'5' - 2}`,
    `'5' == '5' = ${'5' == '5'}`,
    `'5' === 5 = ${'5' === 5}`,
  ];

  writeLines(coercionOutput, 'Challenge 2 - Type Coercion Quiz', coercionLines);

  const executionLines = [];
  const record = (value) => executionLines.push(String(value));

  record('Start');
  record(typeof x);
  var x = 10;
  record(x);

  function showValue() {
    record('Function executed');
  }

  showValue();

  try {
    record(y);
  } catch (error) {
    record(`Intentional error: ${error.message}`);
  }

  let y = 20;
  record('End');

  writeLines(executionOutput, 'Challenge 3 - Execution Order Puzzle', executionLines);
});
