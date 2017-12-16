'use strict';

let QUESTIONS = [];

class Store {
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
      console.log("generateAnswerItemHtml");
      return `
        <li class="answer-item">
          <input type="radio" name="answers" value="${this.answer}" />
          <span class="answer-text">${this.answer}</span>
        </li>
      `;
    };

    generateQuestionHtml() {
      console.log("generateQuestionHtml");
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
    this.sessionToken = "";
  }

  setSessionToken(input) {
    this.sessionToken = input;
  }

  getSessionToken() {
    return this.sessionToken;
  }
  //functions API_CALLS uses.
  buildBaseUrl(amt = 10, query = {}) {
    const url = new URL(this.BASE_API_URL + '/api.php');
    const queryKeys = Object.keys(query);
    url.searchParams.set('amount', amt);

    if (this.getSessionToken()) {
      url.searchParams.set('token', this.getSessionToken());
    }

    queryKeys.forEach(key => url.search);
  }

  buildTokenUrl(){
    return new URL(this.BASE_API_URL + '/api_token.php');
  }

  fetchToken(callback){
    if (this.getSessionToken()) {
      return callback();
    }

    const url = this.buildTokenUrl();
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
    this.Api = Api;
    this.TemplateGenerator = TemplateGenerator;
    this.Renderer = Renderer;
    this.store = store;

    this.Renderer.setPage("BICH WORK.");
    console.log(this.Renderer.getPage());
    this.Renderer.setPage("intro");
  }

  startQuiz() {
    console.log(this);
    console.log(this.store);
    console.log("~~~~");
    //this.Renderer.setPage('question');
    //this.Renderer.setCurrentQuestionIndex(0);
    const quantity = parseInt($('#js-question-quantity').find(':selected').val(), 10);
    fetchAndSeedQuestions(quantity, { type: 'multiple' }, () => {
    this.Renderer.render();
    });
  }
  handleStartQuiz(){
    //store = getInitialStore();
    //this.Renderer.reset();
    console.log(this);

  }

  handleSubmitAnswer(e) {
    e.preventDefault();
    const question = getCurrentQuestion();
    const selected = $('input:checked').val();
    this.store.setUserAnswers(selected);

    if (selected === question.correctAnswer) {
      this.TemplateGenerator.feedback = 'You got it!';
    } else {
      this.TemplateGenerator.feedback = `Too bad! The correct answer was: ${question.correctAnswer}`;
    }

    this.Renderer.setPage('answer');
    this.Renderer.render();
  };

  handleNextQuestion() {
    if (store.currentQuestionIndex === QUESTIONS.length - 1) {
      this.Renderer.setPage('outro');
      this.Renderer.render();
      return;
    }

    this.store.currentQuestionIndex++;
    this.Renderer.setPage('question');
    this.Renderer.render();
  };

}

class Renderer {
  constructor(Api, TemplateGenerator, store, page="intro") {
    this.Api = Api;
    this.TemplateGenerator = TemplateGenerator;
    this.store = store;
    this.page = page;

    console.log(this.Api);
  }

  setPage(input){
    this.page = input;
  }


  getPage(){
    return this.page;
  }

  hideAll(){
      this.TOP_LEVEL_COMPONENTS.forEach(component => $(`.${component}`).hide());

  }

  reset() {
    this.page="intro";

  }
  //insert hideAll
  render() {
    let html;
    this.hideAll();

    const { current, total } = getProgress(store);

    $('.js-score').html(`<span>Score: ${getScore(store)}</span>`);
    $('.js-progress').html(`<span>Question ${current} of ${total}`);

    switch (this.page) {
      case 'intro':
      console.log(this.Api.getSessionToken());
        if (this.Api.getSessionToken()) {
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


Renderer.prototype.TOP_LEVEL_COMPONENTS = [
  'js-intro', 'js-question', 'js-question-feedback',
  'js-outro', 'js-quiz-status'
];

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


let store = new Store();
let Api = new ApiCalls();
let templateGen = new TemplateGenerator();
let renderMachine = new Renderer(Api, templateGen, store);
let domListener = new DomListeners(Api, templateGen, renderMachine, store);

const startQuiz = function () {
  domListener.handleStartQuiz();
}

const submitAnswer = function () {
  domListener.handleSubmitAnswer();
}

const nextQuestion = function () {
  domListener.handleNextQuestion();
}
// On DOM Ready, run render() and add event listeners
$(() => {

  // Run first render
  renderMachine.render();
  // Fetch session token, re-render when complete
  Api.fetchToken(() => {
    renderMachine.render();
  });

  $('.js-intro, .js-outro').on('click', '.js-start', startQuiz);
  $('.js-question').on('submit', submitAnswer);
  $('.js-question-feedback').on('click', '.js-continue', domListener.handleNextQuestion);
});
