<template>
  <div id="popup" :data-lan="language" :class="'icon-size-' + showIconSize" :style="'width:' + getShowWindowSize + 'px'">
    <div id="wrap" :searching="searcher.doing" v-if="ext.extList.length > 0">
      <div id="search">
        <div id="searchBox">
          <input type="text" class="searchInput searcher" v-model="searcher.text" :placeholder="i18n.searcherPlaceholder" @input="search" v-focus @mouseenter="focus">
          <svg width="24px" height="24px" class="searchEmpty" viewBox="0 0 24 24" @mousedown="cancelSearch">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
          </svg>
          <svg width="20px" height="20px" class="serachIco" viewBox="0 0 20 20">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"></path>
          </svg>
        </div>
        <button :class="'searchItem searchInput btn btn-reset' + (ext.iconBadgeAnim ? ' anim' : '')" @click="clear" :title="i18n.closeAllBtn"></button>
        <div id="group" class="searchItem" @mouseenter="showGroup" @mouseleave="hideGroup">
          <button class="searchInput btn btn-group">{{group.list[groupIndex].name}}</button>
          <ul id="group-list" v-show="groupShow">
            <li v-for="(item, index) in group.list" v-if="index !== groupIndex" @click="changeGroup(index)" :title="item.name" :key="index">{{item.name}}</li>
            <li @click="setGroup" class="setting"></li>
          </ul>
        </div>
        <div id="emptyResult" v-show="searcher.empty">
          <p class="title">{{i18n.searcherEmpty}}</p>
          <p class="search-webstore">
            <button class="btn" @click="goChromeStoreSearch">{{i18n.tipsUrl}}</button>
          </p>
        </div>
      </div>
      <ext-item :data-list="getEnbledExtList" data-id="showList" data-locked="locked" :searching="searcher.doing" :hover="hover">
        <template slot="empty">
          <li class="empty" v-if="getEnbledExtList.length === 0">{{i18n.emptyShowListCon}}</li>
        </template>
      </ext-item>
      <ext-item :data-list="getDisabledExtList" data-id="hideList" :searching="searcher.doing" :hover="hover"></ext-item>
    </div>

    <!-- 所有扩展都为空，进行提示 -->
    <div id="allEmptyTips" v-if="ext.allEmpty">
      <span class="title">{{i18n.tipsTitle}}</span>
      <span class="desc">
        <span class="con">{{i18n.tipsCon}}</span>
        <a :href="chromeStore" target="_blank" @click="goChromeStore">{{i18n.tipsUrl}}</a>
      </span>
    </div>

    <div id="rightMenu" :class="[rightMenu.showClass]" :style="{ left: rightMenu.left, right: rightMenu.right, top: rightMenu.top}" @mouseleave="rightMemuLeave">
      <div class="name" :style="{ background: rightMenu.backgroundColor }">
        {{rightMenu.name}}
      </div>
      <ul>
        <li v-for="(item, index) in rightMenu.content" @click="item.handle" :disabled="item.disabled" :key="index" :style="{ background: rightMenu.backgroundColor }">
          {{item.name}}
        </li>
      </ul>
    </div>
    <canvas id="getColorByCanvas" style="display: none;"></canvas>
  </div>
</template>


<script>
import i18n from './lib/i18n'
import ExtItem from "./components/ExtItem"
import * as Common from './lib/common'
import * as Extension from "./lib/extension"
import * as Storage from './lib/storage'
import * as Util from "./lib/util"
import * as Rank from "./lib/rank"

export default {
  data() {
    return {
      // 国际化对象
      i18n: i18n(),
      chromeStore: '',
      language: '',
      ext: {
        extList: [],
        iconBadgeAnim: false,
        allEmpty: false
      },
      rightMenu: {
        name: '',
        showClass: '',
        left: 0,
        top: 0,
        backgroundColor: '#000',
        content: []
      },
      searcher: {
        doing: false,
        text: '',
        empty: false
      },
      hover: {
        doing: false,
        listName: ''
      },
      group: {
        list: [{
          name: '',
          lock: {}
        }]
      },
      groupIndex: 0,
      groupShow: false,
      showIconSize: Common.ShowIconSize,
      showWindowSize: Common.WindowSizeDefaultColum,
      orderHandle: function() {}
    }
  },
  watch: {
    groupIndex: (val, oldVal) => {
      localStorage.setItem("_groupIndex_", val)
    },
    'ext.extList': {
      handler: (_new, _old) => {
        setTimeout(() => {
          Extension.addIconBadge()
        }, 0)
      },
      deep: true
    }
  },
  components: {
    ExtItem
  },
  computed: {
    getEnbledExtList() {
      let list = this.ext.extList.filter(item => {
        if (item.enabled) {
          if (this.group.list[this.groupIndex].lock[item.id]) {
            item.isLocked = true
          } else {
            item.isLocked = false
          }
          return true
        }
      })
      return list.sort(this.orderHandle)
    },
    getDisabledExtList() {
      let list = this.ext.extList.filter(item => {
        if (!item.enabled) {
          if (this.group.list[this.groupIndex].lock[item.id]) {
            item.isLocked = true
          } else {
            item.isLocked = false
          }
          return true
        }
      })
      return list.sort(this.orderHandle)
    },
    getShowWindowSize() {
      return Common.WindowSizeByColum[this.showWindowSize || Common.WindowSizeDefaultColum]
    }
  },
  methods: {
    focus(e) {
      e.target.focus()
    },
    // 启用禁用扩展
    extClick(item) {
      Rank.set(item.id)
      Util.onoff(item)
    },
    clear() {
      Util.clear()
    },
    extEnter(item) {
      Util.enter(item)
    },
    extLeave(item) {
      Util.leave(item)
    },
    search() {
      Util.search()
    },
    cancelSearch() {
      Util.cancelSearch()
    },
    showGroup() {
      Util.showGroup()
    },
    hideGroup() {
      Util.hideGroup()
    },
    changeGroup(index) {
      Util.changeGroup(index)
    },
    setGroup() {
      Util.setGroup()
    },
    goChromeStore(e) {
      chrome.tabs.create({
        'url': e.target.href
      })
    },
    rightMemuLeave() {
      Util.resetHandle()
    },
    goChromeStoreSearch(e) {
      e.preventDefault()
      chrome.tabs.create({
        'url': `https://chrome.google.com/webstore/search/${encodeURIComponent(this.searcher.text)}`
      })
    }
  },
  async beforeCreate() {

    let _storage = await Storage.getAll(this)
    let _allExt = await Extension.getAll(this)

    // 显示初始化：图标大小、宽度等
    let showWindowSize = Storage.get('_showColumn_')
    if (showWindowSize) {
      this.showWindowSize = showWindowSize
    }
    let showIconSize = Storage.get('_showIconSize_')
    if (showIconSize) {
      this.showIconSize = showIconSize
    }

    // 增加分组功能，兼容老版本问题
    Storage.initGroup(this)

    // 排序方法初始化
    this.orderHandle = Extension.orderHandle(_storage)
    
    if (_allExt && _allExt.length === 0) {
      this.ext.allEmpty = true
    } else {
      this.ext.extList = _allExt
    }

    // 初始化相关
    Util.init(this)
  },
  directives: {
    focus: {
      // 指令的定义
      inserted: function (el) {
        el.focus()
      }
    }
  }
}
</script>



