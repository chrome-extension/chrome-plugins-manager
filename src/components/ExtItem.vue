<template>
  <ul :id="dataId" :class="{ gclearfix: true, 'ext-list': true}" :locked="dataLocked">
    <li 
      v-for="item in dataList"
      :data-id="item.id"
      :class="{ hover: item.isHover}"
      :style="getStyle(item)"
      :locked="item.isLocked"
      :searched="item.isSearched"
      :mark="item.showMark"
      @mousedown.left.prevent="extClick(item)"
      @mouseenter="extEnter(item)"
      @mouseleave="extLeave(item)"
      >
      <i v-if="item.showType" :style="'background-color: ' + item.showColor[item.showMark]">{{item.showType}}</i>
    </li>
    <slot name="empty"></slot>
  </ul>
</template>

<script>
  export default {
    name: 'ExtItem',
    props: {
      dataList: Array,
      dataId: String,
      dataLocked: String,
      searching: Boolean,
      hover: Object,
      from: String
    },
    computed: {
      getStyle: function(){
        return function (item) {
          if (item['showBase64'] && item['showBase64'][item['showMark']]){
            if (this.from === 'option') {
              item['showMark'] = item.isLocked ? 'original' : 'filter'
            } else {
              if (this.searching) {
                item['showMark'] = item.isSearched ? 'original' : 'dinginess'
              } else {
                if (this.hover && this.hover.doing && this.dataId === this.hover.listName) {
                    item['showMark'] = item.isHover ? 'original' : 'dinginess'
                } else {
                  item['showMark'] = item.enabled ? 'original' : 'filter'
                }
              }
            }
            // if(item.id === 'dogkpdfcklifaemcdfbildhcofnopogp'){
            //   console.log(`1. background-image:url('${item['showBase64'][item['showMark']]}');`)
            // }
            return `background-image:url('${item['showBase64'][item['showMark']]}');`
          } else {
            if (item.enabled) {
              return `background-image:url('${item['showIcon']}');`
            } else {
              // if(item.id === 'dogkpdfcklifaemcdfbildhcofnopogp'){
              //   console.log(`2. opacity:.5; filter:grayscale(1);background-image:url('${item['showIcon']}');`)
              // }
              return `background-color: #f9f9f9;`
              // return `background-image:url('${item['showIcon']}'); opacity:.5; filter:grayscale(1);`
              // return "background-image: url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4Ij48cGF0aCBkPSJNODc0LjY2NjY2NyA0NjkuMzMzMzMzaC02NHYtMTcwLjY2NjY2NmMwLTQ3LjE0NjY2Ny0zOC4xODY2NjctODUuMzMzMzMzLTg1LjMzMzMzNC04NS4zMzMzMzRoLTE3MC42NjY2NjZWMTQ5LjMzMzMzM2MwLTU4Ljg4LTQ3Ljc4NjY2Ny0xMDYuNjY2NjY3LTEwNi42NjY2NjctMTA2LjY2NjY2NnMtMTA2LjY2NjY2NyA0Ny43ODY2NjctMTA2LjY2NjY2NyAxMDYuNjY2NjY2djY0SDE3MC42NjY2NjdjLTQ3LjE0NjY2NyAwLTg0LjkwNjY2NyAzOC4xODY2NjctODQuOTA2NjY3IDg1LjMzMzMzNGwtMC4yMTMzMzMgMTYyLjEzMzMzM0gxNDkuMzMzMzMzYzYzLjU3MzMzMyAwIDExNS4yIDUxLjYyNjY2NyAxMTUuMiAxMTUuMlMyMTIuOTA2NjY3IDY5MS4yIDE0OS4zMzMzMzMgNjkxLjJIODUuNTQ2NjY3TDg1LjMzMzMzMyA4NTMuMzMzMzMzYzAgNDcuMTQ2NjY3IDM4LjE4NjY2NyA4NS4zMzMzMzMgODUuMzMzMzM0IDg1LjMzMzMzNGgxNjIuMTMzMzMzdi02NGMwLTYzLjU3MzMzMyA1MS42MjY2NjctMTE1LjIgMTE1LjItMTE1LjIgNjMuNTczMzMzIDAgMTE1LjIgNTEuNjI2NjY3IDExNS4yIDExNS4ydjY0SDcyNS4zMzMzMzNjNDcuMTQ2NjY3IDAgODUuMzMzMzMzLTM4LjE4NjY2NyA4NS4zMzMzMzQtODUuMzMzMzM0di0xNzAuNjY2NjY2aDY0YzU4Ljg4IDAgMTA2LjY2NjY2Ny00Ny43ODY2NjcgMTA2LjY2NjY2Ni0xMDYuNjY2NjY3cy00Ny43ODY2NjctMTA2LjY2NjY2Ny0xMDYuNjY2NjY2LTEwNi42NjY2Njd6IiBmaWxsPSIjZjlmOWY5Ij48L3BhdGg+PC9zdmc+');"
            }
          }
        }
      }
    },
    methods: {
      extClick(item) {
        this.$parent.extClick && this.$parent.extClick(item)
      },
      extEnter(item) {
        this.$parent.extEnter && this.$parent.extEnter(item)
      },
      extLeave(item) {
        this.$parent.extLeave && this.$parent.extLeave(item)
      }
    }
  }
