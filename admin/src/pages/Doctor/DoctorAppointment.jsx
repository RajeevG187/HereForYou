import React, { useContext } from 'react';
import { useEffect, useState } from 'react'
import axios from 'axios'; // Assuming you use axios
import { assets } from '../../assets/assets'
import { DoctorContext } from '../../context/DoctorContext';
import { AdminContext } from '../../context/AdminContext';


const DoctorAppointment = () => {
  const [appointments, setAppointments] = useState([]);
  const {dtoken} = useContext(DoctorContext);
  const {backendUrl} = useContext(AdminContext);

  const fetchAppointments = async () => {
    try {
      // Option 1: Destructure data from response
      const { data } = await axios.get(`${backendUrl}/api/doctor/appointments`, {
        headers: { dtoken }
      });
  
      if (data.success) {
        setAppointments(data.appointments); // Also fix: appointments, not ppointments
      } else {
        console.error("Failed to fetch appointments:", data.message);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [dtoken]);

  // // Placeholder functions for accept/reject
  // const handleAccept = async (appointmentId) => {
  //   console.log("Accept appointment:", appointmentId);
  //   // TODO: Implement backend API call to accept appointment
  //   // await axios.post(`${backendUrl}/api/doctor/acceptAppointment`, { appointmentId, docId: doctorId }, { headers: { Authorization: `Bearer ${token}` } });
  //   // After successful update, refetch appointments: fetchAppointments();
  // };

  // const handleReject = async (appointmentId) => {
  //   console.log("Reject appointment:", appointmentId);
  //   // TODO: Implement backend API call to reject appointment
  //   // await axios.post(`${backendUrl}/api/doctor/rejectAppointment`, { appointmentId, docId: doctorId }, { headers: { Authorization: `Bearer ${token}` } });
  //   // After successful update, refetch appointments: fetchAppointments();
  // };

  return (
    <div className='w-full max-w-6xl m-5'>
      <p className='mb-3 text-lg font-medium'>Your Appointments</p>
      <div className='bg-white border rounded text-sm max-h-[80vh] min-h-[60vh] overflow-y-scroll'>
        <div className='hidden sm:grid grid-cols-[0.5fr_3fr_1fr_3fr_3fr_1fr_1fr] grid-flow-col py-3 px-6 border-b'>
          <p>#</p>
          <p>Patient</p>
          <p>Date & Time</p>
          <p>Fee</p>
          <p>Status</p>
          <p>Action</p>
        </div>
        {appointments.length > 0 ? appointments.map((item, index) => (
          <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_1fr_3fr_1fr_1fr] items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50' key={index}>
            <p className='max-sm:hidden'>{index + 1}</p>
            <div className='flex items-center gap-2'>
              <img className='w-8 rounded-full' src={item.userData.image || assets.profile_icon} alt="" /><p>{item.userData.name || 'N/A'}</p>
            </div>
            <p>{item.slotDate} , {item.slotTime}</p>
            <p>{item.amount}</p>
            <p>{item.cancelled ? 'Cancelled' : 'Confirmed'}</p>
            <div className='flex gap-2'>
              {/* Render accept/reject buttons only if not cancelled */}
              {!item.cancelled && (
                <>
                  <button onClick={() => handleAccept(item._id)} className='px-3 py-1 bg-green-500 text-white rounded text-xs'>Accept</button>
                  <button onClick={() => handleReject(item._id)} className='px-3 py-1 bg-red-500 text-white rounded text-xs'>Reject</button>
                </>
              )}
            </div>
          </div>
        )) : <p className='p-6 text-center'>No appointments found.</p>}
      </div>
    </div>
  );
};

export default DoctorAppointment;