import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom"

import Home from './components/pages/Home'
import Register from './components/pages/Register'
import Login from './components/pages/Login'
import PrivateWrapper from './components/pages/PrivateWrapper'
import { UserProvider } from './context/UserContext'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={
            <PrivateWrapper>
              <UserProvider>
                <Home />
              </UserProvider>
            </PrivateWrapper>
          }/>
          <Route path='/register' element={<Register />}/>
          <Route path='/login' element={<Login />}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
