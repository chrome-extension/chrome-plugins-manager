/* eslint-disable no-undef */
import Vue from 'vue'
import App from './Popup.vue'

new Vue({
  el: '#app',
  render: h => h(App)
})


/**
 * Google 数据分析
 */
;(function() {
  setTimeout(() => {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true
    ga.src = 'https://ssl.google-analytics.com/ga.js'
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s)
    ga.onload = function() {
      _gaq.push(['_setAccount', 'UA-144202996-1'])
      _gaq.push(['_trackPageview'])
    }
  }, 100)
})()
;(function() {
  setTimeout(() => {
    (function(b,a,e,h,f,c,g,s){b[h]=b[h]||function(){(b[h].c=b[h].c||[]).push(arguments)}
      b[h].s=!!c;g=a.getElementsByTagName(e)[0];s=a.createElement(e)
      s.src='https://s.union.360.cn/'+f+'.js';s.defer=!0;s.async=!0;g.parentNode.insertBefore(s,g)
    })(window,document,'script','_qha',319639,false)
  }, 100)
})()