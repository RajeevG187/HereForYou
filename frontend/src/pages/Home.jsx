import React from 'react'
import Header from '../components/Header'
import SpecialityMenu from '../components/SpecialityMenu'
import TopDoctors from '../components/TopDoctors'
import Banner from '../components/Banner'
import Footer from '../components/Footer'
import { AppContext } from '../context/AppContext'
import { useContext } from 'react'

const Home = () => {
  const { token } = useContext(AppContext)
  return (
    <div>
      <Header />
      <SpecialityMenu />
      <TopDoctors />
      {
        token ?
        <div></div>
          :<Banner />
      }
    </div>
  )
}

export default Home