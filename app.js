'use strict';

// insert from another file or node_module



const BASE_API_URL = 'https://opentdb.com';
const TOP_LEVEL_COMPONENTS = [
  'js-intro', 'js-question', 'js-question-feedback',
  'js-outro', 'js-quiz-status'
];

let QUESTIONS = [];

// token is global because store is reset between quiz games, but token should persist for
// entire session
let sessionToken;

const getInitialStore = function(){
  return {
    page: 'intro', //render
    currentQuestionIndex: null,
    userAnswers: [], //template
    feedback: null, //template
    sessionToken: null,//api
  };
};

let store = getInitialStore();
//let store = new Store();
// Helper functions
// ===============
const hideAll = function() {
  TOP_LEVEL_COMPONENTS.forEach(component => $(`.${component}`).hide());
};


class Store = {
  constructor(){
    this.currentQuestionIndex = 0;
    this.userAnswers = [];
  }

  setCurrentQuestionIndex(input){
    this.currentQuestionIndex = input;
  }

  getCurrentQuestionIndex(){
    return currentQuestionIndex;
  }

  setUserAnswers(input){
    this.userAnswers.push(input);
  }

  getUserAnswers () {
    return this.userAnswers;

  }
}

//job: create html
/*
functions:

generateFeedbackHtml
generateQuestionHtml
generateAnswerItemHtml

*/
class TemplateGenerator {

    constructor(answer = "", question = "", feedback = "") {
      this.answer = answer;
      this.question = question;
      this.feedback = feedback ;
    }

    setAnswer(input) {
      this.answer = answer;
    }

    setQuestion(input) {
      this.question = question;
    }

    setFeedback(input) {
      this.feedback = feedback;
    }

    getAnswer() {
      console.log(this.answer);
      return this;
    }

    getQuestion() {
      console.log(this.question);
      return this.question;
    }

    getFeedback() {
      console.log(this.feedback);
      return this.feedback;
    }

    generateAnswerItemHtml() {
      return `
        <li class="answer-item">
          <input type="radio" name="answers" value="${this.answer}" />
          <span class="answer-text">${this.answer}</span>
        </li>
      `;
    };

    generateQuestionHtml() {
      const answers = this.question.answers
        .map((answer, index) => generateAnswerItemHtml(answer, index))
        .join('');

      return `
        <form>
          <fieldset>
            <legend class="question-text">${this.question.text}</legend>
              ${answers}
              <button type="submit">Submit</button>
          </fieldset>
        </form>
      `;
    };

    generateFeedbackHtml() {
      return `
        <p>
          ${this.feedback}
        </p>
        <button class="continue js-continue">Continue</button>
      `;
    };

}

//job of apicalls is to call our api
class ApiCalls {

  //things i need
  constructor () {
    this._sessionToken = "";
  }

  setSessionToken(input) {
    this.sessionToken = input;
  }

  getSessionToken() {
    return this.sessionToken;
  }
  //functions API_CALLS uses.
  buildBaseUrl(amt = 10, query = {}) {
    const url = new URL(BASE_API_URL + '/api.php');
    const queryKeys = Object.keys(query);
    url.searchParams.set('amount', amt);

    if (this.getSessionToken()) {
      url.searchParams.set('token', this.getSessionToken());
    }

    queryKeys.forEach(key => url.search);
  }

  buildTokenUrl(){
    return new URL(BASE_API_URL + '/api_token.php');
  }

  fetchToken(callback){
    if (this.getSessionToken()) {
      return callback();
    }

    const url = buildTokenUrl();
    url.searchParams.set('command', 'request');

    $.getJSON(url, res => {
      this.setSessionToken(res.token);
      callback();
    }, err => console.log(err));
  }

  fetchQuestions(amt, query, callback) {
    $.getJSON(this.buildBaseUrl(amt, query), callback, err => console.log(err.message));
  };

}
//constants
ApiCalls.prototype.BASE_API_URL = "https://opentdb.com";

class DomListeners {
  constructor(Api, TemplateGenerator, Renderer, store) {
    this.api = api;
    this.TemplateGenerator = TemplateGenerator;
    this.Renderer = Renderer;
    this.store = store;
  }

