const express = require('express');
const UserRouter = express.Router();
const axios = require ('axios');

const User = require('../db/models/user');
const UserAddress = require('../db/models/userAddress');
const Subscriptions = require('../db/models/subscription');
const { raw } = require('objection');


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
                "user_id":decodeURIComponent(user_id)
            });
            resolve(true);
        }catch (e){
            reject (e.error);
        }
    })
}

const getUserSubscriptions = async (user_id) => {
    return new Promise (async (resolve, reject) => {
        try {
            const subscriptions = await Subscriptions.query().where({
                "user_id":decodeURIComponent(user_id)
            });
            resolve(subscriptions);
        }catch (e){
            reject (e.error);
        }
    })
}

const updateAuth0UserProfile =  async (token, req) => {

    const userId = req.user.sub
    const params = req.body
    
    return new Promise ((resolve, reject) => {
        var config = {
            headers: {'Authorization': "bearer " + token}
        };
    
        axios.patch("https://blue-ribbon.auth0.com/api/v2/users/"+userId,{
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

const addUserLocation = async (userId, req) => {
    return new Promise (async (resolve, reject) => {
        try {
            const userAddress = await UserAddress.query()
                .insert({
                    "user_id":userId,
                    "complete_address":req.complete_address,
                    "coordinates": raw('point('+ parseFloat(req.latitude)+','+parseFloat(req.longitude)+')') ,
                    "tag":req.tag
                });
            resolve(userAddress);
        }catch (e){
            reject (e.error);
        }
    })
}



UserRouter.route('/updateInfo').post(async (req,res) => {

    getAccessToken.then(token=>{
        return token 
    }).then((token)=>{
        return updateAuth0UserProfile(token,req)
    }).then(response => {
        return verifyLocalProfile(req.user.sub)
    }).then(response => {
        if (response == false){
            createLocalProfile(req.user.sub).then(response => {
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

UserRouter.route('/addLocation').post(async (req,res) => {

    if (req.user.sub){
        addUserLocation(req.user.sub, req.body)
        .then((user)=>{
            res.status(200).json(user)
        }).catch(e=>{
            res.status(400).json(e)
        })
    }
})

UserRouter.route('/test').get(async (req,res) => {
    console.log(req.user.sub)
})

UserRouter.route('/subscriptions').get(async (req,res) => {
    getUserSubscriptions(res.user.sub)
        .then ((subscriptions) =>{
            res.status(200).json(subscriptions)
        }).catch(e => {
            res.status(400).json(e)
        })
})


module.exports = UserRouter;
