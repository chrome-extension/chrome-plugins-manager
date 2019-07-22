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