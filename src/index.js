import React from 'react'
import ReactDOM from 'react-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.scss'
import './core'
import App from './App'
import ThemeContext from './contexts/Theme'

require('dotenv').config()

ReactDOM.render(
  <ThemeContext>
    <App />
  </ThemeContext>
  , document.getElementById('root'))