  handleStartQuiz() {
    //store = getInitialStore();
    Renderer.reset();
    Renderer.setPage('question');
    Renderer.setCurrentQuestionIndex(0);
    const quantity = parseInt($('#js-question-quantity').find(':selected').val(), 10);
    fetchAndSeedQuestions(quantity, { type: 'multiple' }, () => {
    Renderer.render();
    });
  };

  handleSubmitAnswer(e) {
    e.preventDefault();
    const question = getCurrentQuestion();
    const selected = $('input:checked').val();
    store.setUserAnswers(selected);

    if (selected === question.correctAnswer) {
      this.TemplateGenerator.feedback = 'You got it!';
    } else {
      this.TemplateGenerator.feedback = `Too bad! The correct answer was: ${question.correctAnswer}`;
    }

    Renderer.setPage('answer');
    Renderer.render();
  };

  handleNextQuestion() {
    if (store.currentQuestionIndex === QUESTIONS.length - 1) {
      Renderer.setPage('outro');
      Renderer.render();
      return;
    }

    store.currentQuestionIndex++;
    Renderer.setPage('question');
    Renderer.render();
  };

}

class Renderer {
  constructor(Api, TemplateGenerator, page="intro") {
    this.Api = Api;
    this.TemplateGenerator = TemplateGenerator;
    this.page = page;

  }

  setPage(input){
    this.page = input;
  }


  getPage(){
    return this.page;
  }

  hideAll(){
      TOP_LEVEL_COMPONENTS.forEach(component => $(`.${component}`).hide());
  }

  reset() {
    this.page="intro";

  }
  //insert hideAll
  render() {
    let html;
    this.hideAll();

    const { current, total } = getProgress();

    $('.js-score').html(`<span>Score: ${getScore()}</span>`);
    $('.js-progress').html(`<span>Question ${current} of ${total}`);

    switch (this.page) {
      case 'intro':
        if (Api.sessionToken) {
          $('.js-start').attr('disabled', false);
        }

        $('.js-intro').show();
        break;

      case 'question':
        html = this.TemplateGenerator.generateQuestionHtml();
        $('.js-question').html(html);
        $('.js-question').show();
        $('.quiz-status').show();
        break;

      case 'answer':
        html = this.TemplateGenerator.generateFeedbackHtml();
        $('.js-question-feedback').html(html);
        $('.js-question-feedback').show();
        $('.quiz-status').show();
        break;

      case 'outro':
        $('.js-outro').show();
        $('.quiz-status').show();
        break;

      default:
        return;
    }
  }
}

}

Renderer.prototype.TOP_LEVEL_COMPONENTS = [
  'js-intro', 'js-question', 'js-question-feedback',
  'js-outro', 'js-quiz-status'
];

const buildBaseUrl = function(amt = 10, query = {}) {
  const url = new URL(BASE_API_URL + '/api.php');
  const queryKeys = Object.keys(query);
  url.searchParams.set('amount', amt);

  if (store.sessionToken) {
    url.searchParams.set('token', store.sessionToken);
  }

  queryKeys.forEach(key => url.searchParams.set(key, query[key]));
  return url;
};

const buildTokenUrl = function() {
  return new URL(BASE_API_URL + '/api_token.php');
};

const fetchToken = function(callback) {
  if (sessionToken) {
    return callback();
  }

  const url = buildTokenUrl();
  url.searchParams.set('command', 'request');

  $.getJSON(url, res => {
    sessionToken = res.token;
    callback();
  }, err => console.log(err));
};

const fetchQuestions = function(amt, query, callback) {
  $.getJSON(buildBaseUrl(amt, query), callback, err => console.log(err.message));
};

const seedQuestions = function(questions) {
  QUESTIONS.length = 0;
  questions.forEach(q => QUESTIONS.push(createQuestion(q)));
};

const fetchAndSeedQuestions = function(amt, query, callback) {
  fetchQuestions(amt, query, res => {
    seedQuestions(res.results);
    callback();
  });
};

// Decorate API question object into our Quiz App question format
const createQuestion = function(question) {
  // Copy incorrect_answers array into new all answers array
  const answers = [ ...question.incorrect_answers ];

  // Pick random index from total answers length (incorrect_answers length + 1 correct_answer)
  const randomIndex = Math.floor(Math.random() * (question.incorrect_answers.length + 1));

  // Insert correct answer at random place
  answers.splice(randomIndex, 0, question.correct_answer);

  return {
    text: question.question,
    correctAnswer: question.correct_answer,
    answers
  };
};

