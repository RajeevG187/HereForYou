import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios'; // Assuming you use axios
import { assets } from '../../assets/assets'; // Assuming you have assets
import { DoctorContext} from '../../context/DoctorContext';

const DoctorProfile = () => {
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const {dtoken}  = useContext(DoctorContext); // Assuming backend URL is in .env

  const fetchDoctorProfile = async () => {
    try {
      // Replace with actual token retrieval (e.g., from localStorage or auth state)
      const token = localStorage.getItem('doctor_token');
      if (!token) {
        console.error("Doctor token not found");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${backendUrl}/api/doctor/profile`, {
        headers: {
          Authorization: `Bearer ${token}` // Assuming Bearer token auth
        }
      });

      if (response.data.success) {
        setDoctorData(response.data.doctor);
      } else {
        console.error("Failed to fetch doctor profile:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching doctor profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorProfile();
  }, [backendUrl]); // Refetch if backendUrl changes

  if (loading) {
    return <div className='w-full max-w-6xl m-5'><p>Loading profile...</p></div>;
  }

  if (!doctorData) {
    return <div className='w-full max-w-6xl m-5'><p>Could not load doctor profile.</p></div>;
  }

  return (
    <div className='w-full max-w-6xl m-5'>
      <p className='mb-3 text-lg font-medium'>Doctor Profile</p>
      <div className='bg-white border rounded p-5 grid grid-cols-1 md:grid-cols-2 gap-5'>
        {/* Profile Image */}
        <div className='flex justify-center md:justify-start'>
          <img
            className='w-32 h-32 rounded-full object-cover'
            src={doctorData.image || assets.profile_icon} // Use a default icon if image is missing
            alt={`${doctorData.name}'s profile picture`}
          />
        </div>

        {/* Profile Details */}
        <div>
          <h2 className='text-xl font-semibold mb-3'>{doctorData.name}</h2>
          <p className='text-gray-700 mb-2'><span className='font-medium'>Email:</span> {doctorData.email}</p>
          <p className='text-gray-700 mb-2'><span className='font-medium'>Speciality:</span> {doctorData.speciality}</p>
          <p className='text-gray-700 mb-2'><span className='font-medium'>Degree:</span> {doctorData.degree}</p>
          <p className='text-gray-700 mb-2'><span className='font-medium'>Experience:</span> {doctorData.experience}</p>
          <p className='text-gray-700 mb-2'><span className='font-medium'>Fees:</span> {doctorData.fees}</p>
          <p className='text-gray-700 mb-2'><span className='font-medium'>Availability:</span> {doctorData.available ? 'Available' : 'Not Available'}</p>

          {/* Address (assuming it's an object with street, city, state, zip) */}
          {doctorData.address && (
            <div className='mt-4'>
              <p className='font-medium mb-1'>Address:</p>
              <p className='text-gray-700'>{doctorData.address.street}</p>
              <p className='text-gray-700'>{doctorData.address.city}, {doctorData.address.state} {doctorData.address.zip}</p>
            </div>
          )}

          {/* About */}
          <div className='mt-4'>
             <p className='font-medium mb-1'>About:</p>
             <p className='text-gray-700'>{doctorData.about}</p>
          </div>

           {/* Slots - You might want a more detailed rendering for slots */}
          {doctorData.slots && Object.keys(doctorData.slots).length > 0 && (
            <div className='mt-4'>
              <p className='font-medium mb-1'>Available Slots:</p>
               {/* Basic rendering - you can enhance this */}
              <p className='text-gray-700'>{JSON.stringify(doctorData.slots)}</p>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;