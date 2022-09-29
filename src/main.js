import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faSort, faSortUp, faSortDown, faAngleDoubleLeft, faAngleDoubleRight, faAngleLeft, faAngleRight, faFaceFrown, faFilterCircleXmark } from '@fortawesome/free-solid-svg-icons'

library.add(faSort, faSortUp, faSortDown, faAngleDoubleLeft, faAngleDoubleRight, faAngleLeft, faAngleRight, faFaceFrown, faFilterCircleXmark)

createApp(App)
  .component('font-awesome-icon', FontAwesomeIcon)  
  .mount('#app')
