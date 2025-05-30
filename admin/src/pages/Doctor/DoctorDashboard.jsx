import React, { useContext } from 'react';
import { useEffect, useState } from 'react'
import axios from 'axios'; // Assuming you use axios
import { assets } from '../../assets/assets'
import { DoctorContext } from '../../context/DoctorContext';
import { AdminContext } from '../../context/AdminContext';

const DoctorDashboard = () => {
  const [doctorData, setDoctorData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const {backendUrl} = useContext(AdminContext);
  const {dtoken} = useContext(DoctorContext);


  const fetchDashboardData = async () => {
    setLoading(true);
    if (!dtoken) {
      console.error("Doctor token not found");
      setLoading(false);
      return;
    }

    try {
      // Fetch Doctor Profile
      const profileResponse = await axios.get(`${backendUrl}/api/doctor/profile`, {
        headers: {dtoken}
      });

      if (profileResponse.data.success) {
        setDoctorData(profileResponse.data.doctor);
      } else {
        console.error("Failed to fetch doctor profile:", profileResponse.data.message);
      }

      // Fetch Doctor Appointments
       // Replace with actual doctor ID retrieval if needed, assuming token provides auth
       // const doctorId = "<YOUR_DOCTOR_ID>"; // If not using token for auth

      const appointmentsResponse = await axios.get(`${backendUrl}/api/doctor/appointments`, {
         headers: {
           Authorization: `Bearer ${token}`
         },
        // params: { docId: doctorId } // Include if backend requires docId parameter
      });

      if (appointmentsResponse.data.success) {
        // Sort appointments by date/time in descending order
        const sortedAppointments = appointmentsResponse.data.appointments.sort((a, b) => {
            // Assuming slotDate and slotTime are comparable strings or can be converted
            const dateA = new Date(`${a.slotDate} ${a.slotTime}`);
            const dateB = new Date(`${b.slotDate} ${b.slotTime}`);
            return dateB - dateA; // Descending order
        });
        setAppointments(sortedAppointments);
      } else {
        console.error("Failed to fetch appointments:", appointmentsResponse.data.message);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [backendUrl, token]); // Refetch if backendUrl or token changes

  if (loading) {
    return <div className='w-full max-w-6xl m-5'><p>Loading dashboard...</p></div>;
  }

  const recentAppointments = appointments.slice(0, 5); // Get the most recent 5

  return (
    <div className='w-full max-w-6xl m-5'>
      <p className='mb-3 text-lg font-medium'>Doctor Dashboard</p>
      <div className='bg-white border rounded p-5'>

        {/* Doctor Basic Info */}
        {doctorData && (
          <div className='flex items-center gap-5 mb-8'>
            <img
              className='w-20 h-20 rounded-full object-cover'
              src={doctorData.image || assets.profile_icon} // Use a default icon if image is missing
              alt={`${doctorData.name}'s profile picture`}
            />
            <div>
              <h2 className='text-xl font-semibold'>{doctorData.name}</h2>
              <p className='text-gray-600'>{doctorData.speciality}</p>
            </div>
          </div>
        )}

        {/* Appointments Summary */}
        <div className='mb-8'>
          <p className='text-lg font-medium mb-3'>Appointments Summary</p>
          <div className='p-4 bg-gray-100 rounded'>
            <p className='text-gray-700'><span className='font-medium'>Total Appointments:</span> {appointments.length}</p>
             {/* Add more summary stats if needed */}
          </div>
        </div>

        {/* Most Recent Appointments */}
        <div>
          <p className='text-lg font-medium mb-3'>Most Recent Appointments</p>
           {recentAppointments.length > 0 ? (
            <div className='border rounded text-sm max-h-[30vh] overflow-y-scroll'>
               <div className='hidden sm:grid grid-cols-[0.5fr_3fr_3fr_1fr] grid-flow-col py-2 px-4 border-b'>
                 <p>#</p>
                 <p>Patient</p>
                 <p>Date & Time</p>
                 <p>Status</p>
               </div>
               {recentAppointments.map((item, index) => (
                 <div className='flex flex-wrap justify-between max-sm:gap-2 sm:grid sm:grid-cols-[0.5fr_3fr_3fr_1fr] items-center text-gray-500 py-2 px-4 border-b last:border-b-0 hover:bg-gray-50' key={item._id || index}>
                    <p className='max-sm:hidden'>{index + 1}</p>
                    <div className='flex items-center gap-2'>
                       <img className='w-7 h-7 rounded-full' src={item.userData.image || assets.profile_icon} alt="" /><p>{item.userData.name || 'N/A'}</p>
                    </div>
                    <p>{item.slotDate} , {item.slotTime}</p>
                    <p>{item.cancelled ? 'Cancelled' : 'Confirmed'}</p>
                 </div>
               ))}
            </div>
           ) : (
             <p className='p-4 text-gray-700'>No recent appointments found.</p>
           )}
        </div>

      </div>
    </div>
  );
};

export default DoctorDashboard;