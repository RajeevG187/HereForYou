import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import About from './pages/About'
import Contacts from './pages/Contacts'
import MyProfile from './pages/MyProfile'
import MyAppointsments from './pages/MyAppointsments'
import Appointment from './pages/Appointment'
import Chat from './pages/Chat'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  return (
    <div className='mx-4 sm:mx-[10%]'>
      <ToastContainer />
      <Navbar/>
      <Routes>
        <Route path = '/' element={<Home/>}/>
        <Route path = '/doctors' element={<Doctors/>}/>
        <Route path = '/doctors/:speciality' element={<Doctors/>}/>
        <Route path = '/login' element={<Login/>}/>
        <Route path = '/about' element={<About/>}/>
        <Route path = '/contact' element={<Contacts/>}/>
        <Route path = '/my-profile' element={<MyProfile/>}/>
        <Route path = '/my-appointments' element={<MyAppointsments/>}/>
        <Route path = '/appointment/:docId' element={<Appointment/>}/>
        <Route path = '/chat' element={<Chat/>}/>
      </Routes>
      <Footer/>
    </div>
  )
}

export default App