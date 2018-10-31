import Vue from 'vue'
import App from './Popup.vue'

new Vue({
  el: '#app',
  render: h => h(App)
});


/**
 * Google 数据分析
 */
(function() {
  setTimeout(() => {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=UA-128079841-1';
    
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
    ga.onload = function() {
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'UA-128079841-1');
    }
  }, 600);
})();