import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const Header = () => {
  const navigate = useNavigate();
  return (
    <div  className='flex flex-col lg:flex-row flex-wrap bg-primary rounded-lg px-6 md:px-10 lg:px-20'>
        {/* ==========Left-side--------- */}
        <div className='md:w-1/2 flex flex-col items-start justify-center gap-4 py-10 m-auto md:py-[10vw] md:mb-[-30px]'>
            <p className='text-3xl md:4xl md:5xl text-white font-semibold leading-tight md:leading-tight lg:leading-tight'>Feeling Low? <br /> Consider Trusting our Specialists!</p>
            <div className='flex flex-col md:flex-row items-centre gap-3 text-white text-sm font-light font-small'>
                <img className='w-28' src={assets.group_profiles} alt="" />
                <p>Or consider having a chat with our specialized chatbot,   <br className='hidden sm:block' /> And assess the possible issues.</p>
            </div>
            <div className='flex md:flex-row items-centre gap-3 text-white text-sm font-light font-small'>
            <a className='flex items-centre gap-2 bg-white px-8 py-3 rounded-full text-gray-600 text-sm m-auto md:m-0 hover:scale-105 transition-all duration-300' href="#speciality">
                Book Appointment <img className='w-3' src={assets.arrow_icon} alt="" />
            </a>
            <button
              className='flex items-centre gap-2 bg-white px-8 py-3 rounded-full text-gray-600 text-sm m-auto md:m-0 hover:scale-105 transition-all duration-300'
              onClick={() => navigate('/chat')}
            >
              Chat with our Bot <img className='w-3' src={assets.arrow_icon} alt="" />
            </button>
            </div> 
        </div>

        {/* ========Right-side========= */}
        <div className='md:w-1/2 relative'>
            <img className='w-full md:absolute bottom-0 h-auto rounded-lg' src={assets.header_img} alt="" />
        </div>
    </div>
  )
}

export default Header