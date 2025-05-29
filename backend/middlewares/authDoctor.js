import jwt from 'jsonwebtoken'

// Doctor authentication middleware
const authDoctor = async(req, res, next)=>{
    try {
        
        const {dtoken} = req.headers
        if(!dtoken){
            return res.json({success:false, message:"not authrized login again"})
        }
        const tokenDecode = jwt.verify(dtoken, process.env.JWT_SECRET)

        req.body.docId = tokenDecode.id
        next()

    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

export default authDoctor