const express = require('express');
const UserRouter = express.Router();
const axios = require ('axios');

const User = require('../db/models/user');
const UserAddress = require('../db/models/userAddress');
const Subscriptions = require('../db/models/subscription');
const { raw } = require('objection');
const verifyCoordinates = require('./utils/CheckPointInAreas')


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

const getUserLocations = async (user_id) => {
    return new Promise (async (resolve, reject) => {
        try {
            const addresses = await UserAddress.query().where({
                "user_id":decodeURIComponent(user_id)
            });
            resolve(addresses);
        }catch (e){
            reject (e.error);
        }
    })
}

const checkLocationEligibility = async (location, listingId) => {
    return new Promise (async (resolve, reject) => {
        verifyCoordinates(listingId,location)
        .then(result => resolve(result))
        .catch(e => reject(e))
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
                    "base_address":req.base_address,
                    "coordinates": raw('point('+ parseFloat(req.latitude)+','+parseFloat(req.longitude)+')') ,
                    "tag":req.tag
                });
            resolve(userAddress);
        }catch (e){
            reject (e.error);
        }
    })
}

const addUserNotificationToken = async (userId, token) => {
    console.log('add',userId, token)
    return new Promise (async (resolve, reject) => {
        try {
            if (!token) {
                reject()
            } else {
                const user = await User.query()
                .where('user_id',userId)
                .patch({
                  notification_token: token
                })
                console.log(user)
                resolve(user);
            }
        }catch (e){
            reject (e.error);
        }
    })
}

const removeUserNotificationToken = async (userId) => {
    console.log('remove',userId)
    return new Promise (async (resolve, reject) => {
        try {
            const user = await User.query()
            .where('user_id',userId)
            .patch({
              notification_token: null
            })
            console.log(user)
            resolve(user);
        }catch (e){
            reject (e.error);
        }
    })
}



UserRouter.route('/checkLocationEligibility').post(async (req,res) => {

    try{
        const listingId = req.body.listingId
        const coordinate = req.body.coordinate
        const eligibility = await checkLocationEligibility(coordinate, listingId) 
        res.status(200).json(eligibility)
    }catch (e){
        res.status(404).json(e)
    }
    
})

UserRouter.route('/isNew').get(async (req, res) => { 
    verifyLocalProfile(req.user.sub).then(value => {
        res.status(200).json(!value)
    }).catch(e => {
        res.status(404).json(e)
    })
})

UserRouter.route('/addNotificationToken').post(async (req, res) => { 
   
    try {
        const token = req.body.token
        const user = await addUserNotificationToken(req.user.sub,token)
        res.status(200).json(true)
    } catch (e){
        res.status(404).json(e)
    }
})

UserRouter.route('/removeNotificationToken').post(async (req, res) => { 

    try {
        const user = await removeUserNotificationToken(req.user.sub)
        res.status(200).json(true)
    } catch (e){
        res.status(404).json(e)
    }
})

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

    getUserSubscriptions(req.user.sub)
        .then ((subscriptions) =>{
            res.status(200).json(subscriptions)
        }).catch(e => {
            res.status(400).json(e)
        })
})

UserRouter.route('/savedLocations').get(async (req,res) => {
    getUserLocations(req.user.sub)
        .then ((locations) =>{
            res.status(200).json(locations)
        }).catch(e => {
            res.status(400).json(e)
        })
})

module.exports = UserRouter;
