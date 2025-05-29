import React from 'react'
import { assets } from '../assets/assets'

const Contacts = () => {


  return (
    <div>
      <div className='text-center text-2xl pt-10 text-gray-500'>
        <p>CONTACT <span className='text-gray-700 font-medium'>US</span></p>
      </div>

      <div className='my-10 flex flex-col md:flex-row gap-12'>
        <img className='w-full md:max-w-[360px]' src={assets.contact_image} alt="" />
        <div className='flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600'>
          <p className='text-lg font-bold text-gray-800'>OUR OFFICE</p>
          <p>54709 Willms Station <br />
          Suite 350, Washington, USA</p>
          <p>Tel: (415) 555‑0132 <br />
          Email: rajeev.goel187@gmail.com</p>
        </div>
      </div>
    </div>
  )
}

export default Contacts