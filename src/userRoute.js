const express = require('express');
const UserRouter = express.Router();
const axios = require ('axios');

const User = require('../db/models/user');
const UserAddress = require('../db/models/userAddress');
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
            console.log(user,id)
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
            console.log(response.data)
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

const addUserLocation = async (req) => {
    return new Promise (async (resolve, reject) => {
        try {
            console.log(req, parseFloat(req.latitude), parseFloat(req.longitude))
            const userAddress = await UserAddress.query()
                .insert({
                    "user_id":decodeURIComponent(req.user_id),
                    "complete_address":req.complete_address,
                    "coordinates": raw('point('+ parseFloat(req.latitude)+','+parseFloat(req.longitude)+')') ,
                    "tag":req.tag
                });
            resolve(userAddress);
        }catch (e){
            console.log(e);
            reject (e.error);
        }
    })
}

// UserRouter.route('/test').get(async (req,res) => {
//     res.status(200).json(req.headers.authorization)
// })
const getUserId = async (accessToken) => {
    return new Promise (async (resolve, reject) => {
        var config = {
            headers: {'Authorization': "bearer " + accessToken}
        };
        axios.get("https://blue-ribbon.auth0.com/userinfo",config).then(response =>{
            resolve(response.data.sub)
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
            res.status(200).json({new_user:'existing user'})
        }else{
            res.status(200).json({status:'new user'})
        }
    }).catch(e=>{
        res.status(400).json(e);
    })
 
})

UserRouter.route('/updateInfo').post(async (req,res) => {

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

UserRouter.route('/addLocation').post(async (req,res) => {
    getAccessToken.then(token=>{
        return token 
    }).then((token)=>{
        return verifyAuth0Profile(req.body.user_id,token)
    }).then((user)=>{
        return addUserLocation(req.body)
    }).then((user)=>{
        res.status(200).json(user)
    }).catch(e=>{
        res.status(400).json(e)
    })
})

UserRouter.route('/test').get(async (req,res) => {
    console.log(req.user)
})


module.exports = UserRouter;
