import React from 'react'
import Nav from './components/Nav.jsx'
import QuizBox from './components/QuizBox.jsx'

const App = () => {
  return (
    <div className='main'>
        <Nav />
        <div id='glowLineNav'></div>
        <div className='quizBoxContainer'>
        <QuizBox />
        </div>
    </div>
  )
}

export default App