<template>
  <div id="option">
    <!-- Tips -->
    <div id="_TOOLS_STATUS__" :class="tips.show ? 'tips show' : 'tips'">{{tips.content}}</div>

    <!-- 设置显示列数 -->
    <div class="list">
      <h1>
        <span>{{i18n.showCols}}</span>
        <span>{{showWindowSize}}</span>
      </h1>
      <p>
        <input type="range" class="range-style" min="6" max="9" step="1" :value="showWindowSize" @input="changeWindowSize">
      </p>
    </div>

    <!-- 设置图标显示大小 -->
    <div class="list">
      <h1>
        <span>{{i18n.iconSize}}</span>
        <span>{{getShowIconSize}}</span>
      </h1>
      <p>
        <input type="range" class="range-style" min="1" max="3" step="1" :value="showIconSize" @input="changeIconSize">
      </p>
    </div>

    <!-- 配置分组 -->
    <div class="list" id="group">
      <h1><span>{{i18n.optionGroupTitle}}</span></h1>
      <p class="describe">{{i18n.optionGroupDesc}}</p>
      <p class="describe" style="margin: 30px 0 0 0;">{{i18n.optionGroupOperat}}</p>
      <ul class="group-list gclearfix">
        <li v-for="(item, index) in group.list" :class="index === groupIndex ? 'cur' : ''" @click="selectGroup(index)">
          {{item.name}}
          <i class="group-del" @click.stop="deleteGroup(index)"></i>
          <i class="group-mod" @click.stop="modifyGroup(index)"></i>
        </li>
        <li class="group-add" @click="addGroup">
          <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M939.939489 459.072557 562.339502 459.072557 562.339502 83.519182 462.055494 83.519182 462.055494 459.072557 84.455507 459.072557 84.455507 559.356564 462.055494 559.356564 462.055494 939.003164 562.339502 939.003164 562.339502 559.356564 939.939489 559.356564Z" fill="#636363"></path></svg>
        </li>
      </ul>
      <ext-item :data-list="getAllExtList" from="option">
        <template slot="empty">
          <li class="empty" v-if="getAllExtList.length === 0">{{i18n.emptyShowListCon}}</li>
        </template>
      </ext-item>
    </div>
    
    <!-- 设置扩展图标排序 -->
    <div class="list">
      <h1>{{i18n.rankName}}</h1>
      <ul class="radio-btn">
        <li>
          <label>
            <input type="radio" name="ext_sort" value="name" v-model="sortType" @click="changeSortType('name')">
            <span class="radio-btn-input"></span>
            <span>{{i18n.sortByName}}</span>
          </label>
        </li>
        <li>
          <label>
            <input type="radio" name="ext_sort" value="rank" v-model="sortType" @click="changeSortType('rank')">
            <span class="radio-btn-input"></span>
            <span>{{i18n.sortByRank}}</span>
          </label>
          <button @click="resetRank">{{i18n.rankBtn}}</button>
        </li>
      </ul>
    </div>

    <!-- 是否显示角标 -->
    <div class="list">
      <h1>{{i18n.showBadgeName}}</h1>
      <switch-btn data-key="show_badge"></switch-btn>
      <p class="describe">{{i18n.showBadgeDesc}}</p>
    </div>
    
    <!-- 捐赠 -->
    <div class="list" id="support" name="support">
      <h1>{{i18n.otherName}}</h1>
      <p class="describe">{{i18n.otherDonate}}</p>
      <ul id="otherDonateList" class="gclearfix">
        <li>
          <img src="assets/pay/pay-wx.png">
        </li>
        <li>
          <a href="https://www.paypal.me/chevionlu" target="_blank">
            <img src="assets/pay/pay-paypal.png">
          </a>
        </li>
        <li>
          <img src="assets/pay/pay-alipay.png">
        </li>
      </ul>
      <p class="describe" v-html="otherDesc"></p>
    </div>
    <canvas id="getColorByCanvas" style="display: none;"></canvas>
  </div>
</template>


