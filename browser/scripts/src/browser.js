import VueContainer from './vue-container.js';

export default function Browser(jq) {
    this.vueContainer = new VueContainer({appContainer:'#browser-app', jq:jq});
    window.vueContainer = this.vueContainer;
}