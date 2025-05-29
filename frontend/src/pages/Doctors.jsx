import React, { useEffect, useState, useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Doctors = () => {

  const { speciality } = useParams()
  const [filterDoc, setFilterDoc] = useState([])
  const { doctors } = useContext(AppContext)
  const [showSpeciality, setShowSpeciality] = useState(false)
  const navigate = useNavigate()

  const applyFilter = () => {
    if (speciality) {
      setFilterDoc(doctors.filter(doc => doc.speciality === speciality))
    } else {
      setFilterDoc(doctors)
    }
  }

  useEffect(() => {
    applyFilter()
  }, [doctors, speciality])


  return (
    <div>
      <p className='text-gray-600'>Browse through the doctors</p>
      <button className={`py-1 px-3 border rounded text-sm ${showSpeciality ? 'bg-primary text-white' : ''} transition-all mt-2`} onClick={() => setShowSpeciality(prev => !prev)}>FILTERS</button>
      <div className='flex flex-col sm:flex-row items-start gap-5 mt-5 '>
        {
          showSpeciality ?
            <div className='flex flex-col gap-4 test-sm text-gray-600'>
              <p onClick={() => speciality === "Psychiatrist" ? navigate('/doctors') : navigate('/doctors/Psychiatrist')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Psychiatrist" ? "bg-indigo-100 text-black" : ""}`}>Psychiatrist</p>
              <p onClick={() => speciality === "Psychologist" ? navigate('/doctors') : navigate('/doctors/Psychologist')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Psychologist" ? "bg-indigo-100 text-black" : ""}`}>Psychologist</p>
              <p onClick={() => speciality === "Clinical Social Worker" ? navigate('/doctors') : navigate('/doctors/Clinical Social Worker')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Clinical Social Worker" ? "bg-indigo-100 text-black" : ""}`}>Clinical Social Worker</p>
              <p onClick={() => speciality === "Counsellor" ? navigate('/doctors') : navigate('/doctors/Counsellor')} className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${speciality === "Counsellor" ? "bg-indigo-100 text-black" : ""}`}>Counsellor</p>
            </div> :
            <p></p>
        }
        <div className='w-full grid grid-cols-auto gap-4 gap-y-6'>
          {
            filterDoc.map((item, index) => (
              <div onClick={() => navigate(`/appointment/${item._id}`)} className='border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500'
                key={index}>
                <img className='bg-blue-50' src={item.image} alt="" />
                <div className='p-4'>
                  <div className='flex items-center gap-2 text-sm text-center text-green-500'>
                    <p className='w-2 h-2 bg-green-500 rounded-full'></p><p>Available</p>
                  </div>
                  <p className='text-gray-900 text-lg font-medium'>{item.name}</p>
                  <p className='text-gray-600 text-sm'>{item.speciality}</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

export default Doctors