<script>
import getI18n from './lib/i18n'
import ExtItem from './components/ExtItem'
import SwitchBtn from './components/SwitchBtn'
import * as Common from './lib/common'
import * as Storage from './lib/storage'
import * as Extension from "./lib/extension"

export default {
  data() {
    return {
      // 国际化对象
      i18n: getI18n(),
      language: chrome.i18n.getUILanguage(),
      extList: [],
      group: {
        list: [
          {
            name: "",
            lock: {}
          }
        ]
      },
      groupIndex: 0,
      showIconSize: Common.ShowIconSize,
      showWindowSize: Common.WindowSizeDefaultColum,
      tips: {
        show: false,
        content: ""
      },
      sortType: "name"
    };
  },
  components: {
    ExtItem,
    SwitchBtn
  },
  watch: {
    'group.list': function(val, oldVal){
      Storage.set('_group_', this.group)
    }
    // extList: {
    //   handler: (_new, _old) => {
    //     setTimeout(() => {
    //       Extension.addIconBadge()
    //     }, 0)
    //   },
    //   deep: true
    // }
  },
  computed: {
    otherDesc() {
      return this.i18n.otherDesc.replace('<a>', `<a href="https://chrome.google.com/webstore/detail/extension-manager/gjldcdngmdknpinoemndlidpcabkggco/reviews?hl=${this.language}" target="_blank">`)
    },
    getAllExtList() {
      return this.extList.map(item => {
        if (this.group.list[this.groupIndex].lock[item.id]) {
          item.isLocked = true
        } else {
          item.isLocked = false
        }
        return item
      })
    },
    getShowWindowSize() {
      // 默认情况下是7列
      return Common.WindowSizeByColum[this.showWindowSize || Common.WindowSizeDefaultColum]
    },
    getShowIconSize() {
      const IconSizeShowText = {
        1: this.i18n.sizeSmall,
        2: this.i18n.sizeNormal,
        3: this.i18n.sizeBig
      }
      return IconSizeShowText[this.showIconSize]
    }
  },

  methods: {
    modifyGroup(index) {
      this.groupIndex = index

      let that = this
      setTimeout(() => {
        var newName = prompt(this.i18n.optionGroupModifyName) || 'New Group'
        if (newName.trim()) {
          let obj = this.group.list[index]
          obj.name = newName
          this.group.list.splice(index, 1, obj)
        }
      }, 100)
    },
    deleteGroup(index) {
      this.groupIndex = index
      
      let that = this
      setTimeout(() => {
        if (confirm(this.i18n.optionGroupDelete)) {
          if (that.group.list.length === 1) {
            this.showTips(this.i18n.optionGroupDeleteAtLeaseOne)
          } else {
            // 设置分组索引
            that.groupIndex = index - 1 < 0 ? 0 : index - 1
            // 设置分组内容
            that.group.list.splice(index, 1)
          }
        }
      }, 100);
    },
    selectGroup(index) {
      this.groupIndex = index
    },
    extClick(item) {
      let listObj = this.group.list[this.groupIndex]
      if (item.isLocked) {
        delete listObj.lock[item.id]
      } else {
        listObj.lock[item.id] = 1
      }
      this.group.list.splice(this.groupIndex, 1, listObj)
      this.showTips(this.i18n.tipSetSuc)
    },
    addGroup() {
      this.group.list.push({
        name: this.i18n.newGroupName,
        lock: {}
      })
      this.groupIndex = this.group.list.length - 1
    },
    // 重置点击生成的rank
    resetRank(e) {
      Storage.remove("_rankList_")
      this.showTips(this.i18n.tipResetRank)
    },

    // 更改扩展显示列数
    changeWindowSize(e) {
      let newSize = e.target.value
      this.showWindowSize = newSize
      Storage.set("_showColumn_", newSize)
      this.showTips(this.i18n.tipSetSuc)
    },

    // 更改显示图标大小
    changeIconSize(e) {
      let newSize = e.target.value
      this.showIconSize = newSize
      Storage.set("_showIconSize_", newSize)
      this.showTips(this.i18n.tipSetSuc)
    },

    // 更改扩展排序
    changeSortType(value) {
      if (this.sortType !== value) {
        this.sortType = value;
        Storage.set("_radio_ext_sort_", value)
        this.showTips(this.i18n.tipSetSuc)
      }
    },

    // 提示组件
    showTips: (function() {
      let timer = null
      return function(text, timenum = 1500) {
        if (text) {
          let t = this
          clearTimeout(timer)
          t.tips.show = true
          t.tips.content = text
          timer = setTimeout(function() {
            t.tips.show = false
            setTimeout(() => {
              t.tips.content = ""
            }, 100)
          }, timenum)
        }
      }
    })()
  },

  // 初始化
  async beforeMount() {
    window._vm = this

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
    
    this.extList = _allExt
  }
}
</script>



