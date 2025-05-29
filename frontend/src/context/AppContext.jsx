import {useState,  createContext, useEffect } from "react";
import axios from 'axios'
import {toast} from 'react-toastify'

export const AppContext = createContext()
const AppContextProvider = (props)=>{

    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [doctors, setDoctors] = useState([])

    const [token, setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):'')
    const [userData, setUserData] = useState(false)

    const currencySymbol = '$'
    
    const getDoctorsData = async() => {
        try {
            const {data} = await axios.get(backendUrl+'/api/doctor/list')
            if(data.success){
                setDoctors(data.doctors)
            }else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error)
        }
    }

    useEffect(()=>{
        getDoctorsData()
    },[])

    const loadUserProfileData = async()=>{
        try {

            const {data} = await axios.get(backendUrl+'/api/user/get-profile', {headers:{token}})
            if(data.success){
                setUserData(data.userData)
            }else{
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error)
        }
    }

    useEffect(()=>{
        if(token){
        loadUserProfileData()
        } else {
            setUserData(false)
        }
    },[token])

    const updateAppointment = async() =>{
        try {
            console.log(userData)
            const {data} = await axios.put(backendUrl+ '/api/user/update-appointment', userData, {headers:{token}})

            if(data.success){
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error)
        }
    }

    const value = {
        doctors, getDoctorsData, currencySymbol, token, setToken, backendUrl, userData, setUserData, loadUserProfileData, updateAppointment,
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
} 

export default AppContextProvider