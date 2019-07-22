/* eslint-disable no-undef */
import Vue from 'vue'
import App from './Option.vue'

// eslint-disable-next-line no-unused-vars
let vm = new Vue({
  el: '#app',
  render: h => h(App)
})

// 禁用页面缩放
chrome.tabs.getCurrent(function(obj){
  chrome.tabs.getZoomSettings(obj.id, function(settingObj){
    if(settingObj.mode !== 'disabled'){
      chrome.tabs.setZoom(1)
      chrome.tabs.setZoomSettings(obj.id, {'mode': 'disabled'}, function(){})
    }
  })
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