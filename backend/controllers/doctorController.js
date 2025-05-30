import doctorModel from "../models/doctorModel.js"
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"

 const changeAvailability = async (req, res)=>{
    try {
        
        const {docId} = req.body
        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId,{available: !docData.available})
        res.json({success:true, message:"Availibility Changed"})

    } catch (error) {
        console.log(error.message)
        res.json({success:false, message:error.message})
    }
 }

 const doctorList = async(req, res)=>{
    try {
        const doctors = await doctorModel.find({}).select(['-password','-email'])
        res.json({success:true, doctors})
        
    } catch (error) {
        console.log(error.message)
        res.json({success:false, message:error.message})
    }
 }

//  API for doctor Login
const loginDoctor = async(req, res)=>{
    try {
        
        const {email, password} = req.body
        const doctor = await doctorModel.findOne({email})
        if(!doctor){
            return res.json({success:false, message:"Invalid Credentials"})
        }

        const isMatch = await bcrypt.compare(password, doctor.password)

        if(isMatch){
            const token = jwt.sign({id:doctor._id},process.env.JWT_SECRET)
            res.json({success:true, token, message:"Login Successful"})
        } else{
            res.json({success:false, message:"Invalid Credentials"})
        }

    } catch (error) {
        console.log(error.message)
        res.json({success:false, message:error.message})
    }
}

// API for appointments of doctor
const appointmentsDoctor = async(req, res)=>{
    try {
        const {docId} = req.body
        const appointments = await appointmentModel.find({docId})

        res.json({success:true, appointments})
        
    } catch (error) {
        console.log(error.message)
        res.json({success:false, message:error.message})
    }
}

// API to fetch doctor profile
const getDoctorProfile = async (req, res) => {
    try {
        // Assuming authDoctor middleware adds userId to req
        const doctorId = req.body;

        if (!doctorId) {
            return res.json({ success: false, message: "Doctor not authenticated." });
        }

        // Find doctor by ID, excluding password
        const doctor = await doctorModel.findById(doctorId).select('-password');

        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found." });
        }

        res.json({ success: true, doctor });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};

export {changeAvailability, doctorList, loginDoctor, appointmentsDoctor, getDoctorProfile}