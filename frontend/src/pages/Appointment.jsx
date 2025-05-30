import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import { toast } from 'react-toastify'
import axios from 'axios'

const Appointment = () => {

const { docId } = useParams()
const { doctors, backendUrl, token, getDoctorsData, currencySymbol } = useContext(AppContext)
const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

const navigate = useNavigate()

const [docInfo, setDocInfo] = useState(null)
const [docSlots, setDocSlots] = useState([])
const [slotIndex, setSlotIndex] = useState(0)
const [slotTime, setSlotTime] = useState('')

const fetchDocInfo = async () => {
  const docInfo = doctors.find(doc => doc._id === docId)
  setDocInfo(docInfo)
}

const getAvailableSolts = async () => {
  setDocSlots([])
  // getting current date
  let today = new Date()
  for(let i= 0; i<7 ; i++)
  {
    // getting date with index
    let currentDate = new Date()
    currentDate.setDate(today.getDate() + i)

    // setting and time of the date with index
    let endTime = new Date()
    endTime.setDate(today.getDate()+i)
    endTime.setHours(21,0,0,0)

    // setting hours
    if(today.getDate() === currentDate.getDate()){
      currentDate.setHours(currentDate.getHours() > 10 ? currentDate.getHours() + 1 :10)
      currentDate.setMinutes(currentDate.getMinutes() > 30 ? 30 : 0)
    } else {
      currentDate.setHours(10)
      currentDate.setMinutes(0)
    }

    let timeSlots = []

    while(currentDate < endTime)
    {
      let formattedTime = currentDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})

      let day = currentDate.getDate()
      let month = currentDate.getMonth()+1
      let year = currentDate.getFullYear()

      const slotDate = day + "_" + month + "_" + year
      const slotTime = formattedTime

      const isSlotAvailable = docInfo.slots[slotDate] && docInfo.slots[slotDate].includes(slotTime) ? false : true

      if (isSlotAvailable) {
        // add slot to array
        timeSlots.push({
          datetime: new Date(currentDate),
          time : formattedTime
        })
      }

      // increment time by 30 mins
      currentDate.setMinutes(currentDate.getMinutes() + 30)
    }
    setDocSlots(prev => ([...prev, timeSlots]))

  }
}

const bookAppointment = async () => {
  if(!token){
    toast.warn("Login to book appointment")
    return navigate('/login')
  }

  try {
    
    const date = docSlots[slotIndex][0].datetime
    let day = date.getDate()
    let month = date.getMonth()+1
    let year = date.getFullYear()

    const slotDate = day +"_"+ month +"_"+ year
    const { data } = await axios.post(backendUrl+'/api/user/book-appointment', {docId, slotDate, slotTime}, {headers:{token}})
    if(data.success){
      toast.success(data.message)
      getDoctorsData()
      navigate('/my-appointments')
    } else {
      toast.error(data.message)
    }
  } catch (error) {
    console.log(error)
    toast.error(error.message)
  }

}

useEffect(() => {
  fetchDocInfo()
},[doctors, docId])

useEffect(() => {
  getAvailableSolts()
},[docInfo])

useEffect(() => {
  console.log(docSlots)
},[docSlots])


  return docInfo && (
    <div>
      {/* Doctor details */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div>
          <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt="" />
        </div>
        <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
          {/* Doctors info  */}
          <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>{docInfo.name} 
            <img className='w-5' src={assets.verified_icon} alt="" />
          </p>
          <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
          <p>{docInfo.degree} - {docInfo.speciality}</p>
          <button className='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>
          </div>

          {/* Doctor's About */}
          <div>
            <p className='flex items-center gap-2 text-sm font-medium mt-3 text-gray-900'>About <img src={assets.info_icon} alt="" /></p>
            <p className='text-sm text-gray-600 mx-w-[700px] mt-1'>{docInfo.about}</p>
          </div>
          <div className='flex items-center gap-2 mt-4'>
            <p className='text-medium text-gray-600'>Appointment Fee:</p>
            <p>{currencySymbol}{docInfo.fees}</p>
          </div>
        </div>  
      </div>

      {/* BOOKING SLOTS */}
      <div className='sm: ml-72 sm:pl-4 mt-4 font-medium text-gray-700'>
        <p>Booking SLots</p>
        <div className='flex gap-3 items-center w-full oveflow-x-scroll mt-4'>
          {
            docSlots.length && docSlots.map((item,index) => (
              <div onClick={() => setSlotIndex(index)} className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex===index ? 'bg-primary text-white' :'border border-gray-300'}`} key ={index}>
                <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                <p>{item[0] && item[0].datetime.getDate()}</p>
              </div>
            ))
          }
        </div>
        <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
          {
            docSlots.length && docSlots[slotIndex].map((item,index)=>(
              <p onClick={()=> setSlotTime(item.time)} className={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${slotTime === item.time ? 'bg-primary text-white' : 'text-gray-400 border border-gray-300'}`} key={index}>
                {item.time.toLowerCase()}
              </p>
            ))
          }
        </div>
        <button onClick={bookAppointment} className='bg-primary text-white text-xl px-10 py-4 rounded-full mt-5'>
          Book an Appointment
        </button>
      </div>

      {/* Listing related doctors */}
      <RelatedDoctors docId={docId} speciality={docInfo.speciality}/>
    </div>
  )
}

export default Appointment