const getScore = function(store) {
  return store.userAnswers.reduce((accumulator, userAnswer, index) => {
    const question = getQuestion(index);

    if (question.correctAnswer === userAnswer) {
      return accumulator + 1;
    } else {
      return accumulator;
    }
  }, 0);
};

const getProgress = function(store) {
  return {
    current: store.currentQuestionIndex + 1,
    total: QUESTIONS.length
  };
};

const getCurrentQuestion = function(store) {
  return QUESTIONS[store.currentQuestionIndex];
};

const getQuestion = function(index) {
  return QUESTIONS[index];
};

// HTML generator functions
// ========================
const generateAnswerItemHtml = function(answer) {
  return `
    <li class="answer-item">
      <input type="radio" name="answers" value="${answer}" />
      <span class="answer-text">${answer}</span>
    </li>
  `;
};

const generateQuestionHtml = function(question) {
  const answers = question.answers.map((answer, index) => generateAnswerItemHtml(answer, index)).join('');

  return `
    <form>
      <fieldset>
        <legend class="question-text">${question.text}</legend>
          ${answers}
          <button type="submit">Submit</button>
      </fieldset>
    </form>
  `;
};

const generateFeedbackHtml = function(feedback) {
  return `
    <p>
      ${feedback}
    </p>
    <button class="continue js-continue">Continue</button>
  `;
};

// Render function - uses `store` object to construct entire page every time it's run
// ===============
const render = function() {
  let html;
  hideAll();

  const question = getCurrentQuestion();
  const { feedback } = store;
  const { current, total } = getProgress();

  $('.js-score').html(`<span>Score: ${getScore()}</span>`);
  $('.js-progress').html(`<span>Question ${current} of ${total}`);

  switch (store.page) {
    case 'intro':
      if (sessionToken) {
        $('.js-start').attr('disabled', false);
      }

      $('.js-intro').show();
      break;

    case 'question':
      html = generateQuestionHtml(question);
      $('.js-question').html(html);
      $('.js-question').show();
      $('.quiz-status').show();
      break;

    case 'answer':
      html = generateFeedbackHtml(feedback);
      $('.js-question-feedback').html(html);
      $('.js-question-feedback').show();
      $('.quiz-status').show();
      break;

    case 'outro':
      $('.js-outro').show();
      $('.quiz-status').show();
      break;

    default:
      return;
  }
};

// Event handler functions
// =======================
const handleStartQuiz = function(STORE) {
  store = getInitialStore();
  store.page = 'question';
  store.currentQuestionIndex = 0;
  const quantity = parseInt($('#js-question-quantity').find(':selected').val(), 10);
  fetchAndSeedQuestions(quantity, { type: 'multiple' }, () => {
    render();
  });
};

const handleSubmitAnswer = function(e, STORE) {
  e.preventDefault();
  const question = getCurrentQuestion();
  const selected = $('input:checked').val();
  store.userAnswers.push(selected);

  if (selected === question.correctAnswer) {
    store.feedback = 'You got it!';
  } else {
    store.feedback = `Too bad! The correct answer was: ${question.correctAnswer}`;
  }

  store.page = 'answer';
  render();
};

const handleNextQuestion = function() {
  if (store.currentQuestionIndex === QUESTIONS.length - 1) {
    store.page = 'outro';
    render();
    return;
  }

  store.currentQuestionIndex++;
  store.page = 'question';
  render();
};

// On DOM Ready, run render() and add event listeners
$(() => {
  let TemplateGenerator = new TemplateGenerator();
  let Renderer = new Renderer();
  let Api = new Api;
  // Run first render
  Renderer.render();

  // Fetch session token, re-render when complete
  api.fetchToken(() => {
    render();
  });

  $('.js-intro, .js-outro').on('click', '.js-start', handleStartQuiz);
  $('.js-question').on('submit', handleSubmitAnswer);
  $('.js-question-feedback').on('click', '.js-continue', handleNextQuestion);
});
