# JavaScript History and Console & DOM Challenges

## Introduction

For this research, I investigated the history of JavaScript and how the language has developed from its creation in 1995 into the modern programming language that is widely used today. I focused on the major changes that took place over the years, including the creation of JavaScript, the standardisation of ECMAScript, ES5, ES6/ES2015 and the yearly releases that followed.

I also looked at some of the practical characteristics of JavaScript, including dynamic typing, type coercion, DOM interaction and how JavaScript executes code.

JavaScript is commonly used together with HTML and CSS to create interactive websites. HTML provides the structure of a webpage, CSS controls its appearance, and JavaScript is responsible for behaviour and interaction. During my research, I also learned that ECMAScript and JavaScript are closely related, but they are not exactly the same thing. ECMAScript is the standard that defines the core language, while JavaScript is an implementation of that standard (MDN Web Docs, 2025).

---

# Part A — Annotated Timeline of JavaScript

## 1995 — Creation of JavaScript

JavaScript was created by Brendan Eich while he was working at Netscape. The language was developed in 1995 and was first released with Netscape Navigator 2.0.

The main idea behind JavaScript was to make webpages more interactive. At that time, many webpages were mainly static HTML documents. JavaScript allowed developers to create behaviour that could respond to actions performed by users.

For example, JavaScript could be used to respond when a user clicked a button, entered information into a form or interacted with elements on a webpage.

### Why this was important

This was the beginning of JavaScript as a browser scripting language. It changed the web from being mainly a collection of static documents into something that could respond to users.

### What I learned

From researching this stage, I learned that JavaScript was originally created mainly to add interaction to webpages. It was not initially designed to be the large programming ecosystem that we have today.

**Reference:** MDN Web Docs (2025).

---

## 1997 — ECMAScript Becomes a Standard

In 1997, ECMAScript was standardised through the ECMA-262 specification.

This was an important development because JavaScript was being used by different browsers, and there needed to be a common specification that could be followed.

The name ECMAScript can sometimes be confusing because most developers simply refer to the language as JavaScript. However, ECMAScript is the standard that defines the core language features, while JavaScript is an implementation of that standard.

### Why this was important

Standardisation helped different browsers follow the same language rules. It also created a foundation that allowed JavaScript to continue developing in a structured way.

### What I learned

I learned that JavaScript and ECMAScript are related but are not technically the same thing. ECMAScript provides the specification behind the core language.

**Reference:** Ecma International (2016).

---

## 2009 — ECMAScript 5 (ES5)

ECMAScript 5, commonly known as ES5, was adopted in December 2009.

ES5 introduced several features that made JavaScript more powerful and easier to work with. Some of the important additions included strict mode, JSON support, improved object property handling and several useful array methods.

Some of the array methods introduced or standardised around this period include:

```javascript
forEach()
map()
filter()
reduce()
```

These methods are still widely used when working with arrays in JavaScript.

### Why this was important

ES5 improved the language and provided developers with better tools for working with data and objects.

### What I learned

While studying JavaScript, I have come across methods such as `forEach()`, `map()`, `filter()` and `reduce()`. Researching ES5 helped me understand that these features are part of JavaScript's historical development rather than being completely new concepts.

**Reference:** Ecma International (2011).

---

## 2015 — ES6 / ECMAScript 2015

ECMAScript 2015, commonly called ES6, was one of the biggest updates in JavaScript's history.

This release introduced many features that are now considered part of modern JavaScript development.

Some of the major features included:

* `let`
* `const`
* Arrow functions
* Classes
* Modules
* Promises
* Template literals
* Destructuring
* Default parameters
* Spread and rest syntax
* Maps and Sets
* Iterators and generators

For example, modern JavaScript commonly uses:

```javascript
const name = "Ronald";

const greet = () => {
    console.log(`Hello ${name}`);
};
```

This style of code would not have been possible in exactly the same way before the features introduced by ES6.

### Why this was important

ES6 modernised JavaScript and made the language more suitable for larger and more complex applications.

It also introduced programming features that I now encounter when learning modern JavaScript.

### What I learned

ES6 was particularly important because many of the features I am learning today, such as `let`, `const`, arrow functions and promises, come from this major update.

**Reference:** Ecma International (2016).

---

## 2016 — JavaScript Moves to Yearly Releases

