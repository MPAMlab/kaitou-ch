<template>
  <div class="wrapper">
    <div class="container">
      <img class="logo" src="./assets/logo.png">
      <p5-divider></p5-divider>
      <div class="poll">
        <img class="bolt1" src="./assets/bolt1.png">
        <img class="bolt2" src="./assets/bolt2.png">
        <img class="wrap" src="./assets/Q.png">
        <div class="bar" id="bar"></div>
        <div class="question">
          <p v-html="questionText"></p>
        </div>
        <span class="percent" id="percentage"></span>
      </div>
      <div class="buttons">
        <p5-button>
          <p5-title :content="$t('buttons.yes')" :animation="true" font_color="#ff0022" selected_font_color="#000" _bg_color="#ff0022" @click="postOption('Yes')"></p5-title>
        </p5-button>
        <p5-button>
          <p5-title :content="$t('buttons.no')" :animation="true" font_color="#ff0022" selected_font_color="#000" selected_bg_color="#ff0022" @click="postOption('No')"></p5-title>
        </p5-button>
      </div>
      <div class="lang-switch">
        <span @click="setLocale('cn')" :class="{ active: $i18n.locale === 'cn' }">CN</span> /
        <span @click="setLocale('jp')" :class="{ active: $i18n.locale === 'jp' }">JP</span> /
        <span @click="setLocale('en')" :class="{ active: $i18n.locale === 'en' }">EN</span>
      </div>
    </div>
<div class="footer">
      <p style="color: grey;" id="debug"></p>
      <!--<p style="color: grey;" id="date"></p>-->
      <p style="color: grey;">Powered by <a href="https://cloudflare.com">Cloudflare Pages, Worker, R2</a>, <a href="https://vuejs.org/">Vue.JS</a> & <a href="https://github.com/q-mona/p5-ui">p5-ui</a>. Maintained by <a href="http://MPAM-Lab.xyz">A/E Dept., MPAM Lab</a>. </p>
      <p style="color: grey;">This is a fan site. Original Credit by (c)Atlus, SEGA <a href="https://github.com/nonefffds/kaitou-ch">Open-sourced at GitHub</a></p>
      <p style="color: grey;">This site uses cookie to count time for voting and will not be used in tracking users' identity.</p>
    </div>
</div>
</template>

