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

const verifyAuth0Profile = async (id, token)=> {
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
            if (user.length == 0){
                resolve(false);
            }else{
                resolve(true);
            }
        }catch (e){
            reject (e.error);
        }
    })
}

const createLocalProfile = async (user_id) => {
    return new Promise (async (resolve, reject) => {
        try {
            const user = await User.query().insert({
                "user_id":user_id
            });
            resolve(true);
        }catch (e){
            reject (e.error);
        }
    })
}

const updateAuth0UserProfile =  async (token, params) => {

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

const getAuth0UserProfile =  async (token, params) => {

    return new Promise ((resolve, reject) => {
        var config = {
            headers: {'Authorization': "bearer " + token}
        };
    
        axios.get("https://blue-ribbon.auth0.com/api/v2/users/"+params.user_id,config).then(response =>{
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
        return verifyAuth0Profile(id,token)
    }).then((user_id)=>{
        return verifyLocalProfile(id);
    }).then(status => {
        if (status == true){
            res.status(200).json({status:'existing user'})
        }else{
            res.status(200).json({status:'new user'})
        }
    }).catch(e=>{
        res.status(400).json(e);
    })
 
})

UserRouter.route('/updateInfo').post(async (req,res) => {
   console.log('req')

    getAccessToken.then(token=>{
        return token 
    }).then((token)=>{
        return updateAuth0UserProfile(token,req.body)
    }).then(response => {
        return verifyLocalProfile(req.body.user_id)
    }).then(response => {
        if (response == false){
            createLocalProfile(req.body.user_id).then(response => {
                res.status(200).json(true);
            }).catch(e => {
                res.status(400).json(e);
            })
        }else{
            res.status(200).json(true);
        }
    }).catch(e=>{
        res.status(400).json(e);
    })

})







UserRouter.route('/updateLocations/:id').post(async (req,res) => {

})


module.exports = UserRouter;
