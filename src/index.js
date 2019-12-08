import React from 'react'
import ReactDOM from 'react-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.scss'
import './core'
import App from './App'

require('dotenv').config()

ReactDOM.render(<App />, document.getElementById('root'))