<style>
  * {
    padding: 0;
    margin: 0;
  }

  body {
    user-select: none;
    -webkit-user-select: none;
    position: relative;
  }

  ::-webkit-scrollbar {
    width: 0px;
  }

  ::-webkit-scrollbar-thumb {
    background: #D8D8D8;
  }

  .gclearfix {
    zoom: 1;
  }

  .gclearfix::after {
    clear: both;
    content: '';
    display: block;
    height: 0;
    visibility: hidden;
  }

  #popup{
    position: relative;
    min-width: 496px;
    min-height: 300px;
  }
  #wrap {
    position: relative;
    min-height: 125px;
    padding: 20px;
    box-sizing: border-box;
    background-color: #fff;
    z-index: 2;
  }
  #search{
    display: -webkit-box;display: -ms-flexbox;display: flex;
    width: 100%;
    height: 46px;
    margin-bottom: 20px;
    box-sizing: border-box;
  }
  #search .searchInput{
    height: 100%;
    box-sizing: border-box;
    border: none;
    outline: none;
    border-radius: 4px;
    -webkit-transition: .4s ease-in-out;
    transition: .4s ease-in-out;
  }
  #search .searchItem{
    -webkit-box-flex: 0;-ms-flex-positive: 0;flex-grow: 0;
    position: relative;
    margin-left: 4px;
  }
  #search #searchBox{
    -webkit-box-flex: 1;-ms-flex-positive: 1;flex-grow: 1;
    height: 100%;
    position: relative;
  }
  #search .searcher{
    width: 100%;
    line-height: 1em;
    padding: 0 40px 0 45px;
    font-size: 16px;
    background: #f5f5f5;
    color: #212121;
  }
  #search .searchEmpty{
    fill: #717171;
    position: absolute;
    right: 10px;
    top: 50%;
    -webkit-transform: translateY(-50%);
    transform: translateY(-50%);
    cursor: pointer;
    display: none;
  }
  #search .searchEmpty:active{
    fill: #000;
  }
  #search .serachIco{
    fill: #717171;
    position: absolute;
    left: 15px;
    top: 50%;
    -webkit-transform: translateY(-58%);
    transform: translateY(-58%);
  }
  #search .btn{
    height: 100%;
    font-size: 16px;
    cursor: pointer;
    color: #717171;
    text-align: center;
    background-color: #f5f5f5;
    padding: 0 12px;
    outline: none;
  }
  #search .btn:hover{
    color: #fff;
    background-color: #40c4ff;
    border-color: #25a1d8;
  }
  #search .btn:active{
    transition: none;
    color: #fff;
    background-color: #5c5e6f;
    border-color: #353640;
  }
  #search .btn-reset{
    width: 50px;
    position: relative;
  }
  #search .btn-reset::before{
    position: absolute;
    width: 20px;
    height: 20px;
    left: 50%;
    top: 50%;
    content: '';
    transform: translate(-50%, -50%);
    -webkit-transform: translate(-50%, -50%);
    background-size: 90%;
    background-repeat: no-repeat;
    background-position: center;
    background-image: url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTMxLjk4MTExMiAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTYzLjk2MjIyNCAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTk1Ljk0MzMzNSAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTEyNy45MjQ0NDcgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik0xNTkuOTA1NTU5IDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMTEzLCAxMTMsIDExMykiPjwvcGF0aD48cGF0aCBkPSJNMTkxLjg4NjY3MSAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTIyMy44Njc3ODIgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik0yNTUuODQ4ODk0IDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMTEzLCAxMTMsIDExMykiPjwvcGF0aD48cGF0aCBkPSJNMjg3LjgzMDAwNiAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTMxOS44MTExMTggMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik0zNTEuNzkyMjMgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik0zODMuNzczMzQxIDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMTEzLCAxMTMsIDExMykiPjwvcGF0aD48cGF0aCBkPSJNNDE1Ljc1NDQ1MyAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTQ0Ny43MzU1NjUgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik00NzkuNzE2Njc3IDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMTEzLCAxMTMsIDExMykiPjwvcGF0aD48cGF0aCBkPSJNNTExLjY5Nzc4OCAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTU0My42Nzg5IDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMTEzLCAxMTMsIDExMykiPjwvcGF0aD48cGF0aCBkPSJNNTc1LjY2MDAxMiAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTYwNy42NDExMjQgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik02MzkuNjIyMjM2IDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMTEzLCAxMTMsIDExMykiPjwvcGF0aD48cGF0aCBkPSJNNjcxLjYwMzM0NyAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTcwMy41ODQ0NTkgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik03MzUuNTY1NTcxIDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMTEzLCAxMTMsIDExMykiPjwvcGF0aD48cGF0aCBkPSJNNzY3LjU0NjY4MyAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTc5OS41Mjc3OTUgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik04MzEuNTA4OTA2IDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMTEzLCAxMTMsIDExMykiPjwvcGF0aD48cGF0aCBkPSJNODYzLjQ5MDAxOCAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTg5NS40NzExMyAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTkyNy40NTIyNDIgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik05NTkuNDMzMzUzIDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMTEzLCAxMTMsIDExMykiPjwvcGF0aD48cGF0aCBkPSJNOTkxLjQxNDQ2NSAwLjYwNDQyM3YxMDIzLjM5NTU3N00wIDMyLjU4NTUzNWgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgNjQuNTY2NjQ3aDEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMTEzLCAxMTMsIDExMykiPjwvcGF0aD48cGF0aCBkPSJNMCA5Ni41NDc3NThoMTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik0wIDEyOC41Mjg4N2gxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgMTYwLjUwOTk4MmgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgMTkyLjQ5MTA5NGgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgMjI0LjQ3MjIwNWgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgMjU2LjQ1MzMxN2gxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgMjg4LjQzNDQyOWgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgMzIwLjQxNTU0MWgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgMzUyLjM5NjY1M2gxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgMzg0LjM3Nzc2NGgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgNDE2LjM1ODg3NmgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgNDQ4LjMzOTk4OGgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgNDgwLjMyMTFoMTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik0wIDUxMi4zMDIyMTJoMTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik0wIDU0NC4yODMzMjNoMTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik0wIDU3Ni4yNjQ0MzVoMTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik0wIDYwOC4yNDU1NDdoMTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik0wIDY0MC4yMjY2NTloMTAyMy4zOTU1NzciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjxwYXRoIGQ9Ik0wIDY3Mi4yMDc3N2gxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgNzA0LjE4ODg4MmgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgNzM2LjE2OTk5NGgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgNzY4LjE1MTEwNmgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgODAwLjEzMjIxOGgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgODMyLjExMzMyOWgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgODY0LjA5NDQ0MWgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgODk2LjA3NTU1M2gxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgOTI4LjA1NjY2NWgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgOTYwLjAzNzc3NmgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTAgOTkyLjAxODg4OGgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTgwNS45MjQwMTcgMTM0LjkyNTA5M0M3MTYuMzc2OTA0IDQ1LjM3Nzk4IDYwNy42NDExMjQgMC42MDQ0MjMgNDg2LjExMjg5OSAwLjYwNDQyM2MtMTE1LjEzMjAwMi02LjM5NjIyMi0yMjMuODY3NzgyIDM4LjM3NzMzNC0zMDcuMDE4NjczIDExNS4xMzIwMDJ2LTYzLjk2MjIyM2MwLTYuMzk2MjIyIDAtNi4zOTYyMjItNi4zOTYyMjItNi4zOTYyMjJIMTE1LjEzMjAwMmMtNi4zOTYyMjIgMC02LjM5NjIyMiAwLTYuMzk2MjIyIDE5LjE4ODY2N3YxNzIuNjk4MDAzYzYuMzk2MjIyIDYuMzk2MjIyIDYuMzk2MjIyIDEyLjc5MjQ0NSAxOS4xODg2NjcgMTIuNzkyNDQ1bDE3OS4wOTQyMjYtNi4zOTYyMjJzNi4zOTYyMjIgMCA2LjM5NjIyMi02LjM5NjIyM1YxNzkuNjk4NjQ5YzAtNi4zOTYyMjIgMC02LjM5NjIyMi02LjM5NjIyMi02LjM5NjIyMmgtNjMuOTYyMjIzYzE0Ny4xMTMxMTQtMTM0LjMyMDY2OSAzNzAuOTgwODk3LTEyMS41MjgyMjUgNTExLjY5Nzc4OCAxOS4xODg2NjcgMTQ3LjExMzExNCAxNDcuMTEzMTE0IDE0Ny4xMTMxMTQgMzkwLjE2OTU2NCAwIDUzMC44ODY0NTUtMTQ3LjExMzExNCAxNDcuMTEzMTE0LTM4My43NzMzNDEgMTQ3LjExMzExNC01MzAuODg2NDU2IDAtMzEuOTgxMTEyLTI1LjU4NDg4OS01MS4xNjk3NzktNTcuNTY2MDAxLTcwLjM1ODQ0NS04OS41NDcxMTNsLTc2Ljc1NDY2OSAyNS41ODQ4OWMyNS41ODQ4ODkgNDQuNzczNTU2IDUxLjE2OTc3OSA4OS41NDcxMTMgODkuNTQ3MTEzIDEyNy45MjQ0NDcgODkuNTQ3MTEzIDg5LjU0NzExMyAxOTguMjgyODkzIDEzNC4zMjA2NjkgMzI2LjIwNzM0IDEzNC4zMjA2NjkgMTIxLjUyODIyNS02LjM5NjIyMiAyMzYuNjYwMjI3LTUxLjE2OTc3OSAzMjYuMjA3MzQxLTEzNC4zMjA2NjlzMTM0LjMyMDY2OS0yMDQuNjc5MTE1IDEzNC4zMjA2NjktMzE5LjgxMTExOEM5NDYuNjQwOTA5IDMzMy4yMDc5ODYgODk1LjQ3MTEzIDIyNC40NzIyMDUgODA1LjkyNDAxNyAxMzQuOTI1MDkzeiIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PHBhdGggZD0iTTYwNy42NDExMjQgNDYxLjEzMjQzM2MwIDUyLjk4NjcwNi00Mi45NTQ2MzEgOTUuOTQzMzM1LTk1Ljk0MzMzNiA5NS45NDMzMzVzLTk1Ljk0MzMzNS00Mi45NTQ2MzEtOTUuOTQzMzM1LTk1Ljk0MzMzNSA0Mi45NTQ2MzEtOTUuOTQzMzM1IDk1Ljk0MzMzNS05NS45NDMzMzYgOTUuOTQzMzM1IDQyLjk1NDYzMSA5NS45NDMzMzYgOTUuOTQzMzM2eiIgZmlsbD0icmdiKDExMywgMTEzLCAxMTMpIj48L3BhdGg+PC9zdmc+');
  }
  #search .btn-reset:hover::before{
    background-image: url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTMxLjk4MTExMiAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTYzLjk2MjIyNCAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTk1Ljk0MzMzNSAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTEyNy45MjQ0NDcgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik0xNTkuOTA1NTU5IDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMjU1LCAyNTUsIDI1NSkiPjwvcGF0aD48cGF0aCBkPSJNMTkxLjg4NjY3MSAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTIyMy44Njc3ODIgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik0yNTUuODQ4ODk0IDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMjU1LCAyNTUsIDI1NSkiPjwvcGF0aD48cGF0aCBkPSJNMjg3LjgzMDAwNiAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTMxOS44MTExMTggMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik0zNTEuNzkyMjMgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik0zODMuNzczMzQxIDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMjU1LCAyNTUsIDI1NSkiPjwvcGF0aD48cGF0aCBkPSJNNDE1Ljc1NDQ1MyAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTQ0Ny43MzU1NjUgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik00NzkuNzE2Njc3IDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMjU1LCAyNTUsIDI1NSkiPjwvcGF0aD48cGF0aCBkPSJNNTExLjY5Nzc4OCAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTU0My42Nzg5IDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMjU1LCAyNTUsIDI1NSkiPjwvcGF0aD48cGF0aCBkPSJNNTc1LjY2MDAxMiAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTYwNy42NDExMjQgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik02MzkuNjIyMjM2IDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMjU1LCAyNTUsIDI1NSkiPjwvcGF0aD48cGF0aCBkPSJNNjcxLjYwMzM0NyAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTcwMy41ODQ0NTkgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik03MzUuNTY1NTcxIDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMjU1LCAyNTUsIDI1NSkiPjwvcGF0aD48cGF0aCBkPSJNNzY3LjU0NjY4MyAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTc5OS41Mjc3OTUgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik04MzEuNTA4OTA2IDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMjU1LCAyNTUsIDI1NSkiPjwvcGF0aD48cGF0aCBkPSJNODYzLjQ5MDAxOCAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTg5NS40NzExMyAwLjYwNDQyM3YxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTkyNy40NTIyNDIgMC42MDQ0MjN2MTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik05NTkuNDMzMzUzIDAuNjA0NDIzdjEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMjU1LCAyNTUsIDI1NSkiPjwvcGF0aD48cGF0aCBkPSJNOTkxLjQxNDQ2NSAwLjYwNDQyM3YxMDIzLjM5NTU3N00wIDMyLjU4NTUzNWgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgNjQuNTY2NjQ3aDEwMjMuMzk1NTc3IiBmaWxsPSJyZ2IoMjU1LCAyNTUsIDI1NSkiPjwvcGF0aD48cGF0aCBkPSJNMCA5Ni41NDc3NThoMTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik0wIDEyOC41Mjg4N2gxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgMTYwLjUwOTk4MmgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgMTkyLjQ5MTA5NGgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgMjI0LjQ3MjIwNWgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgMjU2LjQ1MzMxN2gxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgMjg4LjQzNDQyOWgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgMzIwLjQxNTU0MWgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgMzUyLjM5NjY1M2gxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgMzg0LjM3Nzc2NGgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgNDE2LjM1ODg3NmgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgNDQ4LjMzOTk4OGgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgNDgwLjMyMTFoMTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik0wIDUxMi4zMDIyMTJoMTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik0wIDU0NC4yODMzMjNoMTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik0wIDU3Ni4yNjQ0MzVoMTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik0wIDYwOC4yNDU1NDdoMTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik0wIDY0MC4yMjY2NTloMTAyMy4zOTU1NzciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjxwYXRoIGQ9Ik0wIDY3Mi4yMDc3N2gxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgNzA0LjE4ODg4MmgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgNzM2LjE2OTk5NGgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgNzY4LjE1MTEwNmgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgODAwLjEzMjIxOGgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgODMyLjExMzMyOWgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgODY0LjA5NDQ0MWgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgODk2LjA3NTU1M2gxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgOTI4LjA1NjY2NWgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgOTYwLjAzNzc3NmgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTAgOTkyLjAxODg4OGgxMDIzLjM5NTU3NyIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTgwNS45MjQwMTcgMTM0LjkyNTA5M0M3MTYuMzc2OTA0IDQ1LjM3Nzk4IDYwNy42NDExMjQgMC42MDQ0MjMgNDg2LjExMjg5OSAwLjYwNDQyM2MtMTE1LjEzMjAwMi02LjM5NjIyMi0yMjMuODY3NzgyIDM4LjM3NzMzNC0zMDcuMDE4NjczIDExNS4xMzIwMDJ2LTYzLjk2MjIyM2MwLTYuMzk2MjIyIDAtNi4zOTYyMjItNi4zOTYyMjItNi4zOTYyMjJIMTE1LjEzMjAwMmMtNi4zOTYyMjIgMC02LjM5NjIyMiAwLTYuMzk2MjIyIDE5LjE4ODY2N3YxNzIuNjk4MDAzYzYuMzk2MjIyIDYuMzk2MjIyIDYuMzk2MjIyIDEyLjc5MjQ0NSAxOS4xODg2NjcgMTIuNzkyNDQ1bDE3OS4wOTQyMjYtNi4zOTYyMjJzNi4zOTYyMjIgMCA2LjM5NjIyMi02LjM5NjIyM1YxNzkuNjk4NjQ5YzAtNi4zOTYyMjIgMC02LjM5NjIyMi02LjM5NjIyMi02LjM5NjIyMmgtNjMuOTYyMjIzYzE0Ny4xMTMxMTQtMTM0LjMyMDY2OSAzNzAuOTgwODk3LTEyMS41MjgyMjUgNTExLjY5Nzc4OCAxOS4xODg2NjcgMTQ3LjExMzExNCAxNDcuMTEzMTE0IDE0Ny4xMTMxMTQgMzkwLjE2OTU2NCAwIDUzMC44ODY0NTUtMTQ3LjExMzExNCAxNDcuMTEzMTE0LTM4My43NzMzNDEgMTQ3LjExMzExNC01MzAuODg2NDU2IDAtMzEuOTgxMTEyLTI1LjU4NDg4OS01MS4xNjk3NzktNTcuNTY2MDAxLTcwLjM1ODQ0NS04OS41NDcxMTNsLTc2Ljc1NDY2OSAyNS41ODQ4OWMyNS41ODQ4ODkgNDQuNzczNTU2IDUxLjE2OTc3OSA4OS41NDcxMTMgODkuNTQ3MTEzIDEyNy45MjQ0NDcgODkuNTQ3MTEzIDg5LjU0NzExMyAxOTguMjgyODkzIDEzNC4zMjA2NjkgMzI2LjIwNzM0IDEzNC4zMjA2NjkgMTIxLjUyODIyNS02LjM5NjIyMiAyMzYuNjYwMjI3LTUxLjE2OTc3OSAzMjYuMjA3MzQxLTEzNC4zMjA2NjlzMTM0LjMyMDY2OS0yMDQuNjc5MTE1IDEzNC4zMjA2NjktMzE5LjgxMTExOEM5NDYuNjQwOTA5IDMzMy4yMDc5ODYgODk1LjQ3MTEzIDIyNC40NzIyMDUgODA1LjkyNDAxNyAxMzQuOTI1MDkzeiIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PHBhdGggZD0iTTYwNy42NDExMjQgNDYxLjEzMjQzM2MwIDUyLjk4NjcwNi00Mi45NTQ2MzEgOTUuOTQzMzM1LTk1Ljk0MzMzNiA5NS45NDMzMzVzLTk1Ljk0MzMzNS00Mi45NTQ2MzEtOTUuOTQzMzM1LTk1Ljk0MzMzNSA0Mi45NTQ2MzEtOTUuOTQzMzM1IDk1Ljk0MzMzNS05NS45NDMzMzYgOTUuOTQzMzM1IDQyLjk1NDYzMSA5NS45NDMzMzYgOTUuOTQzMzM2eiIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PC9zdmc+');
  }
  #search .btn-reset.anim::before,
  #search .btn-reset:hover::before{
    animation-name: resetTips;
    -webkit-animation-name: resetTips;
    animation-timing-function: ease-in-out;
    -webkit-animation-timing-function: ease-in-out;
    animation-duration: 2s;
    -webkit-animation-duration: 2s;
    animation-fill-mode: forwards;
    -webkit-animation-fill-mode: forwards;
    animation-iteration-count: infinite;
    -webkit-animation-iteration-count: infinite;
    transform-origin: 0 0;
    -webkit-transform-origin: 0 0;
  }
  @keyframes resetTips {
    0%{
      transform: rotate(0deg) translate3d(-50%, -50%, 0);
    }
    50%{
      transform: rotate(-360deg) translate3d(-50%, -50%, 0);
    }
  }
  @-webkit-keyframes resetTips {
    0%{
      -webkit-transform: rotate(0deg) translate3d(-50%, -50%, 0);
    }
    50%{
      -webkit-transform: rotate(-360deg) translate3d(-50%, -50%, 0);
    }
  }

  #search .btn-group{
    min-width: 104px;
    background-image: url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTUxMS45OTk0ODggNjM0LjY4MzE1NyAxMzIuNzk3MDA0IDI1NS40ODA2NzJsLTY2LjkxNjAzOSA2Ni45MTYwMzkgNDQ2LjExNzUgNDQ2LjEyMjYxNyA0NDYuMTE3NS00NDYuMTIyNjE3LTY2LjkxNjAzOS02Ni45MTYwMzlMNTExLjk5OTQ4OCA2MzQuNjgzMTU3ek01MTEuOTk5NDg4IDYzNC42ODMxNTciIGZpbGw9InJnYigxMTMsIDExMywgMTEzKSI+PC9wYXRoPjwvc3ZnPg==');
    background-repeat: no-repeat;
    background-size: 10px;
    background-position: bottom 2px center;
    padding: 0 12px;
  }
  #search .btn-group:hover{
    background-image: url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTUxMS45OTk0ODggNjM0LjY4MzE1NyAxMzIuNzk3MDA0IDI1NS40ODA2NzJsLTY2LjkxNjAzOSA2Ni45MTYwMzkgNDQ2LjExNzUgNDQ2LjEyMjYxNyA0NDYuMTE3NS00NDYuMTIyNjE3LTY2LjkxNjAzOS02Ni45MTYwMzlMNTExLjk5OTQ4OCA2MzQuNjgzMTU3ek01MTEuOTk5NDg4IDYzNC42ODMxNTciIGZpbGw9InJnYigyNTUsIDI1NSwgMjU1KSI+PC9wYXRoPjwvc3ZnPg==');
  }
  .group-show-list #group-list{
    display: block !important;
  }
  #search #group-list{
    position: absolute;
    width: 100%;
    left: 0;
    top: 100%;
    z-index: 999;
    list-style: none;
    box-shadow: 0 8px 10px 1px rgba(0,0,0,0.14), 0 3px 14px 2px rgba(0,0,0,0.12), 0 5px 5px -3px rgba(0,0,0,0.2);
    border-radius: 4px;
    overflow: hidden;
  }
  #search #group-list li{
    position: relative;
    height: 46px;
    line-height: 46px;
    font-size: 16px;
    text-align: center;
    color: #717171;
    padding: 0 12px;
    background-color: #fff;
    border-top: 1px solid #ebebeb;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }
  #search #group-list li:first-child{
    border-top: 0;
  }
  #search #group-list li:hover{
    color: #fff;
    background-color: #40c4ff;
  }
  #search #group-list li:active{
    transition: none;
    color: #fff;
    background-color: #5c5e6f;
  }
  #search #group-list li.setting::before{
    position: absolute;
    width: 20px;
    height: 20px;
    left: 50%;
    top: 50%;
    content: '';
    transform: translate(-50%, -50%);
    -webkit-transform: translate(-50%, -50%);
    background-size: 90%;
    background-repeat: no-repeat;
    background-position: center;
    background-image: url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTk3Ny45MiA0MzMuOTJsLTQ0LjggMGMtMjAuNDggMC00NC44LTE1LjM2LTQ5LjkyLTM1Ljg0bC0yNS42LTY1LjI4Yy0xMC4yNC0yMC40OC01LjEyLTQ0LjggMTAuMjQtNjAuMTZsMzAuNzItMzAuNzJjMTUuMzYtMTUuMzYgMTUuMzYtMzkuNjggMC01NS4wNGwtNTUuMDQtNTUuMDRjLTE1LjM2LTE1LjM2LTM5LjY4LTE1LjM2LTU1LjA0IDBsLTMwLjcyIDMwLjcyYy0xNS4zNiAxNS4zNi0zOS42OCAyMC40OC02MC4xNiAxMC4yNGwtNjUuMjgtMjUuNmMtMjAuNDgtNS4xMi0zNS44NC0zMC43Mi0zNS44NC00OS45Mkw1OTYuNDggNTIuNDhjMC0yNS42LTIwLjQ4LTM5LjY4LTM5LjY4LTM5LjY4bC03NS41MiAwYy0yNS42IDAtMzkuNjggMjAuNDgtMzkuNjggMzkuNjhMNDQxLjYgMTAyLjRjMCAyMC40OC0xNS4zNiA0NC44LTM1Ljg0IDQ5LjkybC02NS4yOCAyNS42Yy0yMC40OCAxMC4yNC00NC44IDUuMTItNjAuMTYtMTAuMjRMMjM4LjA4IDEyOGMtMTUuMzYtMTUuMzYtMzkuNjgtMTUuMzYtNTUuMDQgMGwtNTUuMDQgNTUuMDRjLTE1LjM2IDE1LjM2LTE1LjM2IDM5LjY4IDAgNTUuMDRsMzAuNzIgMzAuNzJjMTUuMzYgMTUuMzYgMjAuNDggMzkuNjggMTAuMjQgNjAuMTZsLTI1LjYgNjUuMjhjLTUuMTIgMjAuNDgtMzAuNzIgMzUuODQtNDkuOTIgMzUuODRMNDYuMDggNDMwLjA4Yy0yNS42IDAtMzkuNjggMjAuNDgtMzkuNjggMzkuNjhsMCA3NS41MmMwIDI1LjYgMjAuNDggMzkuNjggMzkuNjggMzkuNjhsNDQuOCAwYzIwLjQ4IDAgNDQuOCAxNS4zNiA0OS45MiAzNS44NGwyNS42IDY1LjI4YzEwLjI0IDIwLjQ4IDUuMTIgNDQuOC0xMC4yNCA2MC4xNmwtMzAuNzIgMzAuNzJjLTE1LjM2IDE1LjM2LTE1LjM2IDM5LjY4IDAgNTUuMDRsNTUuMDQgNTUuMDRjMTUuMzYgMTUuMzYgMzkuNjggMTUuMzYgNTUuMDQgMGwzMC43Mi0zMC43MmMxNS4zNi0xNS4zNiAzOS42OC0yMC40OCA2MC4xNi0xMC4yNGw2NS4yOCAyNS42YzIwLjQ4IDUuMTIgMzUuODQgMzAuNzIgMzUuODQgNDkuOTJMNDI3LjUyIDk3Mi44YzAgMjUuNiAyMC40OCAzOS42OCAzOS42OCAzOS42OGw3NS41MiAwYzI1LjYgMCAzOS42OC0yMC40OCAzOS42OC0zOS42OGwwLTQ0LjhjMC0yMC40OCAxNS4zNi00NC44IDM1Ljg0LTQ5LjkybDY1LjI4LTI1LjZjMjAuNDgtMTAuMjQgNDQuOC01LjEyIDYwLjE2IDEwLjI0bDMwLjcyIDMwLjcyYzE1LjM2IDE1LjM2IDM5LjY4IDE1LjM2IDU1LjA0IDBsNTUuMDQtNTUuMDRjMTUuMzYtMTUuMzYgMTUuMzYtMzkuNjggMC01NS4wNGwtMzAuNzItMzAuNzJjLTE1LjM2LTE1LjM2LTIwLjQ4LTM5LjY4LTEwLjI0LTYwLjE2bDI1LjYtNjUuMjhjNS4xMi0yMC40OCAzMC43Mi0zNS44NCA0OS45Mi0zNS44NGw0NC44IDBjMjUuNiAwIDM5LjY4LTIwLjQ4IDM5LjY4LTM5LjY4bDEwLjI0IDAgMC03NS41MkMxMDE3LjYgNDQ5LjI4IDk5Ny4xMiA0MzMuOTIgOTc3LjkyIDQzMy45MnpNNTE0LjU2IDcwMS40NGMtMTA0Ljk2IDAtMTkwLjcyLTg1Ljc2LTE5MC43Mi0xOTAuNzJzODUuNzYtMTkwLjcyIDE5MC43Mi0xOTAuNzJjMTA0Ljk2IDAgMTkwLjcyIDg1Ljc2IDE5MC43MiAxOTAuNzJTNjE5LjUyIDcwMS40NCA1MTQuNTYgNzAxLjQ0eiIgZmlsbD0icmdiKDk5LCA5OSwgOTkpIj48L3BhdGg+PC9zdmc+');
  }
  #search #group-list li.setting:hover:before{
    background-image: url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTk3Ny45MiA0MzMuOTJsLTQ0LjggMGMtMjAuNDggMC00NC44LTE1LjM2LTQ5LjkyLTM1Ljg0bC0yNS42LTY1LjI4Yy0xMC4yNC0yMC40OC01LjEyLTQ0LjggMTAuMjQtNjAuMTZsMzAuNzItMzAuNzJjMTUuMzYtMTUuMzYgMTUuMzYtMzkuNjggMC01NS4wNGwtNTUuMDQtNTUuMDRjLTE1LjM2LTE1LjM2LTM5LjY4LTE1LjM2LTU1LjA0IDBsLTMwLjcyIDMwLjcyYy0xNS4zNiAxNS4zNi0zOS42OCAyMC40OC02MC4xNiAxMC4yNGwtNjUuMjgtMjUuNmMtMjAuNDgtNS4xMi0zNS44NC0zMC43Mi0zNS44NC00OS45Mkw1OTYuNDggNTIuNDhjMC0yNS42LTIwLjQ4LTM5LjY4LTM5LjY4LTM5LjY4bC03NS41MiAwYy0yNS42IDAtMzkuNjggMjAuNDgtMzkuNjggMzkuNjhMNDQxLjYgMTAyLjRjMCAyMC40OC0xNS4zNiA0NC44LTM1Ljg0IDQ5LjkybC02NS4yOCAyNS42Yy0yMC40OCAxMC4yNC00NC44IDUuMTItNjAuMTYtMTAuMjRMMjM4LjA4IDEyOGMtMTUuMzYtMTUuMzYtMzkuNjgtMTUuMzYtNTUuMDQgMGwtNTUuMDQgNTUuMDRjLTE1LjM2IDE1LjM2LTE1LjM2IDM5LjY4IDAgNTUuMDRsMzAuNzIgMzAuNzJjMTUuMzYgMTUuMzYgMjAuNDggMzkuNjggMTAuMjQgNjAuMTZsLTI1LjYgNjUuMjhjLTUuMTIgMjAuNDgtMzAuNzIgMzUuODQtNDkuOTIgMzUuODRMNDYuMDggNDMwLjA4Yy0yNS42IDAtMzkuNjggMjAuNDgtMzkuNjggMzkuNjhsMCA3NS41MmMwIDI1LjYgMjAuNDggMzkuNjggMzkuNjggMzkuNjhsNDQuOCAwYzIwLjQ4IDAgNDQuOCAxNS4zNiA0OS45MiAzNS44NGwyNS42IDY1LjI4YzEwLjI0IDIwLjQ4IDUuMTIgNDQuOC0xMC4yNCA2MC4xNmwtMzAuNzIgMzAuNzJjLTE1LjM2IDE1LjM2LTE1LjM2IDM5LjY4IDAgNTUuMDRsNTUuMDQgNTUuMDRjMTUuMzYgMTUuMzYgMzkuNjggMTUuMzYgNTUuMDQgMGwzMC43Mi0zMC43MmMxNS4zNi0xNS4zNiAzOS42OC0yMC40OCA2MC4xNi0xMC4yNGw2NS4yOCAyNS42YzIwLjQ4IDUuMTIgMzUuODQgMzAuNzIgMzUuODQgNDkuOTJMNDI3LjUyIDk3Mi44YzAgMjUuNiAyMC40OCAzOS42OCAzOS42OCAzOS42OGw3NS41MiAwYzI1LjYgMCAzOS42OC0yMC40OCAzOS42OC0zOS42OGwwLTQ0LjhjMC0yMC40OCAxNS4zNi00NC44IDM1Ljg0LTQ5LjkybDY1LjI4LTI1LjZjMjAuNDgtMTAuMjQgNDQuOC01LjEyIDYwLjE2IDEwLjI0bDMwLjcyIDMwLjcyYzE1LjM2IDE1LjM2IDM5LjY4IDE1LjM2IDU1LjA0IDBsNTUuMDQtNTUuMDRjMTUuMzYtMTUuMzYgMTUuMzYtMzkuNjggMC01NS4wNGwtMzAuNzItMzAuNzJjLTE1LjM2LTE1LjM2LTIwLjQ4LTM5LjY4LTEwLjI0LTYwLjE2bDI1LjYtNjUuMjhjNS4xMi0yMC40OCAzMC43Mi0zNS44NCA0OS45Mi0zNS44NGw0NC44IDBjMjUuNiAwIDM5LjY4LTIwLjQ4IDM5LjY4LTM5LjY4bDEwLjI0IDAgMC03NS41MkMxMDE3LjYgNDQ5LjI4IDk5Ny4xMiA0MzMuOTIgOTc3LjkyIDQzMy45MnpNNTE0LjU2IDcwMS40NGMtMTA0Ljk2IDAtMTkwLjcyLTg1Ljc2LTE5MC43Mi0xOTAuNzJzODUuNzYtMTkwLjcyIDE5MC43Mi0xOTAuNzJjMTA0Ljk2IDAgMTkwLjcyIDg1Ljc2IDE5MC43MiAxOTAuNzJTNjE5LjUyIDcwMS40NCA1MTQuNTYgNzAxLjQ0eiIgZmlsbD0icmdiKDI1NSwgMjU1LCAyNTUpIj48L3BhdGg+PC9zdmc+');
  }

  #emptyResult{
    position: absolute;
    z-index: 99999;
    top: 100px;
    left: 50%;
    transform: translate(-50%, 0);

    width: 70%;
    padding: 50px 0;
    background-color: #ffffff;
    border: 1px solid #d8d8d8;
    border-radius: 4px;
    box-shadow: 7px 7px 10px 0px rgba(0, 0, 0, 0.4);
  }
  #emptyResult .title{
    color: #717171;
    font-size: 26px;
    text-align: center;
    line-height: 40px;
    margin: 0 0 20px 0;
  }
  #emptyResult .search-webstore{
    text-align: center;
  }
  #emptyResult .search-webstore button{
    font-size: 16px;
    height: 42px;
    line-height: 42px;
    padding: 0 16px;
    border-radius: 4px;
  }

  #wrap[searching] #search .searchEmpty{
    display: block;
  }

  #wrap[searching] .ext-list li[searched]::before{
    display: block;
    content: "";
    height: 6px;
    width: 6px;
    position: absolute;
    bottom: -10px;
    left: 50%;
    background: #d8d8d8;
    z-index: 0;
    border-radius: 6px;
    -webkit-transform: translateX(-50%);
    transform: translateX(-50%);
  }
  #wrap[searching] #search .searcher{
    border-left-color: #5c5e6f;
  }
  .icon-size-3 .ext-list li[data-mark] i{
    right: -7px;
  }

  .icon-size-1 .ext-list li{
    background-size: 38px;
  }
  .icon-size-2 .ext-list li{
    background-size: 44px;
  }
  .icon-size-3 .ext-list li{
    background-size: 50px;
  }
  .icon-size-3 .ext-list li[locked]::after{
    top: -3px;
    right: -3px;
  }

  #showList {
    border-bottom: 2px dotted #E6E6E6;
    padding: 0 0 10px 0;
    margin: 0 0 10px 0;
  }

  #showList .empty{
    float: unset;
    display: block;
    width: 97%;
    height: 56px;
    line-height: 56px;
    margin: 40px auto 20px auto;

    font-size: 20px;
    font-weight: 200;
    color: #bbb;
    text-align: center;

    opacity: 0;

    animation-name: showEmptyTips;
    -webkit-animation-name: showEmptyTips;
    animation-delay: 250ms;
    -webkit-animation-delay: 250ms;
    animation-timing-function: ease-in-out;
    -webkit-animation-timing-function: ease-in-out;
    animation-duration: 200ms;
    -webkit-animation-duration: 200ms;
    animation-fill-mode: forwards;
    -webkit-animation-fill-mode: forwards;
  }
  @keyframes showEmptyTips {
    from{
      opacity: 0;
    }
    to{
      opacity: 1;
    }
  }
  @-webkit-keyframes showEmptyTips {
    from{
      opacity: 0;
    }
    to{
      opacity: 1;
    }
  }

  #showList[locked] li {
    position: relative;
  }

  #showList.hideListIsNull, #showList:empty{
    border-bottom: none;
    padding: 0;
    margin: 0;
  }

  #allEmptyTips{
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 99;
    background-color: #fff;
  }
  #allEmptyTips .title{
    display: block;
    font-size: 2.2em;
    text-align: center;
    line-height: 54px;
    color: #c7c7c7;
  }
  #allEmptyTips .desc{
    display: block;
    font-size: 1.1em;
    text-align: center;
    height: 20px;
    line-height: 20px;
    color: #d8d8d8;
  }
  #allEmptyTips .desc a{
    margin: 0 0 0 2px;
    color: #c7e8d3;
    font-weight: bold;
    text-decoration: underline;
    outline: none;
  }

  #rightMenu{
    will-change: auto;
    display: none;

    position: absolute;
    top: 0;
    left: 0;
    z-index: 6;

    height: 84px;
    width: 190px;
    border-radius: 4px;
    overflow: hidden;

    opacity: 0;
    background-color: #efefef;

    /* -webkit-transition: .2s ease-in-out;
    transition: .2 ease-in-out; */
  }
  [data-lan=ru] #rightMenu{
    width: 210px;
  }
  #rightMenu .name{
    height: 30px;
    line-height: 30px;
    text-align: center;
    opacity: .8;
    color: rgba(255, 255, 255, 0.9);
    font-size: 13px;
    padding: 0 10px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
    font-weight: bold;
  }
  #rightMenu ul{
    width: 100%;
  }
  #rightMenu ul li{
    height: 27px;
    line-height: 27px;
    width: 50%;
    float: left;

    font-size: 12px;
    color: #fff;
    text-align: center;
    list-style: none;
    cursor: pointer;
  }
  #rightMenu ul li:nth-child(1){
    opacity: .88;
  }
  #rightMenu ul li:nth-child(2){
    opacity: .92;
  }
  #rightMenu ul li:nth-child(3){
    opacity: .96;
  }
  #rightMenu ul li:not([disabled]):hover{
    /* background: rgba(255, 0, 0, .8) !important;
    opacity: 1 !important; */
    opacity: .7 !important;
  }
  #rightMenu ul li[disabled]{
    color: rgba(255, 255, 255, 0.3);
    cursor: default;
  }

  .showInfoRight{
    display: block !important;
    animation: moveShowInfoRight .2s ease-in-out forwards;
    -webkit-animation: moveShowInfoRight .2s ease-in-out forwards;
  }
  @keyframes moveShowInfoRight {
    from {
      transform: translate3d(-20px, 0, 0);
      opacity: 0;
    }
    to {
      transform: translate3d(0, 0, 0);
      opacity: 1;
    }
  }
  @-webkit-keyframes moveShowInfoRight {
    from {
      -webkit-transform: translate3d(-20px, 0, 0);
      opacity: 0;
    }
    to {
      -webkit-transform: translate3d(0, 0, 0);
      opacity: 1;
    }
  }
  .showInfoLeft{
    display: block !important;
    animation: moveShowInfoLeft .2s ease-in-out forwards;
    -webkit-animation: moveShowInfoLeft .2s ease-in-out forwards;
  }
  @keyframes moveShowInfoLeft {
    from {
      transform: translate3d(20px, 0, 0);
      opacity: 0;
    }
    to {
      transform: translate3d(0, 0, 0);
      opacity: 1;
    }
  }
  @-webkit-keyframes moveShowInfoLeft {
    from {
      -webkit-transform: translate3d(20px, 0, 0);
      opacity: 0;
    }
    to {
      -webkit-transform: translate3d(0, 0, 0);
      opacity: 1;
    }
  }
</style>