<style>
.gclearfix:after {
  display: block;
  clear: both;
  visibility: hidden;
  height: 0;
  content: "";
}
.gclearfix {
  zoom: 1;
}
* {
  padding: 0;
  margin: 0;
}
body {
  text-rendering: geometricPrecision;
  -webkit-user-select: none;
  user-select: none;
  padding: 20px;
  /* font-family: "Lantinghei SC", "Open Sans", Arial, "Hiragino Sans GB", "Microsoft YaHei", "STHeiti", "WenQuanYi Micro Hei", SimSun, sans-serif; */
  /* font-family: arial, sans-serif; */
}
button,
select {
  width: 80px;
  height: 30px;
  line-height: 30px;
  display: inline-block;
  background: #25b75a;
  color: #fff;
  border-radius: 2px;
  border: none;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  border: 1px solid #439e64;
  margin: 10px 10px 0 0;
  letter-spacing: 1px;
  vertical-align: middle;
}
button:hover,
select:hover {
  background: #1fab52;
}
.list {
  background: #efefef;
  margin: 30px 20px;
  padding: 20px;
  border-radius: 2px;
  -webkit-transition: 0.3s ease-in-out;
  transition: 0.3s ease-in-out;
}
.list h1 {
  font-size: 26px;
  font-weight: normal;
  line-height: 48px;
}