After ES6, ECMAScript changed the way new versions of the language were released.

Instead of waiting several years for another large update, ECMAScript moved towards a yearly release cycle.

ECMAScript 2016 was the first release under this new process. It included features such as the exponentiation operator:

```javascript
2 ** 3
```

and:

```javascript
Array.prototype.includes()
```

### Why this was important

The yearly release model allowed JavaScript to develop more consistently. New features could be introduced in smaller updates instead of waiting for another major version like ES6.

### What I learned

I learned that ES6 was not the end of JavaScript's development. The language continues to evolve through regular ECMAScript releases.

**Reference:** Ecma International (2016).

---

## 2017 — Async Functions and `await`

ECMAScript 2017 introduced `async` functions and the `await` keyword.

These features made asynchronous JavaScript easier to understand and write.

For example:

```javascript
async function getData() {
    const response = await fetch("data.json");
    const data = await response.json();

    return data;
}
```

Before `async` and `await`, developers often had to work with callbacks or promise chains, which could sometimes make asynchronous code difficult to follow.

### Why this was important

Modern websites and applications often need to communicate with APIs and retrieve information from servers. Asynchronous programming is therefore an important part of JavaScript development.

### What I learned

I learned that JavaScript's development has not only been about adding new syntax. Many updates have also been focused on making common programming tasks easier for developers to write and understand.

**Reference:** TC39 (2026).

---

## 2018–Present — Continuous Development

JavaScript has continued to receive regular ECMAScript updates since the introduction of the yearly release cycle.

The language is maintained through the ECMAScript specification and the work of TC39, the technical committee responsible for developing the standard.

New releases continue to introduce improvements to the language and its built-in functionality.

### Why this was important

JavaScript is still developing today. This means that the language I am learning now is much more advanced than the JavaScript that was originally released in 1995.

### What I learned

The biggest lesson I took from researching this period is that JavaScript is an evolving language. Developers need to continue learning because new features and improvements are introduced over time.

**Reference:** TC39 (2026).

---

# Summary of the Timeline

| Year             | Development                      | Importance                                                  |
| ---------------- | -------------------------------- | ----------------------------------------------------------- |
| **1995**         | JavaScript created               | Introduced programming and interaction into webpages        |
| **1997**         | ECMAScript standardised          | Provided a common specification for the language            |
| **2009**         | ES5                              | Added important improvements and array/object functionality |
| **2015**         | ES6 / ES2015                     | Major modernisation of JavaScript                           |
| **2016**         | Annual release cycle begins      | Allowed JavaScript to evolve through regular updates        |
| **2017**         | `async` / `await`                | Made asynchronous programming easier                        |
| **2018–Present** | Continued ECMAScript development | Keeps JavaScript relevant to modern development             |

---

# My Overall Findings

After researching the history of JavaScript, I can see that the language has changed considerably since it was first introduced.

JavaScript started as a relatively small scripting language designed to make webpages interactive. It then became standardised through ECMAScript and continued to receive major improvements.

ES5 introduced features that are still useful when working with arrays, objects and JSON. ES6 was an especially important change because it introduced many of the features that are now used in modern JavaScript, such as `let`, `const`, arrow functions, classes, modules and promises.

The move to yearly ECMAScript releases also showed me that JavaScript is continuously changing. Instead of waiting for another major version, new features can be introduced and improved regularly.

This research has given me a better understanding of where the JavaScript features I am currently learning actually came from.

---

# Part B — Console & DOM Challenges

The second part of the task focuses on practical JavaScript concepts. The three challenges demonstrate different characteristics of JavaScript and are completed separately from the main project.

The challenge files are kept in a separate folder as required:

```text
js-fundamentals-challenges/
├── js-fundamentals-challenges.html
└── challenges.js
```

The supplied TODOs in `challenges.js` should be completed without changing the purpose of each challenge.

---

## Challenge 1 — Type Detective

**Concept demonstrated:** Dynamic typing and DOM interaction

This challenge demonstrates that JavaScript is dynamically typed. A variable does not have to remain the same type throughout the program.

It also demonstrates how JavaScript can communicate with the webpage through the DOM. JavaScript can retrieve information from HTML elements, process that information and then update the webpage.

### Three characteristics I observed

**1. JavaScript is dynamically typed**

JavaScript variables can contain different types of values during the execution of a program.