</script>

<style>
  .ext-list li {
    width: 50px;
    height: 50px;
    float: left;
    list-style: none;
    margin: 13px;
    border-radius: 2px;
    background-color: #fff;
    background-size: 50px 50px;
    background-position: center;
    background-repeat: no-repeat;
    position: relative;

    -webkit-transition: .2s ease-in-out;
    transition: .2s ease-in-out;
  }
  .ext-list li.hover {
    transform: scale(1.3) translate3d(0, 0, 0);
    -webkit-transform: scale(1.3) translate3d(0, 0, 0);
  }

  /* 是否应用或开发版 */
  .ext-list li i{
    position: absolute;
    bottom: -2px;
    right: -4px;
    z-index: 999;

    height: 16px;
    line-height: 15px;
    width: 29px;
    padding: 0 2px;

    font-size: 12px;
    color: #fff;
    text-align: center;

    border-radius: 10px;
    box-shadow: 0px 0px 0px 1px #fff;
    background: #5c5d6e;
    -webkit-transform: scale(0.7);
    transform: scale(0.7);
  }

  .ext-list li[locked]::after {
    position: absolute;
    top: 1px;
    right: 1px;
    z-index: 88;
    content: "";
    display: block;
    height: 6px;
    width: 6px;
    border-radius: 10px;
    border: 3px solid #5c5e6f;
    box-shadow: 0px 0px 0px 1px #fff;
    background: #46d5fe;

    animation-name: lockedAnim;
    -webkit-animation-name: lockedAnim;
    animation-timing-function: ease-in-out;
    -webkit-animation-timing-function: ease-in-out;
    animation-duration: 400ms;
    -webkit-animation-duration: 400ms;
    animation-direction: alternate;
    -webkit-animation-direction: alternate;
    animation-iteration-count: 2;
    -webkit-animation-iteration-count: 2;
  }
  .ext-list li[locked][mark=filter]::after {
    border-color: #aeaeae;
    background: #dbdbdb;
  }
  .ext-list li[locked][mark=dinginess]::after {
    border-color: #dfdfdf;
    background: #f1f1f1;
  }
  @keyframes lockedAnim {
    0%{
      transform: scale(1);
      -webkit-transform: scale(1);
    }
    50%{
      transform: scale(1.4);
      -webkit-transform: scale(1.4);
    }
    100%{
      transform: scale(1);
      -webkit-transform: scale(1);
    }
  }
  @-webkit-keyframes lockedAnim {
    0%{
      transform: scale(1);
      -webkit-transform: scale(1);
    }
    50%{
      transform: scale(1.4);
      -webkit-transform: scale(1.4);
    }
    100%{
      transform: scale(1);
      -webkit-transform: scale(1);
    }
  }
</style>