<script>
  import { ref, onMounted } from 'vue'
  import axios from 'axios'
  import { P5Message } from 'p5-ui'
  import { useI18n } from 'vue-i18n';
  export default {
  name: 'App',
  setup() {
    let progress = ref(0); // Declare progress here
    let percentage = ref(0);
    let questionText = ref('');
    const { t, locale } = useI18n();
    const workerUrl = '/api';
    
    const setLocale = (newLocale) => {
      locale.value = newLocale;
      changeQuestion();
    };

    const postOption = async (option) => {
      const lastVoteTime = getCookie("LastVoteTime"); // Get the value of the "LastVoteTime" cookie

      if (lastVoteTime) {
        const currentTime = new Date().getTime(); // Get the current time
        const elapsedTime = currentTime - parseInt(lastVoteTime);

        if (elapsedTime < 60000) {
          P5Message({ type: 'fail' })
          console.log("You can only vote once per minute.");
          return;
        }
      }
      const data = {
          option: option
      };
      try {
        await axios.post(workerUrl, data); // Use the workerUrl here
        console.log(`Option ${option} posted successfully.`);

        P5Message({ type: 'clear' })
        fetchData();
        const currentTime = new Date().getTime();
        setCookie("LastVoteTime", currentTime, 1);
      } catch (error) {
        console.error('Error posting option:', error);
        P5Message({ type: 'fail' })
      }
    }
    const fetchData = async () => {
      try {
        const response = await axios.get(workerUrl); // Use the workerUrl here
        const data = response.data;

        const { Yes, No } = data;
        const total = Yes + No;
        progress.value = total > 0 ? Math.floor(Yes / total * 100) : 0;
        percentage = progress.value;

        const numberDisplay = document.getElementById("percentage");
        numberDisplay.innerHTML = percentage + "%";

        const debugDisplay = document.getElementById("debug");
        debugDisplay.innerHTML = "Yes: " + Yes + " No: " + No +",Total: " + (Yes + No);
        // Get the div element with class "bar"
        const barElement = document.getElementById("bar");

        // Set the style properties of the div element
        barElement.style.width = percentage + "%";
        barElement.style.maxWidth = "220px";

        console.log('Progress:', percentage);
      } catch (error) {
        console.error('Error fetching data:', error);
        P5Message({ type: 'fail' })
      }
    }
    // Function to get the value of a cookie
    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    }

    // Function to set a cookie
    function setCookie(name, value, minutes) {
      const d = new Date();
      d.setTime(d.getTime() + (minutes * 60 * 1000));
      const expires = "expires=" + d.toUTCString();
      document.cookie = name + "=" + value + ";" + expires + ";path=/";
    }
    const changeQuestion = () => {
      // Get the current day of the year
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);

      // Define the questions and their day ranges for the year
      const questionPeriods = [
        { startDay: 1, endDay: 104, text: 'questions.question1' },
        { startDay: 105, endDay: 161, text: 'questions.question2'},
        { startDay: 162, endDay: 301, text: 'questions.question3'},
        { startDay: 302, endDay: 340, text: 'questions.question4' },
        { startDay: 341, endDay: 353, text: 'questions.question5'},
        { startDay: 354, endDay: 365, text: 'questions.question6' },
        { startDay: 366, endDay: 366, text: 'questions.question6' }
      ];
      const currentPeriod = questionPeriods.find(q => dayOfYear >= q.startDay && dayOfYear <= q.endDay);
      if (currentPeriod) {
        questionText.value = t(currentPeriod.text); // Use the key to get the translated text
      } else {
        // Handle the case where the day of the year doesn't match any question range
        questionText.value = t('questions.question6'); // Provide a default message for days without a question
      }
    }
      onMounted(() => {
        fetchData()
        changeQuestion()
      })
      return {
        progress,
        percentage,
        postOption,
        questionText,
        setLocale
      }
    }
  }
  </script>

  <style>
  .lang-switch {
    margin-top: 20px;
    font-size: 14px;
    color: #666;
    font-family: 'Contrail One', sans-serif;
  }
  .lang-switch span {
    cursor: pointer;
    padding: 0 5px;
    transition: color 0.3s;
  }
  .lang-switch span:hover {
    color: #ff0022;
  }
  .lang-switch span.active {
    color: #ff0022;
    text-decoration: underline;
  }
  .wrapper {
  max-width: 1500px;
  padding: 0px;
  text-align: center;
  }
  @font-face {
  font-family: "Contrail One";
  src: url("./assets/ContrailOne-Regular.ttf");
  }
  .logo {
    width: 100px;
    margin: 0 auto;
    display: block;}
  .buttons {
    margin-top: 60px;}
  .container {
    margin-top: 100px;
    padding: 0px;
  }

  .poll {
    margin-left: auto;
    margin-right: auto;
    width: 300px;
    margin-top: 60px;
    position: relative;
    left: -10%;
  }

  .poll .wrap {
    width: 100%;
  }

  .poll .bar {
    background-color: red;
    height: 40px;
    position: absolute;
    width: 0px;
    left: 20px;
    bottom: 10px;
    z-index: -1;
  }

  .poll .percent {
    color: red;
    font-family: 'Contrail One';
    z-index: 100;
    position: absolute;
    font-size: 50px;
    right: -70px;
    bottom: 5px;
  }

  .bolt1 {
    height: 35px;
    position: absolute;
    top: -10px;
    left: 47%;
  }

  .bolt2 {
    height: 35px;
    position: absolute;
    top: -30px;
    left: 56%;
  }

  .question {
    font-size: 12px;
    font-family: test;
    color: white;
    position: absolute;
    bottom: 45px;
    left: 75px;
    -ms-transform: rotate(-7deg);
    -webkit-transform: rotate(-7deg);
    transform: rotate(-7deg);
    white-space: nowrap;
    letter-spacing: 0.05em;
    -webkit-text-stroke: 0.3px #000;
    text-stroke: 0.3px #000;
  }

  .question span {
    color: red;
  }
  .footer {
  font-size: 10px;
  margin-top: 100px;
  margin-bottom: 50px;
  }
  </style>