**2. JavaScript can interact with the DOM**

JavaScript can access HTML elements and change their content or properties.

**3. JavaScript responds to user interaction**

Events allow JavaScript to respond to actions such as clicking a button or entering information.

### One limitation I observed

Dynamic typing can make some errors difficult to identify because an incorrect type may only become a problem when the program actually runs.

---

## Challenge 2 — Type Coercion Quiz

**Concept demonstrated:** Dynamic typing and type coercion

This challenge demonstrates type coercion. JavaScript can automatically convert one data type into another when performing certain operations.

For example, the behaviour of the `+` operator can change depending on whether the values being used are numbers or strings.

JavaScript also has different comparison operators, such as:

```javascript
==
```

and:

```javascript
===
```

The strict equality operator `===` does not perform the same automatic type conversion as `==`.

### Three characteristics I observed

**1. JavaScript can automatically convert data types**

The language may convert a value from one type to another depending on the operation being performed.

**2. Operators can behave differently depending on data types**

For example, the `+` operator can perform either addition or string concatenation.

**3. JavaScript provides different types of equality comparisons**

The `==` and `===` operators do not behave in exactly the same way.

### One limitation I observed

Automatic type coercion can sometimes produce unexpected results. If a developer does not understand how JavaScript converts values, it can lead to bugs.

---

## Challenge 3 — Execution Order Puzzle

**Concept demonstrated:** JavaScript execution and hoisting

This challenge demonstrates how JavaScript handles declarations and execution order.

One important concept is hoisting. Certain declarations are processed in a way that allows them to behave as though they are available before their position in the source code.

Function declarations and variables declared using `var` behave differently from variables declared using `let` and `const`.

For example, `let` and `const` cannot be accessed before their declaration because of the temporal dead zone.

### Three characteristics I observed

**1. JavaScript has specific rules for processing declarations**

The order in which declarations are handled is not always identical to simply reading the code from the first line to the last.

**2. Different declaration types behave differently**

`var`, `let`, `const` and function declarations have different rules regarding hoisting and access.

**3. Execution order affects the result of a program**

Understanding how JavaScript processes declarations and executes statements is important when predicting what a program will do.

### One limitation I observed

Hoisting can make JavaScript code confusing, particularly when variables or functions are declared far away from where they are used. Writing declarations before they are used makes the code easier to understand.

---

# Browser / Runtime Version

I recorded the browser environment used for the practical challenges using:

```javascript
navigator.userAgent
```

**Browser/runtime recorded:**

`[PASTE THE EXACT navigator.userAgent RESULT HERE]`

This records the browser and operating-system environment in which the challenges were tested.

---

# Console & DOM Challenges

The practical files are stored separately from the main project folder, as required by the assignment.

* [JS Fundamentals Challenges — DOM + Console](../js-fundamentals-challenges/js-fundamentals-challenges.html)

The `js-fundamentals-challenges.html` file and `challenges.js` file should remain together in the separate challenge folder/repository.

---

# Conclusion

This research helped me understand how JavaScript developed from a language created for adding simple interaction to webpages into a modern programming language used for much larger applications.

The timeline shows that some of the most important changes happened through ES5 and ES6, while the yearly ECMAScript release process has allowed JavaScript to continue improving.

The practical challenges also helped connect the research to actual JavaScript behaviour. Dynamic typing, type coercion, DOM interaction and execution order are not only theoretical concepts; they affect the way JavaScript programs behave when they are run in a browser.

Overall, the research gave me a better understanding of both the history of JavaScript and some of the reasons why modern JavaScript behaves the way it does.

---

# References — Harvard Style

Ecma International (2011) *ECMAScript Language Specification: ECMA-262, 5.1 Edition*. Available at: https://262.ecma-international.org/5.1/ (Accessed: 11 August 2026).

Ecma International (2016) *ECMAScript 2016 Language Specification: ECMA-262, 7th Edition*. Available at: https://tc39.es/ecma262/2016/ (Accessed: 11 August 2026).

MDN Web Docs (2025) *JavaScript*. Available at: https://developer.mozilla.org/en-US/docs/Glossary/JavaScript (Accessed: 11 August 2026).

TC39 (2026) *ECMAScript Language Specification*. Available at: https://tc39.es/ecma262/ (Accessed: 11 August 2026).
