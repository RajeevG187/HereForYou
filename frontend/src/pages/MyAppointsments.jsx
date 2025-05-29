import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import {useNavigate} from 'react-router-dom'

const MyAppointsments = () => {

  const {backendUrl, token, getDoctorsData} = useContext(AppContext)

  const [appointments, setAppointments] = useState([])
  
  const navigate = useNavigate()
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const slotDateFormat = (slotDate)=>{
    const dateArray = slotDate.split('_')
    return dateArray[0] + " " + months[Number(dateArray[1])-1] + " " + dateArray[2]
  }

  const getUsersAppointments = async() =>{
    try {
      const {data} = await axios.get(backendUrl+'/api/user/appointments', {headers:{token}})
      
      if(data.success){
        setAppointments(data.appointments.reverse())
        console.log(data.appointments)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message)
    }
  }
  useEffect(()=>{
    if(token){
      getUsersAppointments()
    }
  },[token])

  const cancelAppointment = async(appointmentId) =>{
    try {
      const {data} = await axios.post(backendUrl+ '/api/user/cancel-appointment', {appointmentId}, {headers:{token}});

      console.log(data)
      if(data.success){
        toast.success(data.order)
        getUsersAppointments()
        getDoctorsData()
      } else {
        toast.error(data.message)
      }
      
    }  catch (error) {
      console.log(error);
      toast.error(error.message)
    }
  }

  const initPay = (order) => {
    const options = {
      key:  import.meta.env.VITE_RAZOR_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'Apointment Payment',
      description: 'Appointment Payment',
      order_id: order.id,
      recipt: order.recipt,
      handler: async(response) => {
        console.log(response)
        try {
          const {data} = await axios.post(backendUrl+'/api/user/verify-razorpay', response, {headers:{token}})

          if(data.success){
            getUsersAppointments()
            navigate('/my-appointments')
          }
        } catch (error) {
          console.log(error)
          toast.error(error.message)
        }
      }
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const appointmentRazorpay = async(appointmentId) =>{
    try {
      const {data} = await axios.post(backendUrl+ '/api/user/payment-razorpay', {appointmentId}, {headers:{token}});

      if(data.success){
        initPay(data.order)
      } else {
        toast.error(data.message)
      }
      
    }  catch (error) {
      console.log(error);
      toast.error(error.message)
    }
  }

  return (
    <div>
      <p className='pb-3 mt-12 font-medium text-zinc-700 border-b'>My Appointments</p>
      {
        appointments.map((item, index)=>(
          <div className='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b' key ={index}>
            <div>
              <img className='w-32 bg-indigo-100' src={item.docData.image} alt="" />
            </div>
            <div className='flex-1 text-sm text-zinc-600'>
            <p className='text-neutral-800 font-semibold'>{item.docData.name}</p>
            <p>{item.docData.speciality}</p>
            <p  className='text-zinc-700 font-medium mt-1'>Address</p>
            <p className='text-xs'>{item.docData.address.line1}</p>
            <p className='text-xs'>{item.docData.address.line2}</p>
            <p className='text-xm mt-1'><span className='text-sm text-zinc-600 font-medium'>Date & Time</span> {slotDateFormat(item.slotDate)} | {item.slotTime}</p>
            </div>
            <div></div>
              {!item.cancelled && !item.payment &&<div className='flex flex-col gap-2 justify-end'>
                <button onClick={()=>appointmentRazorpay(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition all'>Pay Online</button>
                <button onClick={()=>cancelAppointment(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition all'>Cancel Appointment</button>
              </div>}
              {item.cancelled && <div className='flex flex-col gap-2 justify-center'>
              <button className='text-m text-red-600 text-center sm:min-w-48 py-2 h-10 border rounded'>
                Appointment Cancelled
              </button>
            </div>}
            {item.payment && <div className='flex flex-col gap-2 justify-center'>
              <button className='text-m text-green-600 text-center sm:min-w-48 py-2 h-10 border rounded'>
                Appointment Booked
              </button>
            </div>}
          </div>
        ))
      }
    </div>
  )
}

export default MyAppointsments