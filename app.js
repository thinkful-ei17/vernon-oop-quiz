'use strict';

let QUESTIONS = [];

class Store {
  constructor(currentQuestionIndex=0, userAnswers=[], answer = "", question = "", feedback = "", score=0){
    this.currentQuestionIndex = currentQuestionIndex;
    this.userAnswers = userAnswers;

    this.answer = answer;
    this.question = question;
    this.feedback = feedback;
    this.score = score;
  }

  incrementCurrentQuestionIndex(){
    this.currentQuestionIndex++;
  }

  getCurrentQuestionIndex(){
    return this.currentQuestionIndex;
  }

  setUserAnswers(input){
    this.userAnswers.push(input);
  }

  getUserAnswers () {
    return this.userAnswers;

  }

  setAnswer(input) {
    this.answer = input;
  }

  setQuestion(input) {
    this.question = input;
  }

  setFeedback(input) {
    this.feedback = input;
  }

  getAnswer() {
    //console.log(this.answer);
    return this;
  }

  getQuestion() {
    //console.log(this.question);
    return this.question;
  }

  getFeedback() {
    //console.log(this.feedback);
    return this.feedback;
  }

  getScore() {
    return this.score;
  }

  setScore(input){
    this.score = input;
  }
  reset(currentQuestionIndex=0, userAnswers=[], answer = "", question = "", feedback = "", score=0){
    this.currentQuestionIndex = currentQuestionIndex;
    this.userAnswers = userAnswers;

    this.answer = answer;
    this.question = question;
    this.feedback = feedback;
    this.score = score;
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

    constructor(store) {
      this.store = store;
    }

    generateAnswerItemHtml(answer, index) {
      //console.log("generateAnswerItemHtml");
      //console.log(answer);
      //console.log();
      return `
        <li class="answer-item">
          <input type="radio" name="answers" value="${answer}" />
          <span class="answer-text">${answer}</span>
        </li>
      `;
    };

    generateQuestionHtml() {
      //console.log("generateQuestionHtml");
      const answers = this.store.getQuestion().answers.map((answer, index) => this.generateAnswerItemHtml(answer, index))
        .join('');

      return `
        <form>
          <fieldset>
            <legend class="question-text">${ this.store.getQuestion().text }</legend>
              ${answers}
              <button type="submit">Submit</button>
          </fieldset>
        </form>
      `;
    };

    generateFeedbackHtml() {
      return `
        <p>
          ${this.store.feedback}
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
    //console.log("buildBaseUrl");
    const url = new URL(this.BASE_API_URL + '/api.php');
    const queryKeys = Object.keys(query);
    url.searchParams.set('amount', amt);
    url.searchParams.set('type', 'multiple');

    if (this.getSessionToken()) {
      url.searchParams.set('token', this.getSessionToken());
    }

    //queryKeys.forEach(key => url.search);
    //console.log("url!!!");
    //console.log(url);
    //console.log(queryKeys);
    return url;
  }

  buildTokenUrl(){
    //console.log("buildTokenUrl");
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
    //console.log("fetchQuestions");
    $.getJSON(this.buildBaseUrl(amt, query), callback, err => console.log(err.message));
  };

}
//constants
ApiCalls.prototype.BASE_API_URL = "https://opentdb.com";

class Handlers {

  constructor(Api, TemplateGenerator, Renderer, store) {
    this.Api = Api;
    this.TemplateGenerator = TemplateGenerator;
    this.Renderer = Renderer;
    this.store = store;

    this.Renderer.setPage("fking WORK ALREADY DX D<");
    //console.log(this.Renderer.getPage());
    this.Renderer.setPage("intro");
  }

  handleStartQuiz(){
    //console.log(this);
    //console.log(this.store);
    //console.log("~~~~");
    this.Renderer.setPage('question');
    this.store.reset();
    QUESTIONS = [];

    const quantity = parseInt($('#js-question-quantity').find(':selected').val(), 10);
    fetchAndSeedQuestions(quantity, { type: 'multiple' }, () => {

    //console.log("callback?");
    //console.log(this.store.getCurrentQuestionIndex());
    this.store.setQuestion(QUESTIONS[this.store.getCurrentQuestionIndex()]);

    //console.log(this.store.getQuestion());

    this.store.setAnswer(this.store.getQuestion().answer);

    this.Renderer.render();
    });

  }

  handleSubmitAnswer() {

    //console.log("submitAnswer");
    const question = this.store.getQuestion();
    const selected = $('input:checked').val();
    this.store.setUserAnswers(selected);

    if (selected === question.correctAnswer) {
      this.store.feedback = 'You got it!';
    } else {
      this.store.feedback = `Too bad! The correct answer was: ${question.correctAnswer}`;
    }

    this.Renderer.setPage('answer');
    this.Renderer.render();
  };

  handleNextQuestion() {
    //console.log("handleNextQuestion");
    //console.log(this.store.getCurrentQuestionIndex());
    if (this.store.getCurrentQuestionIndex() === QUESTIONS.length - 1) {
      this.Renderer.setPage('outro');
      this.Renderer.render();
      return;
    }

    this.store.incrementCurrentQuestionIndex();
    this.store.setQuestion(QUESTIONS[this.store.getCurrentQuestionIndex()]);

    //console.log(this.store.getQuestion());

    this.store.setAnswer(this.store.getAnswer());
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

    //console.log(this.Api);
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


    const accumalator = figureScore(this.store);

    $('.js-score').html(`<span>Score: ${accumalator}</span>`);
    $('.js-progress').html(`<span>Question ${current} of ${total}`);

    switch (this.page) {
      case 'intro':
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

let store = new Store();
let Api = new ApiCalls();
let templateGen = new TemplateGenerator(store);
let renderMachine = new Renderer(Api, templateGen, store);
let MyHandlers = new Handlers(Api, templateGen, renderMachine, store);

const seedQuestions = function(questions) {
  //console.log("seedQuestions");

  questions.forEach(function (question) {
    //console.log(question);
    QUESTIONS.push(createQuestion(question));
  });
  //console.log("QUESTIONS");
  //console.log(QUESTIONS);
};

const fetchAndSeedQuestions = function(amt, query, callback) {
  //console.log("fetchAndSeedQuestions");
  Api.fetchQuestions(amt, query, res => {
    //console.log("fetchQuestionsCallBack");
    //console.log(res);
    seedQuestions(res.results);
    callback();
  });
};

// Decorate API question object into our Quiz App question format
const createQuestion = function(question) {
  // Copy incorrect_answers array into new all answers array
  ////console.log(question.incorrect_answers);
  const answers = [ ...question.incorrect_answers ];

  // Pick random index from total answers length (incorrect_answers length + 1 correct_answer)
  const randomIndex = Math.floor(Math.random() * (question.incorrect_answers.length + 1));

  // Insert correct answer at random place
  answers.splice(randomIndex, 0, question.correct_answer);

  return {
    text: question.question,
    correctAnswer: question.correct_answer,
    answers: answers
  };
};

const figureScore = function(store) {

    const question = store.getQuestion();
    const currentScore = store.getScore();
    const index = store.getCurrentQuestionIndex();
    console.log(question.correctAnswer);
    console.log(store.userAnswers);
    console.log(QUESTIONS.length);
    console.log(index);
    if (store.getUserAnswers().length !== 0 && renderMachine.page != "outro"){
      if (store.question.correctAnswer === store.getUserAnswers()[index]) {
        console.log("BAM");
        store.setScore(currentScore + 1);
        return store.getScore();
      }
    }

      return currentScore;


};

const getProgress = function(store) {
  return {
    current: store.getCurrentQuestionIndex()+1,
    total: QUESTIONS.length
  };
};

//getQuestion is used for getScore
const getQuestion = function(index) {
  return QUESTIONS[index];
};

//------------------

const startQuiz = function () {
  MyHandlers.handleStartQuiz();
}

const submitAnswer = function (e) {
  e.preventDefault();
  MyHandlers.handleSubmitAnswer();
}

const nextQuestion = function () {
  MyHandlers.handleNextQuestion();
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
  $('.js-question-feedback').on('click', '.js-continue', nextQuestion);
});