.list .list-plugins {
  list-style: none;
  margin: 20px 0 0 0;
}
.list .list-plugins li {
  height: 40px;
  width: 40px;
  float: left;
  margin: 0 20px 20px 0;
}
.list .list-plugins li[locked] {
  position: relative;
}
.list .list-plugins li[locked]:after {
  position: absolute;
  top: -3px;
  right: -3px;
  z-index: 999;
  content: "";
  display: block;
  height: 6px;
  width: 6px;
  border-radius: 10px;
  border: 3px solid #5c5e6f;
  box-shadow: 0px 0px 0px 1px #fff;
  background: #46d5fe;
}
.list .list-plugins li img {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.tips {
  font-family: MicrosoftYahei;
  color: rgb(255, 255, 255);
  padding: 0px 20px;
  text-align: center;
  font-size: 20px;
  position: fixed;
  top: 0;
  left: 50%;
  z-index: 9999999;
  transition: 0.2s;
  -webkit-transition: 0.2s;
  opacity: 0;
  cursor: pointer;
  height: 36px;
  line-height: 35px;
  background: #25b75a;
  border: 1px solid #439e64;
  transform: translate3d(-50%, -100%, 0);
  -webkit-transform: translate3d(-50%, -100%, 0);
}
.tips.show {
  opacity: 1;
  transform: translate3d(-50%, 0, 0);
  -webkit-transform: translate3d(-50%, 0, 0);
}
ul li {
  font-size: 16px;
  line-height: 30px;
  color: #636363;
  margin: 0 0 0 18px;
}
p.describe {
  font-size: 16px;
  margin: 20px 0 0 0;
  color: #636363;
}
p.describe a {
  font-weight: bold;
  color: #25b75a;
}
p.describe img {
  border-radius: 2px;
  border: 1px solid #dcdcdc;
}
ul li em {
  background: #e2e2e2;
  border-radius: 4px;
  font-style: normal;
  padding: 1px 4px;
  margin: 0 3px;
}

.group-list{
  margin-top: 20px;
  margin-bottom: -1px;
}
.group-list li{
  position: relative;
  float: left;
  cursor: pointer;
  list-style: none;
  height: 40px;
  line-height: 40px;
  min-width: 100px;
  text-align: center;
  padding: 0 63px 0 10px;
  background-color: #e0e0e0;
  margin: 0 10px 0 0;
  border: 1px solid #ccc;
  border-radius: 2px;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.group-list li:hover{
  background-color: #eaeaea;
}
.group-list li.cur{
  background-color: #fff;
  border-bottom-color: #fff;
}
.group-list .group-mod,
.group-list .group-del{
  position: absolute;
  width: 16px;
  height: 16px;
  top: 50%;
  content: '';
  transform: translate3d(0, -50%, 0);
  -webkit-transform: translate3d(0, -50%, 0);
  background-size: 90%;
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 2px;
  border: 1px solid #bdbdbd;
}
.group-list .group-mod:hover,
.group-list .group-del:hover{
  border-color: #636363;
}
.group-list .group-mod{
  right: 35px;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTg3OS4wNCAzMjMuMzZsLTE3Ni44LTE3Ni43NjhhNjQuMDMyIDY0LjAzMiAwIDAgMC05MC40NjQgMC4yMjRsLTY3LjM2IDY3LjM5MiA0NC44NjQgNDQuNjQgMC45Ni0wLjE5MmgwLjAzMmwxNzYuNjQgMTc2LjU3NiAzMC4zMDQgMzAuNCAxNC44NDggMTQuODggNjYuNzItNjYuNzJhNjQgNjQgMCAwIDAgMC4yMjQtOTAuNDMyTTMyNS44ODggODE1LjM2bC0xMy42LTEzLjYzMi04OC4zMi04OC42NC0xNC4wOC0xNC4xNDQtNDAuNzA0LTQzLjM5MkwxNjAgNjQ1Ljc2djE1Ni4xMjhjMCAzNS4xMzYgMjguNTc2IDYzLjY4IDYzLjY4IDYzLjY4aDE1NC4yMDhsLTExLjY0OC0xMS4yLTQwLjM1Mi0zOC45NzZ6TTU0NS4wMjQgMzAzLjg3MmwtNDUuMjQ4LTQ1LjA1NkwxNzkuNjE2IDU3OC45NzZsNDUuMjQ4IDQ1LjI0OCAxNzYuNTQ0IDE3Ni43MDQgNDUuMTg0IDQ1LjAyNCAzMTguOTc2LTMxOC45NzYtNDMuOTM2LTQ2LjQ5NnoiIGZpbGw9IiM2MzYzNjMiPjwvcGF0aD48L3N2Zz4=');
}
.group-list .group-del{
  right: 10px;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTgzMiAyODhoLTEyOFYyMDIuNjI0QzcwNCAxODIuMDE2IDY4Ny4yMzIgMTYwIDY0MC4xMjggMTYwaC0yNTYuMjU2QzMzNi43NjggMTYwIDMyMCAxODIuMDE2IDMyMCAyMDIuNjI0VjI4OEgxOTJhMzIgMzIgMCAwIDAgMCA2NGgyMjRsMTkyIDAuMDMyVjM1MmgyMjRhMzIgMzIgMCAwIDAgMC02NHpNMzg0IDQ0OGEzMiAzMiAwIDAgMSA2NCAwdjIxMC41MjhhMzIgMzIgMCAwIDEtNjQgMFY0NDh6IG0xOTIgMGEzMiAzMiAwIDAgMSA2NCAwdjIxMC41MjhhMzIgMzIgMCAwIDEtNjQgMFY0NDh6IG0zMi00Ny4xMzZIMjI0djM5OS4xMDRjMCAyMC42NzIgOS45ODQgMzguODQ4IDI1LjE4NCA1MC41NiAxMC43ODQgOC4zMiAyNC4xNiAxMy40NzIgMzguODQ4IDEzLjQ3Mmg0NDcuOTM2YzE0LjY4OCAwIDI4LjA2NC01LjE1MiAzOC44OC0xMy40NzIgMTUuMTY4LTExLjcxMiAyNS4xNTItMjkuODg4IDI1LjE1Mi01MC41NlY0MDAuODY0aC0xOTJ6IiBmaWxsPSIjNjM2MzYzIj48L3BhdGg+PC9zdmc+');
}

.group-list .group-add{
  position: relative;
  width: 40px;
  padding: 0;
}
.group-list .group-add svg{
  position: absolute;
  width: 60%;
  height: 60%;
  left: 50%;
  top: 50%;
  transform: translate3d(-50%, -50%, 0);
}
.ext-list{
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 2px;
  padding: 10px;
}
.ext-list li.empty{
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  text-align: center;
  line-height: 50px;
}

.range-style {
  width: 260px;
  height: 4px;
  background: rgba(37, 183, 90, 0.8);
  border: 1px solid #439e64;
  border-radius: 4px;
  -webkit-appearance: none !important;
  outline: none;
  margin: 10px 0 0 0;
}

.range-style::-webkit-slider-thumb {
  width: 24px;
  height: 24px;
  cursor: pointer;

  background: -webkit-gradient(
    linear,
    left top,
    left bottom,
    from(#fff),
    to(#ccc)
  );

  border: 1px solid #666;
  box-shadow: 0 0 6px #666;
  -webkit-box-shadow: 0 0 6px #666;
  border-radius: 14px;
  -webkit-appearance: none !important;
}

.radio-btn li {
  list-style: none;
  height: 40px;
  line-height: 40px;
  vertical-align: middle;
  margin: 0;
}
.radio-btn li label {
  display: inline-block;
  position: relative;
  padding: 0 0 0 38px;
  cursor: pointer;
}
.radio-btn li label input[type="radio"] {
  display: none;
}
.radio-btn li label .radio-btn-input {
  position: absolute;
  left: 0;
  top: 5px;

  display: block;

  width: 30px;
  height: 30px;
  line-height: 30px;
  border-radius: 30px;

  background-repeat: no-repeat;
  background-size: 20px;
  background-position: center;
  background-color: #dcdcdc;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTNweCIgaGVpZ2h0PSI4cHgiIHZpZXdCb3g9IjAgMCAxMyA4IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTQuMDAwMDAwLCAtNy4wMDAwMDApIiBzdHJva2U9IiNGRkZGRkYiPjxwb2x5bGluZSBpZD0iQ2hlY2siIHBvaW50cz0iNSAxMS41IDYuOTAwODc4OTEgMTMuNDAwODc4OSA4LjUgMTUgMTYuNSA3Ij48L3BvbHlsaW5lPjwvZz48L2c+PC9zdmc+');

  -webkit-transition: 0.3s ease-in-out;
  transition: 0.3s ease-in-out;
}
.radio-btn li input[type="radio"]:checked + .radio-btn-input {
  background-color: #25b75a;

  -webkit-animation: 0.4s switch-radio;
  animation: 0.4s switch-radio;
}
@-webkit-keyframes switch-radio {
  from {
    -webkit-transform: scale(1);
  }
  50% {
    -webkit-transform: scale(0.8);
  }
  80% {
    -webkit-transform: scale(1.1);
  }
  to {
    -webkit-transform: scale(1);
  }
}
@keyframes switch-radio {
  from {
    transform: scale(1);
  }
  50% {
    transform: scale(0.8);
  }
  80% {
    transform: scale(1.1);
  }
  to {
    transform: scale(1);
  }
}
.radio-btn li button {
  margin: 0 0 0 10px;
}

#playDemo {
  border: 3px solid #d2d2d2;
  border-radius: 6px;
  margin: 10px 0 0 0;
  width: 200px;
  cursor: pointer;

  -webkit-transition: 0.3s ease-in-out;
  transition: 0.3s ease-in-out;
}

#otherDonateList {
  margin: 20px 0 30px 0;
}
#otherDonateList li {
  list-style: none;
  float: left;
  width: 180px;
  height: 220px;
  margin: 0 40px 0 0;
  border-radius: 4px;
  overflow: hidden;
}
#otherDonateList li img {
  width: 100%;
}
</style>
