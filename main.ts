import MiniSpa from './core.ts'
import * as Vue from 'vue'
import React from'react'
import ReactDOM from 'react-dom';

const miniSpa = new MiniSpa()

let vueApp
miniSpa.registerApp({
  name: 'vue',
  loadApp() {
    return Promise.resolve({
      bootstrap() {
        console.log('vue bootstrap')
      },
      mount() {
        console.log('vue mount')
        vueApp = Vue.createApp({
          data() {
            return {
              text: 'Vue App',
            }
          },
          render() {
            return Vue.h(
              'div', // 标签名称
              this.text // 标签内容
            )
          },
        })

        vueApp.mount('#app')
      },
      unmount() {
        console.log('vue unmount')
        vueApp.unmount()
      },
    })
  },
  active: (location) => window.location.hash === '#/vue',
})

class LikeButton extends React.Component {
  constructor(props) {
      super(props);
      this.state = { liked: false };
  }

  render() {
      if (this.state.liked) {
          return 'You liked this.';
      }

      return React.createElement(
          'button',
          { onClick: () => this.setState({ liked: true }) },
          'Like'
      );
  }
}

miniSpa.registerApp({
  name: 'react',
  loadApp() { 
      return Promise.resolve({
          bootstrap() {
              console.log('react bootstrap')
          },
          mount() {
              console.log('react mount')
              ReactDOM.render(
                  React.createElement(LikeButton),
                  $('#app')
              );
          },
          unmount() {
              console.log('react unmount')
              ReactDOM.unmountComponentAtNode($('#app'));
          },
      })
  },
  active: (location) => window.location.hash === '#/react'
})


miniSpa.start()

function $(selector) {
  return document.querySelector(selector)
}

$('.btn1').onclick = () => {
  location.hash = '/'
}

$('.btn2').onclick = () => {
  location.hash = '/vue'
}

$('.btn3').onclick = () => {
  location.hash = '/react'
}
