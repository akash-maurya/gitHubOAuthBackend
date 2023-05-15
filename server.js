const express = require("express");
const mongoose = require('mongoose');
const User  = require('./models/userModel');
const cors = require('cors');
require("dotenv").config();
const jwt =  require('jsonwebtoken');
const URLSearchParams = require('url-search-params');
const app = express();
const axios =  require('axios');
mongoose.connect(process.env.DB_URL);

app.use(express.json());
app.use(cors())
app.get('/hello',(req,res) => {
	res.send({massage: "Hello server"});
});


app.post('/api/signup', async(req , res) => {
	try{
		const {name, email , password, org} =  req.body;
		const user =  await User.create({
			name: name ,
			email: email,
			password: password ,
			organization: org ,
		})
		if(user){
			const token = jwt.sign(
				{
				name: user.name,
				email: user.email,
				},
				'hfsdfjfashdbfshaf283r2r2784g231#@$@!42134@!34'
			)
			return res.json({
				message: `user ${name} created successfully`,
				status: "success",
				user: token,
			});
		}
		else{
			return res.json({
				message: `Couln't sign up , please try agin`,
				status: "error",
				user:false
			});
		}
	}
	catch(err){
		res.json({message: 'user already exist',status:'error'});
	}
	
});


app.post('/api/login', async(req , res) => {
	try{
		const { email , password} =  req.body;
		const user =  await User.findOne({
			email: email,
			password: password 
		})
		if(user){
			const token = jwt.sign(
				{
				name: user.name,
				email: user.email,
				},
				'hfsdfjfashdbfshaf283r2r2784g231#@$@!42134@!34'
			)
			return res.json({
				message: 'logged in successfully',
				status: "success",
				user: token,
			})
		}
		else{
			res.json({
				message: 'please provide correct email/password',
				status: "error",
			});
		}
	}
	catch(err){
		res.json({message: err,status:'error' , user: false});
	}
	
});

const getGitHubAuthToken = async(code) => {
  
	const CLIENT_ID = process.env.CLIENT_ID;
	const CLIENT_SECRET = process.env.CLIENT_SECRET;
	const params = `?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&code=${code}`;
    const url = `https://github.com/login/oauth/access_token${params}`;
	const githubToken =  await axios
	.post(url,{
		headers:{
			'Accept':'application/json'
		}
	})
	.then((result) => result.data)
	.catch((err)=>{throw err});

	const decoded = new URLSearchParams(githubToken);
	const access_token = decoded.get('access_token');
	return access_token;
}

app.get('/api/auth/github/authToken', async(req, res) => {
	const code = req.query.code;
	if(!code){
		throw new Error('No code ..!');
	}
	try{
		const authToken = await getGitHubAuthToken(code);
		const tokenObject = {token:authToken,status:"sucess"}
		return res.json(tokenObject);	
	}
	catch(err){
		return res.json({message:err, status: "error"});
	}
});


app.get('/api/getUserDetails',async(req,res) => {

	const fetchUserDetialsUrl = 'https://api.github.com/user';
	try{
		const response =  await fetch(fetchUserDetialsUrl,{
			method:'GET',
			headers: {
				"Authorization": "Bearer "+req.get('authToken')  // BEARER FORMAT
			}
		})
		const data = await response.json();
		return res.json({"data":data,"status":"success"});
	}
	catch(err){
		return res.json({"data":err,"status":"error"});
	}
	
});


app.get('/api/getRepos',async(req,res) => {
	const username = req.get('user');
	const fetchUserDetialsUrl = `https://api.github.com/users/${username}/repos`;
	try{
		const response =  await fetch(fetchUserDetialsUrl,{
			method:'GET',
		})
		const data = await response.json();
		return res.json({"data":data,"status":"success"});
	}
	catch(err){
		return res.json({"data":err,"status":"error"});
	}
});

app.listen(8000,() =>{
	console.log("app running on port ",8000);
})

