import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import Razorpay from 'razorpay'

// Api to register User
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.json({ success: false, message: "missing details" })
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Email is not valid" })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Enter a strong password" })
        }

        // Hashing User password
        const salt = await bcrypt.genSalt(5)
        const hashedPassword = await bcrypt.hash(password, salt)

        const userData = {
            name: name,
            email: email,
            password: hashedPassword
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Api for user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            return res.json({ success: false, message: "Invalid Credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Api to get userProfile data
const getProfile = async (req, res) => {
    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')
        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Api to update userProfile

const updateProfile = async (req, res) => {

    try {

        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Incomplete data" })
        }

        await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender })

        if (imageFile) {
            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' })
            const imageUrl = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageUrl })
        }

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to book appointment
const bookAppointment = async (req, res) => {
    try {

        const { userId, docId, slotDate, slotTime } = req.body
        const docData = await doctorModel.findById(docId).select('-password')

        if (!docData.available) {
            return res.json({ success: false, message: "Doctor Not Available" })
        }

        let slots_booked = docData.slots
        // Checking for slots availablity
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: "Slot Not Available" })
            } else {
                slots_booked[slotDate].push(slotTime)
            }
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select('-password')

        delete docData.slots

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // save newslots data in docData
        await doctorModel.findByIdAndUpdate(docId, { slots: slots_booked })

        res.json({ success: true, message: "Appointment booked" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Api to get users appointments for frontend for my appointments page
const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })

        if(appointments.length === 0){
            res.json({success:false, message:"User not Found"})
        }

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//  API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized action" })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasing doctors slot
        const { docId, slotDate, slotTime } = appointmentData
        const docData = await doctorModel.findById(docId)
        let slots = docData.slots
        slots[slotDate] = slots[slotDate].filter(e => e != slotTime)
        await doctorModel.findByIdAndUpdate(docId, { slots })

        res.json({ success: true, message: "Appointment cancelled" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message})
    }
}

// Update Appointments Info when user Data is updated
const updateAppointmentUserInfo = async(req, res) =>{
    try {
        const userData = req.body
        delete userData._id;

        await appointmentModel.updateMany(
            { userId: userData.userId },
            { $set: { userData } },
            { runValidators: true }
        );
        res.json({success:true, message:"Appointments Data updated"})
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message})
    }
}

const razorpay = new Razorpay({
    key_id: process.env.RAZOR_KEY_ID,
    key_secret: process.env.RAZOR_KEY_SECRET
});

// API to make Payment using Razor pay
const paymentRazorpay = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: "Appointment Cacelled or not found" })
        }

        // creating payment optiond for razorpay
        const options = {
            amount: appointmentData.amount * 100,
            currency: process.env.CURRENCY || "INR",
            receipt: appointmentId
        };

        // Creating order
        const order = await razorpay.orders.create(options);
        return res.json({ success: true, order})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to verify payment by razorpay
const verifyRazorpay  = async(req, res) =>{
    try {
        
        const {razorpay_order_id} = req.body
        const orderInfo = await razorpay.orders.fetch(razorpay_order_id)

        if(orderInfo.status === 'paid'){
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, {payment:true})
            res.json({success:true, message:"Payment successful"})
        } else {
            res.json({success:false, message:"payment failed"})
        }

    } catch (error) {
        
    }
}


export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment,updateAppointmentUserInfo, paymentRazorpay, verifyRazorpay }