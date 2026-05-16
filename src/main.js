import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import P5UI from 'p5-ui'
import 'p5-ui/dist/style.css'
import { createI18n } from 'vue-i18n' // Import createI18n function
import messages from './assets/messages';

// Create the i18n instance with the messages
const i18n = createI18n({
    legacy: false,
    locale: 'cn', // Set default locale
    fallbackLocale: 'en', // Set fallback locale
    messages: messages, // Set the messages
})

const app = createApp(App)
app.use(P5UI)
app.use(i18n)
app.mount('#app')
//createApp(App).mount('#app')
