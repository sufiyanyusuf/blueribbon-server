const express = require('express');
const UserRouter = express.Router();
const axios = require ('axios');

const User = require('../db/models/user');

const getAccessToken = new Promise (async (resolve, reject) => {

    axios.post('https://blue-ribbon.auth0.com/oauth/token',{
        "client_id":process.env.AUTH0_CLIENT_ID,
        "client_secret":process.env.AUTH0_CLIENT_SECRET,
        "audience":"https://blue-ribbon.auth0.com/api/v2/",
        "grant_type":"client_credentials"
    }).then(response =>{

        accessToken = response.data.access_token;
        resolve(accessToken)

    }).catch(error => {
        reject(error)
    })
})

const verifyAuth0User = async (id, token)=> {
    return new Promise ((resolve, reject) => {

        var config = {
            headers: {'Authorization': "bearer " + token}
        };

        axios.get('https://blue-ribbon.auth0.com/api/v2/users/' + id,config)
            .then(response => {
                resolve(response.data.user_id)
            }).catch (e => {
                reject(e.response.data)
            })

    })
}

const verifyLocalProfile = async (id) => {
    return new Promise (async (resolve, reject) => {
        try {
            const user = await User.query()
            .where('user_id',id)
            resolve(user);
        }catch (e){
            reject (e.error);
        }
    })
}

const createProfile = async (params) => {
    return new Promise (async (resolve, reject) => {
        try {
            const user = await User.query().insert(params);
            resolve(true);
        }catch (e){
            reject (e.error);
        }
    })
}

const updateProfile = async (params) => {

    return new Promise (async (resolve, reject) => {
        try {
            const user = await User.query().where('user_id',id).patch(params);
            resolve(true);
        }catch (e){
            console.log('update loc profile - ',e.error)
            reject (e.error);
        }
    })
}

const updateUserAuth0Profile =  async (token, params) => {

    return new Promise ((resolve, reject) => {
        var config = {
            headers: {'Authorization': "bearer " + token}
        };
    
        axios.patch("https://blue-ribbon.auth0.com/api/v2/users/"+params.user_id,{
            "given_name":params.first_name,
            "family_name":params.last_name,
            "name":(params.first_name + ' ' +params.last_name),
            "user_metadata":{'birthday':params.birthday, "phone_number":params.phone_number }
        },config).then(response =>{
            resolve(response.data)
        }).catch(error => {
            reject(error)
        })
    })

}


UserRouter.route('/verifyUser/:id').get(async (req,res) => {
    
    const id = req.params.id;
    getAccessToken.then(token=>{
        return token 
    }).then((token)=>{
        return verifyAuth0User(id,token)
    }).then((user_id)=>{
        return verifyLocalProfile(id);
    }).then(response => {
        if (response.length == 0){
            res.status(200).json({status:'new user'})
        }else{
            res.status(200).json({status:'existing user'})
        }
    }).catch(e=>{
        res.status(400).json(e);
    })
 
})

UserRouter.route('/updateInfo').post(async (req,res) => {
   
    getAccessToken.then(token=>{
        return token 
    }).then((token)=>{
        return updateUserAuth0Profile(token,req.body)
    }).then(response => {
        return (updateProfile({
            user_id:req.body.id,
            new_user:false
        }))
    }).then(response =>{
        res.status(200).json(response);
    }).catch(e=>{
        res.status(400).json(e);
    })
})

UserRouter.route('/updateLocations/:id').post(async (req,res) => {

})


module.exports = UserRouter;
