import Vue from 'vue'
import App from './Option.vue'

let vm = new Vue({
  el: '#app',
  render: h => h(App)
})

// 禁用页面缩放
chrome.tabs.getCurrent(function(obj){
  chrome.tabs.getZoomSettings(obj.id, function(settingObj){
    if(settingObj.mode !== "disabled"){
      chrome.tabs.setZoom(1);
      chrome.tabs.setZoomSettings(obj.id, {"mode": "disabled"}, function(){})
    }
  })
});


/**
 * Google 数据分析
 */
// (function() {
//   var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
//   ga.src = 'https://www.googletagmanager.com/gtag/js?id=UA-128079841-1';
//   var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
//   ga.onload = function() {
//     window.dataLayer = window.dataLayer || [];
//     function gtag(){dataLayer.push(arguments);}
//     gtag('js', new Date());
//     gtag('config', 'UA-128079841-1');
//   }
// })();